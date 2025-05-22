export function markCollidable(): void {
  const root = document.body;

  const skipTags = new Set([
    "DIV",
    "SECTION",
    "HEADER",
    "FOOTER",
    "MAIN",
    "NAV",
    "ASIDE",
    "ARTICLE",
    "CANVAS",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
  ]);

  const textEls: Node[] = [];

  const shouldAddChildren = (el: Node): boolean => {
    return (
      (el as HTMLElement).tagName !== undefined &&
      REPLACE_WORDS_IN.has((el as HTMLElement).tagName.toLowerCase())
    );
  };

  const buildTextEls = (el: Node, shouldAdd: boolean) => {
    if (
      (shouldAdd &&
        el.nodeType === Node.TEXT_NODE &&
        el.nodeValue?.trim().length) ??
      0 > 0
    ) {
      textEls.push(el);
      return;
    }
    if (!el.childNodes || (el as any).khIgnore) {
      return;
    }
    const newShouldAdd = shouldAddChildren(el);
    for (let i = 0, len = el.childNodes.length; i < len; i++) {
      buildTextEls(el.childNodes[i], newShouldAdd);
    }
  };

  const wordsToSpans = (textEl: Node) => {
    const p = textEl.parentNode;
    if (!p) return;

    const words = textEl.nodeValue?.split(/\s+/) ?? [];
    const ws = textEl.nodeValue?.split(/\S+/) ?? [];
    const len = Math.max(words.length, ws.length);

    if (ws.length > 0 && ws[0].length === 0) {
      ws.shift();
    }

    for (let i = 0; i < len; i++) {
      if (i < words.length && words[i].length > 0) {
        const n = document.createElement("span");
        n.innerHTML = words[i];
        n.setAttribute("data-sticky", "true");
        // n.style.width = "fit-content";
        p.insertBefore(n, textEl);
      }
      if (i < ws.length && ws[i].length > 0) {
        const n = document.createTextNode(ws[i]);
        p.insertBefore(n, textEl);
      }
    }
    p.removeChild(textEl);
  };

  const allElements = (root as HTMLElement).querySelectorAll("*");
  for (const el of allElements) {
    if (el.tagName.includes("-")) continue; // web components
    if (skipTags.has(el.tagName)) continue;
    if (
      el.childElementCount === 0 ||
      el instanceof HTMLImageElement ||
      el instanceof HTMLCanvasElement ||
      el instanceof SVGElement ||
      el.textContent?.trim()
    ) {
      el.setAttribute("data-sticky", "true");
    }
  }

  buildTextEls(root, shouldAddChildren(root));
  textEls.forEach(wordsToSpans);
}

const REPLACE_WORDS_IN = new Set([
  "a",
  "b",
  "big",
  "body",
  "cite",
  "code",
  "dd",
  "div",
  "dt",
  "em",
  "font",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "i",
  "label",
  "legend",
  "li",
  "p",
  "pre",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "td",
  "th",
  "tt",
]);
