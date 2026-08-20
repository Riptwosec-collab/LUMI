function buildRecommendedAI(){
  const picks=['remove-background','enhance','smart-select','generate','generative-fill'];
  const root=$('#recommendedAITools');if(!root)return;root.innerHTML='';
  picks.map(id=>AI_TOOLS_V3.find(t=>t.id===id)).filter(Boolean).forEach(t=>{const m=AI_MODELS[t.model],b=document.createElement('button');b.className='model-tool-card';b.dataset.model=t.model;b.innerHTML=`<span class="model-icon">${t.icon}</span><h3>${t.title}</h3><p>${t.desc}</p><span class="model-badge">${m.name} · ${m.badge}</span>`;b.onclick=()=>openAIRun(t.id);root.appendChild(b);});
}

function buildStyleIdeas(){
  const styles=[['Clean Portrait','Natural skin + clean light','linear-gradient(135deg,#274B8A66,#FF98B955)'],['Film Air','Fade + grain + halation','linear-gradient(135deg,#9C6A3655,#7A5C9E55)'],['City Night','Blue shadows + crisp detail','linear-gradient(135deg,#2245A566,#11B5C455)'],['Rose Glow','Soft warm portrait','linear-gradient(135deg,#EC489966,#F9731650)'],['Editorial','Contrast + muted color','linear-gradient(135deg,#434D6555,#A855F755)']];
  const root=$('#styleIdeas');if(!root)return;root.innerHTML='';styles.forEach(([n,d,bg])=>{const b=document.createElement('button');b.className='style-card';b.style.setProperty('--style-bg',bg);b.innerHTML=`<b>${n}</b><small>${d}</small>`;b.onclick=()=>{if(!state.image){state.pendingPanel='presets';$('#photoInput').click();return;}showPage('editor');selectPanel('presets');const map={'Clean Portrait':'Portrait','Film Air':'Soft Film','City Night':'City Night','Rose Glow':'Rose Glow','Editorial':'Matte'};applyPreset(map[n]||'Natural');};root.appendChild(b);});
}

function buildAIStudio(){
  const groups={remove:'#aiGroupRemove',enhance:'#aiGroupEnhance',select:'#aiGroupSelect',generate:'#aiGroupGenerate',fill:'#aiGroupFill'};
  Object.values(groups).forEach(sel=>{const e=$(sel);if(e)e.innerHTML='';});
  AI_TOOLS_V3.forEach(t=>{const root=$(groups[t.group]);if(!root)return;const m=AI_MODELS[t.model],b=document.createElement('button');b.className='ai-tool-row';b.dataset.model=t.model;b.innerHTML=`<span class="ai-row-icon">${t.icon}</span><span><h3>${t.title}</h3><p>${t.desc}</p></span><span class="ai-row-badge">${m.name}</span>`;b.onclick=()=>openAIRun(t.id);root.appendChild(b);});
}

async function refreshAIStatus(){
  const root=$('#aiStatusBar');if(!root)return;root.innerHTML='<span>AI Gateway</span><strong>Checking endpoints…</strong>';
  try{const r=await fetch('/api/ai',{cache:'no-store'});const j=await r.json();state.aiStatus=j.models||{};const ready=Object.values(state.aiStatus).filter(x=>x?.configured).length;root.innerHTML=`<span>AI Gateway · ${ready}/5 models configured</span><strong class="${ready?'ok':''}">${ready?'READY FOR '+ready:'NEEDS ENDPOINTS'}</strong>`;if($('#aiRouterValue')){$('#aiRouterValue').textContent=`${ready}/5 ready`;$('#aiRouterValue').classList.toggle('warning',ready<5);}}
  catch(e){state.aiStatus={};root.innerHTML='<span>AI Gateway</span><strong>Offline / unavailable</strong>';if($('#aiRouterValue'))$('#aiRouterValue').textContent='Offline';}
}

function showModelInfo(modelKey){const m=AI_MODELS[modelKey];if(!m)return;$('#featureStatus').textContent=m.badge;$('#featureTitle').textContent=m.name;$('#featureBody').innerHTML=`<p>${escapeHtml(m.description)}</p><div class="feature-warning">LUMI routes this model through a server endpoint configured by environment variable <b>${m.endpointKey}</b>. Model colors are UI identity only and do not imply the model is currently online.</div>`;$('#featureActionBtn').textContent='Open AI Studio';$('#featureActionBtn').onclick=()=>{modal('featureModal',false);showPage('ai');};modal('featureModal',true);}

