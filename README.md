# LUMI AI PWA v2.0 — Pro Local Editor

PWA รุ่นใช้งานก่อน Native iOS ของ LUMI AI เน้นการแต่งภาพแบบ local-first / non-destructive บน iPhone Safari และ browser ที่รองรับ WebGL2 โดยไม่อัปโหลดรูปสำหรับเครื่องมือ Local

Live: https://lumi-ai-pwa-live.vercel.app/

## ทำงานจริงใน v2.0

- Import รูปจาก iPhone / browser picker
- WebGL2 non-destructive render pipeline
- Smart Auto Enhance 3 ระดับ: Natural / Balanced / Strong
- Auto analysis: luminance, dynamic range, shadow/highlight, rough WB suggestion
- Live Histogram + clipping status
- Light: Exposure / Brightness / Contrast / Highlights / Shadows / Whites / Blacks
- Color: Temperature / Tint / Vibrance / Saturation
- HSL Mixer 8 สี: Red / Orange / Yellow / Green / Aqua / Blue / Purple / Magenta
  - Hue / Saturation / Luminance ต่อสี
- Tone Curve: Shadows / Midtones / Highlights + live curve preview
- Beauty: Smooth / Glow / Warmth / Redness / Brighten / Tone Evenness / Texture Restore
- Beauty presets: Natural / Fresh / Soft / Glow
- Detail: Sharpness / Clarity / Dehaze / Vignette / Grain / Bloom
- Manual Selective Mask
  - Paint / Erase / Brush size / Undo stroke / Clear
  - Feather / Invert
  - Exposure / Saturation / Temperature / Contrast / Brightness เฉพาะ mask
- Crop ratios: Original / 1:1 / 4:5 / 3:4 / 9:16 / 16:9 / 2:3
- Rotate Left / Flip H / Flip V
- Pinch zoom / pan / double-tap reset preview
- Multi-step Undo / Redo รวม mask และ geometry
- Before / After
- IndexedDB Projects รวม original Blob + parameters + mask strokes
- Projects: Open / Rename / Duplicate / Favorite / Delete / Clear All
- Favorite filter + Recent Projects
- Export JPEG / PNG / WebP
- Export Resolution: Original / 4096 / 2048 / 1080
- Quality control + estimated output information
- Web Share Files เมื่อ browser รองรับ + download fallback
- Service Worker + Web App Manifest + icon
- Add to Home Screen / standalone mode
- AI Studio ทุกการ์ดเปิดรายละเอียดได้ และมี Local fallback ที่เหมาะสม

## AI Studio — ไม่สร้างผลปลอม

Generative AI ต่อไปนี้ยังเป็น `Needs API`:

- AI Remove
- AI Background / Relight
- Generative Expand
- AI Portrait
- AI Hair
- AI Outfit

Local fallback:

- Remove / Background → Manual Mask
- Portrait → Local Beauty
- Expand → Crop / Geometry
- Hair / Outfit → Manual Mask สำหรับ selective local edits

ไม่มีการสุ่มภาพ placeholder เพื่ออ้างว่า AI ทำงานจริง

## Privacy

Local editor ประมวลผลใน browser และเก็บ Project ใน IndexedDB ของ origin นั้น ภาพจะไม่ถูกส่งไป Cloud โดยเครื่องมือ Local

หากต่อ Generative AI ในอนาคต ต้องแจ้งผู้ใช้ก่อน upload และใช้ signed upload / short-lived credentials จาก backend

## Run local

```bash
python3 -m http.server 8080
```

เปิด `http://localhost:8080`

## Deploy

เป็น static PWA พร้อม `vercel.json`

```bash
vercel --prod
```

## iPhone

1. เปิด HTTPS URL ด้วย Safari
2. Share
3. Add to Home Screen
4. เปิด LUMI AI จาก Home Screen

## ข้อจำกัดของ PWA

- Beauty เป็น local skin-chroma + texture-preserving approximation ไม่ใช่ semantic face/skin model
- RAW/ProRAW ขึ้นกับ decoder ของ browser จึงไม่รับรองทุกกล้อง
- HDR/EDR pipeline เต็มรูปแบบยังไม่เปิด
- Crop ยังเป็น center crop; draggable perspective/crop frame อยู่ใน roadmap
- Export สูงสุดขึ้นกับ `MAX_TEXTURE_SIZE`, memory และข้อจำกัด browser ของอุปกรณ์
- Generative AI ต้องมี backend จริง
- การล้าง Website Data อาจลบ IndexedDB projects ควร export งานสำคัญก่อน
