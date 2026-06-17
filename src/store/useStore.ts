import { create } from 'zustand';
import { Element, ElementType, ToolType, FillStyle, TextAlign, Point, CursorPosition, Collaborator, ChatMessage, UndoAction, GridMode, COLORS, DEFAULT_ELEMENT_PROPS } from '@/types';
import { generateId } from '@/lib/utils';

interface WhiteboardState {
  // Identity
  userId: string;
  userName: string;
  userColor: string;
  setUserName: (name: string) => void;
  setUserColor: (color: string) => void;

  // Board
  boardId: string | null;
  boardName: string;
  elements: Element[];
  background: string;
  gridMode: GridMode;
  setBoardId: (id: string | null) => void;
  setBoardName: (name: string) => void;
  setElements: (elements: Element[]) => void;
  setBackground: (bg: string) => void;
  setGridMode: (mode: GridMode) => void;

  // Theme
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Tool
  currentTool: ToolType;
  elementType: ElementType;
  isLaserActive: boolean;
  laserDuration: number;
  laserWeight: number;
  setCurrentTool: (t: ToolType) => void;
  setElementType: (t: ElementType) => void;
  setLaserActive: (v: boolean) => void;
  setLaserDuration: (v: number) => void;
  setLaserWeight: (v: number) => void;

  // Style
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  roughness: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  textAlign: TextAlign;
  setStrokeColor: (c: string) => void;
  setBackgroundColor: (c: string) => void;
  setFillStyle: (s: FillStyle) => void;
  setStrokeWidth: (w: number) => void;
  setRoughness: (r: number) => void;
  setOpacity: (o: number) => void;
  setFontSize: (s: number) => void;
  setFontFamily: (f: string) => void;
  setTextAlign: (a: TextAlign) => void;

  // View
  zoom: number;
  offsetX: number;
  offsetY: number;
  scrollX: number;
  scrollY: number;
  setZoom: (z: number) => void;
  setOffsetX: (x: number) => void;
  setOffsetY: (y: number) => void;
  setScroll: (x: number, y: number) => void;
  zoomToFit: () => void;

  // Selection
  selectedElementIds: Set<string>;
  editingElementId: string | null;
  hoveringElementId: string | null;
  setSelectedElements: (ids: Set<string>) => void;
  toggleSelectedElement: (id: string) => void;
  clearSelection: () => void;
  setEditingElement: (id: string | null) => void;
  setHoveringElement: (id: string | null) => void;

  // Element CRUD
  addElement: (el: Element) => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
  deleteElements: (ids: string[]) => void;
  duplicateElements: (ids: string[]) => void;
  bringForward: (ids: string[]) => void;
  sendBackward: (ids: string[]) => void;

  // Interaction
  isPanning: boolean;
  lastPointerDown: { x: number; y: number; time: number };
  setIsPanning: (p: boolean) => void;
  setLastPointerDown: (p: { x: number; y: number; time: number }) => void;
  selectedToolOnPointerDown: ToolType | null;

  // Undo/Redo
  undoStack: UndoAction[];
  redoStack: UndoAction[];
  pushUndoStack: () => void;
  undo: () => void;
  redo: () => void;

  // Collaboration
  collaborators: Collaborator[];
  cursors: CursorPosition[];
  chatMessages: ChatMessage[];
  isCollaborating: boolean;
  showChat: boolean;
  setCollaborators: (c: Collaborator[]) => void;
  addCollaborator: (c: Collaborator) => void;
  removeCollaborator: (id: string) => void;
  setCursors: (c: CursorPosition[]) => void;
  updateCursor: (c: CursorPosition) => void;
  removeCursor: (id: string) => void;
  addChatMessage: (m: ChatMessage) => void;
  setCollaborating: (v: boolean) => void;
  setShowChat: (v: boolean) => void;

  // UI dialogs
  showShareDialog: boolean;
  showExportDialog: boolean;
  showLibrary: boolean;
  setShowShareDialog: (v: boolean) => void;
  setShowExportDialog: (v: boolean) => void;
  setShowLibrary: (v: boolean) => void;
}

function getInitialUserName(): string {
  if (typeof window === 'undefined') return 'Anonymous';
  return localStorage.getItem('nf_userName') || 'Anonymous';
}

function getInitialUserId(): string {
  if (typeof window === 'undefined') return generateId();
  let id = localStorage.getItem('nf_userId');
  if (!id) {
    id = generateId();
    localStorage.setItem('nf_userId', id);
  }
  return id;
}

// Apply initial dark class from persisted theme
if (typeof window !== 'undefined' && localStorage.getItem('nf_theme') === 'dark') {
  document.documentElement.classList.add('dark');
}

