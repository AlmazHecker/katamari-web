import { arraify, isDataUrl, isInstanceOf } from "../utils/dom.ts";
import { CssProcessor } from "../services/css-processor.ts";
import { fetchAndCacheResource } from "../utils/resource.ts";
import { getMimeTypeFromUrl } from "../utils/MIME-type.ts";

export class SvgGenerator {
  processElement = async (element: Element, options: any) => {
    if (isInstanceOf(element, HTMLElement)) {
      await this.processBackgroundAndMask(element, options);
      await this.processElementReferences(element, options);
      await this.processChildElements(element, options);
    }
  };

  processBackgroundAndMask = async (element: HTMLElement, options: any) => {
    (await CssProcessor.processStyleProperty("background", element, options)) ||
      (await CssProcessor.processStyleProperty(
        "background-image",
        element,
        options,
      ));
    (await CssProcessor.processStyleProperty("mask", element, options)) ||
      (await CssProcessor.processStyleProperty("mask-image", element, options));
  };

  async processElementReferences(element: Element, options: any) {
    const isImg = isInstanceOf(element, HTMLImageElement);
    const isSvgImg = isInstanceOf(element, SVGImageElement);
    if (
      (isImg && !isDataUrl(element.src)) ||
      (isSvgImg && !isDataUrl(element.href.baseVal))
    ) {
      const src = isImg ? element.src : element.href.baseVal;
      const processedUrl = await fetchAndCacheResource(
        src,
        getMimeTypeFromUrl(src),
        options,
      );

      await new Promise((resolve, reject) => {
        element.onload = resolve;
        element.onerror = reject;
        if (element instanceof HTMLImageElement && element.decode) {
          element.onload = () => {
            element.decode().then(() => requestAnimationFrame(resolve));
          };
          element.decoding = "sync";
        }
        if (element instanceof HTMLImageElement && element.loading === "lazy") {
          element.loading = "eager";
        }

        if (isImg) {
          element.srcset = "";
          element.src = processedUrl;
        } else {
          element.href.baseVal = processedUrl;
        }
      });
    }
  }

  async processChildElements(element: Element, options: any) {
    const children = arraify<Element>(element.childNodes).map((child) =>
      this.processElement(child, options),
    );
    await Promise.all(children);
  }

  // additional step to add some custom styling
  applyStylesToClone(element: HTMLElement, styles: Record<string, string>) {
    const style = element.style;
    styles.backgroundColor && (style.backgroundColor = styles.backgroundColor);
    styles.width && (style.width = `${styles.width}px`);
    styles.height && (style.height = `${styles.height}px`);
    const additionalStyles = styles.style;
    additionalStyles != null &&
      Object.keys(additionalStyles).forEach((property) => {
        // @ts-ignore
        style[property] = additionalStyles[property];
      });
  }

  async createSvgWithForeignObject(
    element: HTMLElement,
    width: number,
    height: number,
  ) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const foreignObject = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "foreignObject",
    );
    svg.setAttribute("width", `${width}`);
    svg.setAttribute("height", `${height}`);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    foreignObject.setAttribute("width", "100%");
    foreignObject.setAttribute("height", "100%");
    foreignObject.setAttribute("x", "0");
    foreignObject.setAttribute("y", "0");
    foreignObject.setAttribute("externalResourcesRequired", "true");
    svg.appendChild(foreignObject);
    foreignObject.appendChild(element);
    return await this.serializeSvgToString(svg);
  }

  async serializeSvgToString(element: Element) {
    const serialized = new XMLSerializer().serializeToString(element);
    const encoded = encodeURIComponent(serialized);
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  }
}
