async function getProject(id) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction('projects', 'readonly');
    const r = tx.objectStore('projects').get(id);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function listProjects() {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction('projects', 'readonly');
    const r = tx.objectStore('projects').getAll();
    r.onsuccess = () => resolve(r.result.sort((a,b) => Number(!!b.favorite)-Number(!!a.favorite) || b.updatedAt-a.updatedAt));
    r.onerror = () => reject(r.error);
  });
}

function parseRatio(key, originalW, originalH) {
  if (key === 'original') return originalW / originalH;
  const [a, b] = key.split(':').map(Number);
  return a / b;
}

function geometryKey(maxDim) {
  return [state.params.cropRatio, state.params.rotation, state.params.flipH, state.params.flipV, maxDim].join('|');
}

function makeGeometryCanvas(maxDim = 1800) {
  if (!state.image) return null;
  const key = geometryKey(maxDim);
  if (maxDim && state.geometryCache && state.geometryKey === key) return state.geometryCache;

  const img = state.image;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const ratio = parseRatio(state.params.cropRatio, iw, ih);
  let sw = iw;
  let sh = ih;
  if (iw / ih > ratio) sw = ih * ratio;
  else sh = iw / ratio;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  const scale = maxDim ? Math.min(1, maxDim / Math.max(sw, sh)) : 1;
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const rot = ((state.params.rotation % 360) + 360) % 360;
  const swap = rot === 90 || rot === 270;
  const out = document.createElement('canvas');
  out.width = swap ? h : w;
  out.height = swap ? w : h;
  const ctx = out.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.save();
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate(rot * Math.PI / 180);
  ctx.scale(state.params.flipH ? -1 : 1, state.params.flipV ? -1 : 1);
  ctx.drawImage(img, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
  ctx.restore();
  applyHealSpots(out);
  applyImageLayers(out);
  applyTextLayers(out);
  if (maxDim) {
    state.geometryCache = out;
    state.geometryKey = key;
  }
  return out;
}

function makeMaskCanvas(width, height) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, width);
  c.height = Math.max(1, height);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stroke of state.maskStrokes) {
    if (!stroke.points?.length) continue;
    ctx.save();
    ctx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = Math.max(2, stroke.size * Math.min(c.width, c.height));
    ctx.beginPath();
    const first = stroke.points[0];
    ctx.moveTo(first.x * c.width, first.y * c.height);
    for (let i = 1; i < stroke.points.length; i++) {
      const p = stroke.points[i];
      ctx.lineTo(p.x * c.width, p.y * c.height);
    }
    if (stroke.points.length === 1) {
      ctx.arc(first.x * c.width, first.y * c.height, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    } else ctx.stroke();
    ctx.restore();
  }
  if (state.params.maskFeather > 0 && state.maskStrokes.length) {
    const blur = document.createElement('canvas');
    blur.width = c.width; blur.height = c.height;
    const bctx = blur.getContext('2d');
    bctx.filter = `blur(${Math.max(0.5, state.params.maskFeather * Math.min(c.width,c.height) * .06)}px)`;
    bctx.drawImage(c,0,0);
    ctx.clearRect(0,0,c.width,c.height);
    ctx.filter = 'none';
    ctx.drawImage(blur,0,0);
  }
  if (state.params.maskInvert) {
    const inv = document.createElement('canvas');
    inv.width = c.width; inv.height = c.height;
    const ictx = inv.getContext('2d');
    ictx.fillStyle = '#fff'; ictx.fillRect(0,0,inv.width,inv.height);
    ictx.globalCompositeOperation = 'destination-out'; ictx.drawImage(c,0,0);
    return inv;
  }
  return c;
}

