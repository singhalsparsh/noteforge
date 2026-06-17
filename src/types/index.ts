// ============================================================
// NoteForge - Excalidraw-style Whiteboard Types
// ============================================================

export const COLORS = [
  '#000000', '#1e1e1e', '#2b2b2b', '#5c5c5c', '#8f8f8f',
  '#c4c4c4', '#d4d4d4', '#ffffff',
  '#ffc8c8', '#ffa8a8', '#ff6b6b', '#ff3333', '#c92a2a',
  '#ffecb3', '#ffd43b', '#fab005', '#f59f00', '#e67700',
  '#b2f2bb', '#69db7c', '#40c057', '#2f9e44', '#1b7a2e',
  '#a5d8ff', '#4dabf7', '#339af0', '#1c7ed6', '#1864ab',
  '#d0bfff', '#9775fa', '#7950f2', '#6741d9', '#5f3dc4',
  '#fcc2d7', '#f06595', '#e64980', '#d6336c', '#c2255c',
] as const;

export const FILL_COLORS = [
  'transparent', '#ffc8c8', '#ffecb3', '#b2f2bb', '#a5d8ff',
  '#d0bfff', '#fcc2d7', '#ffd8a8', '#c3fae8', '#d3f9d8',
  '#e9ecef', '#f8f9fa',
] as const;

export const STROKE_WIDTHS = [1, 2, 3, 4, 5, 6, 8, 10, 12] as const;

export const FONT_FAMILIES = [
  'Virgil', 'Helvetica', 'Cascadia', 'Excalifont',
] as const;

export const ROUGHNESS_LEVELS = [0, 1, 2, 3] as const;

export enum ElementType {
  Rectangle = 'rectangle',
  Ellipse = 'ellipse',
  Diamond = 'diamond',
  Arrow = 'arrow',
  Line = 'line',
  Freedraw = 'freedraw',
  Text = 'text',
  Image = 'image',
  Selection = 'selection',
}

export interface Point {
  x: number;
  y: number;
}

export interface Element {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  roughness: number;
  opacity: number;
  points: Point[];
  text: string;
  fontFamily: string;
  fontSize: number;
  textAlign: TextAlign;
  containerId: string | null;
  boundElements: Array<{ id: string; type: 'arrow' | 'text' }>;
  isDeleted: boolean;
  groupIds: string[];
  frameId: string | null;
  updatedAt: number;
  version: number;
  isSelected?: boolean;
}

export type FillStyle = 'solid' | 'hachure' | 'cross-hatch' | 'dotted' | 'zigzag' | 'none';
export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'center' | 'bottom';

export enum ToolType {
  Selection = 'selection',
  Rectangle = 'rectangle',
  Diamond = 'diamond',
  Ellipse = 'ellipse',
  Arrow = 'arrow',
  Line = 'line',
  Freedraw = 'freedraw',
  Text = 'text',
  Image = 'image',
  Eraser = 'eraser',
  Hand = 'hand',
}

export interface Board {
  id: string;
  name: string;
  elements: Element[];
  background: string;
  gridMode: GridMode;
  created: number;
  updated: number;
  shareId?: string;
  version: number;
}

export type GridMode = 'none' | 'dots' | 'lines';

export const DEFAULT_ELEMENT_PROPS = {
  strokeColor: '#1e1e1e',
  backgroundColor: 'transparent',
  fillStyle: 'solid' as FillStyle,
  strokeWidth: 4,
  roughness: 1,
  opacity: 100,
  fontFamily: 'Virgil',
  fontSize: 20,
  textAlign: 'left' as TextAlign,
};

export const BOARD_BACKGROUNDS = [
  '#ffffff', '#f8f9fa', '#f1f3f5', '#e9ecef',
  '#fff5f5', '#fff0f6', '#f8f0ff', '#f3f0ff',
  '#edf2ff', '#e7f5ff', '#e3fafc', '#e6fcf5',
  '#ebfbee', '#f4fce3', '#fff9db', '#fff4e6',
];

export interface ExcalidrawTextElement extends Element {
  type: ElementType.Text;
  text: string;
  fontFamily: string;
  fontSize: number;
  textAlign: TextAlign;
  verticalAlign: VerticalAlign;
  containerId: string | null;
  originalText: string;
}

export interface ExcalidrawImageElement extends Element {
  type: ElementType.Image;
  fileId: string;
  status: 'pending' | 'loaded' | 'error';
  scale: [number, number];
}

export interface CursorPosition {
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
  boardId: string;
  tool?: ToolType;
}

export interface Collaborator {
  userId: string;
  userName: string;
  color: string;
  isOnline: boolean;
  lastActive: number;
}

export interface ChatMessage {
  id: string;
  boardId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  imageUrl?: string;
}

export interface UndoAction {
  elements: Element[];
  timestamp: number;
}

export interface AppState {
  theme: 'light' | 'dark';
  boardId: string | null;
  elements: Element[];
  currentTool: ToolType;
  elementType: ElementType;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  roughness: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  textAlign: TextAlign;
  zoom: number;
  offsetX: number;
  offsetY: number;
  scrollX: number;
  scrollY: number;
  selectedElementIds: Set<string>;
  editingElementId: string | null;
  hoveringElementId: string | null;
  isPanning: boolean;
  isBinding: boolean;
  lastPointerDown: { x: number; y: number; time: number };
  collaborators: Collaborator[];
  cursors: CursorPosition[];
  chatMessages: ChatMessage[];
  showChat: boolean;
  showShareDialog: boolean;
  showExportDialog: boolean;
  showColorPicker: boolean;
  showLibrary: boolean;
  gridMode: GridMode;
  gridSize: number;
  name: string;
  undoStack: UndoAction[];
  redoStack: UndoAction[];
  isCollaborating: boolean;
  userName: string;
  userId: string;
  userColor: string;
}
