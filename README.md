# ✦ NoteForge

> A sketchy whiteboard for diagrams, doodles, and ideas — built by **Sparsh Singhal**.

NoteForge is a real-time collaborative whiteboard that lives in your browser. Think Excalidraw meets a notebook: hand-drawn-style shapes, pressure-sensitive pens, image import with local audio transcription, P2P collaboration via PeerJS, and a glass-morphism UI that looks good doing it. No signup, no server, no nonsense.

**[Live Demo](https://noteforge.vercel.app)** &nbsp;·&nbsp; [Report Bug](https://github.com/sparshsinghal/noteforge/issues) &nbsp;·&nbsp; [Request Feature](https://github.com/sparshsinghal/noteforge/issues)

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
git clone https://github.com/sparshsinghal/noteforge.git
cd noteforge

# Install
npm install

# Development
npm run dev

# Open
open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

---

## 🗂️ Project Structure

```
noteforge/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Homepage — board list, bulk delete
│   │   ├── layout.tsx                  # Root layout + theme provider
│   │   ├── board/[id]/page.tsx         # Canvas board page
│   │   ├── docs/page.tsx               # Documentation
│   │   └── api/
│   │       ├── notebooks/route.ts      # Notebook CRUD API
│   │       └── socket/route.ts         # Socket.io endpoint
│   ├── components/
│   │   ├── canvas/
│   │   │   └── Canvas.tsx              # Main canvas — pointer events, RAF render, text overlay
│   │   ├── toolbar/
│   │   │   ├── MainToolbar.tsx         # Bottom toolbar — tools, styles, settings
│   │   │   ├── TopBar.tsx              # Top navigation bar with user name
│   │   │   ├── MarketplacePanel.tsx    # Shapes / Images / Audio marketplace
│   │   │   └── LibraryPanel.tsx        # Legacy library (kept for reference)
│   │   ├── collaboration/
│   │   │   ├── ShareDialog.tsx         # Share link + expiry UI
│   │   │   ├── ChatPanel.tsx           # Real-time chat with moderation
│   │   ├── editor/
│   │   │   └── ExportDialog.tsx        # PDF / PNG / SVG export modal
│   │   └── ui/
│   │       └── DeleteConfirmModal.tsx  # Reusable confirmation modal
│   ├── store/
│   │   └── useStore.ts                 # Zustand store — all app state
│   ├── lib/
│   │   ├── canvasEngine.ts             # Canvas rendering engine (9 pen types)
│   │   ├── renderer.ts                 # Element rendering — shapes, text, images, selection
│   │   ├── database.ts                 # IndexedDB wrapper for local persistence
│   │   ├── peerClient.ts               # PeerJS client — P2P mesh networking
│   │   ├── usePeerCollaboration.ts     # React hook — collaborator lifecycle
│   │   ├── useCollaboration.ts         # Socket.io collaboration hook (legacy)
│   │   ├── socket.ts                   # Socket.io client
│   │   ├── websocket-server.ts         # WebSocket server
│   │   ├── moderation.ts              # Content moderation (English/Hindi/Hinglish)
│   │   └── utils.ts                    # generateId, debounce, color utilities
│   └── types/
│       └── index.ts                    # TypeScript types — Element, Board, ToolType, etc.
├── public/
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js](https://nextjs.org/) 16.2 (App Router) |
| **UI Library** | [React](https://react.dev/) 19 |
| **Language** | [TypeScript](https://www.typescriptlang.org/) 5 |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) 3.4 |
| **State** | [Zustand](https://github.com/pmndrs/zustand) |
| **Canvas** | HTML5 Canvas 2D API (custom rendering engine) |
| **P2P** | [PeerJS](https://peerjs.com/) 1.5 (cloud signaling) |
| **Realtime (legacy)** | [Socket.io](https://socket.io/) 4 (polling fallback) |
| **Storage** | IndexedDB (via custom wrapper) |
| **Export** | [jsPDF](https://github.com/parallax/jsPDF) 2.5 + [html2canvas](https://html2canvas.hertzen.com/) 1.4 |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **QR** | [qrcode.react](https://github.com/zpao/qrcode.react) 3.1 |
| **Transcription** | Web Speech API (SpeechRecognition, client-side only) |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl++` / `Ctrl+=` | Zoom In |
| `Ctrl+-` | Zoom Out |
| `Ctrl+0` | Reset Zoom |
| `1` — `9` | Select tool |
| `Escape` | Deselect / Cancel |
| `Delete` / `Backspace` | Delete selected |
| `Ctrl+D` | Duplicate selected |

---

## 🌐 Deploy to Vercel

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/sparshsinghal/noteforge.git
git push -u origin main

# Import at https://vercel.com/new
# Framework preset: Next.js
# No database setup needed — everything runs client-side
```

Environment variables (all optional):
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SOCKET_URL` | Custom Socket.io server URL |
| `NEXT_PUBLIC_PEER_HOST` | Custom PeerJS signaling host |
| `NEXT_PUBLIC_PEER_PORT` | Custom PeerJS signaling port |

---

## 📄 License

MIT — feel free to use, modify, and share.

---

<p align="center">
  Made with ☕ and rough.js by <strong>Sparsh Singhal</strong><br>
  <sub>Built with Next.js · React · TypeScript · PeerJS · Tailwind CSS · Zustand</sub>
</p>
