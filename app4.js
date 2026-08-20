function buildControls() {
  const targetIds = { light: 'lightSliders', color: 'colorSliders', effects: 'effectSliders', beauty: 'beautySliders', mask: 'maskSliders', curve: 'curveSliders' };
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

async function loadBlob(blob, name = 'Photo', existingId = null, existingParams = null, existingMask = null) {
  if (state.objectURL) URL.revokeObjectURL(state.objectURL);
  state.objectURL = URL.createObjectURL(blob);
  state.originalBlob = blob;
  const img = new Image();
  img.decoding = 'async';
  img.src = state.objectURL;
  await img.decode();

  state.image = img;
  state.params = existingParams ? { ...deepCopy(DEFAULT_PARAMS), ...existingParams } : deepCopy(DEFAULT_PARAMS);
  state.maskStrokes = deepCopy(existingMask || []);
  state.undo = [];
  state.redo = [];
  invalidateGeometry(false);
  state.projectId = existingId || crypto.randomUUID();
  state.projectName = name.replace(/\.[^.]+$/, '') || 'LUMI Photo';

  $('#projectTitle').textContent = state.projectName;
  $('#imageMeta').textContent = `${img.naturalWidth} × ${img.naturalHeight} • LOCAL • NON-DESTRUCTIVE`;
  $('#exportInfo').textContent = `Original ${img.naturalWidth} × ${img.naturalHeight}`;

  if (!existingId) {
    const thumb = await makeThumbnail(blob);
    await putProject({ id: state.projectId, name: state.projectName, blob, params: state.params, maskStrokes: state.maskStrokes, thumb, createdAt: Date.now(), updatedAt: Date.now(), favorite:false });
  }

  syncUI();
  updateHistoryButtons();
  showPage('editor');
  selectPanel(state.pendingPanel === 'editor' ? 'light' : state.pendingPanel);
  state.pendingPanel = 'light';
  renderPreview();
  await refreshProjects();
  if (state.panel === 'auto') runAutoEnhance();
}

async function makeThumbnail(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement('canvas');
    const s = Math.min(1, 400 / Math.max(img.naturalWidth, img.naturalHeight));
    c.width = Math.max(1, Math.round(img.naturalWidth * s));
    c.height = Math.max(1, Math.round(img.naturalHeight * s));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise(resolve => c.toBlob(resolve, 'image/jpeg', .72));
  } finally {
    URL.revokeObjectURL(url);
  }
}

let saveTimer;
