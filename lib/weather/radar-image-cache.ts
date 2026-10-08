import { blueRadarBlob } from './radar-palette';

export type RadarImage = { url: string; bytes: number; dispose: () => void };
export type RadarImageLoader = (
  url: string,
  signal: AbortSignal,
) => Promise<RadarImage>;

type Job = {
  url: string;
  controller: AbortController;
  promise: Promise<RadarImage>;
  resolve: (image: RadarImage) => void;
  reject: (error: unknown) => void;
};

/** A bounded, priority-aware image buffer. No background traffic after closing. */
export class RadarImageCache {
  private images = new Map<string, RadarImage>();
  private jobs = new Map<string, Job>();
  private queue: Job[] = [];
  private active = 0;
  private pinned: string | null = null;

  constructor(
    private loader: RadarImageLoader,
    private maxBytes = 16 * 1024 * 1024,
    private concurrency = 2,
  ) {}

  has(url: string): boolean {
    return this.images.has(url);
  }

  pin(url: string | null): void {
    this.pinned = url;
    this.evict();
  }

  load(url: string, priority = false): Promise<RadarImage> {
    const cached = this.images.get(url);
    if (cached) {
      this.images.delete(url);
      this.images.set(url, cached);
      return Promise.resolve(cached);
    }
    const existing = this.jobs.get(url);
    if (existing) {
      if (priority) {
        const index = this.queue.indexOf(existing);
        if (index >= 0) {
          this.queue.splice(index, 1);
          this.queue.unshift(existing);
        }
      }
      return existing.promise;
    }
    let resolve!: Job['resolve'];
    let reject!: Job['reject'];
    const promise = new Promise<RadarImage>((yes, no) => {
      resolve = yes;
      reject = no;
    });
    const job: Job = {
      url,
      controller: new AbortController(),
      promise,
      resolve,
      reject,
    };
    this.jobs.set(url, job);
    if (priority) this.queue.unshift(job);
    else this.queue.push(job);
    this.pump();
    return promise;
  }

  /** Drop obsolete work when scrubbing or moving the map; retain decoded frames. */
  retainRequests(urls: Set<string>): void {
    this.queue = this.queue.filter((job) => {
      if (urls.has(job.url)) return true;
      this.jobs.delete(job.url);
      job.reject(new DOMException('Obsolete radar frame', 'AbortError'));
      return false;
    });
    for (const job of this.jobs.values()) {
      if (!urls.has(job.url)) {
        this.jobs.delete(job.url);
        job.controller.abort();
        job.reject(new DOMException('Obsolete radar frame', 'AbortError'));
      }
    }
  }

  stop(): void {
    this.retainRequests(new Set());
    this.pin(null);
  }

  clear(): void {
    this.stop();
    for (const image of this.images.values()) image.dispose();
    this.images.clear();
  }

  private pump(): void {
    while (this.active < this.concurrency && this.queue.length) {
      const job = this.queue.shift()!;
      this.active++;
      void this.loader(job.url, job.controller.signal)
        .then(
          (image) => {
            if (job.controller.signal.aborted) {
              image.dispose();
              return;
            }
            this.images.set(job.url, image);
            this.evict(job.url);
            job.resolve(image);
          },
          (error) => job.reject(error),
        )
        .finally(() => {
          if (this.jobs.get(job.url) === job) this.jobs.delete(job.url);
          this.active--;
          this.pump();
        });
    }
  }

  private evict(protectedUrl?: string): void {
    let bytes = [...this.images.values()].reduce(
      (total, image) => total + image.bytes,
      0,
    );
    for (const [url, image] of this.images) {
      if (bytes <= this.maxBytes && this.images.size <= 24) break;
      if (url === this.pinned || url === protectedUrl) continue;
      this.images.delete(url);
      image.dispose();
      bytes -= image.bytes;
    }
  }
}

export async function loadRadarImage(
  url: string,
  signal: AbortSignal,
): Promise<RadarImage> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 12_000);
  let objectUrl: string | null = null;
  try {
    signal.throwIfAborted();
    const response = await fetch(url, { signal: controller.signal });
    if (
      !response.ok ||
      !response.headers.get('content-type')?.includes('image/')
    )
      throw new Error('Radar image unavailable');
    objectUrl = URL.createObjectURL(await response.blob());
    const image = new Image();
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      const aborted = () => reject(controller.signal.reason);
      controller.signal.addEventListener('abort', aborted, { once: true });
      void image
        .decode()
        .then(resolve, reject)
        .finally(() => {
          controller.signal.removeEventListener('abort', aborted);
        });
      if (controller.signal.aborted) aborted();
    });
    controller.signal.throwIfAborted();
    const blueImage = await blueRadarBlob(image, controller.signal);
    URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(blueImage);
    const resultUrl = objectUrl;
    return {
      url: resultUrl,
      bytes: image.naturalWidth * image.naturalHeight * 4,
      dispose: () => URL.revokeObjectURL(resultUrl),
    };
  } catch (error) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    if (controller.signal.aborted && !signal.aborted)
      throw new Error('Radar image request timed out');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}
