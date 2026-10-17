# tools local

<p align="center">
  <img src="public/icon.svg" width="84" height="84" alt="tools local logo" />
</p>

<p align="center">
  <strong>100% Client-Side Offline Image Privacy & Watermark Toolbox</strong><br>
  Zero network uploads · Pure in-browser rendering · Complete offline functionality
</p>

<p align="center">
  <a href="README.md"><strong>English</strong></a> · <a href="README.zh-CN.md"><strong>简体中文</strong></a>
</p>

---

## 🌟 Overview

**tools local** is a modern, high-performance, and privacy-first local image utility suite built for developers, photographers, businesses, and everyday users. All image processing—watermarking, redacting, EXIF stripping, screenshot trimming, and identity copy generation—takes place **100% inside your browser memory** using HTML5 Canvas 2D and modern Web APIs.

No images or metadata are ever transmitted to any external server. You can safely disconnect your internet or use it in airplane mode without any loss of functionality.

---

## 🚀 Key Modules

### 1. Image Watermark Studio (`/watermark`)
- **Full Text & Layout Control**: Multi-line custom text, dynamic macros (`{{date}}`, `{{time}}`, `{{filename}}`), and one-click legal disclaimers.
- **Smart Tiling & 9-Grid Positioning**: 50% staggered brick layout (anti-crop protection) and 9-grid anchor positioning with precise pixel offsets.
- **Visual Stylization**: Real-time opacity adjustment (0–100%), custom outline stroke (to ensure white text remains readable on white images), drop shadows with 3D depth, and blend modes (`Screen`, `Overlay`, `Soft Light`, `Multiply`, `Difference`).
- **Batch Processing**: Drag-and-drop multiple images, clipboard paste (`Cmd/Ctrl + V`), filmstrip queue management, and concurrent ZIP export.
- **One-Click Presets**: Tiled anti-counterfeiting, KYC certificate stamp, photographer watermark, center sample stamp, and high-density security grid.

### 2. Privacy Redaction Studio (`/redact`)
- **Dual Selection Tools**: Precise rectangular marquee selection and freehand brush drawing.
- **Three Irreversible Redaction Effects**:
  - **Pixelate Mosaic**: Adjustable block size (6px to 36px).
  - **Hardware Gaussian Blur**: Smooth gradient blur radius (6px to 40px).
  - **Solid Color Fill**: Pure black, white, slate gray, and warning red.
- **Non-Destructive Workflow**: Undo history (`Cmd/Ctrl + Z`), canvas clear, hold-to-compare original preview, and pixel-level permanent burn-in on export.

### 3. Photo EXIF & GPS Cleaner (`/exif`)
- **Full Binary Inspection**: Deep inspection of raw EXIF tags using `exifr` without uploading files.
- **Automated Risk Assessment**: Flags high-precision GPS coordinates (latitude, longitude, altitude), camera device models, lens specs, and exact timestamps.
- **Zero-Loss Scrubbing**: Strips all sensitive metadata tags by re-encoding via HTML5 Canvas.
- **Batch Stripping**: One-click bulk stripping and automatic packaging into a clean ZIP archive.

### 4. Screenshot Privacy Trimmer (`/screenshot`)
- **One-Click Smart Crop Presets**:
  - Trim iOS Dynamic Island / notch status bar and Android status bar.
  - Trim bottom system navigation bar (Home Bar).
  - Trim browser top bar (hides active URL tabs and personal bookmarks).
- **Fine-Tuning Margin Sliders**: Independent pixel-level controls for top, bottom, left, and right margins.
- **One-Click Masking**: Click anywhere on the screenshot to instantly stamp circular avatar blur or username redaction bars.

