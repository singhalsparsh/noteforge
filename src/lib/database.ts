// ============================================================
// NoteForge - Local Storage Database
// Uses IndexedDB via a simple wrapper for offline-first storage
// Falls back to localStorage for simple data
// ============================================================

interface StorageData {
  notebooks: any[];
  pages: any[];
  settings: any;
  shareLinks: any[];
  sessions: any[];
}

const DB_NAME = 'NoteForgeDB';
const DB_VERSION = 1;
const STORE_NAME = 'noteforge';

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance!);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function dbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fallback to localStorage
    const val = localStorage.getItem(`nf_${key}`);
    return val ? JSON.parse(val) : null;
  }
}

export async function dbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    localStorage.setItem(`nf_${key}`, JSON.stringify(value));
  }
}

export async function dbDelete(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    localStorage.removeItem(`nf_${key}`);
  }
}

export async function dbGetAll(): Promise<Record<string, any>> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const data: Record<string, any> = {};
        request.result.forEach((item: any) => {
          data[item.key] = item.value;
        });
        resolve(data);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('nf_')) {
        data[key.slice(3)] = JSON.parse(localStorage.getItem(key) || 'null');
      }
    }
    return data;
  }
}

// Notebook CRUD helpers
export async function getNotebooks(): Promise<any[]> {
  const notebooks = await dbGet<any[]>('notebooks');
  return notebooks || [];
}

export async function getNotebook(id: string): Promise<any | null> {
  const notebooks = await getNotebooks();
  return notebooks.find((n: any) => n.id === id) || null;
}

export async function saveNotebook(notebook: any): Promise<void> {
  const notebooks = await getNotebooks();
  const index = notebooks.findIndex((n: any) => n.id === notebook.id);
  if (index >= 0) {
    notebooks[index] = { ...notebooks[index], ...notebook, updatedAt: new Date().toISOString() };
  } else {
    notebooks.push({
      ...notebook,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  await dbSet('notebooks', notebooks);
}

export async function deleteNotebook(id: string): Promise<void> {
  const notebooks = await getNotebooks();
  const filtered = notebooks.filter((n: any) => n.id !== id);
  await dbSet('notebooks', filtered);
}

// Pages CRUD helpers
export async function getPages(notebookId: string): Promise<any[]> {
  const key = `pages_${notebookId}`;
  const pages = await dbGet<any[]>(key);
  return pages || [];
}

export async function getPage(pageId: string, notebookId: string): Promise<any | null> {
  const pages = await getPages(notebookId);
  return pages.find((p: any) => p.id === pageId) || null;
}

export async function savePage(page: any, notebookId: string): Promise<void> {
  const key = `pages_${notebookId}`;
  const pages = await getPages(notebookId);
  const index = pages.findIndex((p: any) => p.id === page.id);
  if (index >= 0) {
    pages[index] = { ...pages[index], ...page, updatedAt: new Date().toISOString() };
  } else {
    pages.push({
      ...page,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  await dbSet(key, pages);
}

export async function deletePage(pageId: string, notebookId: string): Promise<void> {
  const key = `pages_${notebookId}`;
  const pages = await getPages(notebookId);
  const filtered = pages.filter((p: any) => p.id !== pageId);
  await dbSet(key, filtered);
}

// Strokes operations for a page
export async function getStrokes(pageId: string, notebookId: string): Promise<any[]> {
  const page = await getPage(pageId, notebookId);
  return page?.strokes || [];
}

export async function saveStroke(stroke: any, pageId: string, notebookId: string): Promise<void> {
  const page = await getPage(pageId, notebookId);
  if (page) {
    const strokeIndex = page.strokes.findIndex((s: any) => s.id === stroke.id);
    if (strokeIndex >= 0) {
      page.strokes[strokeIndex] = stroke;
    } else {
      page.strokes.push(stroke);
    }
    await savePage(page, notebookId);
  }
}

export async function deleteStroke(strokeId: string, pageId: string, notebookId: string): Promise<void> {
  const page = await getPage(pageId, notebookId);
  if (page) {
    page.strokes = page.strokes.filter((s: any) => s.id !== strokeId);
    await savePage(page, notebookId);
  }
}

// Share links
export async function getShareLink(token: string): Promise<any | null> {
  const links = await dbGet<any[]>('shareLinks') || [];
  return links.find((l: any) => l.token === token) || null;
}

export async function saveShareLink(link: any): Promise<void> {
  const links = await dbGet<any[]>('shareLinks') || [];
  const index = links.findIndex((l: any) => l.id === link.id);
  if (index >= 0) {
    links[index] = link;
  } else {
    links.push(link);
  }
  await dbSet('shareLinks', links);
}

// Settings
export async function getSettings(): Promise<any> {
  return await dbGet<any>('settings') || {
    theme: 'light',
    accentColor: '#3b82f6',
    defaultPaperType: 'blank',
    defaultPaperColor: '#FFFFFF',
    autoSaveInterval: 5000,
    toolbarPosition: 'top',
    sidebarPosition: 'left',
    fontSize: 14,
    snapToGrid: false,
    gridSize: 25,
    autoDeselect: true,
    autoDeselectTimeout: 3000,
  };
}

export async function saveSettings(settings: any): Promise<void> {
  await dbSet('settings', settings);
}