function drawMaskOverlay() {
  const overlay = $('#maskOverlay');
  if (!overlay || !state.image) return;
  const source = makeGeometryCanvas(1800);
  overlay.width = source.width;
  overlay.height = source.height;
  const ctx = overlay.getContext('2d');
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  if (state.panel !== 'mask') return;
  const mask = makeMaskCanvas(overlay.width, overlay.height);
  ctx.drawImage(mask,0,0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = 'rgba(255,70,110,.52)';
  ctx.fillRect(0,0,overlay.width,overlay.height);
  ctx.globalCompositeOperation = 'source-over';
}

function invalidateGeometry(clearMask = false) {
  state.geometryCache = null;
  state.geometryKey = '';
  resetCanvasGesture();
  if (clearMask && (state.maskStrokes.length || state.params.maskInvert)) {
    state.maskStrokes = [];
    state.params.maskInvert = false;
    toast('Manual Mask ถูกล้างหลังเปลี่ยน Geometry');
  }
}

function paramsForRender() {
  return state.compare ? { ...deepCopy(DEFAULT_PARAMS), cropRatio: state.params.cropRatio, rotation: state.params.rotation, flipH: state.params.flipH, flipV: state.params.flipV } : state.params;
}

function queueRender() {
  if (state.renderQueued) return;
  state.renderQueued = true;
  requestAnimationFrame(() => {
    state.renderQueued = false;
    renderPreview();
  });
}

function renderPreview() {
  if (!state.image || !state.renderer) return;
  try {
    const src = makeGeometryCanvas(1800);
    const mask = state.compare ? null : makeMaskCanvas(src.width, src.height);
    state.renderer.render(src, paramsForRender(), mask);
    $('#canvasEmpty').style.display = 'none';
    $('#beforeBadge').classList.toggle('show', state.compare);
    requestAnimationFrame(() => { drawMaskOverlay(); updateHistogram(); });
  } catch (err) {
    console.error(err);
    toast('Render ไม่สำเร็จ');
  }
}

function snapshot() {
  return { params: deepCopy(state.params), maskStrokes: deepCopy(state.maskStrokes), healSpots: deepCopy(state.healSpots || []), textLayers: deepCopy(state.textLayers || []) };
}

function restoreSnapshot(snap) {
  if (!snap) return;
  if (snap.params) {
    state.params = { ...deepCopy(DEFAULT_PARAMS), ...deepCopy(snap.params) };
    state.maskStrokes = deepCopy(snap.maskStrokes || []);
    state.healSpots = deepCopy(snap.healSpots || []);
    state.textLayers = deepCopy(snap.textLayers || []);
  } else {
    state.params = { ...deepCopy(DEFAULT_PARAMS), ...deepCopy(snap) };
    state.maskStrokes = [];
  }
}

function commit(before) {
  state.undo.push(before || snapshot());
  if (state.undo.length > 60) state.undo.shift();
  state.redo = [];
  updateHistoryButtons();
  scheduleProjectSave();
}

function undo() {
  if (!state.undo.length) return;
  state.redo.push(snapshot());
  restoreSnapshot(state.undo.pop());
  invalidateGeometry(false);
  syncUI();
  queueRender();
  updateHistoryButtons();
  scheduleProjectSave();
}

function redo() {
  if (!state.redo.length) return;
  state.undo.push(snapshot());
  restoreSnapshot(state.redo.pop());
  invalidateGeometry(false);
  syncUI();
  queueRender();
  updateHistoryButtons();
  scheduleProjectSave();
}

function updateHistoryButtons() {
  $('#undoBtn').disabled = !state.undo.length;
  $('#redoBtn').disabled = !state.redo.length;
}

function buildControls() {
  const targetIds = { light: 'lightSliders', color: 'colorSliders', effects: 'effectSliders', beauty: 'beautySliders', mask: 'maskSliders', curve: 'curveSliders', levels:'levelsSliders', grading:'gradingSliders', tonal:'tonalSliders', mixer:'mixerSliders', replacecolor:'replaceColorSliders', optics:'opticsSliders', film:'filmSliders', blur:'blurSliders' };
  for (const [panel, items] of Object.entries(SLIDERS)) {
    const root = document.getElementById(targetIds[panel]);
    if (!root) continue;
    root.innerHTML = '';
    items.forEach(([key, label, min, max, step, format]) => {
      const row = document.createElement('div');
      row.className = 'slider-row';
      row.innerHTML = `<div class="slider-head"><span>${label}</span><span id="value-${key}">${format(state.params[key])}</span></div><input type="range" min="${min}" max="${max}" step="${step}" value="${state.params[key]}" data-param="${key}">`;
      root.appendChild(row);
    });
  }

  buildHSLControls();
  drawCurvePreview();

  const presets = $('#presetGrid');
  presets.innerHTML = '';
  Object.keys(PRESETS).forEach(name => {
    const b = document.createElement('button');
    b.className = 'preset-btn';
    b.dataset.preset = name;
    b.innerHTML = `<span>${name}</span>`;
    presets.appendChild(b);
  });

  const ratios = $('#ratioRow');
  ratios.innerHTML = '';
  RATIOS.forEach(([key, label]) => {
    const b = document.createElement('button');
    b.dataset.ratio = key;
    b.textContent = label;
    ratios.appendChild(b);
  });
}

function buildHSLControls() {
  const colors = $('#hslColors');
  if (!colors) return;
  colors.innerHTML = '';
  HSL_COLORS.forEach(([key,label]) => {
    const b = document.createElement('button');
    b.dataset.hslColor = key;
    b.textContent = label;
    b.className = key === state.hslColor ? 'active' : '';
    b.onclick = () => { state.hslColor = key; buildHSLControls(); };
    colors.appendChild(b);
  });
  const root = $('#hslSliders');
  root.innerHTML = '';
  [['h','Hue'],['s','Saturation'],['l','Luminance']].forEach(([suffix,label]) => {
    const key = `hsl_${state.hslColor}_${suffix}`;
    const row = document.createElement('div');
    row.className = 'slider-row';
    row.innerHTML = `<div class="slider-head"><span>${label}</span><span id="value-${key}">${pct(state.params[key] || 0)}</span></div><input type="range" min="-1" max="1" step="0.01" value="${state.params[key] || 0}" data-param="${key}">`;
    root.appendChild(row);
  });
}

function drawCurvePreview(){
  const c=$('#curveCanvas'); if(!c) return; const ctx=c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height); ctx.fillStyle='#0b0d13'; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=1;
  for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(i*c.width/4,0);ctx.lineTo(i*c.width/4,c.height);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*c.height/4);ctx.lineTo(c.width,i*c.height/4);ctx.stroke();}
  ctx.strokeStyle='#7387ff'; ctx.lineWidth=2; ctx.beginPath();
  for(let i=0;i<=100;i++){const x=i/100, sw=(1-x)**2, hw=x*x, mw=1-Math.abs(x*2-1); let y=clamp(x+(state.params.curveShadows*sw+state.params.curveMidtones*mw+state.params.curveHighlights*hw)*.22,0,1); const px=x*c.width, py=(1-y)*c.height; i?ctx.lineTo(px,py):ctx.moveTo(px,py);} ctx.stroke();
}

