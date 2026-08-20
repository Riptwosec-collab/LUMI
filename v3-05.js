function bindEvents() {
  $$('[data-nav]').forEach(b => b.onclick = () => {
    const page = b.dataset.nav;
    if (page === 'editor' && !state.image) { state.pendingPanel = 'light'; $('#photoInput').click(); return; }
    showPage(page);
  });
  $$('[data-open-picker]').forEach(b => b.onclick = () => { state.pendingPanel = b.dataset.openPicker || 'light'; $('#photoInput').click(); });
  $$('[data-tool]').forEach(b => b.onclick = () => openTool(b.dataset.tool));
  $$('.info-feature').forEach(b => b.onclick = () => openFeatureModal(b.dataset.feature, false));
  $$('[data-ai]').forEach(b => b.onclick = () => openFeatureModal(b.dataset.ai, true));
  $('#photoInput').onchange = async e => { const f = e.target.files?.[0]; if (!f) return; loading(true, 'Loading photo…'); try { await loadBlob(f, f.name); } catch (err) { console.error(err); toast('เปิดรูปไม่สำเร็จ'); } finally { loading(false); e.target.value = ''; } };
  $('#backBtn').onclick = () => showPage('home'); $('#undoBtn').onclick = undo; $('#redoBtn').onclick = redo;
  $('#compareBtn').onclick = () => { state.compare = !state.compare; $('#compareBtn').classList.toggle('accent', state.compare); queueRender(); };
  $('#exportBtn').onclick = () => { if(!state.image) return toast('เลือกรูปก่อน'); updateExportEstimate(); modal('exportModal', true); };
  $('#downloadExportBtn').onclick = exportImage;
  $('#exportQuality').oninput = e => { $('#qualityValue').textContent = `${e.target.value}%`; updateExportEstimate(); };
  $('#exportType').onchange = updateExportEstimate; $('#exportResolution').onchange = updateExportEstimate;
  $$('[data-close-modal]').forEach(b => b.onclick = () => modal(b.dataset.closeModal, false));
  $$('.modal-backdrop').forEach(m => m.addEventListener('click', e => { if (e.target === m) modal(m.id, false); }));
  $$('#toolTabs button').forEach(b => b.onclick = () => selectPanel(b.dataset.panel));
  document.addEventListener('pointerdown', e => { const input = e.target.closest('input[data-param]'); if (input) state.sliderStart = snapshot(); });
  document.addEventListener('input', e => { const input = e.target.closest('input[data-param]'); if (!input) return; const k = input.dataset.param; state.params[k] = Number(input.value); const spec = Object.values(SLIDERS).flat().find(x => x[0] === k); const valueEl = $(`#value-${k}`); if (spec && valueEl) valueEl.textContent = spec[5](state.params[k]); else if (k.startsWith('hsl_') && valueEl) valueEl.textContent = pct(state.params[k]); if (k.startsWith('curve')) drawCurvePreview(); queueRender(); });
  document.addEventListener('change', e => { const input = e.target.closest('input[data-param]'); if (!input) return; commit(state.sliderStart || snapshot()); state.sliderStart = null; });
  $$('.preset-btn').forEach(b => b.onclick = () => applyPreset(b.dataset.preset));
  $$('#beautyPills button').forEach(b => b.onclick = () => applyBeautyPreset(b.dataset.beautyPreset));
  $$('[data-reset-panel]').forEach(b => b.onclick = () => resetPanel(b.dataset.resetPanel));
  $$('#ratioRow button').forEach(b => b.onclick = () => { const before = snapshot(); state.params.cropRatio = b.dataset.ratio; invalidateGeometry(true); commit(before); syncUI(); queueRender(); });
  $('#rotateLeftBtn').onclick = () => { const before = snapshot(); state.params.rotation = (state.params.rotation - 90) % 360; invalidateGeometry(true); commit(before); queueRender(); };
  $('#flipHBtn').onclick = () => { const before = snapshot(); state.params.flipH = !state.params.flipH; invalidateGeometry(true); commit(before); queueRender(); };
  $('#flipVBtn').onclick = () => { const before = snapshot(); state.params.flipV = !state.params.flipV; invalidateGeometry(true); commit(before); queueRender(); };
  const autoStrength = (id,strength) => { $$('.auto-strength button').forEach(b=>b.classList.toggle('active',b.id===id)); runAutoEnhance(strength); };
  $('#autoEnhanceBtn').onclick = () => autoStrength('autoEnhanceBtn',1); if ($('#autoNaturalBtn')) $('#autoNaturalBtn').onclick = () => autoStrength('autoNaturalBtn',.65); if ($('#autoStrongBtn')) $('#autoStrongBtn').onclick = () => autoStrength('autoStrongBtn',1.35);
  $('#maskPaintBtn').onclick = () => { state.maskMode = 'paint'; $('#maskPaintBtn').classList.add('active'); $('#maskEraseBtn').classList.remove('active'); };
  $('#maskEraseBtn').onclick = () => { state.maskMode = 'erase'; $('#maskEraseBtn').classList.add('active'); $('#maskPaintBtn').classList.remove('active'); };
  $('#maskFeather').onpointerdown = () => { state.sliderStart = snapshot(); };
  $('#maskFeather').oninput = e => { state.params.maskFeather=Number(e.target.value)/100; $('#maskFeatherValue').textContent=`${e.target.value}%`; queueRender(); };
  $('#maskFeather').onchange = () => { commit(state.sliderStart || snapshot()); state.sliderStart=null; };
  $('#maskInvertBtn').onclick = () => { if(!state.maskStrokes.length) return toast('ระบาย Mask ก่อน Invert'); const before=snapshot(); state.params.maskInvert=!state.params.maskInvert; commit(before); syncUI(); queueRender(); };
  $('#maskBrushSize').oninput = e => { state.maskBrush = Number(e.target.value) / 100; $('#maskBrushValue').textContent = `${e.target.value}%`; };
  $('#maskUndoStrokeBtn').onclick = () => { if (!state.maskStrokes.length) return toast('ยังไม่มี Mask stroke'); const before = snapshot(); state.maskStrokes.pop(); commit(before); drawMaskOverlay(); queueRender(); };
  $('#clearMaskBtn').onclick = () => { if (!state.maskStrokes.length && !state.params.maskInvert && state.params.maskFeather===DEFAULT_PARAMS.maskFeather && SLIDERS.mask.every(x => state.params[x[0]] === 0)) return; const before = snapshot(); state.maskStrokes = []; SLIDERS.mask.forEach(x => state.params[x[0]] = DEFAULT_PARAMS[x[0]]); state.params.maskFeather = DEFAULT_PARAMS.maskFeather; state.params.maskInvert = false; commit(before); syncUI(); queueRender(); };
  $('#viewAllProjectsBtn').onclick = () => showPage('projects');
  $('#favoriteProjectsBtn').onclick = async () => { state.projectFilter = state.projectFilter==='favorites'?'all':'favorites'; $('#favoriteProjectsBtn').classList.toggle('active',state.projectFilter==='favorites'); $('#favoriteProjectsBtn').textContent=state.projectFilter==='favorites'?'★ All Projects':'★ Favorites'; await refreshProjects(); };
  $('#clearProjectsBtn').onclick = async () => { if (!confirm('ลบ Projects ที่เก็บในเครื่องทั้งหมด?')) return; await clearProjects(); if (state.objectURL) URL.revokeObjectURL(state.objectURL); state.image = null; state.originalBlob = null; state.projectId = null; state.maskStrokes = []; state.healSpots = []; state.textLayers=[]; state.layers=[]; state.projectVersions=[]; $('#canvasEmpty').style.display = 'flex'; await refreshProjects(); toast('Projects cleared'); };
  const install = () => { if (state.deferredInstall) { state.deferredInstall.prompt(); state.deferredInstall = null; } else modal('installModal', true); };
  $('#installBtn').onclick = install; $('#installHelpBtn').onclick = install; $('#clearOfflineCacheBtn').onclick = clearOfflineCache;
  $('#aboutBtn').onclick = () => { $('#featureStatus').textContent = 'LUMI AI PWA'; $('#featureTitle').textContent = 'Feature Status'; $('#featureBody').innerHTML = '<p><b>Working locally:</b> Import, Smart Auto + WB, Beauty, Presets, Light, Color, HSL Mixer, Tone Curve, Detail, Manual Mask + Feather/Invert, Crop/Rotate/Flip, Undo/Redo, Projects, Before/After และ Export</p><p><b>Needs API:</b> Generative Remove, Background, Expand, Portrait, Hair และ Outfit</p><p><b>Browser-limited:</b> RAW/HDR pipeline เต็มรูปแบบ</p>'; $('#featureActionBtn').textContent = 'Close'; $('#featureActionBtn').onclick = () => modal('featureModal', false); modal('featureModal', true); };
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); state.deferredInstall = e; }); setupCanvasGestures(); setupMaskDrawing();
}

