# LUMI AI PWA v2.0 — Feature Status

## ✅ Working — Local

- Installable PWA / standalone layout
- iPhone safe area + Home Indicator handling
- Service Worker offline shell
- Photo import
- WebGL2 non-destructive renderer
- Smart Auto Enhance: Natural / Balanced / Strong
- Live Histogram + clipping warning
- Light: Exposure / Brightness / Contrast / Highlights / Shadows / Whites / Blacks
- Color: Temperature / Tint / Vibrance / Saturation
- HSL Mixer 8 colors × Hue / Saturation / Luminance
- Tone Curve: Shadows / Midtones / Highlights
- Beauty: Smooth / Glow / Warmth / Redness / Brighten / Tone Evenness / Texture Restore
- Beauty presets
- Presets: Original / Natural / Vivid / Portrait / Soft Film / Matte / Warm / Cool / B&W / Clean Air / Rose Glow / City Night
- Detail: Sharpness / Clarity / Dehaze / Vignette / Grain / Bloom
- Manual Mask: Paint / Erase / Brush / Undo Stroke / Clear / Feather / Invert
- Mask local adjustments: Exposure / Saturation / Temperature / Contrast / Brightness
- Crop ratios + Rotate / Flip H / Flip V
- Pinch / Pan / Double-tap reset preview
- Undo / Redo including masks and geometry
- Before / After
- IndexedDB Projects
- Project Open / Rename / Duplicate / Favorite / Delete / Clear All
- Favorite filter + Recent Projects
- Export JPEG / PNG / WebP
- Export Original / 4096 / 2048 / 1080
- Web Share / download fallback
- AI feature detail sheets + real local fallbacks

## 🟡 Partial / Browser-limited

- Beauty semantic precision: color/texture approximation, not face segmentation
- Crop: center crop, not draggable frame/perspective yet
- RAW/DNG: decoder-dependent
- HDR/EDR: full pipeline not enabled
- Export ceiling depends on GPU texture size and browser memory

## 🔌 Needs API

- AI Remove generative fill
- AI Background generation / relight
- Generative Expand
- AI Portrait generation
- AI Hair generation
- AI Outfit generation

## ⏳ Next

- Semantic Person / Face / Skin / Hair masks using browser/on-device model where viable
- Brush hardness / edge-aware mask refine
- Linear / Radial Gradient masks
- Draggable crop frame + straighten + perspective
- Color Grading wheels
- Profile system
- Project version history
- Batch edit / batch export
- Optional encrypted cloud sync
- Generative AI backend contract integration

## No fake features

AI tools that require a real server remain clearly labeled `Needs API`. They never create random placeholder output.