function updateHistogram(){
  const hc=$('#histogramCanvas'); if(!hc || !state.image || !$('#editorCanvas').width) return;
  const w=128,h=72,tmp=document.createElement('canvas'); tmp.width=w;tmp.height=h; const t=tmp.getContext('2d',{willReadFrequently:true});
  try{t.drawImage($('#editorCanvas'),0,0,w,h); const d=t.getImageData(0,0,w,h).data; const bins=Array(64).fill(0); let black=0,white=0;
    for(let i=0;i<d.length;i+=4){const l=(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2])/255;bins[Math.min(63,Math.floor(l*64))]++;if(l<.01)black++;if(l>.99)white++;}
    const ctx=hc.getContext('2d');ctx.clearRect(0,0,hc.width,hc.height);const max=Math.max(...bins,1);ctx.fillStyle='rgba(116,135,255,.85)';bins.forEach((v,i)=>{const bw=hc.width/64;ctx.fillRect(i*bw,hc.height-(v/max)*hc.height,bw+.5,(v/max)*hc.height)}); const pctClip=(black+white)/(d.length/4);$('#clipStatus').textContent=pctClip>.015?`Clipping ${(pctClip*100).toFixed(1)}%`:'No clipping';$('#clipStatus').classList.toggle('warning',pctClip>.015);
  }catch(e){}
}

function updateExportEstimate(){
  if(!state.image) return; const res=$('#exportResolution')?.value||'original'; const source=makeGeometryCanvas(0); let w=source.width,h=source.height; const max=res==='original'?Math.max(w,h):Number(res); if(res!=='original'&&Math.max(w,h)>max){const sc=max/Math.max(w,h);w=Math.round(w*sc);h=Math.round(h*sc);} const q=Number($('#exportQuality')?.value||92)/100; const mp=w*h/1e6; const type=$('#exportType')?.value||'image/jpeg'; const factor=type==='image/png'?1.8:(.22+.55*q); const mb=Math.max(.1,mp*factor); $('#exportEstimate').textContent=`${w} × ${h} · approx ${mb.toFixed(1)} MB`;
}

function applyBeautyPreset(name){
  const looks={natural:{skinSmooth:.12,skinGlow:.06,skinBrighten:.04,skinTexture:.08},fresh:{skinSmooth:.18,skinGlow:.13,skinBrighten:.10,skinEven:.08,skinTexture:.10},soft:{skinSmooth:.28,skinGlow:.10,skinEven:.16,skinTexture:.14},glow:{skinSmooth:.14,skinGlow:.24,skinBrighten:.14,skinWarmth:.05,skinTexture:.08}};
  const before=snapshot(); SLIDERS.beauty.forEach(x=>state.params[x[0]]=0); Object.assign(state.params,looks[name]||looks.natural); commit(before); syncUI(); queueRender(); $$('#beautyPills button').forEach(b=>b.classList.toggle('active',b.dataset.beautyPreset===name)); toast(`${name} beauty applied`);
}

