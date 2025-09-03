// Polyfill CustomEvent for Node.js environment
if (typeof globalThis.CustomEvent === 'undefined') {
  class CustomEventPolyfill extends Event {
    detail: unknown;
    constructor(event: string, params?: { detail?: unknown; bubbles?: boolean; cancelable?: boolean; composed?: boolean }) {
      super(event, params);
      this.detail = params?.detail;
    }
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  (globalThis as any).CustomEvent = CustomEventPolyfill;
}