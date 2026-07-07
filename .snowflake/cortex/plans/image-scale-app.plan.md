# Plan: Image Scale App (Snowflake App Runtime + Local)

## Overview

A Next.js app that allows users to upload product images and scale them for retail partners (Walmart, Target), add banner overlays, or manually resize. Styled with elf cosmetics-inspired branding (bold pinks/reds, clean modern aesthetic) without using the elf name or products.

## Architecture

```
image_scale/
├── app/
│   ├── layout.tsx          # Root layout with branding
│   ├── page.tsx            # Main UI: upload + mode selector + results
│   ├── globals.css         # Elf-inspired theme (pink/red/white)
│   └── api/
│       └── scale/route.ts  # Server-side image processing via sharp
├── components/
│   ├── ImageUploader.tsx    # Drag-and-drop upload component
│   ├── ModeSelector.tsx     # Walmart / Target / Banner / Manual buttons
│   ├── BannerUploader.tsx   # Secondary upload for banner mode
│   ├── ManualControls.tsx   # Width/height/aspect-ratio inputs
│   └── ResultPreview.tsx    # Processed image preview + download
├── lib/
│   └── presets.ts          # Retailer dimension configs
├── public/
│   └── icon.svg            # App icon
├── app.yml                 # Snowflake App Runtime config
├── snowflake.yml           # snow CLI deployment config
├── next.config.ts          # standalone output for SPCS
├── package.json
└── tsconfig.json
```

## Key Design Decisions

### Image Processing: `sharp` (server-side)
- Runs in the `/api/scale` route — works identically local and in SPCS
- Handles resize, crop, composite (banner overlay)
- Returns processed image as a blob for download
- No Snowflake SDK needed — this is a pure image-processing app

### Retailer Presets
| Retailer | Main Image | Secondary | Swatch | Format |
|----------|-----------|-----------|--------|--------|
| Walmart  | 2000×2000 | 1500×1500 | 500×500 | JPEG (white bg) |
| Target   | 1200×1200 | 800×800   | 400×400 | PNG (transparent ok) |

### Banner Overlay
- User uploads base image + banner image
- Banner composited on top (position: top, bottom, or overlay)
- User chooses position and opacity

### Manual Scale
- Enter width and/or height
- Aspect-ratio lock toggle (default on)
- Fit mode: contain (letterbox) or cover (crop)

### Branding (elf-inspired, no elf name)
- Primary: `#DF0714` (bold red-pink)
- Accent: `#FFB5CD` (pink), `#FFD2E1` (light pink)
- Background: white with subtle pink gradients
- Typography: system sans-serif (Inter/Futura-like), bold headings, clean body
- UI: minimal, modern, generous whitespace, rounded corners
- App name: "Image Scale Studio" or similar generic name

### Dual Deployment
- **Local:** `npm run dev` → http://localhost:3000
- **Snowflake App Runtime:** `snow app deploy --connection Demo462`
  - `next.config.ts`: `output: "standalone"` for containerized deployment
  - `app.yml`: `npm ci` install, `node .next/standalone/server.js` run
  - `snowflake.yml`: entity type `snowflake-app`, compute pool, warehouse

## Retailer Specs Research Note
The specific pixel dimensions for Walmart/Target product images are based on their standard marketplace seller requirements. These can be made configurable in the presets file if the user has different specs.
