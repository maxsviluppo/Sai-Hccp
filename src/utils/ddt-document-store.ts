const DB_NAME = 'haccp_ddt_documents_v1';
const STORE = 'blobs';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function ddtDocumentStorageKey(clientId: string, docId: string): string {
  return `${clientId}::${docId}`;
}

export async function saveDdtDocumentBlob(storageKey: string, dataUrl: string): Promise<void> {
  const blob = await fetch(dataUrl).then(r => r.blob());
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, storageKey);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getDdtDocumentBlob(storageKey: string): Promise<Blob | null> {
  const db = await openDb();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(storageKey);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}

export async function getDdtDocumentObjectUrl(storageKey: string): Promise<string | null> {
  const blob = await getDdtDocumentBlob(storageKey);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function deleteDdtDocumentBlob(storageKey: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(storageKey);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
