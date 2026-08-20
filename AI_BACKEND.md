# LUMI AI v3 — AI Model Gateway

The PWA never embeds model secrets. `/api/ai` routes jobs only to allow-listed server endpoints.

## Environment variables

`REMBG_ENDPOINT`, `REMBG_TOKEN`, `REALESRGAN_ENDPOINT`, `REALESRGAN_TOKEN`, `SAM2_ENDPOINT`, `SAM2_TOKEN`, `FLUX_ENDPOINT`, `FLUX_TOKEN`, `SDXL_ENDPOINT`, `SDXL_TOKEN`, and optional `AI_PROVIDER_TOKEN`.

## Status

`GET /api/ai` returns readiness flags only. Endpoint URLs and tokens are never returned to the browser.

## Job

`POST /api/ai` accepts `model`, `tool`, `prompt`, `option`, a bounded preview `imageDataUrl`, and project metadata. Valid models are `rembg`, `realesrgan`, `sam2`, `flux`, and `sdxl`.

Local editing never calls this route. Every cloud AI run requires explicit user consent in the AI sheet. If a provider is not configured the gateway returns `MODEL_NOT_CONFIGURED`; LUMI does not manufacture a fake result.

For production original-resolution AI jobs, use signed object storage and short-lived server credentials rather than sending large originals as JSON data URLs.
