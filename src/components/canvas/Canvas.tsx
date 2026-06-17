'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Element, ElementType, Point, ToolType, CursorPosition } from '@/types';
import { renderElement, drawGrid, chaikinSmooth } from '@/lib/renderer';
import { generateId, distance } from '@/lib/utils';
import { emitCursorMove } from '@/lib/peerClient';

function getCursorForTool(tool: ToolType, isLaser: boolean): string {
  if (isLaser) return 'none';
  switch (tool) {
    case ToolType.Selection: return 'default';
    case ToolType.Freedraw: return 'crosshair';
    case ToolType.Rectangle:
    case ToolType.Ellipse:
    case ToolType.Diamond: return 'crosshair';
    case ToolType.Arrow:
    case ToolType.Line: return 'crosshair';
    case ToolType.Text: return 'text';
    case ToolType.Eraser: return 'none';
    case ToolType.Hand: return 'grab';
    default: return 'default';
  }
}

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Persistent refs for performance — avoids re-renders on every frame
  const stateRef = useRef({
    elements: [] as Element[],
    zoom: 100, scrollX: 0, scrollY: 0,
    theme: 'light' as 'light' | 'dark',
    selectedElementIds: new Set<string>(),
    currentTool: ToolType.Selection,
    isLaserActive: false,
    laserDuration: 2000,
    laserWeight: 6,
    userId: '',
    userName: '',
    userColor: '#6965db',
    boardId: '',
  });

  // Resize handle state
  const RESIZE_HANDLE_SIZE = 8;
  type ResizeDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
  const resizeHandleRef = useRef<{ elId: string; dir: ResizeDir; startX: number; startY: number; startEl: { x: number; y: number; w: number; h: number } } | null>(null);

  // Interaction refs
  const drawingRef = useRef(false);
  const dragStartRef = useRef<Point | null>(null);
  const dragElementRef = useRef<string | null>(null);
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const freeDrawPointsRef = useRef<Point[]>([]);
  const eraserPathRef = useRef<Point[]>([]);
  const selectionRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const boxStartRef = useRef<Point | null>(null);
  const isPanningRef = useRef(false);
  const lastPointerDownRef = useRef<Point>({ x: 0, y: 0 });
  const lastToolRef = useRef<ToolType>(ToolType.Selection);
  const laserPathRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const mousePosRef = useRef<Point | null>(null);

  // Subscribe to store for reactive updates (elements changes)
  useEffect(() => {
    const unsub = useStore.subscribe((s) => {
      stateRef.current.elements = s.elements;
      stateRef.current.zoom = s.zoom;
      stateRef.current.scrollX = s.scrollX;
      stateRef.current.scrollY = s.scrollY;
      stateRef.current.theme = s.theme;
      stateRef.current.selectedElementIds = s.selectedElementIds;
      stateRef.current.currentTool = s.currentTool;
      stateRef.current.isLaserActive = s.isLaserActive;
      stateRef.current.laserDuration = s.laserDuration;
      stateRef.current.laserWeight = s.laserWeight;
      stateRef.current.userId = s.userId;
      stateRef.current.userName = s.userName;
      stateRef.current.userColor = s.userColor;
      stateRef.current.boardId = s.boardId || '';
      lastToolRef.current = s.currentTool;
    });
    return unsub;
  }, []);

  // Initialize from store
  useEffect(() => {
    const s = useStore.getState();
    stateRef.current.elements = s.elements;
    stateRef.current.zoom = s.zoom;
    stateRef.current.scrollX = s.scrollX;
    stateRef.current.scrollY = s.scrollY;
    stateRef.current.theme = s.theme;
    stateRef.current.selectedElementIds = s.selectedElementIds;
    stateRef.current.currentTool = s.currentTool;
    stateRef.current.isLaserActive = s.isLaserActive;
    stateRef.current.laserDuration = s.laserDuration;
    stateRef.current.laserWeight = s.laserWeight;
    stateRef.current.userId = s.userId;
    stateRef.current.userName = s.userName;
    stateRef.current.userColor = s.userColor;
    stateRef.current.boardId = s.boardId || '';
  }, []);

  // Remote cursors — sync from store to ref for rendering
  const [remoteCursors, setRemoteCursors] = useState<CursorPosition[]>([]);
  const cursorsDirtyRef = useRef(false);
  useEffect(() => {
    const unsub = useStore.subscribe((s) => {
      setRemoteCursors(s.cursors.filter(c => c.userId !== stateRef.current.userId));
    });
    return unsub;
  }, []);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const c = containerRef.current;
      const canvas = canvasRef.current;
      const bgCanvas = bgCanvasRef.current;
      if (!c || !canvas || !bgCanvas) return;
      const rect = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      bgCanvas.width = rect.width * dpr;
      bgCanvas.height = rect.height * dpr;
      bgCanvas.style.width = `${rect.width}px`;
      bgCanvas.style.height = `${rect.height}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // RAF render loop
  useEffect(() => {
    let rafId: number;
    let lastRender = 0;

    function render(timestamp: number) {
      rafId = requestAnimationFrame(render);
      // Throttle to ~30fps when nothing is changing, 60fps during active drawing
      const dt = timestamp - lastRender;
      if (dt < 16) return;
      lastRender = timestamp;

      const canvas = canvasRef.current;
      const bgCanvas = bgCanvasRef.current;
      if (!canvas || !bgCanvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const ctx = canvas.getContext('2d')!;
      const bgCtx = bgCanvas.getContext('2d')!;
      const w = rect.width;
      const h = rect.height;
      const st = stateRef.current;

      // Background + grid
      bgCtx.save();
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bgCtx.fillStyle = st.theme === 'dark' ? '#1e1e2e' : '#f8f9fa';
      bgCtx.fillRect(0, 0, w, h);
      drawGrid(bgCtx, w, h, st.scrollX, st.scrollY, st.zoom, st.theme === 'dark', 'dots');
      bgCtx.restore();

      // Elements
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const scale = st.zoom / 100;
      ctx.translate(st.scrollX, st.scrollY);
      ctx.scale(scale, scale);

      // Draw all non-deleted elements
      for (const el of st.elements) {
        if (!el.isDeleted) {
          renderElement(ctx, el, st.selectedElementIds.has(el.id));
        }
      }

      // Draw freedraw preview points (smoothed)
      if (freeDrawPointsRef.current.length >= 2) {
        const pts = chaikinSmooth(freeDrawPointsRef.current, 1);
        ctx.save();
        ctx.strokeStyle = useStore.getState().strokeColor;
        ctx.lineWidth = useStore.getState().strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = useStore.getState().opacity / 100;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Eraser trail preview
      if (eraserPathRef.current.length >= 3) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 16 / scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(eraserPathRef.current[0].x, eraserPathRef.current[0].y);
        for (let i = 1; i < eraserPathRef.current.length; i++) {
          ctx.lineTo(eraserPathRef.current[i].x, eraserPathRef.current[i].y);
        }
        ctx.stroke();
        // Inner brighter line
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.lineWidth = 24 / scale;
        ctx.beginPath();
        ctx.moveTo(eraserPathRef.current[0].x, eraserPathRef.current[0].y);
        for (let i = 1; i < eraserPathRef.current.length; i++) {
          ctx.lineTo(eraserPathRef.current[i].x, eraserPathRef.current[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Selection rectangle
      if (selectionRectRef.current) {
        const { x: sx, y: sy, w: sw, h: sh } = selectionRectRef.current;
        ctx.save();
        ctx.strokeStyle = '#6965db';
        ctx.lineWidth = 1 / scale;
        ctx.setLineDash([4 / scale, 4 / scale]);
        ctx.fillStyle = 'rgba(105, 101, 219, 0.08)';
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeRect(sx, sy, sw, sh);
        ctx.restore();
      }

      // Laser pointer — presentation highlighting tool with smooth fade
      const now = Date.now();
      const lw = st.laserWeight || 6;
      const ld = st.laserDuration || 2000;
      const activePoints = laserPathRef.current.filter(p => now - p.time < ld);
      laserPathRef.current = activePoints;
      if (activePoints.length >= 2) {
        // Draw the glowing trail — iterate segments with alpha based on age
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer glow pass — thick, faint
        for (let i = 0; i < activePoints.length - 1; i++) {
          const p = activePoints[i];
          const age = (now - p.time) / ld;
          const alpha = Math.max(0, 0.25 * (1 - age * age));
          const thickness = (lw * 2.5) / scale * (1 - age * 0.5);

          ctx.strokeStyle = `rgba(255, 40, 40, ${alpha})`;
          ctx.lineWidth = thickness;
          ctx.shadowColor = '#ff2222';
          ctx.shadowBlur = 25 / scale * (1 - age * 0.3);

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(activePoints[i + 1].x, activePoints[i + 1].y);
          ctx.stroke();
        }

        // Inner bright pass — thinner, brighter
        for (let i = 0; i < activePoints.length - 1; i++) {
          const p = activePoints[i];
          const age = (now - p.time) / ld;
          const alpha = Math.max(0, 0.9 * (1 - age * age));

          ctx.strokeStyle = i === activePoints.length - 2
            ? `rgba(255, 255, 200, ${Math.max(0.6, alpha)})`  // tip is yellow-white
            : `rgba(255, 80, 40, ${alpha})`;
          ctx.lineWidth = (lw / scale) * (1 - age * 0.4);
          ctx.shadowBlur = 0;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(activePoints[i + 1].x, activePoints[i + 1].y);
          ctx.stroke();
        }

        ctx.restore();

        // Bright spot at current position (the "laser dot")
        const last = activePoints[activePoints.length - 1];
        ctx.save();
        // Outer glow
        const gradient = ctx.createRadialGradient(last.x, last.y, 0, last.x, last.y, 12 / scale);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
        gradient.addColorStop(0.3, 'rgba(255, 100, 50, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 20 / scale;
        ctx.beginPath();
        ctx.arc(last.x, last.y, 12 / scale, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.shadowBlur = 8 / scale;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(last.x, last.y, 2.5 / scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Laser cursor overlay
      if (stateRef.current.isLaserActive && mousePosRef.current) {
        const mp = mousePosRef.current;
        ctx.save();
        // Laser crosshair
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.7)';
        ctx.lineWidth = 1.5 / scale;
        ctx.beginPath();
        ctx.arc(mp.x, mp.y, 6 / scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mp.x - 12 / scale, mp.y);
        ctx.lineTo(mp.x + 12 / scale, mp.y);
        ctx.moveTo(mp.x, mp.y - 12 / scale);
        ctx.lineTo(mp.x, mp.y + 12 / scale);
        ctx.stroke();
        // Center dot
        ctx.fillStyle = '#ff3333';
        ctx.shadowColor = '#ff2222';
        ctx.shadowBlur = 10 / scale;
        ctx.beginPath();
        ctx.arc(mp.x, mp.y, 2.5 / scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Tool cursor overlays
      if (stateRef.current.currentTool === ToolType.Eraser && mousePosRef.current) {
        const mp = mousePosRef.current;
          ctx.save();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
          ctx.lineWidth = 2 / scale;
          ctx.setLineDash([4 / scale, 3 / scale]);
          ctx.beginPath();
          ctx.arc(mp.x, mp.y, 12 / scale, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
          ctx.beginPath();
          ctx.arc(mp.x, mp.y, 12 / scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        
      }

      ctx.restore();
    }

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  function getCanvasPoint(e: React.PointerEvent): Point {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scale = stateRef.current.zoom / 100;
    return {
      x: (e.clientX - rect.left - stateRef.current.scrollX) / scale,
      y: (e.clientY - rect.top - stateRef.current.scrollY) / scale,
    };
  }

  function getResizeHandleAt(point: Point): { elId: string; dir: ResizeDir } | null {
    const elements = stateRef.current.elements;
    const selIds = stateRef.current.selectedElementIds;
    const scale = stateRef.current.zoom / 100;
    const hs = RESIZE_HANDLE_SIZE / scale;
    const hh = hs / 2;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.isDeleted || !selIds.has(el.id)) continue;
      const handles: [ResizeDir, number, number][] = [
        ['nw', el.x - hh, el.y - hh],
        ['n', el.x + el.width / 2 - hh, el.y - hh],
        ['ne', el.x + el.width - hh, el.y - hh],
        ['e', el.x + el.width - hh, el.y + el.height / 2 - hh],
        ['se', el.x + el.width - hh, el.y + el.height - hh],
        ['s', el.x + el.width / 2 - hh, el.y + el.height - hh],
        ['sw', el.x - hh, el.y + el.height - hh],
        ['w', el.x - hh, el.y + el.height / 2 - hh],
      ];
      for (const [dir, hx, hy] of handles) {
        if (point.x >= hx && point.x <= hx + hs && point.y >= hy && point.y <= hy + hs) {
          return { elId: el.id, dir };
        }
      }
    }
    return null;
  }

  function hitTest(point: Point): Element | null {
    const elements = stateRef.current.elements;
    // Iterate in reverse for top-most first
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.isDeleted) continue;
      if (
        point.x >= el.x && point.x <= el.x + el.width &&
        point.y >= el.y && point.y <= el.y + el.height
      ) {
        return el;
      }
    }
    return null;
  }

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const point = getCanvasPoint(e);
    const tool = stateRef.current.currentTool;
    lastPointerDownRef.current = { x: e.clientX, y: e.clientY };
    drawingRef.current = true;
    dragStartRef.current = point;
    if (stateRef.current.isLaserActive) {
      laserPathRef.current.push({ x: point.x, y: point.y, time: Date.now() });
    }

    // Store tool for space-bar restore
    useStore.setState({ selectedToolOnPointerDown: tool });

    if (e.button === 1 || tool === ToolType.Hand) {
      isPanningRef.current = true;
      return;
    }

    if (tool === ToolType.Eraser) {
      eraserPathRef.current = [point];
      return;
    }

    if (tool === ToolType.Selection) {
      // Check resize handle first
      const handleHit = getResizeHandleAt(point);
      if (handleHit) {
        const el = stateRef.current.elements.find(e => e.id === handleHit.elId);
        if (el) {
          resizeHandleRef.current = {
            elId: handleHit.elId,
            dir: handleHit.dir,
            startX: point.x,
            startY: point.y,
            startEl: { x: el.x, y: el.y, w: el.width, h: el.height },
          };
        }
        return;
      }
      const hit = hitTest(point);
      if (hit) {
        useStore.getState().clearSelection();
        useStore.getState().setSelectedElements(new Set([hit.id]));
        dragElementRef.current = hit.id;
        dragOffsetRef.current = { x: point.x - hit.x, y: point.y - hit.y };
      } else {
        useStore.getState().clearSelection();
        selectionRectRef.current = { x: point.x, y: point.y, w: 0, h: 0 };
        boxStartRef.current = point;
      }
      return;
    }

    if ([ToolType.Rectangle, ToolType.Ellipse, ToolType.Diamond, ToolType.Line, ToolType.Arrow].includes(tool)) {
      boxStartRef.current = point;
      return;
    }

    if (tool === ToolType.Freedraw) {
      freeDrawPointsRef.current = [point];
      return;
    }

    if (tool === ToolType.Text) {
      const id = generateId();
      const store = useStore.getState();
      const textEl: Element = {
        id, type: ElementType.Text, x: point.x, y: point.y,
        width: 200, height: 30, angle: 0,
        strokeColor: store.strokeColor, backgroundColor: 'transparent',
        fillStyle: 'solid', strokeWidth: 1, roughness: 0, opacity: store.opacity,
        points: [], text: '',
        fontFamily: store.fontFamily, fontSize: store.fontSize, textAlign: 'left',
        containerId: null, boundElements: [],
        isDeleted: false, groupIds: [], frameId: null,
        updatedAt: Date.now(), version: 1,
      };
      store.pushUndoStack();
      store.addElement(textEl);
      store.setEditingElement(id);
      store.setSelectedElements(new Set([id]));
      setEditingText('');
      setTextEditorPos({
        x: e.clientX - (canvasRef.current?.getBoundingClientRect().left || 0),
        y: e.clientY - (canvasRef.current?.getBoundingClientRect().top || 0),
      });
      setTimeout(() => textEditorRef.current?.focus(), 50);
      return;
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const point = getCanvasPoint(e);
    mousePosRef.current = point;

    if (!drawingRef.current && !isPanningRef.current && !stateRef.current.isLaserActive) return;
    const st = stateRef.current;
    const tool = st.currentTool;

    // Emit cursor position
    emitCursorMove({
      userId: st.userId, userName: st.userName, color: st.userColor,
      x: point.x, y: point.y,
      boardId: st.boardId,
      tool,
    });

    // Panning
    if (isPanningRef.current) {
      const dx = e.clientX - lastPointerDownRef.current.x;
      const dy = e.clientY - lastPointerDownRef.current.y;
      useStore.getState().setScroll(st.scrollX + dx, st.scrollY + dy);
      lastPointerDownRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Resize element
    if (resizeHandleRef.current) {
      const { elId, dir, startX, startY, startEl } = resizeHandleRef.current;
      const dx = point.x - startX;
      const dy = point.y - startY;
      let { x: ex, y: ey, w: ew, h: eh } = startEl;
      // Adjust based on drag direction
      if (dir.includes('w')) { ex = startEl.x + dx; ew = startEl.w - dx; }
      if (dir.includes('e')) { ew = startEl.w + dx; }
      if (dir.includes('n')) { ey = startEl.y + dy; eh = startEl.h - dy; }
      if (dir.includes('s')) { eh = startEl.h + dy; }
      // Enforce minimum size
      if (ew < 10) { ew = 10; if (dir.includes('w')) ex = startEl.x + startEl.w - 10; }
      if (eh < 10) { eh = 10; if (dir.includes('n')) ey = startEl.y + startEl.h - 10; }
      useStore.getState().updateElement(elId, { x: ex, y: ey, width: ew, height: eh });
      return;
    }

    // Drag element
    if (dragElementRef.current) {
      useStore.getState().updateElement(dragElementRef.current, {
        x: point.x - dragOffsetRef.current.x,
        y: point.y - dragOffsetRef.current.y,
      });
      return;
    }

    // Selection rectangle
    if (selectionRectRef.current && boxStartRef.current) {
      const sx = Math.min(boxStartRef.current.x, point.x);
      const sy = Math.min(boxStartRef.current.y, point.y);
      const sw = Math.abs(point.x - boxStartRef.current.x);
      const sh = Math.abs(point.y - boxStartRef.current.y);
      selectionRectRef.current = { x: sx, y: sy, w: sw, h: sh };

      const selected: string[] = [];
      for (const el of st.elements) {
        if (!el.isDeleted &&
            el.x + el.width >= sx && el.x <= sx + sw &&
            el.y + el.height >= sy && el.y <= sy + sh) {
          selected.push(el.id);
        }
      }
      useStore.getState().setSelectedElements(new Set(selected));
      return;
    }

    // Eraser path tracking
    if (tool === ToolType.Eraser) {
      eraserPathRef.current.push(point);
      return;
    }

    // Freedraw preview
    if (tool === ToolType.Freedraw) {
      freeDrawPointsRef.current.push(point);
      return;
    }

    // Laser pointer — add trail point on every move, but don't block other tools
    if (st.isLaserActive) {
      laserPathRef.current.push({ x: point.x, y: point.y, time: Date.now() });
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const isLaser = stateRef.current.isLaserActive;
    if (!drawingRef.current && !isPanningRef.current && !dragElementRef.current && !boxStartRef.current && !isLaser) return;

    const point = getCanvasPoint(e);
    const wasPanning = isPanningRef.current;
    const wasDragging = !!dragElementRef.current;
    const wasResizing = !!resizeHandleRef.current;

    isPanningRef.current = false;
    drawingRef.current = false;

    if (wasResizing) {
      useStore.getState().pushUndoStack();
      resizeHandleRef.current = null;
      dragStartRef.current = null;
      return;
    }

    if (wasPanning) {
      dragStartRef.current = null;
      return;
    }

    if (wasDragging && dragElementRef.current) {
      useStore.getState().pushUndoStack();
      dragElementRef.current = null;
      dragStartRef.current = null;
      return;
    }

    if (selectionRectRef.current && boxStartRef.current) {
      selectionRectRef.current = null;
      boxStartRef.current = null;
      dragStartRef.current = null;
      return;
    }

    const tool = stateRef.current.currentTool;
    const store = useStore.getState();

    // Eraser stroke — delete any element whose stroke intersects the eraser path
    if (tool === ToolType.Eraser && eraserPathRef.current.length >= 2) {
      const path = eraserPathRef.current;
      const elements = store.elements;
      const toDelete: string[] = [];
      const threshold = 12; // px threshold for stroke hit

      for (const el of elements) {
        if (el.isDeleted) continue;

        if (el.type === ElementType.Freedraw && el.points.length >= 2) {
          // For freedraw: check if eraser path comes close to any stroke point
          let hit = false;
          for (const ep of el.points) {
            for (const pp of path) {
              if (Math.abs(pp.x - ep.x) < threshold && Math.abs(pp.y - ep.y) < threshold) {
                hit = true;
                break;
              }
            }
            if (hit) break;
          }
          if (hit) { toDelete.push(el.id); continue; }
        }

        // For shapes and text: check against element bounding box with tighter threshold
        const elBox = { x: el.x - threshold, y: el.y - threshold, w: el.width + threshold * 2, h: el.height + threshold * 2 };
        for (const p of path) {
          if (p.x >= elBox.x && p.x <= elBox.x + elBox.w && p.y >= elBox.y && p.y <= elBox.y + elBox.h) {
            toDelete.push(el.id);
            break;
          }
        }
      }

      if (toDelete.length > 0) {
        store.pushUndoStack();
        store.deleteElements(toDelete);
      }
    }

    // Shape creation
    if (boxStartRef.current && (
      [ToolType.Rectangle, ToolType.Ellipse, ToolType.Diamond, ToolType.Line, ToolType.Arrow].includes(tool)
    )) {
      const start = boxStartRef.current;
      const x = Math.min(start.x, point.x);
      const y = Math.min(start.y, point.y);
      const w = Math.max(1, Math.abs(point.x - start.x));
      const h = Math.max(1, Math.abs(point.y - start.y));

      const typeMap: Record<string, ElementType> = {
        [ToolType.Rectangle]: ElementType.Rectangle,
        [ToolType.Ellipse]: ElementType.Ellipse,
        [ToolType.Diamond]: ElementType.Diamond,
        [ToolType.Arrow]: ElementType.Arrow,
        [ToolType.Line]: ElementType.Line,
      };

      const elType = typeMap[tool] || ElementType.Rectangle;
      const id = generateId();
      const pts: Point[] = elType === ElementType.Arrow || elType === ElementType.Line
        ? [{ x: start.x, y: start.y }, { x: point.x, y: point.y }]
        : [];

      const el: Element = {
        id, type: elType, x, y, width: w, height: h, angle: 0,
        strokeColor: store.strokeColor, backgroundColor: store.backgroundColor,
        fillStyle: store.fillStyle, strokeWidth: store.strokeWidth,
        roughness: store.roughness, opacity: store.opacity,
        points: pts, text: '', fontFamily: store.fontFamily,
        fontSize: store.fontSize, textAlign: 'left',
        containerId: null, boundElements: [],
        isDeleted: false, groupIds: [], frameId: null,
        updatedAt: Date.now(), version: 1,
      };

      store.pushUndoStack();
      store.addElement(el);
    }

    // Freedraw finish — no selection outline
    if (tool === ToolType.Freedraw && freeDrawPointsRef.current.length >= 2) {
      const pts = chaikinSmooth(freeDrawPointsRef.current, 2);
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of pts) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }

      const id = generateId();
      const el: Element = {
        id, type: ElementType.Freedraw,
        x: minX, y: minY,
        width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY),
        angle: 0, strokeColor: store.strokeColor, backgroundColor: 'transparent',
        fillStyle: 'none', strokeWidth: store.strokeWidth,
        roughness: store.roughness, opacity: store.opacity,
        points: pts, text: '', fontFamily: store.fontFamily,
        fontSize: store.fontSize, textAlign: 'left',
        containerId: null, boundElements: [],
        isDeleted: false, groupIds: [], frameId: null,
        updatedAt: Date.now(), version: 1,
      };

      store.pushUndoStack();
      store.addElement(el);
    }

    boxStartRef.current = null;
    dragStartRef.current = null;
    freeDrawPointsRef.current = [];
    eraserPathRef.current = [];

    // Auto-deselect selection tool → switch back to freedraw/pen
    if (tool === ToolType.Selection && !wasDragging) {
      // keep as selection
    }
  }, []);

  // Text editing state
  const [editingText, setEditingText] = useState('');
  const textEditorRef = useRef<HTMLTextAreaElement>(null);
  const [textEditorPos, setTextEditorPos] = useState({ x: 0, y: 0 });

  // Double-click to edit text
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e as unknown as React.PointerEvent);
    const hit = hitTest(point);
    if (hit && hit.type === ElementType.Text) {
      const store = useStore.getState();
      store.setSelectedElements(new Set([hit.id]));
      store.setEditingElement(hit.id);
      setEditingText(hit.text);
      setTextEditorPos({
        x: e.clientX - (canvasRef.current?.getBoundingClientRect().left || 0),
        y: e.clientY - (canvasRef.current?.getBoundingClientRect().top || 0),
      });
      setTimeout(() => textEditorRef.current?.focus(), 50);
    }
  }, []);

  function commitTextEdit() {
    const store = useStore.getState();
    const editingId = store.editingElementId;
    if (editingId && editingText.trim()) {
      store.pushUndoStack();
      store.updateElement(editingId, { text: editingText });
    }
    store.setEditingElement(null);
    setEditingText('');
  }

  // Keyboard handlers
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const st = useStore.getState();
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) st.redo();
            else st.undo();
            break;
          case 'y':
            e.preventDefault();
            st.redo();
            break;
          case 'a':
            // Select all
            e.preventDefault();
            st.setSelectedElements(new Set(st.elements.filter(el => !el.isDeleted).map(el => el.id)));
            break;
          case '=':
          case '+': e.preventDefault(); st.setZoom(st.zoom + 10); break;
          case '-': e.preventDefault(); st.setZoom(st.zoom - 10); break;
          case '0': e.preventDefault(); st.setZoom(100); st.setScroll(0, 0); break;
          case 'd': e.preventDefault(); if (!isInput) st.duplicateElements([...st.selectedElementIds]); break;
        }
      } else if (!isInput) {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            if (st.selectedElementIds.size > 0) {
              st.pushUndoStack();
              st.deleteElements([...st.selectedElementIds]);
            }
            break;
          case 'v': st.setCurrentTool(ToolType.Selection); break;
          case 'r': st.setCurrentTool(ToolType.Rectangle); break;
          case 'e': st.setCurrentTool(ToolType.Ellipse); break;
          case 'd': st.setCurrentTool(ToolType.Diamond); break;
          case 'a': st.setCurrentTool(ToolType.Arrow); break;
          case 'l': st.setCurrentTool(ToolType.Line); break;
          case 'f': st.setCurrentTool(ToolType.Freedraw); break;
          case 't': st.setCurrentTool(ToolType.Text); break;
          case 'x': st.setCurrentTool(ToolType.Eraser); break;
          case 'h':
          case ' ':
            e.preventDefault();
            st.setCurrentTool(ToolType.Hand);
            break;
          case 'Escape': st.clearSelection(); break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'h') {
        const st = useStore.getState();
        st.setCurrentTool(st.selectedToolOnPointerDown || ToolType.Selection);
      }
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  // Wheel zoom — at mouse position, ~35% per tick
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const st = useStore.getState();
        const scale = st.zoom / 100;

        // Get mouse position relative to container
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Canvas point under mouse at current zoom
        const canvasX = (mouseX - st.scrollX) / scale;
        const canvasY = (mouseY - st.scrollY) / scale;

        // New zoom (35% per tick, clamped)
        const zoomFactor = e.deltaY > 0 ? 0.65 : 1.35; // scroll down = zoom out
        const newZoom = Math.max(10, Math.min(500, st.zoom * zoomFactor));
        const newScale = newZoom / 100;

        // Adjust scroll so the point under mouse stays fixed
        const newScrollX = mouseX - canvasX * newScale;
        const newScrollY = mouseY - canvasY * newScale;

        useStore.getState().setZoom(newZoom);
        useStore.getState().setScroll(newScrollX, newScrollY);
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div ref={containerRef} className="canvas-container relative w-full h-full overflow-hidden">
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 pointer-events-none"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={{ cursor: getCursorForTool(stateRef.current.currentTool, stateRef.current.isLaserActive) }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      />

      {/* Text editing overlay */}
      {(() => {
        const st = useStore.getState();
        const editingId = st.editingElementId;
        const editingEl = editingId ? st.elements.find(el => el.id === editingId) : null;
        if (!editingEl) return null;
        return (
          <textarea
            ref={textEditorRef}
            value={editingText}
            onChange={e => setEditingText(e.target.value)}
            onBlur={commitTextEdit}
            onKeyDown={e => {
              if (e.key === 'Escape') { commitTextEdit(); }
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitTextEdit(); }
            }}
            className="absolute z-50 bg-transparent outline-none border-2 border-blue-500 rounded p-0 resize-none overflow-hidden"
            style={{
              left: textEditorPos.x,
              top: textEditorPos.y,
              fontFamily: editingEl.fontFamily || st.fontFamily,
              fontSize: editingEl.fontSize || st.fontSize,
              color: editingEl.strokeColor || st.strokeColor,
              minWidth: 100,
              minHeight: 30,
              lineHeight: 1.3,
              whiteSpace: 'pre-wrap',
            }}
          />
        );
      })()}

      {/* Remote cursors overlay */}
      {remoteCursors.map(cursor => {
        const st = stateRef.current;
        const scale = st.zoom / 100;
        const screenX = cursor.x * scale + st.scrollX;
        const screenY = cursor.y * scale + st.scrollY;
        return (
          <div
            key={cursor.userId}
            className="remote-cursor"
            style={{
              left: screenX,
              top: screenY,
              transition: 'left 0.08s linear, top 0.08s linear',
            }}
          >
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
              <path d="M2 2L12 14H8L6 18L4 14H2L2 2Z" fill={cursor.color || '#6965db'} stroke="white" strokeWidth="1.5"/>
            </svg>
            <span
              className="remote-cursor-label"
              style={{ background: cursor.color || '#6965db' }}
            >
              {cursor.userName || 'User'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
