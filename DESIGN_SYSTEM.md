# LUMI AI v3 — Model Color Design System

## Core palette

- Background `#0B1020`
- Surface `#121A2F`
- Glass `rgba(255,255,255,0.08)`
- Primary text `#FFFFFF`
- Secondary text `#A8B3CF`
- Divider `rgba(255,255,255,0.12)`

## Model identities

| Model | Colors | Role |
|---|---|---|
| rembg | `#22C55E` / `#34D399` / `#A7F3D0` | Remove background / cutout |
| Real-ESRGAN | `#3B82F6` / `#38BDF8` / `#93C5FD` | Enhance / upscale |
| SAM 2 | `#8B5CF6` / `#22D3EE` / `#C4B5FD` | Smart selection / masks |
| FLUX.1 Schnell | `#F97316` / `#EC4899` / `#FB7185` | Fast creative generation |
| Stable Diffusion XL | `#4F46E5` / `#818CF8` / `#A5B4FC` | Fill / replace / expand / img2img |

Model colors are used on tool cards, badges, glow, selected options, AI run sheets and result context. Local editing tools stay neutral/indigo so model identity remains meaningful.

Motion uses restrained scale/fade transitions and respects `prefers-reduced-motion`. Layout uses iOS safe-area insets and one-hand-friendly bottom navigation.
