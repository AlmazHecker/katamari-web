import { ElementHandler, ConversionOptions } from "../../types";
import { CanvasHandler } from "./canvas-handler";
import { VideoHandler } from "./video-handler";
import { IframeHandler } from "./iframe-handler";
import { ImageHandler } from "./image-handler";

export class BaseHandler implements ElementHandler {
  private readonly defaultHandlers: Record<string, ElementHandler>;

  constructor() {
    this.defaultHandlers = {
      canvas: new CanvasHandler(),
      video: new VideoHandler(),
      iframe: new IframeHandler(),
      img: new ImageHandler(),
      image: new ImageHandler(), // For SVGImageElement
    };
  }

  async clone(element: Element, options: ConversionOptions): Promise<Element> {
    const handler = this.getHandlerForElement(element);
    return handler
      ? handler.clone(element as any, options)
      : (element.cloneNode(false) as Element);
  }

  getHandlers(): Record<string, ElementHandler> {
    return this.defaultHandlers;
  }

  private getHandlerForElement(element: Element): ElementHandler | null {
    const tagName = element.tagName?.toLowerCase?.();
    return this.defaultHandlers[tagName] || null;
  }
}
