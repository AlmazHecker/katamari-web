import { ElementHandler, ConversionOptions } from "../../types";
import { createImageFromDataUrl } from "../../utils/resource";
import { fetchAndCacheResource } from "../../utils/resource";
import { getMimeTypeFromUrl } from "../../utils/MIME-type.ts";

export class VideoHandler implements ElementHandler {
  async clone(
    element: HTMLVideoElement,
    options: ConversionOptions,
  ): Promise<Element> {
    if (element.currentSrc) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = element.clientWidth;
      canvas.height = element.clientHeight;
      if (context)
        context.drawImage(element, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL();
      return createImageFromDataUrl(dataUrl);
    }
    const posterUrl = element.poster;
    const mimeType = getMimeTypeFromUrl(posterUrl);
    const processedUrl = await fetchAndCacheResource(
      posterUrl,
      mimeType,
      options,
    );
    return createImageFromDataUrl(processedUrl);
  }
}
