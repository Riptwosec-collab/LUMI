'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const deepCopy = obj => JSON.parse(JSON.stringify(obj));

function pct(v) {
  const n = Math.round(v * 100);
  return `${n >= 0 ? '+' : ''}${n}`;
}

const DEFAULT_PARAMS = Object.freeze({
  exposure: 0,
  brightness: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  sharpness: 0,
  clarity: 0,
  dehaze: 0,
  vignette: 0,
  grain: 0,
  skinSmooth: 0,
  skinGlow: 0,
  skinWarmth: 0,
  skinRedness: 0,
  maskExposure: 0,
  maskSaturation: 0,
  maskTemperature: 0,
  cropRatio: 'original',
  rotation: 0,
  flipH: false,
  flipV: false
});

const SLIDERS = {
  light: [
    ['exposure', 'Exposure', -2, 2, 0.01, v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`],
    ['brightness', 'Brightness', -1, 1, 0.01, pct],
    ['contrast', 'Contrast', -1, 1, 0.01, pct],
    ['highlights', 'Highlights', -1, 1, 0.01, pct],
    ['shadows', 'Shadows', -1, 1, 0.01, pct]
  ],
  color: [
    ['temperature', 'Temperature', -1, 1, 0.01, pct],
    ['tint', 'Tint', -1, 1, 0.01, pct],
    ['vibrance', 'Vibrance', -1, 1, 0.01, pct],
    ['saturation', 'Saturation', -1, 1, 0.01, pct]
  ],
  effects: [
    ['sharpness', 'Sharpness', 0, 1, 0.01, pct],
    ['clarity', 'Clarity', -1, 1, 0.01, pct],
    ['dehaze', 'Dehaze', -1, 1, 0.01, pct],
    ['vignette', 'Vignette', 0, 1, 0.01, pct],
    ['grain', 'Grain', 0, 1, 0.01, pct]
  ],
  beauty: [
    ['skinSmooth', 'Skin Smooth', 0, 1, 0.01, pct],
    ['skinGlow', 'Skin Glow', 0, 1, 0.01, pct],
    ['skinWarmth', 'Skin Warmth', -1, 1, 0.01, pct],
    ['skinRedness', 'Redness', -1, 1, 0.01, pct]
  ],
  mask: [
    ['maskExposure', 'Mask Exposure', -1.5, 1.5, 0.01, v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`],
    ['maskSaturation', 'Mask Saturation', -1, 1, 0.01, pct],
    ['maskTemperature', 'Mask Temperature', -1, 1, 0.01, pct]
  ]
};

const PRESETS = {
  Original: {},
  Natural: { exposure: .08, contrast: .06, highlights: -.08, shadows: .12, vibrance: .10, saturation: .02 },
  Vivid: { contrast: .15, vibrance: .28, saturation: .10, sharpness: .12 },
  Portrait: { exposure: .10, highlights: -.15, shadows: .12, temperature: .06, vibrance: .10, skinGlow: .08 },
  'Soft Film': { contrast: -.05, highlights: -.12, shadows: .18, temperature: .08, saturation: -.08, vignette: .12, grain: .08 },
  Matte: { contrast: -.10, highlights: -.18, shadows: .28, saturation: -.06, vignette: .08 },
  Warm: { temperature: .24, tint: .04, vibrance: .12, highlights: -.06 },
  Cool: { temperature: -.22, tint: -.03, contrast: .06, vibrance: .08 },
  'B&W': { saturation: -1, contrast: .14, shadows: .08, sharpness: .12, grain: .10 }
};

const RATIOS = [
  ['original', 'Original'], ['1:1', '1:1'], ['4:5', '4:5'], ['3:4', '3:4'],
  ['9:16', '9:16'], ['16:9', '16:9'], ['2:3', '2:3']
];

