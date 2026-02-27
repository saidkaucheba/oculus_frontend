export type HttpMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface QueuedOperation {
  id: string;
  method: HttpMethod;
  path: string;
  body: unknown | null;
  isFormData?: boolean;
  formDataEntries?: { key: string; value: string | { name: string; type: string; base64: string } }[];
  createdAt: number;
  attempts: number;
  tag: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface SyncState {
  pendingCount: number;
  status: SyncStatus;
  lastSyncAt: number | null;
  lastError: string | null;
}

const DB_NAME = 'oculus_offline';
const DB_VERSION = 1;
const STORE_OPS = 'pending_operations';
const STORE_CACHE = 'read_cache';

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_OPS)) {
        const store = db.createObjectStore(STORE_OPS, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'cacheKey' });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(req.result); };
    req.onerror  = () => reject(req.error);
  });
}

function idbPut(storeName: string, value: object): Promise<void> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  }));
}

function idbGetAll<T>(storeName: string): Promise<T[]> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror   = () => reject(req.error);
  }));
}

function idbDelete(storeName: string, key: string): Promise<void> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  }));
}

function idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror   = () => reject(req.error);
  }));
}

async function serializeFormData(form: FormData): Promise<QueuedOperation['formDataEntries']> {
  const entries: QueuedOperation['formDataEntries'] = [];
  for (const [key, value] of form.entries()) {
    if (value instanceof File) {
      const base64 = await fileToBase64(value);
      entries!.push({ key, value: { name: value.name, type: value.type, base64 } });
    } else {
      entries!.push({ key, value: value as string });
    }
  }
  return entries;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function deserializeFormData(entries: QueuedOperation['formDataEntries']): FormData {
  const form = new FormData();
  for (const entry of entries ?? []) {
    if (typeof entry.value === 'string') {
      form.append(entry.key, entry.value);
    } else {
      const { name, type, base64 } = entry.value;
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      form.append(entry.key, new Blob([bytes], { type }), name);
    }
  }
  return form;
}

interface CacheEntry<T> {
  cacheKey: string;
  data: T;
  savedAt: number;
}

export async function cacheSet<T>(key: string, data: T): Promise<void> {
  await idbPut(STORE_CACHE, { cacheKey: key, data, savedAt: Date.now() });
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const entry = await idbGet<CacheEntry<T>>(STORE_CACHE, key);
  return entry ? entry.data : null;
}

export async function enqueue(op: Omit<QueuedOperation, 'id' | 'createdAt' | 'attempts'>): Promise<string> {
  const id = crypto.randomUUID();
  const full: QueuedOperation = { ...op, id, createdAt: Date.now(), attempts: 0 };
  await idbPut(STORE_OPS, full);
  notifyListeners();
  return id;
}

export async function getPendingOps(): Promise<QueuedOperation[]> {
  const all = await idbGetAll<QueuedOperation>(STORE_OPS);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function removePendingOp(id: string): Promise<void> {
  await idbDelete(STORE_OPS, id);
  notifyListeners();
}

const BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

function getCsrfToken(): string {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

async function replayOperation(op: QueuedOperation): Promise<void> {
  const base = BASE_URL || window.location.origin;
  const url = `${base}${op.path}`;

  let body: BodyInit | undefined;
  const headers: Record<string, string> = {
    'X-CSRFToken': getCsrfToken(),
  };

  if (op.isFormData && op.formDataEntries) {
    body = deserializeFormData(op.formDataEntries);
  } else if (op.body !== null && op.body !== undefined) {
    body = JSON.stringify(op.body);
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method: op.method,
    credentials: 'include',
    headers,
    body,
  });

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
}

type Listener = (state: SyncState) => void;
const listeners = new Set<Listener>();
let _syncState: SyncState = {
  pendingCount: 0,
  status: 'idle',
  lastSyncAt: null,
  lastError: null,
};

function notifyListeners() {
  getPendingOps().then(ops => {
    _syncState = { ..._syncState, pendingCount: ops.length };
    listeners.forEach(fn => fn({ ..._syncState }));
  });
}

export function getSyncState(): SyncState { return { ..._syncState }; }

export function subscribeSyncState(fn: Listener): () => void {
  listeners.add(fn);
  getPendingOps().then(ops => {
    fn({ ..._syncState, pendingCount: ops.length });
  });
  return () => listeners.delete(fn);
}

let _syncing = false;

export async function syncQueue(): Promise<void> {
  if (_syncing) return;
  if (!navigator.onLine) return;

  const ops = await getPendingOps();
  if (ops.length === 0) return;

  _syncing = true;
  _syncState = { ..._syncState, status: 'syncing', lastError: null };
  notifyListeners();

  let hadError = false;

  for (const op of ops) {
    try {
      await replayOperation(op);
      await removePendingOp(op.id);
    } catch (err) {
      hadError = true;
      await idbPut(STORE_OPS, { ...op, attempts: op.attempts + 1 });
      console.warn(`[OfflineQueue] Failed to sync op ${op.id} (${op.tag}):`, err);
      break;
    }
  }

  _syncing = false;
  _syncState = {
    ..._syncState,
    status: hadError ? 'error' : 'idle',
    lastSyncAt: hadError ? _syncState.lastSyncAt : Date.now(),
    lastError: hadError ? 'Ошибка синхронизации. Повторная попытка при следующем подключении.' : null,
  };
  notifyListeners();
}

window.addEventListener('online', () => {
  console.info('[OfflineQueue] Сеть восстановлена — начинаем синхронизацию...');
  syncQueue();
});

if (navigator.onLine) {
  syncQueue();
}

export async function offlineMutation<T>(
  method: HttpMethod,
  path: string,
  body: unknown | FormData | null,
  tag: string,
): Promise<T | null> {
  const isFormData = body instanceof FormData;
  const formDataEntries = isFormData ? await serializeFormData(body as FormData) : undefined;
  const serializedBody  = isFormData ? null : body;

  const opId = await enqueue({
    method,
    path,
    body: serializedBody,
    isFormData,
    formDataEntries,
    tag,
  });

  if (!navigator.onLine) {
    return null;
  }

  try {
    const base = BASE_URL || window.location.origin;
    const url = `${base}${path}`;
    const headers: Record<string, string> = { 'X-CSRFToken': getCsrfToken() };

    let fetchBody: BodyInit | undefined;
    if (isFormData) {
      fetchBody = body as FormData;
    } else if (body !== null && body !== undefined) {
      fetchBody = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }

    const resp = await fetch(url, {
      method,
      credentials: 'include',
      headers,
      body: fetchBody,
    });

    await removePendingOp(opId);

    if (resp.status === 204) return null;
    const data = await resp.json();
    if (!resp.ok) throw data;
    return data as T;
  } catch (err) {
    console.warn('[OfflineQueue] Запрос упал (онлайн), операция в очереди:', err);
    throw err;
  }
}
