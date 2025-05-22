export interface ConversionOptions {
  includeStyles?: boolean;
  inlineStyles?: boolean;
  fontFormatPreference?: string;
  cacheBust?: boolean;
  fetchOptions?: RequestInit;
  fallbackUrl?: string;
  filter?: (element: Element) => boolean;

  width?: number;
  height?: number;
  [key: string]: any;
}

export interface ResourceCache {
  [key: string]: string;
}

export interface CssTextCache {
  [key: string]: { url: string; cssText: string };
}

export type CssTextCacheItem = CssTextCache[string];

export interface ElementHandler {
  clone(element: Element, options: ConversionOptions): Promise<Element>;
}