function findAITool(id){return AI_TOOLS_V3.find(t=>t.id===id);}
function drawAIRunPreview(){const c=$('#aiRunPreview'),empty=$('#aiRunPreviewEmpty');if(!c||!state.image){c?.classList.remove('ready');if(empty)empty.style.display='block';return;}const src=makeGeometryCanvas(900);const scale=Math.min(1,800/Math.max(src.width,src.height));c.width=Math.max(1,Math.round(src.width*scale));c.height=Math.max(1,Math.round(src.height*scale));c.getContext('2d').drawImage($('#editorCanvas').width?$('#editorCanvas'):src,0,0,c.width,c.height);c.classList.add('ready');empty.style.display='none';}

async function openAIRun(toolId){
  const t=findAITool(toolId);if(!t)return;state.aiTool=t;state.aiOption=t.options?.[0]||null;const m=AI_MODELS[t.model],sheet=$('#aiRunSheet');sheet.dataset.model=t.model;$('#aiRunModel').textContent=m.label.toUpperCase();$('#aiRunTitle').textContent=t.title;$('#aiRunBadge').textContent=m.badge;$('#aiRunModelName').textContent=m.name;$('#aiRunModelDesc').textContent=m.description;$('#aiPromptWrap').style.display=t.prompt?'block':'none';$('#aiPrompt').value='';$('#aiCloudConsent').checked=false;$('#aiRunMessage').textContent='';
  const opts=$('#aiRunOptions');opts.innerHTML='';(t.options||[]).forEach((o,i)=>{const b=document.createElement('button');b.className='ai-option'+(i===0?' active':'');b.textContent=o;b.onclick=()=>{state.aiOption=o;$$('.ai-option',opts).forEach(x=>x.classList.toggle('active',x===b));};opts.appendChild(b);});
  if(!state.image){$('#aiRunPreview').classList.remove('ready');$('#aiRunPreviewEmpty').style.display='block';$('#aiRunPreviewEmpty').textContent='Choose a photo to use this AI tool';}else drawAIRunPreview();
  modal('aiRunModal',true);await refreshAIStatus();const status=state.aiStatus?.[t.model];$('#aiRunStatus').textContent=status?.configured?'READY':'NEEDS API';$('#aiRunStatus').style.color=status?.configured?'#7EE5AA':'#FACC15';
  const fallback=localFallbackForAI(t);$('#aiLocalFallbackBtn').style.display=fallback?'block':'none';$('#aiLocalFallbackBtn').textContent=fallback?.label||'Use Local Fallback';
}

function localFallbackForAI(t){
  if(t.model==='realesrgan')return{label:'Use Local Detail',panel:'effects'};
  if(t.model==='sam2')return{label:'Use Manual Mask',panel:'mask'};
  if(t.model==='rembg')return{label:'Use Manual Mask + PNG',panel:'mask'};
  if(t.id.includes('expand'))return{label:'Use Crop / Geometry',panel:'crop'};
  if(t.id.includes('portrait'))return{label:'Use Local Beauty',panel:'beauty'};
  if(t.model==='sdxl')return{label:'Use Manual Mask',panel:'mask'};
  if(t.model==='flux')return{label:'Use Film / Presets',panel:'film'};
  return null;
}

async function canvasDataURL(max=1400){if(!state.image)return null;const src=makeGeometryCanvas(max);const out=document.createElement('canvas');out.width=src.width;out.height=src.height;const r=new WebGLRenderer(out);r.render(src,state.params,makeMaskCanvas(src.width,src.height));return out.toDataURL('image/jpeg',.9);}

