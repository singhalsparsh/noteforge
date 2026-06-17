'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { renderElement } from '@/lib/renderer';

interface Props {
  boardId: string;
  onClose: () => void;
}

export default function ExportDialog({ boardId, onClose }: Props) {
  const [format, setFormat] = useState<'png' | 'jpg' | 'svg' | 'pdf' | 'json'>('png');
  const [exporting, setExporting] = useState(false);
  const [quality, setQuality] = useState(0.92);
  const { boardName, elements, background } = useStore();

  async function handleExport() {
    setExporting(true);
    try {
      switch (format) {
        case 'json':
          exportJSON();
          break;
        case 'svg':
          exportSVG();
          break;
        case 'pdf':
          await exportPDF();
          break;
        case 'png':
        case 'jpg':
          await exportRaster();
          break;
      }
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  function exportJSON() {
    const data = {
      type: 'noteforge-board',
      name: boardName,
      background,
      elements,
      exportedAt: Date.now(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${boardName || 'board'}.noteforge`);
  }

  function exportSVG() {
    const padding = 50;
    const bounds = getElementsBounds();
    const w = Math.max(Math.ceil(bounds.w + padding * 2), 200);
    const h = Math.max(Math.ceil(bounds.h + padding * 2), 200);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    ctx.translate(-bounds.x + padding, -bounds.y + padding);

    elements.filter(e => !e.isDeleted).forEach(el => {
      renderElement(ctx, el, false);
    });

    const dataUrl = canvas.toDataURL('image/png');
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <image width="${w}" height="${h}" xlink:href="${dataUrl}"/>
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    downloadBlob(blob, `${boardName || 'board'}.svg`);
  }

  async function exportRaster() {
    const padding = 50;
    const bounds = getElementsBounds();
    const w = Math.max(Math.ceil(bounds.w + padding * 2), 200);
    const h = Math.max(Math.ceil(bounds.h + padding * 2), 200);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    ctx.translate(-bounds.x + padding, -bounds.y + padding);

    elements.filter(e => !e.isDeleted).forEach(el => {
      renderElement(ctx, el, false);
    });

    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, format === 'png' ? 'image/png' : 'image/jpeg', quality);
    });

    if (blob) {
      downloadBlob(blob, `${boardName || 'board'}.${format}`);
    }
  }

  async function exportPDF() {
    const { jsPDF } = await import('jspdf');
    const padding = 50;
    const bounds = getElementsBounds();
    const w = Math.max(Math.ceil(bounds.w + padding * 2), 200);
    const h = Math.max(Math.ceil(bounds.h + padding * 2), 200);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    ctx.translate(-bounds.x + padding, -bounds.y + padding);

    elements.filter(e => !e.isDeleted).forEach(el => {
      renderElement(ctx, el, false);
    });

    const imageData = canvas.toDataURL('image/png');

    const doc = new jsPDF({
      orientation: w > h ? 'landscape' : 'portrait',
      unit: 'px',
      format: [w, h],
      compress: true,
    });
    doc.addImage(imageData, 'PNG', 0, 0, w, h);
    const pdfBlob = doc.output('blob');
    downloadBlob(pdfBlob, `${boardName || 'board'}.pdf`);
  }

  function getElementsBounds() {
    if (elements.length === 0) return { x: 0, y: 0, w: 800, h: 600 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.filter(e => !e.isDeleted).forEach(el => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + (el.width || 100));
      maxY = Math.max(maxY, el.y + (el.height || 100));
    });
    if (!isFinite(minX)) return { x: 0, y: 0, w: 800, h: 600 };
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-[420px] max-w-[95vw] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Export</h2>
              <p className="text-xs text-[var(--text-secondary)]">{boardName}</p>
            </div>
          </div>
          <button onClick={onClose} className="glass-button p-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Format selection */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-200">Format</label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'png', label: 'PNG',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> },
                { id: 'jpg', label: 'JPG',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/></svg> },
                { id: 'svg', label: 'SVG',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
                { id: 'pdf', label: 'PDF',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
                { id: 'json', label: 'JSON',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{'{ }'}<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id as any)}
                  className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl transition-all ${
                    format === f.id
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="w-5 h-5 flex items-center justify-center">{f.icon}</span>
                  <span className="text-[10px] font-medium">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Board stats */}
          <div className="rounded-xl p-3 text-xs space-y-1 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
              <span>Elements</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">{elements.filter(e => !e.isDeleted).length}</span>
            </div>
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
              <span>Format</span>
              <span className="font-medium text-gray-700 dark:text-gray-200 uppercase">{format === 'pdf' ? `PDF (${format})` : format.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Quality slider (PNG/JPG only) */}
        {(format === 'png' || format === 'jpg') && (
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-200">
              Quality: <span className="font-bold text-blue-500">
                {quality >= 0.95 ? 'Extreme' : quality >= 0.85 ? 'High' : quality >= 0.6 ? 'Medium' : 'Low'}
              </span>
            </label>
            <input type="range" min={0.3} max={0.98} step={0.01} value={quality}
              onChange={e => setQuality(Number(e.target.value))}
              className="w-full accent-blue-500" />
            <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
              <span>Extreme</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border-color)]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? (
              <>
                <div className="spinner w-4 h-4" />
                Exporting...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
