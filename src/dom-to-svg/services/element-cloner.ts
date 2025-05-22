import { ConversionOptions, ElementHandler } from "../types";
import { BaseHandler } from "../strategies/element-handlers/base-handler";
import { isInstanceOf, arraify } from "../utils/dom";
import {
  isHTMLInputElement,
  isHTMLTextAreaElement,
  isHTMLSelectElement,
} from "../utils/type-guards";

export class ElementCloner {
  private readonly handlers: Record<string, ElementHandler>;
  private readonly baseHandler: BaseHandler;

  constructor(handlers: Record<string, ElementHandler> = {}) {
    this.baseHandler = new BaseHandler();
    this.handlers = {
      ...this.baseHandler.getHandlers(),
      ...handlers,
    };
  }

  async clone(
    element: Element,
    options: ConversionOptions,
    deep = true,
  ): Promise<HTMLElement | undefined> {
    if (!(deep || !options.filter || options.filter(element))) return undefined;

    const clonedElement = await this.createElementClone(element, options);
    const processedClone = await this.processCloneChildren(
      element,
      clonedElement,
      options,
    );

    if (isInstanceOf(processedClone, HTMLElement)) {
      this.applyComputedStyles(element, processedClone);
      this.clonePseudoElementStyle(element, processedClone, ":before");
      this.clonePseudoElementStyle(element, processedClone, ":after");

      if (isHTMLTextAreaElement(element)) {
        (processedClone as HTMLTextAreaElement).innerHTML = element.value;
      }

      if (isHTMLInputElement(element)) {
        processedClone.setAttribute("value", element.value);
      }

      if (isHTMLSelectElement(element)) {
        this.syncSelectElementValue(element, processedClone);
      }
    }

    return this.processSvgUseElements(processedClone, options);
  }

  private async createElementClone(
    element: Element,
    options: ConversionOptions,
  ): Promise<Element> {
    const tagName = element.tagName?.toLowerCase?.();
    const handler = this.handlers[tagName] || this.baseHandler;
    return handler.clone(element, options);
  }

  private async processCloneChildren(
    original: Element,
    clone: Element,
    options: ConversionOptions,
  ): Promise<Element> {
    let children: Element[] = [];

    if (
      original.tagName?.toUpperCase?.() === "SLOT" &&
      "assignedNodes" in original
    ) {
      children = arraify((original as HTMLSlotElement).assignedNodes());
    } else if (isInstanceOf(original, HTMLIFrameElement)) {
      const doc = original.contentDocument;
      if (doc?.body) children = arraify(doc.body.childNodes);
    } else {
      const root = (original.shadowRoot ?? original) as ParentNode;
      children = arraify(root.childNodes);
    }

    if (children.length === 0 || isInstanceOf(original, HTMLVideoElement)) {
      return clone;
    }

    await children.reduce(async (promise, child) => {
      await promise;
      const clonedChild = await this.clone(child, options, false);
      if (clonedChild) clone.appendChild(clonedChild);
    }, Promise.resolve());

    return clone;
  }

  applyComputedStyles(original: Element, clone: HTMLElement) {
    const cloneStyle = clone.style;
    if (!cloneStyle) return;

    const originalStyles = window.getComputedStyle(original);

    if (originalStyles.cssText) {
      cloneStyle.cssText = originalStyles.cssText;
      cloneStyle.transformOrigin = originalStyles.transformOrigin;
    } else {
      arraify<string>(originalStyles).forEach((property) => {
        let value = originalStyles.getPropertyValue(property);
        if (property === "font-size" && value.endsWith("px")) {
          value = `${Math.floor(parseFloat(value.slice(0, -2))) - 0.1}px`;
        }
        if (
          isInstanceOf(original, HTMLIFrameElement) &&
          property === "display" &&
          value === "inline"
        ) {
          value = "block";
        }
        if (property === "d" && clone.getAttribute("d")) {
          value = `path(${clone.getAttribute("d")})`;
        }
        cloneStyle.setProperty(
          property,
          value,
          originalStyles.getPropertyPriority(property),
        );
      });
    }
  }

  clonePseudoElementStyle(
    element: Element,
    clone: HTMLElement,
    pseudoSelector: string,
  ) {
    const computedStyle = window.getComputedStyle(element, pseudoSelector);
    const content = computedStyle.getPropertyValue("content");
    if (content !== "" && content !== "none") {
      const className = generateUniqueClassName();
      try {
        clone.className = `${clone.className} ${className}`;
      } catch {
        return;
      }
      const styleElement = document.createElement("style");
      const appendChild = styleElement.appendChild;
      const selector = `.${className}:${pseudoSelector}`;
      let cssText;
      if (computedStyle.cssText) {
        const contentValue = computedStyle.getPropertyValue("content");
        cssText = `${computedStyle.cssText} content: '${contentValue.replace(/'|"/g, "")}';`;
      } else {
        cssText = this.getComputedStyleAsText(computedStyle);
      }
      const textNode = document.createTextNode(`${selector}{${cssText}}`);
      appendChild.call(styleElement, textNode);
      clone.appendChild(styleElement);
    }
  }

  getComputedStyleAsText(styleDeclaration: CSSStyleDeclaration) {
    return arraify<string>(styleDeclaration)
      .map((property) => {
        const value = styleDeclaration.getPropertyValue(property);
        const priority = styleDeclaration.getPropertyPriority(property);
        return `${property}: ${value}${priority ? " !important" : ""};`;
      })
      .join(" ");
  }

  syncSelectElementValue(original: HTMLSelectElement, clone: HTMLElement) {
    if (isInstanceOf(original, HTMLSelectElement)) {
      const selectedOption = Array.from(clone.children).find(
        (option) => original.value === option.getAttribute("value"),
      );
      selectedOption && selectedOption.setAttribute("selected", "");
    }
  }

  async processSvgUseElements(element: Element, options: any) {
    const uses = element.querySelectorAll
      ? element.querySelectorAll("use")
      : [];
    if (uses.length === 0) return element as HTMLElement;

    const defsCache: Record<string, Element> = {};
    for (let i = 0; i < uses.length; i++) {
      const href = uses[i].getAttribute("xlink:href");
      if (!href) continue;

      const localDef = element.querySelector(href);
      const globalDef = document.querySelector(href);

      if (!localDef && globalDef && !defsCache[href]) {
        defsCache[href] = (await this.clone(globalDef, options, true))!;
      }
    }
  }

  // ... (other methods remain the same)
}

const generateUniqueClassName = (() => {
  let counter = 0;
  return () => {
    counter += 1;
    return `u${`0000${((Math.random() * 36 ** 4) << 0).toString(36)}`.slice(
      -4,
    )}${counter}`;
  };
})();
