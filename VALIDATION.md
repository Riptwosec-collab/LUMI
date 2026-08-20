# LUMI AI PWA v3.0 — Validation

## Completed static validation

- `node --check` passed for `v3-01.js` through `v3-09.js` and `api/ai.js`.
- `manifest.webmanifest` and `vercel.json` parse as valid JSON.
- HTML duplicate-ID check passed on the v3 source document.
- AI registry contains exactly rembg / Real-ESRGAN / SAM 2 / FLUX.1 Schnell / Stable Diffusion XL.
- AI gateway uses an allow-list; a browser cannot provide an arbitrary proxy endpoint URL.
- Service Worker version is `lumi-ai-pwa-v3.0` and excludes `/api/*` from cache handling.
- v2 local editing workflow is preserved; v3 adds panels/pages/workflows rather than deleting existing tools.

## Runtime truthfulness

AI tools report READY only when their server endpoint is configured. Otherwise `/api/ai` reports the provider as unconfigured and an attempted job returns `MODEL_NOT_CONFIGURED`. No placeholder image is represented as a successful AI result.

## Deployment note

GitHub `main` contains the complete v3 runtime. Vercel automatic/API deployment is currently subject to the account deployment quota; production verification must use the deployment created after the quota permits the latest Git commit to build.
