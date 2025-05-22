export function isHTMLInputElement(
  element: unknown,
): element is HTMLInputElement {
  return element instanceof HTMLInputElement;
}

export function isHTMLTextAreaElement(
  element: unknown,
): element is HTMLTextAreaElement {
  return element instanceof HTMLTextAreaElement;
}

export function isHTMLSelectElement(
  element: unknown,
): element is HTMLSelectElement {
  return element instanceof HTMLSelectElement;
}
