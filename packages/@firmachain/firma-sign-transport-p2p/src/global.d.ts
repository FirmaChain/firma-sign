// Global type declarations for P2P Transport
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      CustomEvent?: typeof CustomEvent;
    }
  }
}

export {};