'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const deepCopy = obj => JSON.parse(JSON.stringify(obj));

function pct(v) {
  const n = Math.round(v * 100);
  return `${n >= 0 ? '+' : ''}${n}`;
}

const HSL_COLORS = [
  ['red','Red',0.00], ['orange','Orange',0.08], ['yellow','Yellow',0.16], ['green','Green',0.33],
  ['aqua','Aqua',0.50], ['blue','Blue',0.62], ['purple','Purple',0.75], ['magenta','Magenta',0.90]
];

const HSL_DEFAULTS = Object.fromEntries(HSL_COLORS.flatMap(([key]) => [
  [`hsl_${key}_h`, 0], [`hsl_${key}_s`, 0], [`hsl_${key}_l`, 0]
]));

const DEFAULT_PARAMS = Object.freeze({
  exposure: 0,
  brightness: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  sharpness: 0,
  clarity: 0,
  dehaze: 0,
  vignette: 0,
  grain: 0,
  bloom: 0,
  skinSmooth: 0,
  skinGlow: 0,
  skinWarmth: 0,
  skinRedness: 0,
  skinBrighten: 0,
  skinEven: 0,
  skinTexture: 0,
  curveShadows: 0,
  curveMidtones: 0,
  curveHighlights: 0,
  maskExposure: 0,
  maskSaturation: 0,
  maskTemperature: 0,
  maskContrast: 0,
  maskBrightness: 0,
  maskFeather: 0.08,
  maskInvert: false,
  ...HSL_DEFAULTS,
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
    ['shadows', 'Shadows', -1, 1, 0.01, pct],
    ['whites', 'Whites', -1, 1, 0.01, pct],
    ['blacks', 'Blacks', -1, 1, 0.01, pct]
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
    ['grain', 'Grain', 0, 1, 0.01, pct],
    ['bloom', 'Bloom', 0, 1, 0.01, pct]
  ],
  beauty: [
    ['skinSmooth', 'Skin Smooth', 0, 1, 0.01, pct],
    ['skinGlow', 'Skin Glow', 0, 1, 0.01, pct],
    ['skinWarmth', 'Skin Warmth', -1, 1, 0.01, pct],
    ['skinRedness', 'Redness', -1, 1, 0.01, pct],
    ['skinBrighten', 'Skin Brighten', 0, 1, 0.01, pct],
    ['skinEven', 'Tone Evenness', 0, 1, 0.01, pct],
    ['skinTexture', 'Texture Restore', 0, 1, 0.01, pct]
  ],
  mask: [
    ['maskExposure', 'Mask Exposure', -1.5, 1.5, 0.01, v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`],
    ['maskSaturation', 'Mask Saturation', -1, 1, 0.01, pct],
    ['maskTemperature', 'Mask Temperature', -1, 1, 0.01, pct],
    ['maskContrast', 'Mask Contrast', -1, 1, 0.01, pct],
    ['maskBrightness', 'Mask Brightness', -1, 1, 0.01, pct]
  ],
  curve: [
    ['curveShadows', 'Shadows', -1, 1, 0.01, pct],
    ['curveMidtones', 'Midtones', -1, 1, 0.01, pct],
    ['curveHighlights', 'Highlights', -1, 1, 0.01, pct]
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
  'B&W': { saturation: -1, contrast: .14, shadows: .08, sharpness: .12, grain: .10 },
  'Clean Air': { exposure: .06, highlights: -.12, shadows: .10, dehaze: .12, vibrance: .08, hsl_blue_s: .08, hsl_green_s: -.05 },
  'Rose Glow': { exposure: .08, temperature: .05, tint: .04, skinGlow: .12, skinBrighten: .08, hsl_orange_l: .10, hsl_magenta_s: .08 },
  'City Night': { shadows: .14, blacks: -.10, contrast: .12, dehaze: .18, hsl_blue_s: .16, hsl_aqua_s: .10, grain: .05 }
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
    bullets: ['9:16', '4:5', '1:1', '16:9', 'Custom'],
    fallbackPanel: 'crop'
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
    bullets: ['Hairstyle', 'Hair color', 'Keep face', 'Keep lighting'],
    fallbackPanel: 'mask'
  },
  outfit: {
    title: 'AI Outfit',
    status: 'NEEDS API',
    body: 'เปลี่ยนเสื้อผ้าโดยรักษา pose มือ ใบหน้า และฉากหลัง ต้องใช้ backend generative AI',
    bullets: ['Casual', 'Street', 'Business', 'Formal', 'Custom prompt'],
    fallbackPanel: 'mask'
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
  hslColor: 'red',
  projectFilter: 'all',
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

