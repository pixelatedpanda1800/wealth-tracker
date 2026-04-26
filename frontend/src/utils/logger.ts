const isDev = import.meta.env.DEV;

export const logger = {
  error: (message: string, ...args: unknown[]) => {
    if (isDev) console.error(`[error] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) console.warn(`[warn] ${message}`, ...args);
  },
  log: (message: string, ...args: unknown[]) => {
    if (isDev) console.log(`[log] ${message}`, ...args);
  },
};
