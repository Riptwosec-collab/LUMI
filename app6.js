function runAutoEnhance(strength = 1) {
  if (!state.image) return;
  const a = analyzeImage();
  const before = snapshot();
  const adjusted=Object.fromEntries(Object.entries(a.suggested).map(([k,v])=>[k,v*strength]));
  Object.assign(state.params, adjusted);
  commit(before);
  syncUI();
  queueRender();
  $('#analysisResult').innerHTML = `แสงเฉลี่ย <b>${Math.round(a.avg*100)}%</b> · Dynamic range <b>${Math.round(a.range*100)}%</b> · Saturation <b>${Math.round(a.avgSat*100)}%</b><br>WB ${a.warmth>0?'cool → warm':'warm → cool'}<br>Applied: Exposure ${adjusted.exposure.toFixed(2)}, Shadows ${pct(adjusted.shadows)}, Highlights ${pct(adjusted.highlights)}, Vibrance ${pct(adjusted.vibrance)}`;
  toast('Auto Enhance applied');
}

async function exportImage() {
  if (!state.image) return;
  loading(true, 'Rendering full quality…');
  try {
    let source = makeGeometryCanvas(0);
    const requested = $('#exportResolution')?.value || 'original';
    if (requested !== 'original' && Math.max(source.width, source.height) > Number(requested)) {
      const sc = Number(requested) / Math.max(source.width, source.height);
      const sized = document.createElement('canvas'); sized.width=Math.max(1,Math.round(source.width*sc)); sized.height=Math.max(1,Math.round(source.height*sc)); sized.getContext('2d').drawImage(source,0,0,sized.width,sized.height); source=sized;
    }
    const max = state.renderer.maxTextureSize;
    if (source.width > max || source.height > max) {
      const scale = max / Math.max(source.width, source.height);
      const tmp = document.createElement('canvas');
      tmp.width = Math.round(source.width * scale);
      tmp.height = Math.round(source.height * scale);
      tmp.getContext('2d').drawImage(source, 0, 0, tmp.width, tmp.height);
      source = tmp;
      toast(`ลดขนาดตาม WebGL limit ${max}px`);
    }
    const mask = makeMaskCanvas(source.width, source.height);
    const out = document.createElement('canvas');
    const renderer = new WebGLRenderer(out);
    renderer.render(source, state.params, mask);
    const type = $('#exportType').value;
    const quality = Number($('#exportQuality').value) / 100;
    const blob = await new Promise((resolve, reject) => out.toBlob(b => b ? resolve(b) : reject(new Error('Encode failed')), type, quality));
    const ext = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp' }[type] || 'jpg';
    const file = new File([blob], `${state.projectName || 'LUMI'}-edited.${ext}`, { type });

    if (navigator.canShare && navigator.canShare({ files:[file] })) {
      await navigator.share({ files:[file], title:'LUMI AI Export' });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    modal('exportModal', false);
    toast('Export complete');
  } catch (err) {
    if (err?.name !== 'AbortError') {
      console.error(err);
      toast('Export ไม่สำเร็จ');
    }
  } finally {
    loading(false);
  }
}

function resetCanvasGesture() {
  Object.assign(state.gesture, { scale:1, x:0, y:0, pointers:new Map(), startDist:0, startScale:1 });
  applyCanvasTransform();
}

function applyCanvasTransform() {
  const { scale,x,y } = state.gesture;
  $('#canvasStack').style.transform = `translate(${x}px,${y}px) scale(${scale})`;
}

function setupCanvasGestures() {
  const stage = $('#canvasStack');
  let lastTap = 0;
  stage.addEventListener('pointerdown', e => {
    if (state.panel === 'mask') return;
    stage.setPointerCapture(e.pointerId);
    state.gesture.pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if (state.gesture.pointers.size === 2) {
      const p = [...state.gesture.pointers.values()];
      state.gesture.startDist = Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
      state.gesture.startScale = state.gesture.scale;
    }
    const now = Date.now();
    if (now-lastTap < 300) {
      resetCanvasGesture();
      lastTap = 0;
    } else lastTap = now;
  });
  stage.addEventListener('pointermove', e => {
    if (state.panel === 'mask' || !state.gesture.pointers.has(e.pointerId)) return;
    const old = state.gesture.pointers.get(e.pointerId);
    state.gesture.pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if (state.gesture.pointers.size === 1 && state.gesture.scale > 1) {
      state.gesture.x += e.clientX-old.x;
      state.gesture.y += e.clientY-old.y;
    } else if (state.gesture.pointers.size === 2) {
      const p = [...state.gesture.pointers.values()];
      const dist = Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
      state.gesture.scale = clamp(state.gesture.startScale*(dist/state.gesture.startDist),1,5);
      if (state.gesture.scale === 1) { state.gesture.x=0; state.gesture.y=0; }
    }
    applyCanvasTransform();
  });
  const end = e => state.gesture.pointers.delete(e.pointerId);
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
}

function pointFromMaskEvent(e) {
  const rect = $('#maskOverlay').getBoundingClientRect();
  return {
    x: clamp((e.clientX-rect.left)/rect.width, 0, 1),
    y: clamp((e.clientY-rect.top)/rect.height, 0, 1)
  };
}

function setupMaskDrawing() {
  const overlay = $('#maskOverlay');
  overlay.addEventListener('pointerdown', e => {
    if (state.panel !== 'mask' || !state.image) return;
    e.preventDefault();
    overlay.setPointerCapture(e.pointerId);
    const before = snapshot();
    const stroke = { erase: state.maskMode === 'erase', size: state.maskBrush, points: [pointFromMaskEvent(e)] };
    state.maskStrokes.push(stroke);
    state.maskDrawing = { pointerId:e.pointerId, stroke, before };
    drawMaskOverlay();
  });
  overlay.addEventListener('pointermove', e => {
    if (!state.maskDrawing || state.maskDrawing.pointerId !== e.pointerId) return;
    state.maskDrawing.stroke.points.push(pointFromMaskEvent(e));
    drawMaskOverlay();
  });
  const finish = e => {
    if (!state.maskDrawing || state.maskDrawing.pointerId !== e.pointerId) return;
    commit(state.maskDrawing.before);
    state.maskDrawing = null;
    queueRender();
  };
  overlay.addEventListener('pointerup', finish);
  overlay.addEventListener('pointercancel', finish);
}

async function refreshStatus() {
  $('#modeValue').textContent = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone ? 'Installed PWA' : 'Browser';
  $('#offlineValue').textContent = !('serviceWorker' in navigator) ? 'Unavailable' : navigator.serviceWorker.controller ? 'Active' : 'Ready after refresh';
  if (state.renderer) $('#rendererValue').textContent = `WebGL2 Pro · max ${state.renderer.maxTextureSize}px`;
  if (state.db) $('#projectCount').textContent = (await listProjects()).length;
}

function openFeatureModal(feature, ai = false) {
  const data = ai ? AI_FEATURES[feature] : INFO_FEATURES[feature];
  if (!data) return;
  $('#featureStatus').textContent = data.status;
  $('#featureTitle').textContent = data.title;
  $('#featureBody').innerHTML = `<p>${escapeHtml(data.body)}</p>${data.bullets?.length ? `<ul>${data.bullets.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>` : ''}${ai ? '<div class="feature-warning">Cloud AI ยังไม่ส่งรูปหรือเรียก API ใด ๆ ในเวอร์ชันนี้</div>' : ''}`;
  if (ai && data.fallbackPanel) {
    const localLabel = data.fallbackPanel === 'mask' ? 'Manual Mask' : data.fallbackPanel === 'beauty' ? 'Local Beauty' : data.fallbackPanel === 'crop' ? 'Crop / Canvas' : data.fallbackPanel;
    $('#featureActionBtn').textContent = state.image ? `Open ${localLabel}` : 'Choose Photo for Local Tool';
    $('#featureActionBtn').onclick = () => {
      modal('featureModal', false);
      if (state.image) {
        showPage('editor');
        selectPanel(data.fallbackPanel);
      } else {
        state.pendingPanel = data.fallbackPanel;
        $('#photoInput').click();
      }
    };
  } else {
    $('#featureActionBtn').textContent = 'Close';
    $('#featureActionBtn').onclick = () => modal('featureModal', false);
  }
  modal('featureModal', true);
}

async function clearOfflineCache() {
  if (!('caches' in window)) {
    toast('Cache API unavailable');
    return;
  }
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  toast('Offline cache cleared');
  setTimeout(() => location.reload(), 450);
}

