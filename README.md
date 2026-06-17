# ✦ NoteForge

> A sketchy whiteboard for diagrams, doodles, and ideas — built by **Sparsh Singhal**.

NoteForge is a real-time collaborative whiteboard that lives in your browser. Think Excalidraw meets a notebook: hand-drawn-style shapes, pressure-sensitive pens, image import with local audio transcription, P2P collaboration via PeerJS, and a glass-morphism UI that looks good doing it. No signup, no server, no nonsense.

**[Live Demo]([https://noteforge.vercel.app](https://noteforge.sparshlike.eu.org/))** &nbsp;·&nbsp; [Report Bug](https://github.com/singhalsparsh/noteforge/issues) &nbsp;·&nbsp; [Request Feature](https://github.com/singhalsparsh/noteforge/issues)

---

## ✨ Features

### 🖌️ Canvas & Drawing

| Feature | Description |
|---|---|
| **9 Pen Types** | Fountain, Ball, Pencil, Brush, Fine Tip, Highlighter, Marker, Calligraphy, Laser pointer |
| **Pressure Sensitivity** | Pointer Events API — works with stylus and touch |
| **Shape Tools** | Rectangle, Circle, Diamond, Arrow, Line, Freedraw — all hand-drawn rough style |
| **Smart Text** | Double-click to edit inline, font family picker (Virgil, Helvetica, Cascadia, Excalifont), size, alignment |
| **Resize Handles** | 8-directional drag handles on any selected element |
| **Eraser** | Stroke-intersection based — swipe through what you want to erase |
| **Image Import** | Paste or upload images onto the canvas (PNG/JPG, max 5MB) |
| **Zoom & Pan** | Up to 500% zoom with smooth pan, scroll-wheel zoom, reset button |
| **Undo / Redo** | Full state history with Ctrl+Z / Ctrl+Y |
| **Custom Cursors** | Each tool gets its own pen-like cursor |

### 🎨 Marketplace (Library)

A built-in asset panel with three tabs:

- **Shapes** — 12 pre-built draggable elements: basic shapes, cards, sticky notes, stars, clouds, flags
- **Images** — Upload and manage imported images; drop them onto the canvas
- **Audio** — Upload audio files (max 10MB) and get **local transcriptions** using the Web Speech API — no data leaves your machine

### 🤝 Real-Time Collaboration

NoteForge uses a **PeerJS star topology** — one peer hosts, others connect directly:

- **Live cursors** — see where others are pointing in real time
- **Element sync** — version-based merging (no overwrites)
- **Built-in chat** — text and image sharing with content moderation
- **Auto-reconnect** — up to 3 retries with exponential backoff
- **Share dialog** — copy a link with optional expiry (1h / 24h / 7d / 30d / never)

### 🔐 Content Moderation

All user-generated content is filtered through a multi-language blocklist covering **English, Hindi, and Hinglish** vulgar terms:

- Chat messages — blocked content is replaced with `[Content moderated]`
- User names — vulgar names are blocked with a warning
- File uploads — hard limits: images 5MB, audio 10MB

### 📤 Export

| Format | Details |
|---|---|
| **PDF** | Vector export via jsPDF + html2canvas |
| **PNG** | High-resolution image export |
| **SVG** | Vector graphics export |

### 🌗 UI / UX

- **Glass morphism** — backdrop-blur panels, frosted toolbars, subtle borders
- **Dark / Light mode** — one-click toggle, persists across sessions
- **Fully responsive** — works on desktop, tablet, and mobile
- **Keyboard shortcuts** — full navigation without touching the mouse
- **Bulk delete** — multi-select boards on the homepage and delete in one go
- **Auto-save** — every 3 seconds to IndexedDB

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/singhalsparsh/noteforge.git
cd noteforge

# Install
npm install

# Development
npm run dev

# Open
open http://localhost:3000
