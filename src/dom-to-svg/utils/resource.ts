import { resourceCache } from "../utils/cache.ts";

interface FetchTransformParams {
  response: Response;
  result: string | ArrayBuffer | null;
}

type FetchTransform<T = any> = (params: FetchTransformParams) => T;

export const fetchWithOptions = async <T = any>(
  url: string,
  options: RequestInit,
  transform: FetchTransform<T>,
): Promise<T> => {
  const response = await fetch(url, options);
  if (response.status === 404) {
    throw new Error(`Resource not found: ${response.url}`);
  }

  const blob = await response.blob();

  return new Promise<T>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read blob data"));
    reader.onloadend = () => {
      try {
        resolve(
          transform({
            response,
            result: reader.result,
          }),
        );
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsDataURL(blob);
  });
};

export const fetchAndCacheResource = async (
  url: string,
  mimeType: string,
  options: any,
) => {
  const cacheKey = getResourceCacheKey(url, mimeType, options.cacheBustingKey);
  if (resourceCache.get(cacheKey) != null) return resourceCache.get(cacheKey);

  if (options.cacheBust) {
    url += (/\?/.test(url) ? "&" : "?") + Date.now();
  }

  let result;
  try {
    const data = await fetchWithOptions(
      url,
      options.fetchOptions,
      ({ response, result }) => {
        if (!mimeType) mimeType = response.headers.get("Content-Type") || "";
        return result.split(",")[1];
      },
    );
    result = `data:${mimeType};base64,${data}`;
  } catch {
    result = options.fallbackUrl || "";
  }

  resourceCache.set(cacheKey, result);
  return result;
};

const getResourceCacheKey = (
  url: string,
  mimeType: string,
  cacheKeyPrefix: string,
) => {
  let key = url.replace(/\?.*/, "");
  cacheKeyPrefix && (key = url);
  /ttf|otf|eot|woff2?/i.test(key) && (key = key.replace(/.*\//, ""));
  return mimeType ? `[${mimeType}]${key}` : key;
};

export const createImageFromDataUrl = (
  dataUrl: string,
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decode = async () => resolve(image);
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.src = dataUrl;
  });
};
