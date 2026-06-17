# NoteForge Project Guide

## Overview
NoteForge is a canvas-based note-taking web application with real-time collaboration. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm start` - Start production server

## Project Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components (canvas, editor, notebook, collaboration, ui)
- `src/lib/` - Core libraries (canvas engine, database, websocket, utilities)
- `src/store/` - Zustand state management
- `src/types/` - TypeScript type definitions

## Key Architecture Decisions
- **No authentication required** - Anonymous local-first usage
- **IndexedDB for storage** - Local persistence without a server
- **Canvas API for rendering** - Custom rendering engine for pen strokes
- **Socket.io** with polling fallback for Vercel-compatible real-time
- **Zustand** for state management (simple, performant)
- **Glass morphism** design with dark/light mode

## Build & Deploy
- Build: `npm run build`
- Deploy: Push to GitHub, import in Vercel
- No external database required for basic usage
- Environment variables in `.env.local` for customization

## Canvas Engine
The canvas engine (`src/lib/canvasEngine.ts`) handles:
- 9 pen types with distinct rendering (fountain, ball, pencil, brush, fine-tip, highlighter, marker, calligraphy, laser)
- Pressure sensitivity via Pointer Events API
- Multiple paper types (blank, lined, grid, dot-grid, music, calligraphy)
- Shape rendering (rect, circle, triangle, line, arrow, star, heart, polygon, bezier)
- Stroke smoothing with stabilization
- Image and text rendering
- Full scene rendering with layering