const AI_FEATURES = {
  remove: {
    title: 'AI Remove',
    status: 'NEEDS API',
    body: 'ลบคนหรือวัตถุจากภาพต้องใช้ Generative Fill บน backend จริง ใน PWA นี้ยังไม่อัปโหลดรูปและไม่สร้างผลลัพธ์ปลอม',
    bullets: ['Smart Select / Brush', 'Result variations', 'Signed upload', 'Delete result after processing'],
    fallbackPanel: 'mask'
  },
  background: {
    title: 'AI Background',
    status: 'NEEDS API',
    body: 'Remove / Replace / Generate / Relight ต้องใช้ segmentation และ generative model ผ่าน server architecture',
    bullets: ['Remove', 'Blur', 'Replace', 'Generate', 'Relight'],
    fallbackPanel: 'mask'
  },
  expand: {
    title: 'Generative Expand',
    status: 'NEEDS API',
    body: 'ขยายภาพ 9:16, 4:5, 1:1 หรือ 16:9 โดยสร้างพื้นที่ใหม่รอบต้นฉบับ',
    bullets: ['9:16', '4:5', '1:1', '16:9', 'Custom']
  },
  portrait: {
    title: 'AI Portrait',
    status: 'NEEDS API',
    body: 'สร้าง Portrait style จากภาพที่ผู้ใช้เลือก โดยต้องมี consent และ backend ที่รักษาใบหน้า/pose ให้เหมาะสม',
    bullets: ['Studio', 'Business', 'Travel', 'Film', 'Luxury'],
    fallbackPanel: 'beauty'
  },
  hair: {
    title: 'AI Hair',
    status: 'NEEDS API',
    body: 'เปลี่ยนทรงหรือสีผมด้วย generative model โดยรักษาใบหน้าและแสงเดิม',
    bullets: ['Hairstyle', 'Hair color', 'Keep face', 'Keep lighting']
  },
  outfit: {
    title: 'AI Outfit',
    status: 'NEEDS API',
    body: 'เปลี่ยนเสื้อผ้าโดยรักษา pose มือ ใบหน้า และฉากหลัง ต้องใช้ backend generative AI',
    bullets: ['Casual', 'Street', 'Business', 'Formal', 'Custom prompt']
  }
};

const INFO_FEATURES = {
  raw: {
    title: 'RAW Editing on PWA',
    status: 'LIMITED BY BROWSER',
    body: 'PWA อ่านไฟล์ RAW/DNG ได้ไม่สม่ำเสมอ เพราะขึ้นกับ decoder ของ Safari/WebKit จึงยังไม่เปิดเป็นฟีเจอร์หลัก หาก browser decode ไฟล์ได้สามารถ import ผ่าน file picker ได้ แต่ไม่อ้างว่ารองรับกล้องทุกรุ่น',
    bullets: ['Native iOS จะใช้ Core Image RAW pipeline', 'PWA ไม่ hard-code camera support', 'JPEG/PNG/WebP workflow ทำงานเต็มกว่า']
  },
  hdr: {
    title: 'HDR Editing',
    status: 'ROADMAP',
    body: 'HDR/EDR แบบเต็มต้องใช้ color-management และ export path ที่ browser รองรับสม่ำเสมอกว่านี้ เวอร์ชัน PWA จึงคงเป็น roadmap และไม่เปิดปุ่มปลอม',
    bullets: ['SDR-safe preview', 'Highlight protection', 'Wide-color roadmap']
  }
};

const state = {
  page: 'home',
  panel: 'light',
  pendingPanel: 'light',
  params: deepCopy(DEFAULT_PARAMS),
  undo: [],
  redo: [],
  image: null,
  objectURL: null,
  originalBlob: null,
  projectId: null,
  projectName: null,
  renderer: null,
  compare: false,
  renderQueued: false,
  geometryCache: null,
  geometryKey: '',
  db: null,
  deferredInstall: null,
  sliderStart: null,
  maskStrokes: [],
  maskMode: 'paint',
  maskBrush: .12,
  maskDrawing: null,
  gesture: { scale: 1, x: 0, y: 0, pointers: new Map(), startDist: 0, startScale: 1 }
};

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 1900);
}

function loading(show, text = 'Rendering…') {
  $('#loadingText').textContent = text;
  $('#loading').classList.toggle('show', show);
}

