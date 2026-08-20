# LUMI AI PWA v3.0 — Premium AI Photo Studio

LUMI AI v3 preserves the v2 local editor and upgrades it into a premium iPhone/PWA photo studio with a searchable Mega Toolbox, deeper Pro controls, local projects/workflows, and a model-routed AI Studio.

## Premium AI model identity

- **rembg** — emerald/mint — background removal and cutout.
- **Real-ESRGAN** — electric blue/cyan — enhance and upscale.
- **SAM 2** — purple/cyan — smart selection and semantic masks.
- **FLUX.1 Schnell** — orange/pink — fast creative generation.
- **Stable Diffusion XL** — indigo/violet — fill, replace, background, expand and img2img.

Model colors are used on cards, badges, run sheets and result context. Color identity never implies that a model endpoint is configured.

## Local editor

Working local foundations include Import, WebGL2 non-destructive render, Smart Auto, Histogram/Clipping, Light, Color, HSL, Curve, Levels, Tonal Contrast, Color Balance, RGB Channel Mixer, Replace Color, Detail, Film, Optics, local Lens Blur, skin-aware Beauty, Manual Mask, Crop/Rotate/Flip, Spot Heal, Layers/Blend Modes, Text/Watermark, Undo/Redo, Before/After, IndexedDB Projects, Versions, Batch export, Collage, Browser Camera and JPEG/PNG/WebP export.

## Mega Toolbox

All Tools categorizes Smart, Beauty, Pro Photo, Selective, Retouch, Effects, AI Studio, Workflow and Creator capabilities. Every item routes to one of four honest states: working local tool, model workflow, browser/native limitation, or API requirement.

## AI Gateway

`GET /api/ai` reports readiness for the five allow-listed model endpoints. `POST /api/ai` proxies an explicitly consented AI job server-side. Secrets never ship to the browser.

Configure model providers with `.env.example`. Unconfigured providers return `MODEL_NOT_CONFIGURED`; LUMI does not generate fake output.

See `AI_BACKEND.md`, `DESIGN_SYSTEM.md`, `FEATURES.md` and `VALIDATION.md`.

## PWA

The root boot shell loads the v3 premium UI bundle and `v3-01.js` through `v3-09.js`. The service worker caches the v3 shell and excludes `/api/*` from offline caching.

On iPhone: open the HTTPS deployment in Safari → Share → Add to Home Screen.

## Limitations

Semantic Face/Skin/Hair/Clothes masks, multi-person beauty, face/body geometry and depth maps require real model integration. Generative Remove/Replace/Expand/Background/Hair/Outfit/Portrait require configured AI providers. RAW/ProRAW, full HDR/EDR, Live Photo preservation, Pro Camera and tracked Video remain primarily Native-iOS responsibilities.
