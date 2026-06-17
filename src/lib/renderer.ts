// ============================================================
// NoteForge - Hand-drawn Rough Rendering Engine
// Inspired by rough.js — renders shapes with a sketchy look
// ============================================================

import { Element, ElementType, Point, FillStyle } from '@/types';

// Seeded random for reproducible wobble
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function perpendicularOffset(
  x1: number, y1: number, x2: number, y2: number,
  offset: number
): [number, number] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.001) return [0, 0];
  return [(-dy / len) * offset, (dx / len) * offset];
}

// === ROUGH LINE ===
export function roughLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  strokeColor: string, strokeWidth: number, roughness: number = 1,
  opacity: number = 100
) {
  ctx.save();
  ctx.globalAlpha = opacity / 100;
  const rng = seededRandom(Math.floor(x1 + y1 + x2 + y2));
  const wobble = roughness * 2;
  const numStrokes = roughness > 1.5 ? 2 : 1;

  for (let s = 0; s < numStrokes; s++) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth + (s === 1 ? 0.3 : 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const steps = Math.max(4, Math.floor(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 5));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = lerp(x1, x2, t) + (rng() - 0.5) * wobble * (s + 1) * 0.5;
      const y = lerp(y1, y2, t) + (rng() - 0.5) * wobble * (s + 1) * 0.5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Add micro-wobble second pass for roughness
    if (roughness > 1) {
      ctx.globalAlpha = 0.3 * (opacity / 100);
      ctx.lineWidth = strokeWidth * 0.3;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = lerp(x1, x2, t) + (rng() - 0.5) * wobble * 1.5;
        const y = lerp(y1, y2, t) + (rng() - 0.5) * wobble * 1.5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

// === ROUGH RECTANGLE ===
export function roughRectangle(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  strokeColor: string, fillColor: string, fillStyle: FillStyle,
  strokeWidth: number, roughness: number = 1, opacity: number = 100,
  angle: number = 0
) {
  ctx.save();
  ctx.globalAlpha = opacity / 100;

  if (angle) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(angle);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }

  const rng = seededRandom(Math.floor(x * 7 + y * 13 + w * 3 + h * 5));
  const wobble = roughness * 2.5;
  const corners: [number, number][] = [
    [x, y], [x + w, y], [x + w, y + h], [x, y + h],
  ];

  // Fill
  if (fillColor && fillColor !== 'transparent') {
    drawFill(ctx, corners, fillColor, fillStyle, roughness, rng);
  }

  // Outline (multiple sketchy strokes)
  const numStrokes = roughness >= 2 ? 3 : 2;
  for (let s = 0; s < numStrokes; s++) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth + (s * 0.5);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const perturbed = corners.map(([cx, cy], i) => {
      if (i === 0 && numStrokes > 1) return [cx, cy];
      return [
        cx + (rng() - 0.5) * wobble * (s + 1) * 0.4,
        cy + (rng() - 0.5) * wobble * (s + 1) * 0.4,
      ] as [number, number];
    });

    ctx.moveTo(perturbed[0][0], perturbed[0][1]);
    for (let i = 1; i <= 4; i++) {
      const [px, py] = perturbed[i % 4];
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  ctx.restore();
}

// === ROUGH ELLIPSE ===
export function roughEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, rx: number, ry: number,
  strokeColor: string, fillColor: string, fillStyle: FillStyle,
  strokeWidth: number, roughness: number = 1, opacity: number = 100,
  angle: number = 0
) {
  ctx.save();
  ctx.globalAlpha = opacity / 100;

  if (angle) {
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.translate(-cx, -cy);
  }

  const rng = seededRandom(Math.floor(cx * 7 + cy * 13 + rx * 3));
  const wobble = roughness * 2;

  // Fill
  if (fillColor && fillColor !== 'transparent') {
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = opacity / 100;
    if (fillStyle === 'solid') {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Generate approximate polygon for fill patterns
      const steps = 20;
      const pts: [number, number][] = [];
      for (let i = 0; i < steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        pts.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
      }
      drawFill(ctx, pts, fillColor, fillStyle, roughness, rng);
    }
  }

  // Outline (rough ellipse with wobble)
  const numStrokes = roughness >= 2 ? 3 : 2;
  for (let s = 0; s < numStrokes; s++) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth + (s * 0.3);
    ctx.beginPath();

    const steps = Math.max(12, Math.floor(Math.PI * 2 * Math.max(rx, ry) / 4));
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const px = cx + rx * Math.cos(t);
      const py = cy + ry * Math.sin(t);
      const wx = (rng() - 0.5) * wobble * (s + 1) * 0.3;
      const wy = (rng() - 0.5) * wobble * (s + 1) * 0.3;

      if (i === 0) ctx.moveTo(px + wx, py + wy);
      else ctx.lineTo(px + wx, py + wy);
    }
    ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
}

// === ROUGH DIAMOND ===
export function roughDiamond(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  strokeColor: string, fillColor: string, fillStyle: FillStyle,
  strokeWidth: number, roughness: number = 1, opacity: number = 100,
  angle: number = 0
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const corners: [number, number][] = [
    [cx, y], [x + w, cy], [cx, y + h], [x, cy],
  ];
  drawRoughPolygon(ctx, corners, strokeColor, fillColor, fillStyle, strokeWidth, roughness, opacity, angle);
}

// === ROUGH POLYGON (arrows, lines, freehand) ===
export function roughPolygon(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  strokeColor: string, fillColor: string, fillStyle: FillStyle,
  strokeWidth: number, roughness: number = 1, opacity: number = 100,
  angle: number = 0
) {
  drawRoughPolygon(ctx, points, strokeColor, fillColor, fillStyle, strokeWidth, roughness, opacity, angle);
}

function drawRoughPolygon(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  strokeColor: string, fillColor: string, fillStyle: FillStyle,
  strokeWidth: number, roughness: number = 1, opacity: number = 100,
  angle: number = 0
) {
  if (points.length < 2) return;

  ctx.save();
  ctx.globalAlpha = opacity / 100;

  if (angle && points.length === 4) {
    const [x1, y1] = points[0];
    const [x3, y3] = points[2];
    const cx = (x1 + x3) / 2;
    const cy = (y1 + y3) / 2;
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.translate(-cx, -cy);
  }

  const rng = seededRandom(Math.floor(points[0][0] + points[0][1] + points.length));
  const wobble = roughness * 2.5;

  const isClosed = distance(points[0][0], points[0][1], points[points.length - 1][0], points[points.length - 1][1]) < 10;

  // Fill
  if (fillColor && fillColor !== 'transparent' && isClosed) {
    drawFill(ctx, points, fillColor, fillStyle, roughness, rng);
  }

  // Outline
  const numStrokes = roughness >= 2 ? 3 : 2;
  for (let s = 0; s < numStrokes; s++) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth + (s * 0.3);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const perturbed = points.map(([px, py]) => [
      px + (rng() - 0.5) * wobble * (s + 1) * 0.3,
      py + (rng() - 0.5) * wobble * (s + 1) * 0.3,
    ] as [number, number]);

    ctx.moveTo(perturbed[0][0], perturbed[0][1]);
    for (let i = 1; i < perturbed.length; i++) {
      ctx.lineTo(perturbed[i][0], perturbed[i][1]);
    }
    if (isClosed) ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
}

// === CHAIKIN SMOOTHING ===
export function chaikinSmooth(points: Point[], iterations: number = 1): Point[] {
  let pts = points;
  for (let iter = 0; iter < iterations; iter++) {
    const smoothed: Point[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const q = { x: p0.x * 0.75 + p1.x * 0.25, y: p0.y * 0.75 + p1.y * 0.25 };
      const r = { x: p0.x * 0.25 + p1.x * 0.75, y: p0.y * 0.25 + p1.y * 0.75 };
      smoothed.push(q, r);
    }
    smoothed.push(pts[pts.length - 1]);
    pts = smoothed;
  }
  return pts;
}

// === ROUGH FREEHAND PATH ===
export function roughFreedraw(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  strokeColor: string, strokeWidth: number, roughness: number = 1,
  opacity: number = 100
) {
  if (points.length < 2) return;

  // Smooth the points first
  const smoothPts = chaikinSmooth(points, 2);

  ctx.save();
  ctx.globalAlpha = opacity / 100;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Add micro-wobble for sketchy feel (much less wobble)
  const rng = seededRandom(Math.floor(smoothPts[0].x + smoothPts[0].y + smoothPts.length));
  const wobble = roughness * 0.8;

  ctx.beginPath();
  ctx.moveTo(smoothPts[0].x + (rng() - 0.5) * wobble, smoothPts[0].y + (rng() - 0.5) * wobble);

  for (let i = 1; i < smoothPts.length; i++) {
    const p = smoothPts[i];
    const wx = (rng() - 0.5) * wobble;
    const wy = (rng() - 0.5) * wobble;
    ctx.lineTo(p.x + wx, p.y + wy);
  }
  ctx.stroke();

  // Second pass for extra roughness
  if (roughness > 1) {
    ctx.globalAlpha = 0.2 * (opacity / 100);
    ctx.lineWidth = strokeWidth * 0.5;
    ctx.beginPath();
    ctx.moveTo(smoothPts[0].x + (rng() - 0.5) * wobble * 1.5, smoothPts[0].y + (rng() - 0.5) * wobble * 1.5);
    for (let i = 1; i < smoothPts.length; i++) {
      ctx.lineTo(smoothPts[i].x + (rng() - 0.5) * wobble * 1.5, smoothPts[i].y + (rng() - 0.5) * wobble * 1.5);
    }
    ctx.stroke();
  }

  ctx.restore();
}

// === ARROW RENDERING ===
export function roughArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  strokeColor: string, strokeWidth: number, roughness: number = 1,
  opacity: number = 100
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = Math.min(20, strokeWidth * 5);

  // Arrow shaft
  roughLine(ctx, x1, y1, x2, y2, strokeColor, strokeWidth, roughness, opacity);

  // Arrowhead
  const rng = seededRandom(Math.floor(x2 + y2));
  const wobble = roughness * 1.5;

  ctx.save();
  ctx.globalAlpha = opacity / 100;
  ctx.fillStyle = strokeColor;

  const headPoints: [number, number][] = [
    [x2, y2],
    [x2 - headLen * Math.cos(angle - 0.35) + (rng() - 0.5) * wobble,
     y2 - headLen * Math.sin(angle - 0.35) + (rng() - 0.5) * wobble],
    [x2 - headLen * Math.cos(angle + 0.35) + (rng() - 0.5) * wobble,
     y2 - headLen * Math.sin(angle + 0.35) + (rng() - 0.5) * wobble],
  ];

  ctx.beginPath();
  ctx.moveTo(headPoints[0][0], headPoints[0][1]);
  ctx.lineTo(headPoints[1][0], headPoints[1][1]);
  ctx.lineTo(headPoints[2][0], headPoints[2][1]);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// === TEXT RENDERING (hand-drawn style) ===
export function drawHandText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  color: string, fontSize: number, fontFamily: string,
  textAlign: CanvasTextAlign, opacity: number = 100
) {
  ctx.save();
  ctx.globalAlpha = opacity / 100;
  ctx.font = `${fontSize}px ${fontFamily}, 'Comic Sans MS', cursive, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'top';

  const lines = text.split('\n');
  const lineHeight = fontSize * 1.3;

  // Add slight hand-drawn wobble to each character
  lines.forEach((line, i) => {
    const lineY = y + i * lineHeight;
    ctx.fillText(line, x, lineY);
  });

  ctx.restore();
}

// === FILL PATTERNS ===
function drawFill(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string, fillStyle: FillStyle,
  roughness: number, rng: () => number
) {
  switch (fillStyle) {
    case 'solid':
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      break;
    case 'hachure':
      drawHachureFill(ctx, points, color, roughness, rng);
      break;
    case 'cross-hatch':
      drawHachureFill(ctx, points, color, roughness, rng, false);
      drawHachureFill(ctx, points, color, roughness, rng, true);
      break;
    case 'dotted':
      drawDottedFill(ctx, points, color, roughness, rng);
      break;
    case 'zigzag':
      drawZigzagFill(ctx, points, color, roughness, rng);
      break;
    case 'none':
      break;
  }
}

function drawHachureFill(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
  roughness: number, rng: () => number,
  perpendicular?: boolean
) {
  const minX = Math.min(...points.map(p => p[0]));
  const maxX = Math.max(...points.map(p => p[0]));
  const minY = Math.min(...points.map(p => p[1]));
  const maxY = Math.max(...points.map(p => p[1]));

  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;

  const spacing = 4 + roughness * 2;
  const angle = perpendicular ? Math.PI / 4 : -Math.PI / 4;
  const diag = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2);

  for (let d = -diag; d < diag; d += spacing) {
    const x1 = minX + d * Math.cos(angle);
    const y1 = minY + d * Math.sin(angle);
    const x2 = minX + d * Math.cos(angle) + diag * Math.cos(angle + Math.PI / 2);
    const y2 = minY + d * Math.sin(angle) + diag * Math.sin(angle + Math.PI / 2);

    const wx = (rng() - 0.5) * roughness;
    const wy = (rng() - 0.5) * roughness;
    ctx.beginPath();
    ctx.moveTo(x1 + wx, y1 + wy);
    ctx.lineTo(x2 + wx, y2 + wy);
    ctx.stroke();
  }

  ctx.restore();
}

function drawDottedFill(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string, roughness: number, rng: () => number
) {
  const minX = Math.min(...points.map(p => p[0]));
  const maxX = Math.max(...points.map(p => p[0]));
  const minY = Math.min(...points.map(p => p[1]));
  const maxY = Math.max(...points.map(p => p[1]));

  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.3;

  const spacing = 6 + roughness * 2;
  for (let x = minX; x < maxX; x += spacing) {
    for (let y = minY; y < maxY; y += spacing) {
      const wx = (rng() - 0.5) * roughness;
      const wy = (rng() - 0.5) * roughness;
      ctx.beginPath();
      ctx.arc(x + wx, y + wy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawZigzagFill(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string, roughness: number, rng: () => number
) {
  const minX = Math.min(...points.map(p => p[0]));
  const maxX = Math.max(...points.map(p => p[0]));
  const minY = Math.min(...points.map(p => p[1]));
  const maxY = Math.max(...points.map(p => p[1]));

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.3;

  const spacing = 8 + roughness * 3;
  const amplitude = 3;
  for (let y = minY; y < maxY; y += spacing) {
    ctx.beginPath();
    let zig = true;
    for (let x = minX; x < maxX; x += 4) {
      const wy = zig ? amplitude : -amplitude;
      const wx = (rng() - 0.5) * roughness * 0.5;
      if (x === minX) ctx.moveTo(x + wx, y + wy);
      else ctx.lineTo(x + wx, y + wy);
      zig = !zig;
    }
    ctx.stroke();
  }

  ctx.restore();
}

// === MAIN ELEMENT RENDERER ===
export function renderElement(
  ctx: CanvasRenderingContext2D,
  element: Element,
  isSelected: boolean = false
) {
  const { type, x, y, width, height, angle, strokeColor, backgroundColor, fillStyle, strokeWidth, roughness, opacity, points, text, fontFamily, fontSize, textAlign } = element;

  if (element.isDeleted) return;

  ctx.save();

  switch (type) {
    case ElementType.Rectangle:
      roughRectangle(ctx, x, y, width, height, strokeColor, backgroundColor, fillStyle, strokeWidth, roughness, opacity, angle);
      break;
    case ElementType.Ellipse:
      roughEllipse(ctx, x + width / 2, y + height / 2, width / 2, height / 2, strokeColor, backgroundColor, fillStyle, strokeWidth, roughness, opacity, angle);
      break;
    case ElementType.Diamond:
      roughDiamond(ctx, x, y, width, height, strokeColor, backgroundColor, fillStyle, strokeWidth, roughness, opacity, angle);
      break;
    case ElementType.Arrow:
      if (points.length >= 2) {
        roughArrow(ctx, points[0].x, points[0].y, points[points.length - 1].x, points[points.length - 1].y, strokeColor, strokeWidth, roughness, opacity);
      }
      break;
    case ElementType.Line:
      if (points.length >= 2) {
        const p1 = points[0], p2 = points[points.length - 1];
        roughLine(ctx, p1.x, p1.y, p2.x, p2.y, strokeColor, strokeWidth, roughness, opacity);
      }
      break;
    case ElementType.Freedraw:
      if (points.length >= 2) {
        roughFreedraw(ctx, points, strokeColor, strokeWidth, roughness, opacity);
      }
      break;
    case ElementType.Text:
      drawHandText(ctx, text, x, y, strokeColor, fontSize, fontFamily, textAlign as CanvasTextAlign, opacity);
      break;
    case ElementType.Image:
      try {
        const img = new Image();
        img.src = text; // Store data URL in text field
        if (img.complete) {
          ctx.save();
          ctx.globalAlpha = opacity / 100;
          ctx.drawImage(img, x, y, width, height);
          ctx.restore();
        } else {
          img.onload = () => {
            ctx.save();
            ctx.globalAlpha = opacity / 100;
            ctx.drawImage(img, x, y, width, height);
            ctx.restore();
          };
          // Fallback: draw placeholder
          ctx.save();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(x, y, width, height);
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(x, y, width, height);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Loading...', x + width / 2, y + height / 2);
          ctx.restore();
        }
      } catch {
        // Draw placeholder
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(x, y, width, height);
        ctx.restore();
      }
      break;
  }

  ctx.restore();

  // Selection highlight
  if (isSelected) {
    drawSelectionOutline(ctx, element);
  }
}

function drawSelectionOutline(ctx: CanvasRenderingContext2D, el: Element) {
  ctx.save();
  const scale = ctx.getTransform().a || 1;
  ctx.strokeStyle = '#6965db';
  ctx.lineWidth = 2 / scale;
  ctx.setLineDash([4 / scale, 4 / scale]);
  ctx.strokeRect(el.x - 4, el.y - 4, el.width + 8, el.height + 8);

  // Draw 8 resize handles (4 corners + 4 midpoints)
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#6965db';
  ctx.lineWidth = 1.5 / scale;
  const hs = 7 / scale;
  const hh = hs / 2;
  const corners: [number, number][] = [
    [el.x - hh, el.y - hh],           // nw
    [el.x + el.width / 2 - hh, el.y - hh],         // n
    [el.x + el.width - hh, el.y - hh],             // ne
    [el.x + el.width - hh, el.y + el.height / 2 - hh],    // e
    [el.x + el.width - hh, el.y + el.height - hh],       // se
    [el.x + el.width / 2 - hh, el.y + el.height - hh],   // s
    [el.x - hh, el.y + el.height - hh],            // sw
    [el.x - hh, el.y + el.height / 2 - hh],        // w
  ];
  for (const [hx, hy] of corners) {
    ctx.fillRect(hx, hy, hs, hs);
    ctx.strokeRect(hx, hy, hs, hs);
  }
  ctx.restore();
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// === BACKGROUND GRID ===
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number, height: number,
  scrollX: number, scrollY: number,
  zoom: number, darkMode: boolean,
  gridMode: string
) {
  if (gridMode === 'none') return;

  const gridSize = 20 * (zoom / 100);
  const offsetX = scrollX % gridSize;
  const offsetY = scrollY % gridSize;

  ctx.save();

  if (gridMode === 'dots') {
    ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
    for (let x = offsetX; x < width; x += gridSize) {
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (gridMode === 'lines') {
    ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 0.5;
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  ctx.restore();
}