function modal(id, show = true) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('show', show);
  el.setAttribute('aria-hidden', show ? 'false' : 'true');
}

class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false, alpha: true });
    if (!this.gl) throw new Error('WebGL2 is not supported on this device.');

    const gl = this.gl;
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const vs = `#version 300 es
      in vec2 a_pos;
      out vec2 v_uv;
      void main(){
        gl_Position = vec4(a_pos, 0.0, 1.0);
        v_uv = vec2(a_pos.x*.5+.5, 1.0-(a_pos.y*.5+.5));
      }`;

    const fs = `#version 300 es
      precision highp float;
      uniform sampler2D u_tex;
      uniform sampler2D u_mask;
      uniform vec2 u_res;
      uniform float u_exposure,u_brightness,u_contrast,u_highlights,u_shadows;
      uniform float u_temp,u_tint,u_vibrance,u_saturation;
      uniform float u_sharpness,u_clarity,u_dehaze,u_vignette,u_grain;
      uniform float u_skinSmooth,u_skinGlow,u_skinWarmth,u_skinRedness;
      uniform float u_maskExposure,u_maskSaturation,u_maskTemp;
      in vec2 v_uv;
      out vec4 outColor;

      float lum(vec3 c){ return dot(c,vec3(.2126,.7152,.0722)); }
      float rand(vec2 co){ return fract(sin(dot(co,vec2(12.9898,78.233)))*43758.5453); }
      float skinMask(vec3 c){
        float cb = .5 - .168736*c.r - .331264*c.g + .5*c.b;
        float cr = .5 + .5*c.r - .418688*c.g - .081312*c.b;
        float cbm = smoothstep(.23,.30,cb) * (1.0-smoothstep(.47,.54,cb));
        float crm = smoothstep(.50,.54,cr) * (1.0-smoothstep(.71,.77,cr));
        float brightness = smoothstep(.08,.22,lum(c));
        return clamp(cbm*crm*brightness,0.0,1.0);
      }

      void main(){
        vec2 t = 1.0/u_res;
        vec3 original = texture(u_tex,v_uv).rgb;
        vec3 c = original;
        float skin = skinMask(c);

        if(u_skinSmooth > .001){
          vec3 blur = vec3(0.0);
          blur += texture(u_tex,v_uv+vec2(-t.x,-t.y)).rgb;
          blur += texture(u_tex,v_uv+vec2( 0.0,-t.y)).rgb;
          blur += texture(u_tex,v_uv+vec2( t.x,-t.y)).rgb;
          blur += texture(u_tex,v_uv+vec2(-t.x, 0.0)).rgb;
          blur += texture(u_tex,v_uv+vec2( t.x, 0.0)).rgb;
          blur += texture(u_tex,v_uv+vec2(-t.x, t.y)).rgb;
          blur += texture(u_tex,v_uv+vec2( 0.0, t.y)).rgb;
          blur += texture(u_tex,v_uv+vec2( t.x, t.y)).rgb;
          blur *= .125;
          c = mix(c, blur, skin*u_skinSmooth*.62);
        }
        c += skin*u_skinGlow*.07;
        c.r += skin*(u_skinWarmth*.045 + u_skinRedness*.035);
        c.g += skin*u_skinWarmth*.012;
        c.b -= skin*u_skinWarmth*.035;
        c.g -= skin*u_skinRedness*.018;

        if(u_sharpness > .001 || abs(u_clarity) > .001){
          vec3 n=texture(u_tex,v_uv+vec2(0.0,-t.y)).rgb;
          vec3 s=texture(u_tex,v_uv+vec2(0.0,t.y)).rgb;
          vec3 e=texture(u_tex,v_uv+vec2(t.x,0.0)).rgb;
          vec3 w=texture(u_tex,v_uv+vec2(-t.x,0.0)).rgb;
          vec3 avg=(n+s+e+w)*.25;
          c += (c-avg)*(u_sharpness*.42 + u_clarity*.22);
        }

        c *= pow(2.0,u_exposure);
        c += u_brightness*.30;
        float l=lum(c);
        c += vec3(u_shadows*pow(max(0.0,1.0-l),2.0)*.32);
        c += vec3(u_highlights*pow(max(0.0,l),2.0)*.28);
        c = (c-.5)*(1.0+u_contrast*.85)+.5;
        c = (c-.5)*(1.0+u_dehaze*.30)+.5 - vec3(u_dehaze*.025);

        c.r += u_temp*.075;
        c.b -= u_temp*.075;
        c.g += u_tint*.055;
        c.r -= u_tint*.018;
        c.b -= u_tint*.018;

        float y=lum(c);
        float mx=max(c.r,max(c.g,c.b));
        float mn=min(c.r,min(c.g,c.b));
        float chroma=mx-mn;
        float vib=1.0+u_vibrance*(1.0-clamp(chroma,0.0,1.0))*.9;
        c=mix(vec3(y),c,vib);
        c=mix(vec3(lum(c)),c,1.0+u_saturation);

        float m = texture(u_mask,v_uv).r;
        if(m > .001){
          c *= pow(2.0,u_maskExposure*m);
          float ml=lum(c);
          c = mix(vec3(ml),c,1.0+u_maskSaturation*m);
          c.r += u_maskTemp*.07*m;
          c.b -= u_maskTemp*.07*m;
        }

        float d=distance(v_uv,vec2(.5));
        float vig=smoothstep(.28,.76,d)*u_vignette*.68;
        c*=1.0-vig;
        float g=(rand(v_uv*u_res+vec2(u_exposure*31.7,u_temp*19.3))-.5)*u_grain*.12;
        c += vec3(g);
        outColor=vec4(clamp(c,0.0,1.0),1.0);
      }`;

    this.program = this.createProgram(vs, fs);
    this.posLoc = gl.getAttribLocation(this.program, 'a_pos');
    this.uniforms = {};
    [
      'u_res','u_exposure','u_brightness','u_contrast','u_highlights','u_shadows',
      'u_temp','u_tint','u_vibrance','u_saturation','u_sharpness','u_clarity','u_dehaze','u_vignette','u_grain',
      'u_skinSmooth','u_skinGlow','u_skinWarmth','u_skinRedness',
      'u_maskExposure','u_maskSaturation','u_maskTemp','u_tex','u_mask'
    ].forEach(n => this.uniforms[n] = gl.getUniformLocation(this.program, n));

    const buf = gl.createBuffer();
    this.buffer = buf;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    this.texture = gl.createTexture();
    this.maskTexture = gl.createTexture();
    this.blankMask = document.createElement('canvas');
    this.blankMask.width = 1;
    this.blankMask.height = 1;
  }

  createProgram(vsSource, fsSource) {
    const gl = this.gl;
    const compile = (type, src) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  bindTexture(unit, texture, source) {
    const gl = this.gl;
    gl.activeTexture(unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  }

  render(source, params, maskSource = null) {
    const gl = this.gl;
    this.canvas.width = source.width;
    this.canvas.height = source.height;
    gl.viewport(0, 0, source.width, source.height);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.posLoc);
    gl.vertexAttribPointer(this.posLoc, 2, gl.FLOAT, false, 0, 0);

    this.bindTexture(gl.TEXTURE0, this.texture, source);
    this.bindTexture(gl.TEXTURE1, this.maskTexture, maskSource || this.blankMask);
    gl.uniform1i(this.uniforms.u_tex, 0);
    gl.uniform1i(this.uniforms.u_mask, 1);

    gl.uniform2f(this.uniforms.u_res, source.width, source.height);
    gl.uniform1f(this.uniforms.u_exposure, params.exposure);
    gl.uniform1f(this.uniforms.u_brightness, params.brightness);
    gl.uniform1f(this.uniforms.u_contrast, params.contrast);
    gl.uniform1f(this.uniforms.u_highlights, params.highlights);
    gl.uniform1f(this.uniforms.u_shadows, params.shadows);
    gl.uniform1f(this.uniforms.u_temp, params.temperature);
    gl.uniform1f(this.uniforms.u_tint, params.tint);
    gl.uniform1f(this.uniforms.u_vibrance, params.vibrance);
    gl.uniform1f(this.uniforms.u_saturation, params.saturation);
    gl.uniform1f(this.uniforms.u_sharpness, params.sharpness);
    gl.uniform1f(this.uniforms.u_clarity, params.clarity);
    gl.uniform1f(this.uniforms.u_dehaze, params.dehaze);
    gl.uniform1f(this.uniforms.u_vignette, params.vignette);
    gl.uniform1f(this.uniforms.u_grain, params.grain);
    gl.uniform1f(this.uniforms.u_skinSmooth, params.skinSmooth);
    gl.uniform1f(this.uniforms.u_skinGlow, params.skinGlow);
    gl.uniform1f(this.uniforms.u_skinWarmth, params.skinWarmth);
    gl.uniform1f(this.uniforms.u_skinRedness, params.skinRedness);
    gl.uniform1f(this.uniforms.u_maskExposure, params.maskExposure);
    gl.uniform1f(this.uniforms.u_maskSaturation, params.maskSaturation);
    gl.uniform1f(this.uniforms.u_maskTemp, params.maskTemperature);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}

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
    r.onsuccess = () => resolve(r.result.sort((a, b) => b.updatedAt - a.updatedAt));
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
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, c.width, c.height);
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
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,70,100,.48)';
  ctx.fillStyle = 'rgba(255,70,100,.48)';
  for (const stroke of state.maskStrokes) {
    if (stroke.erase || !stroke.points?.length) continue;
    ctx.lineWidth = Math.max(2, stroke.size * Math.min(overlay.width, overlay.height));
    ctx.beginPath();
    const first = stroke.points[0];
    ctx.moveTo(first.x * overlay.width, first.y * overlay.height);
    for (let i = 1; i < stroke.points.length; i++) {
      const p = stroke.points[i];
      ctx.lineTo(p.x * overlay.width, p.y * overlay.height);
    }
    if (stroke.points.length === 1) {
      ctx.arc(first.x * overlay.width, first.y * overlay.height, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    } else ctx.stroke();
  }
}

