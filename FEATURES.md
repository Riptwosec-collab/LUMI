# LUMI AI PWA v3.0 — Feature Status

## ✅ Local / working

- Premium dark glass design with per-model AI color identity.
- Home: AI legend, Recommended AI Tools, style ideas, onboarding and Recent Projects.
- Searchable All Tools catalog across Smart, Beauty, Pro Photo, Selective, Retouch, Effects, AI Studio, Workflow and Creator.
- Import + WebGL2 non-destructive preview/export pipeline.
- Smart Auto, histogram and clipping indicator.
- Light / Color / HSL / Tone Curve foundation.
- Levels, Tonal Contrast/Gamma, Color Balance, RGB Channel Mixer and Replace Color.
- Detail, Film Lab, Optics and local Lens Blur foundation.
- Skin-aware basic Beauty.
- Manual Mask with Paint/Erase/Feather/Invert and selective Light/Color.
- Crop ratios, rotate and flips.
- Spot Heal/Clone workflow.
- Image Layers, opacity and blend modes.
- Text/watermark layer.
- Projects: save/open/rename/duplicate/favorite/delete.
- Session Versions, Batch export, Collage and Browser Camera.
- JPEG/PNG/WebP export with target resolution.
- Privacy Center, Storage Manager, Pro Info and AI Edit Status.
- Ask LUMI structured local edit plan with routing to AI workflows when needed.

## 🔌 AI endpoint integration ready

- rembg — Remove Background / Product Cut / Transparent PNG.
- Real-ESRGAN — Enhance / 2× / 4× / Restore Detail.
- SAM 2 — Smart Select / Person / Face-Skin / Sky-Background masks.
- FLUX.1 Schnell — Generate / Portrait / Avatar / Style Transfer.
- Stable Diffusion XL — Fill / Replace / Background / Expand / Img2Img / Hair / Outfit / Harmonize.

The AI gateway checks provider readiness and requires explicit cloud-processing consent before POST. Unconfigured providers are blocked instead of producing placeholder output.

## 🧠 Model required

- Semantic person/face/skin/hair/clothes masks.
- Multi-person beauty.
- Face/eye/nose/lip geometry.
- Makeup region placement.
- Body pose/reshape and background protection.
- AI Depth map / semantic Lens Blur.
- Smart Deband / face-aware relight / sky-aware actions.

## 🟡 Partial / architecture-ready

- Full arbitrary-point RGB curve editor.
- 3D LUT import/export shader path.
- Linear/Radial/Color/Luminance mask primitives.
- Persistent version history across all browser restarts.
- Learned Match Look (current local version uses reference color statistics).
- Content-aware healing beyond neighborhood sampling.

## 📱 Native iOS path

- Core Image RAW / Apple ProRAW.
- Full HDR/EDR and gain-map export.
- Manual AVFoundation camera / ProRAW / focus peaking / zebra.
- Live Photo preservation.
- Video timeline with tracked Beauty/Body effects.
- Metal high-resolution pipeline / ProMotion optimization.
