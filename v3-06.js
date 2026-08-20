const TOOL_CATALOG_V3 = [
  {id:'auto-analyze',title:'Auto Analyze 2.0',category:'Smart',desc:'Scene, exposure, blur, color and composition report',icon:'✦',status:'LOCAL',panel:'auto'},
  {id:'auto-light',title:'Auto Light',category:'Smart',desc:'Adaptive exposure and dynamic range',icon:'☼',status:'LOCAL',panel:'auto'},
  {id:'auto-color',title:'Auto Color',category:'Smart',desc:'White balance and vibrance suggestion',icon:'◉',status:'LOCAL',panel:'auto'},
  {id:'auto-detail',title:'Auto Detail',category:'Smart',desc:'Texture and detail recovery suggestion',icon:'✧',status:'LOCAL',panel:'effects'},
  {id:'auto-geometry',title:'Auto Geometry',category:'Smart',desc:'Horizon / perspective analysis workflow',icon:'⌗',status:'MODEL',advanced:'Auto Geometry needs scene-line detection; manual geometry remains local.'},
  {id:'fix-dark-face',title:'Fix Dark Face',category:'Smart',desc:'Face-aware relighting',icon:'☀',status:'MODEL',ai:'person-mask'},
  {id:'recover-sky',title:'Recover Sky',category:'Smart',desc:'Sky-aware local recovery',icon:'◒',status:'MODEL',ai:'sky-mask'},
  {id:'match-look',title:'Match Look',category:'Smart',desc:'Match tone/color from a reference photo',icon:'≈',status:'LOCAL',advancedTool:'matchlook'},
  {id:'skin-retouch',title:'Skin Retouch Pro',category:'Beauty',desc:'Smooth, texture, pores, glow, redness and tone',icon:'♡',status:'LOCAL',panel:'beauty'},
  {id:'brush-concealer',title:'Brush Concealer',category:'Beauty',desc:'Paint only blemishes or acne areas',icon:'✎',status:'LOCAL',panel:'mask'},
  {id:'skin-tone-lab',title:'Skin Tone Lab',category:'Beauty',desc:'Warmth, redness, brightness, neck/body matching workflow',icon:'◉',status:'LOCAL',panel:'beauty'},
  {id:'multi-person',title:'Multi-Person Beauty',category:'Beauty',desc:'Per-person face/skin/makeup controls',icon:'♙',status:'MODEL',ai:'person-mask'},
  {id:'face-sculpt',title:'Face Sculpt Pro',category:'Beauty',desc:'Jaw, chin, cheek, forehead and face geometry',icon:'◇',status:'MODEL',ai:'face-mask'},
  {id:'eyes-studio',title:'Eyes Studio',category:'Beauty',desc:'Eye shape, iris, eye white, catchlight and under-eye',icon:'◉',status:'MODEL',ai:'face-mask'},
  {id:'nose-studio',title:'Nose Studio',category:'Beauty',desc:'Bridge, tip, nostril and symmetry controls',icon:'△',status:'MODEL',ai:'face-mask'},
  {id:'lip-smile',title:'Lip & Smile Studio',category:'Beauty',desc:'Lip geometry, smile, teeth brightness and tone',icon:'⌣',status:'MODEL',ai:'face-mask'},
  {id:'makeup',title:'Makeup Studio 2.0',category:'Beauty',desc:'Foundation, blush, contour, brows, eyes and lips',icon:'✦',status:'MODEL',ai:'face-mask'},
  {id:'hair',title:'Hair Studio 2.0',category:'Beauty',desc:'Color, highlights, shine, volume, hairline and generative hair',icon:'≋',status:'MODEL',ai:'ai-hair'},
  {id:'body',title:'Body Studio 2.0',category:'Beauty',desc:'Height, waist, shoulder, posture and background protection',icon:'♢',status:'MODEL',ai:'person-mask'},
  {id:'ai-nails',title:'AI Nails',category:'Beauty',desc:'Nail style, polish and custom generation',icon:'✧',status:'API',ai:'generate'},
  {id:'style-advisor',title:'AI Style Advisor',category:'Beauty',desc:'Hair, makeup and color palette recommendations',icon:'✦',status:'API',ai:'generate'},
  {id:'light-pro',title:'Light Pro',category:'Pro Photo',desc:'Exposure, highlights, shadows, whites, blacks',icon:'☼',status:'LOCAL',panel:'light'},
  {id:'tonal-contrast',title:'Tonal Contrast',category:'Pro Photo',desc:'Shadow / midtone / highlight local contrast',icon:'◩',status:'LOCAL',panel:'tonal'},
  {id:'histogram',title:'Histogram Pro',category:'Pro Photo',desc:'Live luminance histogram and clipping',icon:'▥',status:'LOCAL',panel:'light'},
  {id:'white-balance',title:'White Balance',category:'Pro Photo',desc:'Temperature, tint and WB workflow',icon:'◉',status:'LOCAL',panel:'color'},
  {id:'hsl',title:'HSL Mixer',category:'Pro Photo',desc:'8-color Hue / Saturation / Luminance',icon:'◉',status:'LOCAL',panel:'hsl'},
  {id:'replace-color',title:'Replace Color',category:'Pro Photo',desc:'Target a hue range then shift hue, saturation and luminance',icon:'↻',status:'LOCAL',panel:'replacecolor'},
  {id:'curve',title:'Tone Curve',category:'Pro Photo',desc:'Shadows, midtones, highlights with curve preview',icon:'⌁',status:'LOCAL',panel:'curve'},
  {id:'levels',title:'Levels',category:'Pro Photo',desc:'Black input, gamma, white input and output levels',icon:'▰',status:'LOCAL',panel:'levels'},
  {id:'color-balance',title:'Color Balance',category:'Pro Photo',desc:'Shadow / midtone / highlight warmth and tint',icon:'◉',status:'LOCAL',panel:'grading'},
  {id:'channel-mixer',title:'RGB Channel Mixer',category:'Pro Photo',desc:'Mix source RGB into output channels',icon:'▦',status:'LOCAL',panel:'mixer'},
  {id:'color-grading',title:'Color Grading',category:'Pro Photo',desc:'Zone-based grading foundation for Pro workflow',icon:'◌',status:'LOCAL',panel:'grading'},
  {id:'detail-pro',title:'Detail Pro',category:'Pro Photo',desc:'Sharpness, clarity, dehaze, grain and bloom',icon:'✧',status:'LOCAL',panel:'effects'},
  {id:'denoise',title:'AI Denoise',category:'Pro Photo',desc:'Model-based denoise and detail preservation',icon:'◇',status:'API',ai:'restore-detail'},
  {id:'smart-deband',title:'Smart Deband',category:'Pro Photo',desc:'Detect and repair sky/gradient banding',icon:'≋',status:'MODEL',advanced:'Smart Deband model integration point is ready; local Film/Detail controls remain available.'},
  {id:'optics',title:'Optics Pro',category:'Pro Photo',desc:'Lens vignette and chromatic fringe controls',icon:'◉',status:'LOCAL',panel:'optics'},
  {id:'geometry',title:'Geometry Pro',category:'Pro Photo',desc:'Crop ratios, rotate and flips',icon:'⌗',status:'LOCAL',panel:'crop'},
  {id:'raw',title:'RAW / ProRAW',category:'Pro Photo',desc:'Browser decoder dependent; full pipeline belongs to Native iOS',icon:'RAW',status:'NATIVE',advanced:'PWA import depends on Safari/WebKit decoder support. Native iOS uses Core Image RAW/ProRAW pipeline.'},
  {id:'hdr',title:'HDR / EDR',category:'Pro Photo',desc:'Wide-range editing and HDR export roadmap',icon:'HDR',status:'NATIVE',advanced:'Full HDR/EDR preview and gain-map export is reserved for the Native iOS color-managed pipeline.'},
  {id:'manual-mask',title:'Manual Mask',category:'Selective',desc:'Brush, erase, feather, invert and local adjustments',icon:'◐',status:'LOCAL',panel:'mask'},
  {id:'subject-mask',title:'Subject Mask',category:'Selective',desc:'Semantic subject selection',icon:'◎',status:'MODEL',ai:'smart-select'},
  {id:'background-mask',title:'Background Mask',category:'Selective',desc:'Semantic background selection',icon:'▣',status:'MODEL',ai:'sky-mask'},
  {id:'person-mask-tool',title:'Person / Face / Skin',category:'Selective',desc:'Per-person semantic region masks',icon:'♙',status:'MODEL',ai:'person-mask'},
  {id:'hair-mask',title:'Hair / Clothes Mask',category:'Selective',desc:'Fine semantic selection workflow',icon:'≋',status:'MODEL',ai:'face-mask'},
  {id:'object-mask',title:'Object Select',category:'Selective',desc:'Point-guided SAM 2 object mask',icon:'◎',status:'API',ai:'smart-select'},
  {id:'gradient-mask',title:'Linear / Radial Gradient',category:'Selective',desc:'Gradient selective adjustments',icon:'◒',status:'LOCAL',advancedTool:'gradientmask'},
  {id:'range-mask',title:'Color / Luminance Range',category:'Selective',desc:'Range-based selective adjustment workflow',icon:'◌',status:'LOCAL',advancedTool:'rangemask'},
  {id:'control-point',title:'Control Point',category:'Selective',desc:'Point + radius local exposure/color adjustment',icon:'⊙',status:'LOCAL',advancedTool:'controlpoint'},
  {id:'heal',title:'Spot Heal',category:'Retouch',desc:'Tap a blemish to sample nearby texture',icon:'✚',status:'LOCAL',panel:'retouch'},
  {id:'clone',title:'Clone / Patch',category:'Retouch',desc:'Clone nearby content into a target area',icon:'⊕',status:'LOCAL',panel:'retouch'},
  {id:'remove-people',title:'Remove Extra People',category:'Retouch',desc:'Detect extras then generatively fill the scene',icon:'⌫',status:'API',ai:'ai-remove'},
  {id:'glare',title:'Glare / Reflection Removal',category:'Retouch',desc:'Advanced image restoration',icon:'◈',status:'API',ai:'ai-remove'},
  {id:'layers',title:'Layers & Blend Modes',category:'Retouch',desc:'Add image layer, opacity and blend mode',icon:'▱',status:'LOCAL',panel:'layers'},
  {id:'double-exposure',title:'Double Exposure',category:'Retouch',desc:'Blend a second image with creative modes',icon:'◫',status:'LOCAL',panel:'layers'},
  {id:'lens-blur',title:'Lens Blur',category:'Effects',desc:'Local blur foundation with AI depth path',icon:'◉',status:'LOCAL',panel:'blur'},
  {id:'depth-blur',title:'AI Depth Blur',category:'Effects',desc:'Subject/point focus with depth map',icon:'◎',status:'MODEL',ai:'smart-select'},
  {id:'film-lab',title:'Film Lab 2.0',category:'Effects',desc:'Fade, halation, grain, bloom and vignette',icon:'▤',status:'LOCAL',panel:'film'},
  {id:'ccd',title:'CCD / Digicam Lab',category:'Effects',desc:'Digital vintage styling workflow',icon:'▣',status:'LOCAL',panel:'film'},
  {id:'presets',title:'Adaptive Presets',category:'Effects',desc:'Global look + skin / sky / grain strategy',icon:'◫',status:'LOCAL',panel:'presets'},
  {id:'lut',title:'LUT Import / Export',category:'Effects',desc:'3D LUT pipeline integration point',icon:'▦',status:'PARTIAL',advanced:'LUT UI and file workflow are available as an integration point; shader-side 3D LUT texture support is next.'},
  ...AI_TOOLS_V3.map(t=>({id:`ai-${t.id}`,title:t.title,category:'AI Studio',desc:t.desc,icon:t.icon,status:'API',ai:t.id,model:t.model})),
  {id:'ask-lumi',title:'Ask LUMI 2.0',category:'AI Studio',desc:'Thai/English intent → selection → structured edit plan',icon:'✦',status:'API',advancedTool:'asklumi'},
  {id:'ai-dependency',title:'AI Edit Status',category:'AI Studio',desc:'Track masks and AI edits that need refresh after geometry changes',icon:'✓',status:'LOCAL',advancedTool:'aistatus'},
  {id:'batch',title:'Batch Editor',category:'Workflow',desc:'Apply current look to multiple photos and export',icon:'▦',status:'LOCAL',action:'batch'},
  {id:'projects',title:'Projects Pro',category:'Workflow',desc:'Favorites, rename, duplicate and local persistence',icon:'▤',status:'LOCAL',action:'projects'},
  {id:'history',title:'Edit History Pro',category:'Workflow',desc:'Undo/Redo history with non-destructive parameters',icon:'↶',status:'LOCAL',advancedTool:'history'},
  {id:'versions',title:'Project Versions',category:'Workflow',desc:'Snapshot / compare / restore versions',icon:'◫',status:'PARTIAL',advancedTool:'versions'},
  {id:'export',title:'Export Pro',category:'Workflow',desc:'JPEG / PNG / WebP, quality and target resolution',icon:'↑',status:'LOCAL',action:'export'},
  {id:'social-export',title:'Social Export',category:'Workflow',desc:'Instagram / Story / TikTok / wallpaper ratios',icon:'↗',status:'LOCAL',advancedTool:'socialexport'},
  {id:'storage',title:'Storage Manager',category:'Workflow',desc:'Projects, cache and model storage visibility',icon:'▤',status:'LOCAL',advancedTool:'storage'},
  {id:'privacy',title:'Privacy Center',category:'Workflow',desc:'Local vs Cloud processing map and consent controls',icon:'◇',status:'LOCAL',advancedTool:'privacy'},
  {id:'model-manager',title:'AI Model Manager',category:'Workflow',desc:'Endpoint status, model colors and backend readiness',icon:'◎',status:'LOCAL',action:'ai'},
  {id:'collage',title:'Collage Studio',category:'Creator',desc:'Grid / before-after / story collage',icon:'▦',status:'LOCAL',action:'collage'},
  {id:'creator',title:'Creator Studio',category:'Creator',desc:'Text overlay, watermark and simple graphics layer',icon:'T',status:'LOCAL',advancedTool:'creator'},
  {id:'camera',title:'Camera Capture',category:'Creator',desc:'Capture from browser camera into the editor',icon:'◉',status:'LOCAL',action:'camera'},
  {id:'pro-camera',title:'Pro Camera',category:'Creator',desc:'ISO, shutter, focus peaking and ProRAW',icon:'PRO',status:'NATIVE',advanced:'Manual camera controls, ProRAW and focus peaking require the Native iOS AVFoundation implementation.'},
  {id:'live-photo',title:'Live Photo',category:'Creator',desc:'Cover, trim and motion-preserving export',icon:'LIVE',status:'NATIVE',advanced:'Live Photo preservation and paired asset export are Native iOS features.'},
  {id:'video',title:'Video Editor',category:'Creator',desc:'Timeline, color, beauty tracking and effects',icon:'▶',status:'NATIVE',advanced:'Video foundation remains in the Native iOS roadmap after Photo Core stability.'},
  {id:'ai-camera',title:'AI Camera',category:'Creator',desc:'Generate alternate angles, mood and lighting',icon:'✦',status:'API',ai:'generate'},
  {id:'metadata',title:'Pro Info Panel',category:'Creator',desc:'Dimensions, type, color and available EXIF metadata',icon:'i',status:'LOCAL',advancedTool:'metadata'}
];

