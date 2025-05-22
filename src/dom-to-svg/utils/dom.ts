import { ConversionOptions } from "../types.ts";

export function getElementDimensions(
  element: HTMLElement,
  options: ConversionOptions
) {
  let width = options.width;
  if (!width) {
    const leftBorder = getStylePixelValue(element, "border-left-width");
    const rightBorder = getStylePixelValue(element, "border-right-width");
    width = element.clientWidth + leftBorder + rightBorder;
  }

  let height = options.height;
  if (!height) {
    const topBorder = getStylePixelValue(element, "border-top-width");
    const bottomBorder = getStylePixelValue(element, "border-bottom-width");
    height = element.clientHeight + topBorder + bottomBorder;
  }

  return { width, height };
}

export function getStylePixelValue(element: HTMLElement, property: string) {
  // iframe & top level window handling
  const style = (element.ownerDocument.defaultView || window).getComputedStyle(
    element
  );
  const value = style.getPropertyValue(property);
  return value ? parseFloat(value.replace("px", "")) : 0;
}

export function arraify<T>(nodes: unknown): T[] {
  const array: T[] = [];
  for (let i = 0, length = (nodes as unknown[]).length; i < length; i++)
    array.push((nodes as unknown[])[i] as T);
  return array;
}

export function isDataUrl(url: string): boolean {
  return url.search(/^(data:)/) !== -1;
}

export const isInstanceOf = <T>(
  element: unknown,
  constructor: new (...args: any[]) => T
): element is T => {
  if (element instanceof constructor) return true;
  let proto = Object.getPrototypeOf(element);
  while (proto !== null) {
    if (proto.constructor === constructor) return true;
    proto = Object.getPrototypeOf(proto);
  }
  if (element?.constructor.name === constructor.name) return true;
  return false;
};

// WARNING! The isInstance below makes iframe copy pixel perfect but causes slowdowns.
// export const isInstanceOf = (element: any, constructor: any) => {
//   if (element instanceof constructor) return true;
//   const prototype = Object.getPrototypeOf(element);
//   return prototype === null
//     ? false
//     : prototype.constructor.name === constructor.name ||
//     isInstanceOf(prototype, constructor);
// };
