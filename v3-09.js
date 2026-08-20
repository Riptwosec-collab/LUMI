function renderLayerList(){
  const root=$('#layerList');if(!root)return;root.innerHTML='';
  state.layers.forEach(l=>{const row=document.createElement('article');row.className='project-row';row.style.gridTemplateColumns='1fr';row.innerHTML=`<div class="project-row-meta"><strong>${escapeHtml(l.name||'Image Layer')}</strong><span>Image layer</span></div><div class="control-group"><div class="slider-head"><span>Opacity</span><span>${Math.round((l.opacity??1)*100)}%</span></div><input data-layer-opacity="${l.id}" type="range" min="0" max="100" value="${Math.round((l.opacity??1)*100)}"><select data-layer-blend="${l.id}" style="width:100%;margin-top:8px;background:#11182a;border:1px solid var(--line);color:#fff;border-radius:10px;padding:8px"><option value="source-over">Normal</option><option value="multiply">Multiply</option><option value="screen">Screen</option><option value="overlay">Overlay</option><option value="soft-light">Soft Light</option><option value="hard-light">Hard Light</option><option value="color">Color</option><option value="luminosity">Luminosity</option></select><button data-layer-remove="${l.id}" class="danger-btn" style="width:100%;margin-top:8px">Remove Layer</button></div>`;root.appendChild(row);const sel=$(`[data-layer-blend="${l.id}"]`,row);if(sel)sel.value=l.blend||'source-over';});
  state.textLayers.forEach(l=>{const row=document.createElement('article');row.className='project-row';row.style.gridTemplateColumns='1fr';row.innerHTML=`<div class="project-row-meta"><strong>${escapeHtml(l.text||'Text')}</strong><span>Text / watermark · ${Math.round((l.opacity??1)*100)}%</span></div><button data-text-remove="${l.id}" class="danger-btn">Remove Text</button>`;root.appendChild(row);});
  if(!state.layers.length&&!state.textLayers.length)root.innerHTML='<div class="empty-state">No extra layers</div>';
  $$('[data-layer-opacity]',root).forEach(i=>i.oninput=()=>{const l=state.layers.find(x=>x.id===i.dataset.layerOpacity);if(!l)return;l.opacity=Number(i.value)/100;invalidateGeometry(false);queueRender();scheduleProjectSave();renderLayerList();});
  $$('[data-layer-blend]',root).forEach(i=>i.onchange=()=>{const l=state.layers.find(x=>x.id===i.dataset.layerBlend);if(!l)return;l.blend=i.value;invalidateGeometry(false);queueRender();scheduleProjectSave();});
  $$('[data-layer-remove]',root).forEach(b=>b.onclick=()=>{const i=state.layers.findIndex(x=>x.id===b.dataset.layerRemove);if(i<0)return;const [l]=state.layers.splice(i,1);if(l.url)URL.revokeObjectURL(l.url);invalidateGeometry(false);queueRender();scheduleProjectSave();renderLayerList();});
  $$('[data-text-remove]',root).forEach(b=>b.onclick=()=>{state.textLayers=state.textLayers.filter(x=>x.id!==b.dataset.textRemove);invalidateGeometry(false);queueRender();scheduleProjectSave();renderLayerList();});
}

async function addImageLayer(file){if(!state.image)return toast('Open a base photo first');const u=URL.createObjectURL(file),im=new Image();im.src=u;await im.decode();state.layers.push({id:crypto.randomUUID(),name:file.name,blob:file,image:im,opacity:.88,blend:'source-over',scale:.55,x:.5,y:.5,url:u});invalidateGeometry(false);queueRender();renderLayerList();scheduleProjectSave();toast('Image layer added');}

function setupRetouchTap(){const stage=$('#canvasStage');if(!stage)return;stage.addEventListener('click',e=>{if(state.panel!=='retouch'||!state.image)return;const rect=$('#editorCanvas').getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)return;const x=(e.clientX-rect.left)/rect.width,y=(e.clientY-rect.top)/rect.height;state.healSpots.push({x,y,r:state.healBrush,mode:state.retouchMode});invalidateGeometry(false);queueRender();scheduleProjectSave();updateHealUI();});}
function updateHealUI(){if($('#healCount'))$('#healCount').textContent=`${state.healSpots.length} retouch spot(s)`;}

function serializableLayers(){return (state.layers||[]).map(l=>({id:l.id,name:l.name,blob:l.blob,opacity:l.opacity,blend:l.blend,scale:l.scale,x:l.x,y:l.y}));}
async function rehydrateLayers(items){
  (state.layers||[]).forEach(l=>l.url&&URL.revokeObjectURL(l.url)); state.layers=[];
  for(const raw of items||[]){if(!raw?.blob)continue;const u=URL.createObjectURL(raw.blob),im=new Image();im.src=u;try{await im.decode();state.layers.push({...raw,image:im,url:u});}catch(e){URL.revokeObjectURL(u);}}
}