const V3_PANEL_SPECS = {
  levels:{label:'Levels',small:'RGB LEVELS',icon:'▰'},grading:{label:'Grading',small:'COLOR BALANCE',icon:'◌'},tonal:{label:'Tonal',small:'LOCAL CONTRAST',icon:'◩'},
  mixer:{label:'Mixer',small:'RGB CHANNELS',icon:'▦'},replacecolor:{label:'Replace',small:'TARGET COLOR',icon:'↻'},optics:{label:'Optics',small:'LENS',icon:'◉'},
  blur:{label:'Blur',small:'LENS BLUR',icon:'◎'},film:{label:'Film',small:'FILM LAB',icon:'▤'},retouch:{label:'Retouch',small:'HEAL / CLONE',icon:'✚'},layers:{label:'Layers',small:'COMPOSITE',icon:'▱'},
  face:{label:'Face',small:'MODEL ASSISTED',icon:'◇'},makeup:{label:'Makeup',small:'MODEL ASSISTED',icon:'✦'},hair:{label:'Hair',small:'MODEL ASSISTED',icon:'≋'},body:{label:'Body',small:'MODEL ASSISTED',icon:'♢'}
};
Object.assign(state, { aiStatus:null, aiTool:null, aiOption:null, aiResult:null, aiBeforeBlob:null, toolCategory:'All', healSpots:[], retouchMode:'heal', healBrush:.055, layers:[], textLayers:[], batchMode:null, cameraStream:null, projectVersions:[] });
function ensureV3EditorPanels(){
  const tabs=$('#toolTabs'), scroll=$('.panel-scroll'); if(!tabs||!scroll) return;
  const existing=new Set($$('#toolTabs button').map(b=>b.dataset.panel));
  const order=['levels','grading','tonal','mixer','replacecolor','optics','blur','film','retouch','layers','face','makeup','hair','body'];
  for(const key of order){
    const sp=V3_PANEL_SPECS[key];
    if(!existing.has(key)){const b=document.createElement('button');b.dataset.panel=key;b.innerHTML=`<b>${sp.icon}</b><span>${sp.label}</span>`;tabs.appendChild(b);}
    if(!$(`[data-panel-view="${key}"]`)){
      const sec=document.createElement('section');sec.className='edit-panel';sec.dataset.panelView=key;
      if(SLIDERS[key]) sec.innerHTML=`<div class="panel-title"><div><small>${sp.small}</small><h3>${sp.label}</h3></div><button class="reset-btn" data-reset-panel="${key}">Reset</button></div><div class="sliders" id="${key==='replacecolor'?'replaceColor':key}Sliders"></div>`;
      else if(key==='retouch') sec.innerHTML=`<div class="panel-title"><div><small>${sp.small}</small><h3>Retouch</h3></div><button class="reset-btn" id="clearHealBtn">Clear</button></div><p class="panel-note">Tap a blemish on the image. LUMI samples a nearby patch locally and keeps each spot non-destructive in the current project.</p><div class="mask-tools"><button id="healModeBtn" class="active">Heal</button><button id="cloneModeBtn">Clone</button><button id="undoHealBtn">Undo Spot</button></div><div class="slider-row"><div class="slider-head"><span>Brush</span><span id="healBrushValue">6%</span></div><input id="healBrush" type="range" min="2" max="18" value="6"></div><div id="healCount" class="analysis-card">0 retouch spots</div>`;
      else if(key==='layers') sec.innerHTML=`<div class="panel-title"><div><small>${sp.small}</small><h3>Layers</h3></div><button class="reset-btn" id="clearLayersBtn">Clear</button></div><button class="primary-btn small" id="addLayerBtn">＋ Add Image Layer</button><button class="secondary-btn" id="addTextLayerBtn" style="width:100%;margin-top:8px">＋ Add Text / Watermark</button><div id="layerList" class="project-list" style="margin-top:12px"></div>`;
      else sec.innerHTML=modelPanelMarkup(key,sp);
      scroll.appendChild(sec);
    }
  }
}
function modelPanelMarkup(key,sp){ const copy={face:['Face Sculpt Pro','Face Width · Jaw · Chin · Cheek · Forehead','face-mask'],makeup:['Makeup Studio','Foundation · Blush · Contour · Brows · Eyes · Lips','face-mask'],hair:['Hair Studio','Color · Highlights · Volume · Hairline · AI Hairstyle','ai-hair'],body:['Body Studio','Height · Waist · Shoulder · Posture · Background protection','person-mask']}[key]; return `<div class="panel-title"><div><small>${sp.small}</small><h3>${copy[0]}</h3></div><span class="panel-badge">SAM 2 + AI</span></div><p class="panel-note">${copy[1]}. Semantic precision requires model segmentation; manual Mask remains available locally.</p><div class="tool-status-line"><span>Identity-aware workflow</span><span>Non-destructive plan</span><span>No fake result</span></div><button class="primary-btn" data-open-ai-tool="${copy[2]}">Analyze / Select with AI</button><button class="secondary-btn" data-open-local-mask="1" style="width:100%;margin-top:8px">Use Manual Mask</button>`; }
function modelStyle(el,model){if(!el)return;el.dataset.model=model;}
function buildModelLegend(){ const html=Object.entries(AI_MODELS).map(([k,m])=>`<button class="model-chip" data-model="${k}" data-model-info="${k}"><i></i><span><b>${m.name}</b><small>${m.label}</small></span></button>`).join(''); ['#aiModelLegend','#aiStudioLegend'].forEach(sel=>{const el=$(sel);if(el)el.innerHTML=html;}); $$('[data-model-info]').forEach(b=>b.onclick=()=>showModelInfo(b.dataset.modelInfo)); }
