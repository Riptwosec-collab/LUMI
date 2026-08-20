function bindEvents() {
  $$('[data-nav]').forEach(b => b.onclick = () => {
    const page = b.dataset.nav;
    if (page === 'editor' && !state.image) {
      state.pendingPanel = 'light';
      $('#photoInput').click();
      return;
    }
    showPage(page);
  });

  $$('[data-open-picker]').forEach(b => b.onclick = () => {
    state.pendingPanel = b.dataset.openPicker || 'light';
    $('#photoInput').click();
  });

  $$('[data-tool]').forEach(b => b.onclick = () => openTool(b.dataset.tool));
  $$('.info-feature').forEach(b => b.onclick = () => openFeatureModal(b.dataset.feature, false));
  $$('[data-ai]').forEach(b => b.onclick = () => openFeatureModal(b.dataset.ai, true));

  $('#photoInput').onchange = async e => {
    const f = e.target.files?.[0];
    if (!f) return;
    loading(true, 'Loading photo…');
    try {
      await loadBlob(f, f.name);
    } catch (err) {
      console.error(err);
      toast('เปิดรูปไม่สำเร็จ');
    } finally {
      loading(false);
      e.target.value = '';
    }
  };

  $('#backBtn').onclick = () => showPage('home');
  $('#undoBtn').onclick = undo;
  $('#redoBtn').onclick = redo;
  $('#compareBtn').onclick = () => {
    state.compare = !state.compare;
    $('#compareBtn').classList.toggle('accent', state.compare);
    queueRender();
  };
  $('#exportBtn').onclick = () => { if(!state.image) return toast('เลือกรูปก่อน'); updateExportEstimate(); modal('exportModal', true); };
  $('#downloadExportBtn').onclick = exportImage;
  $('#exportQuality').oninput = e => { $('#qualityValue').textContent = `${e.target.value}%`; updateExportEstimate(); };
  $('#exportType').onchange = updateExportEstimate;
  $('#exportResolution').onchange = updateExportEstimate;

  $$('[data-close-modal]').forEach(b => b.onclick = () => modal(b.dataset.closeModal, false));
  $$('.modal-backdrop').forEach(m => m.addEventListener('click', e => { if (e.target === m) modal(m.id, false); }));

  $$('#toolTabs button').forEach(b => b.onclick = () => selectPanel(b.dataset.panel));

  document.addEventListener('pointerdown', e => {
    const input = e.target.closest('input[data-param]');
    if (input) state.sliderStart = snapshot();
  });

  document.addEventListener('input', e => {
    const input = e.target.closest('input[data-param]');
    if (!input) return;
    const k = input.dataset.param;
    state.params[k] = Number(input.value);
    const spec = Object.values(SLIDERS).flat().find(x => x[0] === k);
    const valueEl = $(`#value-${k}`);
    if (spec && valueEl) valueEl.textContent = spec[5](state.params[k]);
    else if (k.startsWith('hsl_') && valueEl) valueEl.textContent = pct(state.params[k]);
    if (k.startsWith('curve')) drawCurvePreview();
    queueRender();
  });

  document.addEventListener('change', e => {
    const input = e.target.closest('input[data-param]');
    if (!input) return;
    commit(state.sliderStart || snapshot());
    state.sliderStart = null;
  });

  $$('.preset-btn').forEach(b => b.onclick = () => applyPreset(b.dataset.preset));
  $$('#beautyPills button').forEach(b => b.onclick = () => applyBeautyPreset(b.dataset.beautyPreset));
  $$('[data-reset-panel]').forEach(b => b.onclick = () => resetPanel(b.dataset.resetPanel));

  $$('#ratioRow button').forEach(b => b.onclick = () => {
    const before = snapshot();
    state.params.cropRatio = b.dataset.ratio;
    invalidateGeometry(true);
    commit(before);
    syncUI();
    queueRender();
  });

  $('#rotateLeftBtn').onclick = () => {
    const before = snapshot();
    state.params.rotation = (state.params.rotation - 90) % 360;
    invalidateGeometry(true);
    commit(before);
    queueRender();
  };
  $('#flipHBtn').onclick = () => {
    const before = snapshot();
    state.params.flipH = !state.params.flipH;
    invalidateGeometry(true);
    commit(before);
    queueRender();
  };
  $('#flipVBtn').onclick = () => {
    const before = snapshot();
    state.params.flipV = !state.params.flipV;
    invalidateGeometry(true);
    commit(before);
    queueRender();
  };

  const autoStrength = (id,strength) => { $$('.auto-strength button').forEach(b=>b.classList.toggle('active',b.id===id)); runAutoEnhance(strength); };
  $('#autoEnhanceBtn').onclick = () => autoStrength('autoEnhanceBtn',1);
  $('#autoNaturalBtn') && ($('#autoNaturalBtn').onclick = () => autoStrength('autoNaturalBtn',.65));
  $('#autoStrongBtn') && ($('#autoStrongBtn').onclick = () => autoStrength('autoStrongBtn',1.35));

  $('#maskPaintBtn').onclick = () => {
    state.maskMode = 'paint';
    $('#maskPaintBtn').classList.add('active');
    $('#maskEraseBtn').classList.remove('active');
  };
  $('#maskEraseBtn').onclick = () => {
    state.maskMode = 'erase';
    $('#maskEraseBtn').classList.add('active');
    $('#maskPaintBtn').classList.remove('active');
  };
  $('#maskFeather').onpointerdown = () => { state.sliderStart = snapshot(); };
  $('#maskFeather').oninput = e => { state.params.maskFeather=Number(e.target.value)/100; $('#maskFeatherValue').textContent=`${e.target.value}%`; queueRender(); };
  $('#maskFeather').onchange = () => { commit(state.sliderStart || snapshot()); state.sliderStart=null; };
  $('#maskInvertBtn').onclick = () => { if(!state.maskStrokes.length) return toast('ระบาย Mask ก่อน Invert'); const before=snapshot(); state.params.maskInvert=!state.params.maskInvert; commit(before); syncUI(); queueRender(); };
  $('#maskBrushSize').oninput = e => {
    state.maskBrush = Number(e.target.value) / 100;
    $('#maskBrushValue').textContent = `${e.target.value}%`;
  };
  $('#maskUndoStrokeBtn').onclick = () => {
    if (!state.maskStrokes.length) return toast('ยังไม่มี Mask stroke');
    const before = snapshot();
    state.maskStrokes.pop();
    commit(before);
    drawMaskOverlay();
    queueRender();
  };
  $('#clearMaskBtn').onclick = () => {
    if (!state.maskStrokes.length && !state.params.maskInvert && state.params.maskFeather===DEFAULT_PARAMS.maskFeather && SLIDERS.mask.every(x => state.params[x[0]] === 0)) return;
    const before = snapshot();
    state.maskStrokes = [];
    SLIDERS.mask.forEach(x => state.params[x[0]] = DEFAULT_PARAMS[x[0]]);
    state.params.maskFeather = DEFAULT_PARAMS.maskFeather;
    state.params.maskInvert = false;
    commit(before);
    syncUI();
    queueRender();
  };

  $('#viewAllProjectsBtn').onclick = () => showPage('projects');
  $('#favoriteProjectsBtn').onclick = async () => { state.projectFilter = state.projectFilter==='favorites'?'all':'favorites'; $('#favoriteProjectsBtn').classList.toggle('active',state.projectFilter==='favorites'); $('#favoriteProjectsBtn').textContent=state.projectFilter==='favorites'?'★ All Projects':'★ Favorites'; await refreshProjects(); };
  $('#clearProjectsBtn').onclick = async () => {
    if (!confirm('ลบ Projects ที่เก็บในเครื่องทั้งหมด?')) return;
    await clearProjects();
    if (state.objectURL) URL.revokeObjectURL(state.objectURL);
    state.image = null;
    state.originalBlob = null;
    state.projectId = null;
    state.maskStrokes = [];
    $('#canvasEmpty').style.display = 'flex';
    await refreshProjects();
    toast('Projects cleared');
  };

  const install = () => {
    if (state.deferredInstall) {
      state.deferredInstall.prompt();
      state.deferredInstall = null;
    } else modal('installModal', true);
  };
  $('#installBtn').onclick = install;
  $('#installHelpBtn').onclick = install;
  $('#clearOfflineCacheBtn').onclick = clearOfflineCache;
  $('#aboutBtn').onclick = () => {
    $('#featureStatus').textContent = 'LUMI AI PWA';
    $('#featureTitle').textContent = 'Feature Status';
    $('#featureBody').innerHTML = '<p><b>Working locally:</b> Import, Smart Auto + WB, Beauty, Presets, Light, Color, HSL Mixer, Tone Curve, Detail, Manual Mask + Feather/Invert, Crop/Rotate/Flip, Undo/Redo, Projects, Before/After และ Export</p><p><b>Needs API:</b> Generative Remove, Background, Expand, Portrait, Hair และ Outfit</p><p><b>Browser-limited:</b> RAW/HDR pipeline เต็มรูปแบบ</p>';
    $('#featureActionBtn').textContent = 'Close';
    $('#featureActionBtn').onclick = () => modal('featureModal', false);
    modal('featureModal', true);
  };

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    state.deferredInstall = e;
  });

  setupCanvasGestures();
  setupMaskDrawing();
}

async function init() {
  buildControls();
  try {
    state.renderer = new WebGLRenderer($('#editorCanvas'));
  } catch (err) {
    console.error(err);
    $('#rendererValue').textContent = 'Unavailable';
    toast('อุปกรณ์นี้ไม่รองรับ WebGL2');
  }

  try {
    state.db = await openDB();
    await refreshProjects();
  } catch (err) {
    console.error(err);
    toast('เปิด Local Projects ไม่สำเร็จ');
  }

  bindEvents();
  syncUI();
  updateHistoryButtons();
  refreshStatus();
  const initial = new URLSearchParams(location.search).get('open');
  if (['projects','ai','me'].includes(initial)) showPage(initial);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(refreshStatus).catch(() => { if($('#offlineValue')) $('#offlineValue').textContent='Online only'; });
  }
}

document.addEventListener('DOMContentLoaded', init);