const AI_MODELS = Object.freeze({
  rembg: { name:'rembg', label:'Background AI', icon:'✂', badge:'CLEAN', description:'Background removal / cutout / product isolation', colors:['#22C55E','#34D399','#A7F3D0'], endpointKey:'REMBG_ENDPOINT' },
  realesrgan: { name:'Real-ESRGAN', label:'Enhance AI', icon:'◇', badge:'HD', description:'Super-resolution / detail restoration / upscale', colors:['#3B82F6','#38BDF8','#93C5FD'], endpointKey:'REALESRGAN_ENDPOINT' },
  sam2: { name:'SAM 2', label:'Selection AI', icon:'◎', badge:'SMART', description:'Promptable object selection and semantic masks', colors:['#8B5CF6','#22D3EE','#C4B5FD'], endpointKey:'SAM2_ENDPOINT' },
  flux: { name:'FLUX.1 Schnell', label:'Creative AI', icon:'✦', badge:'FAST', description:'Fast creative generation / portrait / style exploration', colors:['#F97316','#EC4899','#FB7185'], endpointKey:'FLUX_ENDPOINT' },
  sdxl: { name:'Stable Diffusion XL', label:'Generative Edit AI', icon:'◈', badge:'PRO', description:'Fill / replace / background / expand / img2img', colors:['#4F46E5','#818CF8','#A5B4FC'], endpointKey:'SDXL_ENDPOINT' }
});

