export interface DownloadProgress {
  progress: number;   // 0 to 1
  loaded: number;     // in bytes
  total: number;      // in bytes
  fromCache: boolean;
}

export type ProgressCallback = (progress: DownloadProgress) => void;

class ModelDownloadManager {
  private activeDownloads = new Map<string, Promise<string>>();
  private objectUrls = new Map<string, string>();
  private progressListeners = new Map<string, Set<ProgressCallback>>();
  private progressValues = new Map<string, DownloadProgress>();

  /**
   * Fetches the 3D model, caching it locally in the browser Cache Storage.
   * If already downloaded or in progress, it will reuse the existing cache or promise.
   * Reports download progress in real-time.
   */
  async getModel(url: string, onProgress?: ProgressCallback): Promise<string> {
    // 1. Check if already loaded in memory
    if (this.objectUrls.has(url)) {
      if (onProgress) {
        onProgress({ progress: 1, loaded: 0, total: 0, fromCache: true });
      }
      return this.objectUrls.get(url)!;
    }

    // 2. Register progress listener
    if (onProgress) {
      if (!this.progressListeners.has(url)) {
        this.progressListeners.set(url, new Set());
      }
      this.progressListeners.get(url)!.add(onProgress);
      // Immediately notify with current progress if download already started
      if (this.progressValues.has(url)) {
        onProgress(this.progressValues.get(url)!);
      }
    }

    // 3. Check if download is already in progress
    if (this.activeDownloads.has(url)) {
      return this.activeDownloads.get(url)!;
    }

    // 4. Start new download
    const downloadPromise = this.startDownload(url);
    this.activeDownloads.set(url, downloadPromise);
    
    try {
      const objectUrl = await downloadPromise;
      return objectUrl;
    } finally {
      // Clean up active download reference when finished/failed
      this.activeDownloads.delete(url);
    }
  }

  /**
   * Unsubscribes a callback from progress updates for a URL.
   */
  unsubscribe(url: string, onProgress: ProgressCallback) {
    const listeners = this.progressListeners.get(url);
    if (listeners) {
      listeners.delete(onProgress);
      if (listeners.size === 0) {
        this.progressListeners.delete(url);
      }
    }
  }

  /**
   * Forces a specific model to be re-fetched on next load, bypassing both
   * the in-memory map and Cache Storage.
   */
  async evictModel(url: string) {
    const objectUrl = this.objectUrls.get(url);
    if (objectUrl) {
      try { URL.revokeObjectURL(objectUrl); } catch {}
      this.objectUrls.delete(url);
    }
    this.progressValues.delete(url);
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('augmentable-model-cache-v2');
        await cache.delete(url);
      } catch {}
    }
  }

  /**
   * Revokes all generated Object URLs to prevent memory leaks.
   */
  clearMemory() {
    this.objectUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Failed to revoke object URL during clear:', e);
      }
    });
    this.objectUrls.clear();
    this.progressValues.clear();
  }

  private updateProgress(url: string, progressInfo: DownloadProgress) {
    this.progressValues.set(url, progressInfo);
    const listeners = this.progressListeners.get(url);
    if (listeners) {
      listeners.forEach(cb => {
        try {
          cb(progressInfo);
        } catch (e) {
          console.error('Error in progress listener:', e);
        }
      });
    }
  }

  private async startDownload(url: string): Promise<string> {
    const cacheName = 'augmentable-model-cache-v2';
    
    // Check Cache Storage first
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          let isCacheValid = true;
          try {
            // Perform a fast HEAD request to check if the server has a newer version.
            // Disable browser caching for the HEAD request to guarantee we check the origin server.
            const headResponse = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
            if (headResponse.ok) {
              const serverETag = headResponse.headers.get('etag');
              const serverLength = headResponse.headers.get('content-length');
              
              const cachedETag = cachedResponse.headers.get('etag');
              const cachedLength = cachedResponse.headers.get('content-length');
              
              if (serverETag && cachedETag) {
                isCacheValid = (serverETag === cachedETag);
              } else if (serverLength && cachedLength) {
                isCacheValid = (parseInt(serverLength, 10) === parseInt(cachedLength, 10));
              }
            }
          } catch (headError) {
            console.warn('Failed to perform HEAD validation, assuming cache is valid:', headError);
            isCacheValid = true;
          }

          if (isCacheValid) {
            const blob = await cachedResponse.blob();
            const objectUrl = URL.createObjectURL(blob);
            this.objectUrls.set(url, objectUrl);
            this.updateProgress(url, { progress: 1, loaded: blob.size, total: blob.size, fromCache: true });
            return objectUrl;
          } else {
            console.log(`Cache invalidated for ${url}. Re-downloading from server...`);
          }
        }
      } catch (e) {
        console.warn('Cache Storage match failed, falling back to network fetch:', e);
      }
    }

    this.updateProgress(url, { progress: 0, loaded: 0, total: 0, fromCache: false });

    // Fetch from network with progress (retry up to 3 times with backoff)
    let response: Response | null = null;
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetch(url);
        if (response.ok) break;
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (e) {
        lastError = e as Error;
      }
      if (attempt < 2) await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
    }
    if (!response || !response.ok) {
      throw lastError ?? new Error(`Failed to fetch model after 3 attempts`);
    }

    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    
    let blob: Blob;

    if (total === 0 || !response.body) {
      // Fallback if content-length is missing or body is not readable
      blob = await response.blob();
      this.updateProgress(url, { progress: 1, loaded: blob.size, total: blob.size, fromCache: false });
    } else {
      const reader = response.body.getReader();
      let loaded = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          this.updateProgress(url, { progress: loaded / total, loaded, total, fromCache: false });
        }
      }
      blob = new Blob(chunks, { type: 'model/gltf-binary' });
    }

    // Save to Cache Storage for future loads
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open(cacheName);
        const headers: Record<string, string> = {
          'Content-Type': 'model/gltf-binary',
          'Content-Length': blob.size.toString()
        };
        if (etag) headers['ETag'] = etag;
        if (lastModified) headers['Last-Modified'] = lastModified;

        await cache.put(url, new Response(blob.slice(), { headers }));
      } catch (e) {
        console.warn('Cache Storage save failed:', e);
      }
    }

    const objectUrl = URL.createObjectURL(blob);
    this.objectUrls.set(url, objectUrl);
    return objectUrl;
  }
}

export const modelDownloadManager = new ModelDownloadManager();

// Delete old cache versions on startup so stale models are never served
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      if (name.startsWith('augmentable-model-cache-') && name !== 'augmentable-model-cache-v2') {
        caches.delete(name);
      }
    });
  }).catch(() => {});
}
