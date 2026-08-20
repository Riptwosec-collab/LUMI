# LUMI AI PWA v1.1

PWA รุ่นใช้งานก่อน Native iOS app ของ LUMI AI โดยเน้นฟังก์ชัน Local ที่ทำงานจริงบน iPhone/Safari ก่อนต่อ Cloud AI

## ทำงานจริง
- Import ภาพจาก iPhone / browser photo picker
- WebGL2 non-destructive preview
- Smart Auto Enhance แบบ local analysis
- Local Beauty แบบ skin-aware chroma approximation: Skin Smooth / Glow / Warmth / Redness
- Presets 9 แบบ
- Light: Exposure, Brightness, Contrast, Highlights, Shadows
- Color: Temperature, Tint, Vibrance, Saturation
- Detail: Sharpness, Clarity, Dehaze, Vignette, Grain
- Manual Selective Mask: Paint / Erase / Undo Stroke / Brush Size
- Mask adjustments: Exposure / Saturation / Temperature
- Center Crop: Original, 1:1, 4:5, 3:4, 9:16, 16:9, 2:3
- Rotate / Flip H / Flip V
- Pinch zoom / pan / double-tap reset บน preview
- Undo / Redo รวม Manual Mask
- Before / After
- Projects page เต็มหน้า: Open / Delete / New Project / Clear All
- Project persistence ด้วย IndexedDB รวม original Blob + parameters + mask strokes
- Export JPEG / PNG / WebP ที่ resolution สูงสุดตาม WebGL/browser limit
- Web Share Files เมื่อ browser รองรับ + download fallback
- Service Worker + Manifest + Apple touch icon
- Offline app shell หลังเปิดเว็บครั้งแรก
- Me page: install help, renderer status, project count, clear offline cache, feature status

## AI Studio
การ์ด AI ทุกใบกดได้และเปิด Feature Detail แต่ไม่ fake generation

- AI Remove / Background มี local fallback ไป Manual Mask
- AI Portrait มี local fallback ไป Beauty
- Generative Expand / Hair / Outfit แสดง Needs API จนกว่าจะต่อ backend จริง

## Run local
Service Worker ต้องใช้ HTTP/HTTPS หรือ localhost

```bash
python3 -m http.server 8080
```

เปิด `http://localhost:8080`

## Deploy Vercel
โฟลเดอร์นี้เป็น static site พร้อม `vercel.json`

```bash
vercel --prod
```

หรือ Import Git repository เข้า Vercel แล้วใช้โฟลเดอร์นี้เป็น Root Directory

## ติดตั้งบน iPhone
1. เปิด URL HTTPS ด้วย Safari
2. Share
3. Add to Home Screen
4. เปิด LUMI AI จาก Home Screen

## ข้อจำกัด
- Skin-aware Beauty เป็น GPU chroma approximation ไม่ใช่ semantic face/skin segmentation จึงอาจโดนวัตถุที่มีสีคล้ายผิว
- RAW/ProRAW ไม่รับประกันบน PWA เพราะขึ้นกับ Safari/WebKit decoder
- HDR/EDR pipeline เต็มรูปแบบยังไม่เปิด
- Crop เป็น center crop ยังไม่มี draggable crop box
- Full-resolution export ถูกจำกัดด้วย WebGL `MAX_TEXTURE_SIZE` ของอุปกรณ์
- Generative AI ยังต้องต่อ server API จริง
- Project data อยู่ใน browser storage ของ origin นั้น ควร Export งานสำคัญก่อนล้าง Website Data