function syncUI() {
  $$('input[data-param]').forEach(input => {
    const k = input.dataset.param;
    input.value = state.params[k];
    const spec = Object.values(SLIDERS).flat().find(x => x[0] === k);
    const valueEl = $(`#value-${k}`);
    if (spec && valueEl) valueEl.textContent = spec[5](state.params[k]);
  });
  $$('#ratioRow button').forEach(b => b.classList.toggle('active', b.dataset.ratio === state.params.cropRatio));
  $('#maskBrushSize').value = Math.round(state.maskBrush * 100);
  $('#maskBrushValue').textContent = `${Math.round(state.maskBrush * 100)}%`;
  if ($('#maskFeather')) $('#maskFeather').value = Math.round(state.params.maskFeather * 100);
  if ($('#maskFeatherValue')) $('#maskFeatherValue').textContent = `${Math.round(state.params.maskFeather * 100)}%`;
  $('#maskInvertBtn')?.classList.toggle('active', !!state.params.maskInvert);
  buildHSLControls();
  drawCurvePreview();
  updateExportEstimate();
  drawMaskOverlay();
}

function isDefaultLook() {
  const keys = ['exposure','brightness','contrast','highlights','shadows','whites','blacks','temperature','tint','vibrance','saturation','sharpness','clarity','dehaze','vignette','grain','bloom','skinSmooth','skinGlow','skinWarmth','skinRedness','skinBrighten','skinEven','skinTexture','curveShadows','curveMidtones','curveHighlights', ...Object.keys(HSL_DEFAULTS)];
  return keys.every(k => Math.abs(state.params[k]) < .0001);
}

function selectPanel(panel) {
  state.panel = panel;
  $$('#toolTabs button').forEach(b => b.classList.toggle('active', b.dataset.panel === panel));
  $$('.edit-panel').forEach(p => p.classList.toggle('active', p.dataset.panelView === panel));
  $('#maskOverlay').classList.toggle('active', panel === 'mask');
  $('#maskBadge').classList.toggle('show', panel === 'mask');
  drawMaskOverlay();
}

function resetPanel(panel) {
  const keys = {
    presets: ['exposure','brightness','contrast','highlights','shadows','whites','blacks','temperature','tint','vibrance','saturation','sharpness','clarity','dehaze','vignette','grain','bloom','skinGlow','skinBrighten','curveShadows','curveMidtones','curveHighlights', ...Object.keys(HSL_DEFAULTS)],
    light: SLIDERS.light.map(x => x[0]),
    color: SLIDERS.color.map(x => x[0]),
    effects: SLIDERS.effects.map(x => x[0]),
    beauty: SLIDERS.beauty.map(x => x[0]),
    mask: [...SLIDERS.mask.map(x => x[0]), 'maskFeather','maskInvert'],
    hsl: Object.keys(HSL_DEFAULTS),
    curve: SLIDERS.curve.map(x => x[0]),
    levels: SLIDERS.levels.map(x=>x[0]), grading: SLIDERS.grading.map(x=>x[0]), tonal: SLIDERS.tonal.map(x=>x[0]), mixer: SLIDERS.mixer.map(x=>x[0]),
    replacecolor: SLIDERS.replacecolor.map(x=>x[0]), optics: SLIDERS.optics.map(x=>x[0]), film: SLIDERS.film.map(x=>x[0]), blur: SLIDERS.blur.map(x=>x[0]),
    crop: ['cropRatio','rotation','flipH','flipV']
  }[panel];
  if (!keys) return;
  const before = snapshot();
  keys.forEach(k => state.params[k] = DEFAULT_PARAMS[k]);
  if (panel === 'crop') invalidateGeometry(true);
  commit(before);
  syncUI();
  queueRender();
}

function applyPreset(name) {
  const before = snapshot();
  ['exposure','brightness','contrast','highlights','shadows','whites','blacks','temperature','tint','vibrance','saturation','sharpness','clarity','dehaze','vignette','grain','bloom','skinGlow','skinBrighten','curveShadows','curveMidtones','curveHighlights', ...Object.keys(HSL_DEFAULTS)].forEach(k => state.params[k] = 0);
  Object.assign(state.params, PRESETS[name]);
  commit(before);
  syncUI();
  queueRender();
  $$('.preset-btn').forEach(b => b.classList.toggle('active', b.dataset.preset === name));
  toast(`${name} applied`);
}

function showPage(page) {
  state.page = page;
  $$('.page').forEach(p => p.classList.toggle('active', p.dataset.page === page));
  $('#homeTopbar').style.display = page === 'home' ? 'flex' : 'none';
  $$('#bottomNav button').forEach(b => b.classList.toggle('active', b.dataset.nav === page));
  if (page === 'editor') queueRender();
  if (page === 'me') refreshStatus();
  if (page === 'projects') refreshProjects();
  if (page === 'tools') buildMegaToolCatalog();
  if (page === 'ai') refreshAIStatus();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function openTool(tool) {
  if (state.image) {
    showPage('editor');
    selectPanel(tool === 'auto' ? 'auto' : tool);
    if (tool === 'auto') runAutoEnhance();
  } else {
    state.pendingPanel = tool;
    $('#photoInput').click();
  }
}