export const useStore = create<WhiteboardState>((set, get) => ({
  userId: getInitialUserId(),
  userName: getInitialUserName(),
  userColor: '#6965db',
  setUserName: (name) => { set({ userName: name }); if (typeof window !== 'undefined') localStorage.setItem('nf_userName', name); },
  setUserColor: (color) => set({ userColor: color }),

  boardId: null,
  boardName: 'Untitled',
  elements: [],
  background: '#ffffff',
  gridMode: 'dots',
  setBoardId: (id) => set({ boardId: id }),
  setBoardName: (name) => set({ boardName: name }),
  setElements: (elements) => set({ elements }),
  setBackground: (bg) => set({ background: bg }),
  setGridMode: (mode) => set({ gridMode: mode }),

  theme: typeof window !== 'undefined' ? (localStorage.getItem('nf_theme') as 'light' | 'dark') || 'light' : 'light',
  setTheme: (t) => {
    set({ theme: t });
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', t === 'dark');
      localStorage.setItem('nf_theme', t);
      // Auto-adjust stroke color for visibility
      const s = get().strokeColor;
      const lightColors = ['#ffffff', '#e0e0e0', '#c4c4c4', '#d4d4d4', '#f0f0f0'];
      const darkColors = ['#000000', '#1e1e1e', '#2b2b2b', '#5c5c5c', '#8f8f8f', '#c4c4c4'];
      if (t === 'dark' && darkColors.includes(s)) {
        set({ strokeColor: '#e0e0e0' });
      } else if (t === 'light' && lightColors.includes(s)) {
        set({ strokeColor: '#1e1e1e' });
      }
      // Shift existing element colors for visibility on new theme
      const elements = get().elements;
      const updatedElements = elements.map(el => {
        let newStroke = el.strokeColor;
        let newBg = el.backgroundColor;
        if (t === 'dark') {
          if (darkColors.includes(newStroke)) newStroke = '#e0e0e0';
          if (darkColors.includes(newBg)) newBg = '#e0e0e0';
        } else {
          if (lightColors.includes(newStroke)) newStroke = '#1e1e1e';
          if (lightColors.includes(newBg)) newBg = '#1e1e1e';
        }
        return { ...el, strokeColor: newStroke, backgroundColor: newBg };
      });
      set({ elements: updatedElements });
    }
  },
  toggleTheme: () => { const nt = get().theme === 'light' ? 'dark' : 'light'; get().setTheme(nt); },

  currentTool: ToolType.Freedraw,
  elementType: ElementType.Freedraw,
  isLaserActive: false,
  setCurrentTool: (t) => set({ currentTool: t, elementType: t === ToolType.Selection ? ElementType.Rectangle : t as unknown as ElementType }),
  setElementType: (t) => set({ elementType: t, currentTool: ToolType.Selection }),
  setLaserActive: (v) => set({ isLaserActive: v }),
  laserDuration: 2000,
  laserWeight: 6,
  setLaserDuration: (v) => set({ laserDuration: v }),
  setLaserWeight: (v) => set({ laserWeight: v }),

  strokeColor: typeof window !== 'undefined' && localStorage.getItem('nf_theme') === 'dark' ? '#e0e0e0' : '#1e1e1e',
  backgroundColor: 'transparent',
  fillStyle: 'solid',
  strokeWidth: 4,
  roughness: 1,
  opacity: 100,
  fontSize: 20,
  fontFamily: 'Virgil',
  textAlign: 'left',
  setStrokeColor: (c) => set({ strokeColor: c }),
  setBackgroundColor: (c) => set({ backgroundColor: c }),
  setFillStyle: (s) => set({ fillStyle: s }),
  setStrokeWidth: (w) => set({ strokeWidth: w }),
  setRoughness: (r) => set({ roughness: r }),
  setOpacity: (o) => set({ opacity: o }),
  setFontSize: (s) => set({ fontSize: s }),
  setFontFamily: (f) => set({ fontFamily: f }),
  setTextAlign: (a) => set({ textAlign: a }),

  zoom: 100,
  offsetX: 0,
  offsetY: 0,
  scrollX: 0,
  scrollY: 0,
  setZoom: (z) => set({ zoom: Math.max(10, Math.min(500, z)) }),
  setOffsetX: (x) => set({ offsetX: x }),
  setOffsetY: (y) => set({ offsetY: y }),
  setScroll: (x, y) => set({ scrollX: x, scrollY: y }),
  zoomToFit: () => {},
  selectedToolOnPointerDown: null,

  selectedElementIds: new Set<string>(),
  editingElementId: null,
  hoveringElementId: null,
  setSelectedElements: (ids) => set({ selectedElementIds: ids, editingElementId: null }),
  toggleSelectedElement: (id) => {
    const s = new Set(get().selectedElementIds);
    if (s.has(id)) s.delete(id); else s.add(id);
    set({ selectedElementIds: s });
  },
  clearSelection: () => set({ selectedElementIds: new Set(), editingElementId: null }),
  setEditingElement: (id) => set({ editingElementId: id }),
  setHoveringElement: (id) => set({ hoveringElementId: id }),

  addElement: (el) => set((s) => ({ elements: [...s.elements, el] })),
  updateElement: (id, updates) => set((s) => ({
    elements: s.elements.map(e => e.id === id ? { ...e, ...updates, updatedAt: Date.now(), version: e.version + 1 } : e),
  })),
  deleteElements: (ids) => set((s) => ({
    elements: s.elements.map(e => ids.includes(e.id) ? { ...e, isDeleted: true } : e),
    selectedElementIds: new Set([...s.selectedElementIds].filter(id => !ids.includes(id))),
  })),
  duplicateElements: (ids) => {
    const elements = get().elements;
    const newElements = elements.filter(e => ids.includes(e.id)).map(e => ({
      ...e,
      id: generateId(),
      x: e.x + 20,
      y: e.y + 20,
      version: 1,
    }));
    set((s) => ({ elements: [...s.elements, ...newElements] }));
  },
  bringForward: (ids) => set((s) => {
    const maxOrd = s.elements.length - 1;
    return {
      elements: s.elements.map(e => ids.includes(e.id) ? { ...e, opacity: e.opacity } : e).map((e, i, arr) => {
        if (!ids.includes(e.id)) return e;
        const next = arr.findIndex((el, j) => j > i && !ids.includes(el.id));
        if (next === -1) return e;
        return { ...arr[next], opacity: arr[next].opacity };
      }).map((e, i, arr) => {
        // Simple reorder: move to top
        if (ids.includes(e.id)) return { ...e };
        return e;
      }),
    };
  }),
  sendBackward: (ids) => {},

  isPanning: false,
  lastPointerDown: { x: 0, y: 0, time: 0 },
  setIsPanning: (p) => set({ isPanning: p }),
  setLastPointerDown: (p) => set({ lastPointerDown: p }),

  undoStack: [],
  redoStack: [],
  pushUndoStack: () => {
    const elements = JSON.parse(JSON.stringify(get().elements));
    set((s) => ({ undoStack: [...s.undoStack.slice(-49), { elements, timestamp: Date.now() }], redoStack: [] }));
  },
  undo: () => {
    const { undoStack, elements } = get();
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    set({ redoStack: [...get().redoStack, { elements: JSON.parse(JSON.stringify(elements)), timestamp: Date.now() }], elements: action.elements, undoStack: undoStack.slice(0, -1) });
  },
  redo: () => {
    const { redoStack, elements } = get();
    if (redoStack.length === 0) return;
    const action = redoStack[redoStack.length - 1];
    set({ undoStack: [...get().undoStack, { elements: JSON.parse(JSON.stringify(elements)), timestamp: Date.now() }], elements: action.elements, redoStack: redoStack.slice(0, -1) });
  },

  collaborators: [],
  cursors: [],
  chatMessages: [],
  isCollaborating: false,
  showChat: false,
  setCollaborators: (c) => set({ collaborators: c }),
  addCollaborator: (c) => set((s) => ({
    collaborators: s.collaborators.find(x => x.userId === c.userId) ? s.collaborators.map(x => x.userId === c.userId ? c : x) : [...s.collaborators, c],
  })),
  removeCollaborator: (id) => set((s) => ({ collaborators: s.collaborators.filter(c => c.userId !== id) })),
  setCursors: (c) => set({ cursors: c }),
  updateCursor: (c) => set((s) => ({
    cursors: s.cursors.find(x => x.userId === c.userId) ? s.cursors.map(x => x.userId === c.userId ? c : x) : [...s.cursors, c],
  })),
  removeCursor: (id) => set((s) => ({ cursors: s.cursors.filter(c => c.userId !== id) })),
  addChatMessage: (m) => set((s) => ({ chatMessages: [...s.chatMessages.slice(-99), m] })),
  setCollaborating: (v) => set({ isCollaborating: v }),
  setShowChat: (v) => set({ showChat: v }),

  showShareDialog: false,
  showExportDialog: false,
  showLibrary: false,
  setShowShareDialog: (v) => set({ showShareDialog: v }),
  setShowExportDialog: (v) => set({ showExportDialog: v }),
  setShowLibrary: (v) => set({ showLibrary: v }),
}));