async function runAIJob(){
  const t=state.aiTool;if(!t)return;if(!state.image){state.pendingPanel='light';modal('aiRunModal',false);$('#photoInput').click();return;}if(!$('#aiCloudConsent').checked)return $('#aiRunMessage').textContent='Please confirm cloud processing consent before running this model.';
  const prompt=$('#aiPrompt').value.trim();if(t.prompt&&!prompt)return $('#aiRunMessage').textContent='Add a prompt describing the result you want.';
  loading(true,`${AI_MODELS[t.model].name} · Preparing…`);$('#aiRunBtn').disabled=true;
  try{const preview=await canvasDataURL(1400);const r=await fetch('/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model:t.model,tool:t.id,prompt,option:state.aiOption,imageDataUrl:preview,metadata:{projectId:state.projectId,width:state.image.naturalWidth,height:state.image.naturalHeight}})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.message||j.error||`AI request failed (${r.status})`);const url=j.imageDataUrl||j.output?.imageDataUrl||j.outputUrl;if(!url)throw new Error('AI provider returned no image result');state.aiResult={url,tool:t,model:t.model,jobId:j.jobId||null};state.aiBeforeBlob=state.originalBlob;$('#resultImage').src=url;$('#resultImage').classList.add('ready');$('#resultEmpty').style.display='none';$('#resultModelLabel').textContent=AI_MODELS[t.model].name.toUpperCase();$('#resultTitle').textContent=t.title;$('#resultMeta').textContent=`${AI_MODELS[t.model].name} · ${state.aiOption||''} · ${j.jobId?`Job ${j.jobId}`:'Completed'}`;modal('aiRunModal',false);showPage('result');}
  catch(e){console.error(e);$('#aiRunMessage').textContent=e.message.includes('not configured')?`${AI_MODELS[t.model].name} backend is not configured yet. Add ${AI_MODELS[t.model].endpointKey} in Vercel Environment Variables.`:e.message;toast('AI job not completed');}
  finally{loading(false);$('#aiRunBtn').disabled=false;}
}

function buildMegaToolCatalog(){
  const root=$('#megaToolCatalog');if(!root)return;const q=($('#toolSearch')?.value||'').trim().toLowerCase(),cat=state.toolCategory||'All';root.innerHTML='';const filtered=TOOL_CATALOG_V3.filter(t=>(cat==='All'||t.category===cat)&&(!q||`${t.title} ${t.desc} ${t.category}`.toLowerCase().includes(q)));const cats=[...new Set(filtered.map(t=>t.category))];
  cats.forEach(c=>{const sec=document.createElement('section');sec.className='tool-category';sec.innerHTML=`<h2>${c.toUpperCase()}</h2><div class="tool-category-grid"></div>`;const grid=$('.tool-category-grid',sec);filtered.filter(t=>t.category===c).forEach(t=>{const b=document.createElement('button');b.className='mega-tool-card';b.dataset.model=t.model||modelFromCatalogTool(t);b.innerHTML=`<span class="tool-icon">${t.icon||'◌'}</span><b>${t.title}</b><span>${t.desc}</span><em>${t.status}</em>`;b.onclick=()=>openCatalogTool(t);grid.appendChild(b);});root.appendChild(sec);});
  if(!filtered.length)root.innerHTML='<div class="empty-state">No tools match this search.</div>';
  if($('#toolModuleCount'))$('#toolModuleCount').textContent=TOOL_CATALOG_V3.length;
}
function modelFromCatalogTool(t){if(t.ai){return findAITool(t.ai)?.model||'sdxl';}if(t.status==='NATIVE')return'native';return'local';}
function buildToolCategoryChips(){const root=$('#toolCategoryChips');if(!root)return;const cats=['All',...new Set(TOOL_CATALOG_V3.map(t=>t.category))];root.innerHTML='';cats.forEach(c=>{const b=document.createElement('button');b.textContent=c;b.className=c===state.toolCategory?'active':'';b.onclick=()=>{state.toolCategory=c;$$('button',root).forEach(x=>x.classList.toggle('active',x===b));buildMegaToolCatalog();};root.appendChild(b);});}

function openCatalogTool(t){
  if(t.panel){openTool(t.panel);return;}if(t.ai){openAIRun(t.ai);return;}if(t.action==='projects'){showPage('projects');return;}if(t.action==='ai'){showPage('ai');return;}if(t.action==='export'){if(!state.image){state.pendingPanel='light';$('#photoInput').click();return;}modal('exportModal',true);return;}if(t.action==='batch'){openAdvancedTool('batch');return;}if(t.action==='collage'){openAdvancedTool('collage');return;}if(t.action==='camera'){openAdvancedTool('camera');return;}if(t.advancedTool){openAdvancedTool(t.advancedTool,t);return;}showAdvancedInfo(t);
}

function showAdvancedInfo(t){$('#advancedToolStatus').textContent=t.status||'FEATURE';$('#advancedToolTitle').textContent=t.title;$('#advancedToolDesc').textContent=t.advanced||t.desc;$('#advancedToolControls').innerHTML=`<div class="analysis-card">${escapeHtml(t.advanced||'This feature is represented in the LUMI architecture. Local-capable tools are enabled first; model/native-only tools remain clearly labeled until their runtime is available.')}</div>`;$('#advancedToolActions').innerHTML='';$('#advancedToolApplyBtn').textContent='Close';$('#advancedToolApplyBtn').onclick=()=>modal('advancedToolModal',false);modal('advancedToolModal',true);}

function sliderMarkup(key,label,min,max,step,value,formatter=v=>v){return `<div class="slider-row"><div class="slider-head"><span>${label}</span><span data-adv-value="${key}">${formatter(value)}</span></div><input data-adv-param="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;}