function bindV3Events(){
  const legacyAIMap={remove:'ai-remove',background:'ai-background',expand:'generative-expand',portrait:'ai-portrait',hair:'ai-hair',outfit:'ai-outfit'};
  $$('[data-ai]').forEach(b=>b.onclick=()=>openAIRun(legacyAIMap[b.dataset.ai]||b.dataset.ai));
  $$('#toolTabs button').forEach(b=>{b.onclick=()=>selectPanel(b.dataset.panel);});
  $$('[data-reset-panel]').forEach(b=>{b.onclick=()=>resetPanel(b.dataset.resetPanel);});
  $$('[data-open-ai-tool]').forEach(b=>b.onclick=()=>openAIRun(b.dataset.openAiTool));
  $$('[data-open-local-mask]').forEach(b=>b.onclick=()=>openTool('mask'));
  $('#toolSearch')?.addEventListener('input',buildMegaToolCatalog);
  $('#aiRunBtn').onclick=runAIJob;$('#aiLocalFallbackBtn').onclick=()=>{const f=localFallbackForAI(state.aiTool);modal('aiRunModal',false);if(f)openTool(f.panel);};
  $('#resultBackBtn').onclick=()=>showPage('ai');$('#resultEditMoreBtn').onclick=async()=>{if(!state.aiResult?.url)return;try{const r=await fetch(state.aiResult.url);const b=await r.blob();await loadBlob(b,`AI ${state.aiResult.tool.title}.png`);}catch(e){toast('Could not load AI result into editor');}};$('#resultRetryBtn').onclick=()=>state.aiTool&&openAIRun(state.aiTool.id);$('#resultSaveBtn').onclick=saveAIResult;$('#resultShareBtn').onclick=shareAIResult;
  $('#batchInput').onchange=e=>{modal('advancedToolModal',false);handleBatchFiles(e.target.files);e.target.value='';};$('#layerInput').onchange=e=>{const f=e.target.files?.[0];if(f)addImageLayer(f);e.target.value='';};
  $('#addLayerBtn')&&($('#addLayerBtn').onclick=()=>$('#layerInput').click());$('#addTextLayerBtn')&&($('#addTextLayerBtn').onclick=()=>openAdvancedTool('creator'));$('#clearLayersBtn')&&($('#clearLayersBtn').onclick=()=>{state.layers.forEach(l=>l.url&&URL.revokeObjectURL(l.url));state.layers=[];state.textLayers=[];invalidateGeometry(false);queueRender();renderLayerList();});
  $('#healModeBtn')&&($('#healModeBtn').onclick=()=>{state.retouchMode='heal';$('#healModeBtn').classList.add('active');$('#cloneModeBtn').classList.remove('active');});$('#cloneModeBtn')&&($('#cloneModeBtn').onclick=()=>{state.retouchMode='clone';$('#cloneModeBtn').classList.add('active');$('#healModeBtn').classList.remove('active');});$('#healBrush')&&($('#healBrush').oninput=e=>{state.healBrush=Number(e.target.value)/100;$('#healBrushValue').textContent=`${e.target.value}%`;});$('#undoHealBtn')&&($('#undoHealBtn').onclick=()=>{state.healSpots.pop();invalidateGeometry(false);queueRender();updateHealUI();});$('#clearHealBtn')&&($('#clearHealBtn').onclick=()=>{state.healSpots=[];invalidateGeometry(false);queueRender();updateHealUI();});
  setupRetouchTap();renderLayerList();updateHealUI();
}

async function saveAIResult(){if(!state.aiResult?.url)return;try{const r=await fetch(state.aiResult.url);const b=await r.blob(),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`LUMI-${state.aiResult.tool.id}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);}catch(e){toast('Save failed');}}
async function shareAIResult(){if(!state.aiResult?.url)return;try{const r=await fetch(state.aiResult.url),b=await r.blob(),f=new File([b],`LUMI-${state.aiResult.tool.id}.png`,{type:b.type||'image/png'});if(navigator.canShare?.({files:[f]}))await navigator.share({files:[f],title:'LUMI AI'});else await saveAIResult();}catch(e){toast('Share unavailable');}}

function installV3GeometryHooks(){
  const oldKey=geometryKey; geometryKey=function(maxDim){return oldKey(maxDim)+`|heal:${JSON.stringify(state.healSpots)}|text:${JSON.stringify(state.textLayers)}|layers:${state.layers.map(l=>[l.id,l.opacity,l.blend,l.scale,l.x,l.y]).join(';')}`;};
}

async function init() {
  ensureV3EditorPanels();
  buildControls();
  buildModelLegend();
  buildRecommendedAI();
  buildStyleIdeas();
  buildAIStudio();
  buildToolCategoryChips();
  buildMegaToolCatalog();
  installV3GeometryHooks();
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
  bindV3Events();
  syncUI();
  updateHistoryButtons();
  refreshStatus();
  const initial = new URLSearchParams(location.search).get('open');
  if (['projects','ai','me','tools'].includes(initial)) showPage(initial);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(refreshStatus).catch(() => { if($('#offlineValue')) $('#offlineValue').textContent='Online only'; });
  }
}

document.addEventListener('DOMContentLoaded', init);
