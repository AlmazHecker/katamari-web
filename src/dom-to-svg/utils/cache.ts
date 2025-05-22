import { CssTextCache } from "@/dom-to-svg/types.ts";

export const createCache = <T extends Record<string, unknown>>() => {
  const cache: Partial<T> = {};
  return {
    get<K extends keyof T>(key: K): T[K] | undefined {
      return cache[key];
    },
    set<K extends keyof T>(key: K, value: T[K]): void {
      cache[key] = value;
    },
    has<K extends keyof T>(key: K): boolean {
      return key in cache;
    },
  };
};

export const resourceCache = createCache();
export const cssTextCache = createCache<CssTextCache>();
