# LUMI AI PWA v1.1 — Feature Status

## ✅ Working
- Installable PWA (`display: standalone`)
- iPhone safe-area / Home Screen styling
- Service Worker offline app shell
- Local photo import
- WebGL2 non-destructive renderer
- Smart Auto Enhance
- Local skin-aware Beauty: Smooth / Glow / Warmth / Redness
- Presets: Original, Natural, Vivid, Portrait, Soft Film, Matte, Warm, Cool, B&W
- Light: Exposure / Brightness / Contrast / Highlights / Shadows
- Color: Temperature / Tint / Vibrance / Saturation
- Detail: Sharpness / Clarity / Dehaze / Vignette / Grain
- Manual Selective Mask: Paint / Erase / Brush Size / Undo Stroke / Clear
- Selective Mask adjustments: Exposure / Saturation / Temperature
- Center Crop ratios
- Rotate / Flip H / Flip V
- Pinch zoom / pan / double-tap reset preview
- Undo / Redo including mask edits
- Before / After
- Projects page: Open / Delete / New / Clear All
- IndexedDB project persistence including mask strokes
- JPEG / PNG / WebP export
- Web Share Files / download fallback
- AI and browser-limited feature cards all open usable detail sheets
- Local fallback from AI Remove/Background to Manual Mask and AI Portrait to Local Beauty
- Me page controls: install, clear offline cache, feature status

## 🟡 Partial / Browser-limited
- Beauty uses skin-color approximation, not semantic face segmentation
- Crop is center crop only
- Full-resolution export bounded by browser/WebGL `MAX_TEXTURE_SIZE`
- RAW/DNG depends on browser decoder
- HDR/EDR full pipeline not enabled

## 🔌 Needs API
- AI Remove generative fill
- AI Background generation / relight
- Generative Expand
- AI Portrait generation
- AI Hair generation
- AI Outfit generation

## ⏳ Planned
- Semantic Face / Skin / Hair masks
- Linear / Radial Gradient masks
- HSL / Tone Curve / Color Grading
- Draggable crop frame
- Project version history
- Batch export
- Optional cloud sync

## Not faked
Generative AI buttons never create random placeholder images. Unsupported AI opens a transparent status/detail flow and, where sensible, offers a real local alternative.