const AI_TOOLS_V3 = [
  {id:'remove-background',title:'Remove Background',desc:'Cut person, product or subject to transparent PNG',group:'remove',model:'rembg',icon:'✂',options:['Person','Product','General']},
  {id:'product-cut',title:'Product Cut',desc:'Clean product isolation with transparent output',group:'remove',model:'rembg',icon:'▱',options:['Clean Edge','Soft Edge','Hair Detail']},
  {id:'transparent-png',title:'Transparent PNG',desc:'Export clean alpha cutout',group:'remove',model:'rembg',icon:'▦',options:['Original Size','2048px','1080px']},
  {id:'ai-remove',title:'Generative Remove',desc:'Remove selected object and rebuild the missing area',group:'remove',model:'sdxl',icon:'⌫',prompt:true,options:['Natural','Preserve Texture','Strong Fill']},
  {id:'enhance',title:'AI Enhance',desc:'Restore detail and perceived sharpness',group:'enhance',model:'realesrgan',icon:'◇',options:['Natural','Balanced','Strong']},
  {id:'upscale-2x',title:'Upscale 2×',desc:'Double resolution with AI reconstruction',group:'enhance',model:'realesrgan',icon:'2×',options:['Photo','Face','Illustration']},
  {id:'upscale-4x',title:'Upscale 4×',desc:'High resolution output for crop and print',group:'enhance',model:'realesrgan',icon:'4×',options:['Photo','Face','Illustration']},
  {id:'restore-detail',title:'Restore Detail',desc:'Recover texture from soft or compressed photos',group:'enhance',model:'realesrgan',icon:'✧',options:['Low','Medium','High']},
  {id:'smart-select',title:'Smart Select',desc:'Tap a subject or object to create a mask',group:'select',model:'sam2',icon:'◎',options:['Tap Object','Point + Box','Refine']},
  {id:'person-mask',title:'Person Mask',desc:'Select a person and keep individuals separate',group:'select',model:'sam2',icon:'♙',options:['Person 1','Person 2','All People']},
  {id:'face-mask',title:'Face / Skin Mask',desc:'Semantic selection workflow for portrait regions',group:'select',model:'sam2',icon:'♡',options:['Face','Skin','Hair']},
  {id:'sky-mask',title:'Sky / Background Mask',desc:'Select large scene regions for local editing',group:'select',model:'sam2',icon:'◒',options:['Sky','Background','Foreground']},
  {id:'generate',title:'AI Generate',desc:'Create a new image from a prompt',group:'generate',model:'flux',icon:'✦',prompt:true,options:['Portrait','Travel','Product','Creative']},
  {id:'ai-portrait',title:'AI Portrait',desc:'Generate premium portrait variations from your photo',group:'generate',model:'flux',icon:'◉',prompt:true,options:['Studio','Business','Travel','Film']},
  {id:'avatar',title:'Avatar Studio',desc:'Create stylized avatar variations',group:'generate',model:'flux',icon:'◍',prompt:true,options:['Clean','3D','Illustration','Fantasy']},
  {id:'style-transfer',title:'Style Transfer',desc:'Explore creative looks while keeping composition',group:'generate',model:'flux',icon:'≈',prompt:true,options:['Cinematic','Editorial','Dreamy','Graphic']},
  {id:'generative-fill',title:'Generative Fill',desc:'Fill a selection from a text instruction',group:'fill',model:'sdxl',icon:'▧',prompt:true,options:['Fill','Blend','Preserve Lighting']},
  {id:'ai-replace',title:'AI Replace',desc:'Replace the selected object while preserving scene context',group:'fill',model:'sdxl',icon:'⇄',prompt:true,options:['Object','Clothes','Accessory']},
  {id:'ai-background',title:'AI Background',desc:'Replace or generate a new background',group:'fill',model:'sdxl',icon:'▣',prompt:true,options:['Studio','Cafe','Outdoor','Custom']},
  {id:'generative-expand',title:'Generative Expand',desc:'Extend canvas for 9:16, 4:5, landscape or custom',group:'fill',model:'sdxl',icon:'↗',prompt:true,options:['9:16','4:5','16:9','Custom']},
  {id:'img2img',title:'Img2Img',desc:'Transform an image with prompt-controlled strength',group:'fill',model:'sdxl',icon:'◫',prompt:true,options:['Low Change','Balanced','Creative']},
  {id:'ai-outfit',title:'AI Outfit',desc:'Change clothes while preserving pose and face',group:'fill',model:'sdxl',icon:'♢',prompt:true,options:['Casual','Business','Formal','Custom']},
  {id:'ai-hair',title:'AI Hair',desc:'Change hairstyle or hair color',group:'fill',model:'sdxl',icon:'≋',prompt:true,options:['Style','Color','Both']},
  {id:'harmonize',title:'AI Harmonize',desc:'Match inserted content to exposure, color, grain and depth',group:'fill',model:'sdxl',icon:'◌',prompt:false,options:['Natural','Cinematic','Strong']}
];
