import { ElementHandler, ConversionOptions } from "../../types";
import { fetchAndCacheResource } from "../../utils/resource";
import { isDataUrl, isInstanceOf } from "../../utils/dom";
import { getMimeTypeFromUrl } from "../../utils/MIME-type.ts";

export class ImageHandler implements ElementHandler {
  async clone(
    element: HTMLImageElement | SVGImageElement,
    options: ConversionOptions,
  ): Promise<Element> {
    try {
      const src = this.getImageSource(element);
      if (!src || isDataUrl(src)) {
        return element.cloneNode(true) as Element;
      }

      const mimeType = getMimeTypeFromUrl(src);
      const processedUrl = await fetchAndCacheResource(src, mimeType, options);

      const clone = element.cloneNode(false) as
        | HTMLImageElement
        | SVGImageElement;
      await this.setProcessedSource(clone, processedUrl);

      return clone;
    } catch (error) {
      console.error("Failed to clone image:", error);
      return element.cloneNode(false) as Element;
    }
  }

  private getImageSource(element: HTMLImageElement | SVGImageElement): string {
    if (isInstanceOf(element, HTMLImageElement)) {
      return element.src;
    }
    if (isInstanceOf(element, SVGImageElement)) {
      return element.href.baseVal;
    }

    // до сюда не должно дойти
    throw "";
  }

  private async setProcessedSource(
    element: HTMLImageElement | SVGImageElement,
    processedUrl: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      element.onload = () => resolve();
      element.onerror = () =>
        reject(new Error("Failed to load processed image"));

      if (isInstanceOf(element, HTMLImageElement)) {
        element.srcset = "";
        element.src = processedUrl;
        if (element.decode) {
          element.decode().catch(() => {});
        }
      } else {
        element.href.baseVal = processedUrl;
      }
    });
  }
}
