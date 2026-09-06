const DB_NAME = 'postStudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'watermarks';

let dbPromise = null;

function getDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB database.'));
    };
  });

  return dbPromise;
}

/**
 * Save a watermark logo Blob to IndexedDB
 * @param {Object} param0 
 * @param {string} param0.name
 * @param {Blob} param0.blob
 * @param {string} param0.mimeType
 * @returns {Promise<Object>} The stored watermark record
 */
export async function saveWatermark({ name, blob, mimeType }) {
  const db = await getDB();
  const id = `wm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const record = {
    id,
    name: name || 'Untitled Watermark',
    blob,
    mimeType: mimeType || blob.type || 'image/png',
    createdAt: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(record);

    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error || new Error('Failed to save watermark.'));
  });
}

/**
 * Get all saved watermarks from IndexedDB
 * @returns {Promise<Array>} List of saved watermark records
 */
export async function getWatermarks() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result || [];
      // Sort newest first
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      resolve(results);
    };
    request.onerror = () => reject(request.error || new Error('Failed to retrieve watermarks.'));
  });
}

/**
 * Get a single watermark by its ID
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
export async function getWatermark(id) {
  if (!id) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error(`Failed to retrieve watermark ${id}.`));
  });
}

/**
 * Delete a watermark from IndexedDB
 * @param {string} id 
 * @returns {Promise<boolean>}
 */
export async function deleteWatermark(id) {
  if (!id) return false;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error || new Error(`Failed to delete watermark ${id}.`));
  });
}

/**
 * Renames an existing watermark record in IndexedDB
 * @param {string} id
 * @param {string} newName
 * @returns {Promise<Object>}
 */
export async function renameWatermark(id, newName) {
  if (!id || !newName) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const record = getRequest.result;
      if (!record) {
        reject(new Error(`Watermark ${id} not found.`));
        return;
      }
      record.name = newName.trim();
      const putRequest = store.put(record);
      putRequest.onsuccess = () => resolve(record);
      putRequest.onerror = () => reject(putRequest.error || new Error('Failed to update watermark name.'));
    };
    getRequest.onerror = () => reject(getRequest.error || new Error('Failed to fetch watermark for rename.'));
  });
}

/**
 * Clear all watermarks from IndexedDB
 * @returns {Promise<boolean>}
 */
export async function clearWatermarks() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error || new Error('Failed to clear watermarks.'));
  });
}
