import { ElementHandler, ConversionOptions } from "../../types";
import { createImageFromDataUrl } from "../../utils/resource.ts";

export class CanvasHandler implements ElementHandler {
  async clone(
    element: HTMLCanvasElement,
    _options: ConversionOptions,
  ): Promise<Element> {
    try {
      const dataUrl = element.toDataURL();
      return dataUrl === "data:,"
        ? (element.cloneNode(false) as Element)
        : await createImageFromDataUrl(dataUrl);
    } catch (error) {
      console.error("Failed to clone canvas:", error);
      return element.cloneNode(false) as Element;
    }
  }
}