### 5. ID Certified Copy Studio (`/id-copy`)
- **Document Protection**: Tailored for identity cards, driver's licenses, passports, and permits.
- **Sensitive Field Redaction**: Toggle switches to mask the last 4 digits of ID numbers, street/apartment address details, or birthdates.
- **Mandatory Purpose Watermark**: Automatically overlays legal protection text: *"For [Purpose] with [Organization] only. Valid until YYYY-MM-DD. Copies and other uses strictly prohibited."*
- **A4 Dual-Sided Print Sheet**: Generates an official standard A4 compliance layout with front and back sides positioned with formal disclaimers.

---

## ⌨️ Desktop Shortcuts & Gestures

| Shortcut / Gesture | Action |
|---|---|
| `Cmd / Ctrl + V` | Paste image or screenshot directly from clipboard |
| `Cmd / Ctrl + S` | Download / save currently processed image |
| `Cmd / Ctrl + Z` | Undo last redaction or mask |
| `Mouse Wheel` | Smooth zoom in and out (10% to 400%) |
| `Left Mouse Drag` | Pan and navigate high-resolution canvas |
| `C` (Hold) | Hold to temporarily compare with original image |
| `Double Click` | Reset viewport zoom to 100% and center canvas |
| `Esc` | Close active dialog or modal |

---

## 🌐 Internationalization (i18n)

Full English and Simplified Chinese localization is supported out-of-the-box:
- **Instant Language Switching**: Toggle between `EN` and `中` in the top header with zero page reload.
- **Auto-Detection**: Defaults to your system/browser language preference (`navigator.language`).
- **Persistent State**: User language preference is stored locally via Zustand localStorage persistence.
- **Complete Type-Safety**: Strictly typed schema in `src/i18n/types.ts` ensuring all keys exist in both locales.

---

## 🛠️ Tech Stack & Architecture

- **Frontend Core**: [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/) (fast HMR and optimized chunk splitting)
- **Styling & UI**: [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) design system, CSS custom variables
- **State Management**: [Zustand 5](https://zustand-demo.pmnd.rs/) with localStorage persistence
- **Routing**: [Wouter](https://github.com/molefrog/wouter) lightweight hash/path routing
- **Code Editor**: [CodeMirror 6](https://codemirror.net/) with JSON syntax highlighting and dark mode
- **Metadata & Compression**: [exifr](https://github.com/MikeKovarik/exifr) for binary EXIF inspection, [JSZip](https://stuk.github.io/jszip/) for in-browser concurrent archiving
- **Testing**: [Vitest](https://vitest.dev/), [@testing-library/react](https://testing-library.com/), [Playwright](https://playwright.dev/)

---

## 🖥️ Desktop application

The app supports Tauri 2 desktop builds for macOS and Windows, with native Save As dialogs and bundled fonts.

```bash
npm run desktop:dev                   # Start the native application
npm run desktop:build:mac -- --ci      # macOS .app and .dmg (run on a Mac)
npm run desktop:build:win -- --ci      # Windows setup.exe (run on Windows)
```

Install Rust and the platform build tools first. See the [desktop build guide](docs/desktop.md) for prerequisites, output paths, CI builds and signing. Test builds are not signed for public distribution.

---

## 💻 Development & Build

### Prerequisites
- Node.js 20 or 22 (`nvm use 22`)
- npm 10+

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/tools_with_local.git
cd tools_with_local

# Install dependencies
npm install

# Start development server
npm run dev
# -> Local server running at http://localhost:3000/

# Run Vitest test suite
npm test

# Build production bundle with TypeScript checking
npm run build
```

---

## 🔒 Privacy & Security Guarantee

1. **Zero External API Calls**: The application makes no telemetry, analytics, or file upload network requests.
2. **In-Memory Rendering**: Files are read via the standard Web `FileReader` and rendered directly on an HTML5 `<canvas>`.
3. **Irreversible Redactions**: Redacted regions have their underlying pixel values permanently modified. Unlike PDF shape annotations, pixel values cannot be recovered by removing layers.

---

## 📄 License

MIT License © 2026 tools local contributors.
