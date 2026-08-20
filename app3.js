async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('lumi-ai-pwa', 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbTx(mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction('projects', mode);
    const store = tx.objectStore('projects');
    fn(store);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function putProject(project) { await dbTx('readwrite', s => s.put(project)); }
async function deleteProject(id) { await dbTx('readwrite', s => s.delete(id)); }
async function clearProjects() { await dbTx('readwrite', s => s.clear()); }

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
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate(rot * Math.PI / 180);
  ctx.scale(state.params.flipH ? -1 : 1, state.params.flipV ? -1 : 1);
  ctx.drawImage(img, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
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
  return { params: deepCopy(state.params), maskStrokes: deepCopy(state.maskStrokes) };
}

function restoreSnapshot(snap) {
  if (!snap) return;
  if (snap.params) {
    state.params = { ...deepCopy(DEFAULT_PARAMS), ...deepCopy(snap.params) };
    state.maskStrokes = deepCopy(snap.maskStrokes || []);
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

