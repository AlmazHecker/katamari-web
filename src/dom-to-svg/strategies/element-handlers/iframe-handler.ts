import { ElementHandler, ConversionOptions } from "../../types";
import { ElementCloner } from "../../services/element-cloner";

export class IframeHandler implements ElementHandler {
  async clone(
    element: HTMLIFrameElement,
    _options: ConversionOptions,
  ): Promise<Element> {
    try {
      // Try to clone iframe content
      const contentClone = await this.cloneIframeContent(element);
      if (contentClone) return contentClone;

      throw new Error("UNABLE TO CLONE IFRAME!");
      // Fallback to basic clone
      // return element.cloneNode(false) as Element;
    } catch (error) {
      console.error("Failed to clone iframe:", error);
      throw null;
    }
  }

  private async cloneIframeContent(
    iframe: HTMLIFrameElement,
  ): Promise<Element | undefined> {
    try {
      const body = iframe.contentDocument?.body;
      if (!body) return;

      const cloner = new ElementCloner();
      return await cloner.clone(body, {}, true);
    } catch {
      return;
    }
  }
}
