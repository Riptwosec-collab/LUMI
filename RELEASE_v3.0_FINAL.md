# LUMI AI PWA v3.0 FINAL

Release status: FINAL source synced to `main`.

## Package

- Archive: `LUMI_AI_PWA_v3.0_FINAL.zip`
- SHA-256: `e1a7cd6d246957d5d5566177c8cf43af463442c0a3c0906e246083737dccf116`

## Runtime

The repository root contains the LUMI AI v3 PWA runtime, premium AI model color system, PWA manifest/service worker, local editor modules, and the server-side `/api/ai` gateway contract.

AI providers that require external inference remain configuration-dependent and must use server-side environment variables; the client must not expose provider tokens or fake successful AI output when a provider is not configured.

## AI model routing

- rembg — background removal / cutout
- Real-ESRGAN — enhance / upscale / restore
- SAM 2 — smart selection / segmentation masks
- FLUX.1 Schnell — generative creation / portrait / style workflows
- Stable Diffusion XL — generative fill / replace / background / expand / img2img

## Release rule

Preserve → Refactor → Upgrade → Integrate. Existing working features are retained and extended rather than removed.