function invalidateGeometry(clearMask = false) {
  state.geometryCache = null;
  state.geometryKey = '';
  resetCanvasGesture();
  if (clearMask && state.maskStrokes.length) {
    state.maskStrokes = [];
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
    requestAnimationFrame(drawMaskOverlay);
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

function buildControls() {
  const targetIds = { light: 'lightSliders', color: 'colorSliders', effects: 'effectSliders', beauty: 'beautySliders', mask: 'maskSliders' };
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
  drawMaskOverlay();
}

function isDefaultLook() {
  const keys = ['exposure','brightness','contrast','highlights','shadows','temperature','tint','vibrance','saturation','sharpness','clarity','dehaze','vignette','grain','skinSmooth','skinGlow','skinWarmth','skinRedness'];
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
    presets: ['exposure','brightness','contrast','highlights','shadows','temperature','tint','vibrance','saturation','sharpness','clarity','dehaze','vignette','grain','skinGlow'],
    light: SLIDERS.light.map(x => x[0]),
    color: SLIDERS.color.map(x => x[0]),
    effects: SLIDERS.effects.map(x => x[0]),
    beauty: SLIDERS.beauty.map(x => x[0]),
    mask: SLIDERS.mask.map(x => x[0]),
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
  ['exposure','brightness','contrast','highlights','shadows','temperature','tint','vibrance','saturation','sharpness','clarity','dehaze','vignette','grain','skinGlow'].forEach(k => state.params[k] = 0);
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
    await putProject({ id: state.projectId, name: state.projectName, blob, params: state.params, maskStrokes: state.maskStrokes, thumb, createdAt: Date.now(), updatedAt: Date.now() });
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
function scheduleProjectSave() {
  clearTimeout(saveTimer);
  if ($('#saveStatus')) $('#saveStatus').textContent = 'Saving…';
  saveTimer = setTimeout(saveCurrentProject, 500);
}

async function saveCurrentProject() {
  if (!state.projectId || !state.originalBlob || !state.db) return;
  const old = await getProject(state.projectId);
  await putProject({
    id: state.projectId,
    name: state.projectName,
    blob: state.originalBlob,
    params: state.params,
    maskStrokes: state.maskStrokes,
    thumb: old?.thumb || await makeThumbnail(state.originalBlob),
    createdAt: old?.createdAt || Date.now(),
    updatedAt: Date.now()
  });
  if ($('#saveStatus')) $('#saveStatus').textContent = 'Saved locally';
  refreshProjects();
}

function projectCard(p, full = false) {
  const card = document.createElement(full ? 'article' : 'button');
  card.className = full ? 'project-row' : 'project-card';
  const url = URL.createObjectURL(p.thumb);
  const img = document.createElement('img');
  img.alt = p.name;
  img.src = url;
  img.onload = () => setTimeout(() => URL.revokeObjectURL(url), 1000);

  if (!full) {
    card.appendChild(img);
    const label = document.createElement('span');
    label.textContent = p.name;
    card.appendChild(label);
    card.onclick = () => loadBlob(p.blob, p.name, p.id, p.params, p.maskStrokes);
    return card;
  }

  const meta = document.createElement('div');
  meta.className = 'project-row-meta';
  const date = new Date(p.updatedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  meta.innerHTML = `<strong>${escapeHtml(p.name)}</strong><span>${date}</span><small>${p.maskStrokes?.length || 0} mask stroke(s)</small>`;
  const actions = document.createElement('div');
  actions.className = 'project-row-actions';
  const open = document.createElement('button');
  open.textContent = 'Open';
  open.onclick = () => loadBlob(p.blob, p.name, p.id, p.params, p.maskStrokes);
  const del = document.createElement('button');
  del.textContent = 'Delete';
  del.className = 'danger-text';
  del.onclick = async () => {
    if (!confirm(`ลบโปรเจกต์ “${p.name}”?`)) return;
    await deleteProject(p.id);
    if (state.projectId === p.id) {
      state.projectId = null;
      state.image = null;
      state.originalBlob = null;
      $('#canvasEmpty').style.display = 'flex';
    }
    await refreshProjects();
    toast('Project deleted');
  };
  actions.append(open, del);
  card.append(img, meta, actions);
  return card;
}

async function refreshProjects() {
  if (!state.db) return;
  const list = await listProjects();
  $('#projectCount').textContent = list.length;
  $('#emptyProjects').style.display = list.length ? 'none' : 'block';
  $('#allProjectsEmpty').style.display = list.length ? 'none' : 'block';

  const recent = $('#recentProjects');
  recent.innerHTML = '';
  list.slice(0, 6).forEach(p => recent.appendChild(projectCard(p, false)));

  const all = $('#allProjects');
  all.innerHTML = '';
  list.forEach(p => all.appendChild(projectCard(p, true)));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

function analyzeImage() {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(state.image, 0, 0, 96, 96);
  const d = ctx.getImageData(0, 0, 96, 96).data;
  const luminance = [];
  const saturation = [];
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] / 255, g = d[i+1] / 255, b = d[i+2] / 255;
    const l = .2126*r + .7152*g + .0722*b;
    const mx = Math.max(r,g,b), mn = Math.min(r,g,b);
    sum += l;
    luminance.push(l);
    saturation.push(mx === 0 ? 0 : (mx-mn)/mx);
  }
  luminance.sort((a,b) => a-b);
  const avg = sum / luminance.length;
  const p10 = luminance[Math.floor(luminance.length*.1)];
  const p90 = luminance[Math.floor(luminance.length*.9)];
  const range = p90 - p10;
  const avgSat = saturation.reduce((a,b) => a+b,0) / saturation.length;
  const suggested = {
    exposure: clamp((.50-avg)*1.05,-.45,.45),
    shadows: p10<.15 ? clamp((.16-p10)*1.8,0,.28) : 0,
    highlights: p90>.88 ? clamp(-((p90-.88)*1.8),-.28,0) : 0,
    contrast: range<.55 ? clamp((.55-range)*.42,0,.16) : 0,
    vibrance: avgSat<.34 ? clamp((.34-avgSat)*.65,0,.16) : 0
  };
  return { avg,p10,p90,range,avgSat,suggested };
}

function runAutoEnhance() {
  if (!state.image) return;
  const a = analyzeImage();
  const before = snapshot();
  Object.assign(state.params, a.suggested);
  commit(before);
  syncUI();
  queueRender();
  $('#analysisResult').innerHTML = `แสงเฉลี่ย <b>${Math.round(a.avg*100)}%</b> · Dynamic range <b>${Math.round(a.range*100)}%</b> · Saturation <b>${Math.round(a.avgSat*100)}%</b><br>Applied: Exposure ${a.suggested.exposure.toFixed(2)}, Shadows ${pct(a.suggested.shadows)}, Highlights ${pct(a.suggested.highlights)}, Vibrance ${pct(a.suggested.vibrance)}`;
  toast('Auto Enhance applied');
}

async function exportImage() {
  if (!state.image) return;
  loading(true, 'Rendering full quality…');
  try {
    let source = makeGeometryCanvas(0);
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
  $('#offlineValue').textContent = 'serviceWorker' in navigator ? 'Ready' : 'Unavailable';
  if (state.renderer) $('#rendererValue').textContent = `WebGL2 · max ${state.renderer.maxTextureSize}px`;
  if (state.db) $('#projectCount').textContent = (await listProjects()).length;
}

function openFeatureModal(feature, ai = false) {
  const data = ai ? AI_FEATURES[feature] : INFO_FEATURES[feature];
  if (!data) return;
  $('#featureStatus').textContent = data.status;
  $('#featureTitle').textContent = data.title;
  $('#featureBody').innerHTML = `<p>${escapeHtml(data.body)}</p>${data.bullets?.length ? `<ul>${data.bullets.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>` : ''}${ai ? '<div class="feature-warning">Cloud AI ยังไม่ส่งรูปหรือเรียก API ใด ๆ ในเวอร์ชันนี้</div>' : ''}`;
  if (ai && data.fallbackPanel) {
    $('#featureActionBtn').textContent = state.image ? `Open ${data.fallbackPanel === 'mask' ? 'Manual Mask' : 'Local Beauty'}` : 'Choose Photo for Local Tool';
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
  $('#exportBtn').onclick = () => state.image ? modal('exportModal', true) : toast('เลือกรูปก่อน');
  $('#downloadExportBtn').onclick = exportImage;
  $('#exportQuality').oninput = e => $('#qualityValue').textContent = `${e.target.value}%`;

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
    queueRender();
  });

  document.addEventListener('change', e => {
    const input = e.target.closest('input[data-param]');
    if (!input) return;
    commit(state.sliderStart || snapshot());
    state.sliderStart = null;
  });

  $$('.preset-btn').forEach(b => b.onclick = () => applyPreset(b.dataset.preset));
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

  $('#autoEnhanceBtn').onclick = runAutoEnhance;

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
    if (!state.maskStrokes.length && SLIDERS.mask.every(x => state.params[x[0]] === 0)) return;
    const before = snapshot();
    state.maskStrokes = [];
    SLIDERS.mask.forEach(x => state.params[x[0]] = DEFAULT_PARAMS[x[0]]);
    commit(before);
    syncUI();
    queueRender();
  };

  $('#viewAllProjectsBtn').onclick = () => showPage('projects');
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
    $('#featureBody').innerHTML = '<p><b>Working locally:</b> Import, Auto Enhance, Beauty, Presets, Light, Color, Detail, Manual Mask, Crop/Rotate/Flip, Undo/Redo, Projects, Before/After และ Export</p><p><b>Needs API:</b> Generative Remove, Background, Expand, Portrait, Hair และ Outfit</p><p><b>Browser-limited:</b> RAW/HDR pipeline เต็มรูปแบบ</p>';
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

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  }
}

document.addEventListener('DOMContentLoaded', init);
