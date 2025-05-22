import { urlRegex, fontSrcRegex, fontUrlFormatRegex } from "../utils/regex";
import { arraify, isDataUrl } from "../utils/dom";
import { cssTextCache } from "../utils/cache";
import { ConversionOptions, CssTextCache, CssTextCacheItem } from "../types";
import { fetchAndCacheResource, fetchWithOptions } from "../utils/resource.ts";
import { getMimeTypeFromUrl } from "../utils/MIME-type.ts";

export class CssProcessor {
  async processStyles(element: Element, options: ConversionOptions) {
    const processedCss =
      options.includeStyles !== false
        ? options.inlineStyles
          ? null
          : await this.getProcessedStyles(element, options)
        : null;

    if (processedCss) {
      const styleElement = document.createElement("style");
      styleElement.appendChild(document.createTextNode(processedCss));
      element.firstChild
        ? element.insertBefore(styleElement, element.firstChild)
        : element.appendChild(styleElement);
    }
  }

  private async getProcessedStyles(
    element: Element,
    options: ConversionOptions,
  ) {
    const styleSheets = await this.collectStyleSheets(element, options);
    const styles = await Promise.all(
      styleSheets.map((sheet) =>
        CssProcessor.processUrlsInCss(
          sheet.cssText,
          sheet.parentStyleSheet?.href || null,
          options,
        ),
      ),
    );
    return styles.join("\n");
  }

  private async collectStyleSheets(
    element: Element,
    options: ConversionOptions,
  ) {
    if (!element.ownerDocument) throw Error("No owner document");
    const sheets = arraify<CSSStyleSheet>(element.ownerDocument.styleSheets);
    const rules = await this.processStyleSheets(sheets, options);
    return this.filterFontFaceRules(rules);
  }

  private static async processUrlsInCss(
    cssText: string,
    baseUrl: string | null,
    options: ConversionOptions,
  ) {
    if (cssText.search(urlRegex) === -1) return cssText;
    const filteredCss = this.filterFontSources(
      cssText,
      options.fontFormatPreference!,
    );
    return await this.extractUrlsFromCss(filteredCss).reduce(
      (promise, url) =>
        promise.then((currentCss) =>
          this.replaceUrlInCss(currentCss, url, baseUrl, options),
        ),
      Promise.resolve(filteredCss),
    );
  }

  private static async replaceUrlInCss(
    cssText: string,
    originalUrl: string,
    baseUrl: string | null,
    options: ConversionOptions,
  ) {
    try {
      const absoluteUrl = baseUrl
        ? new URL(originalUrl, baseUrl).toString()
        : originalUrl;
      const mimeType = getMimeTypeFromUrl(originalUrl);
      const processedUrl = await fetchAndCacheResource(
        absoluteUrl,
        mimeType,
        options,
      );
      return cssText.replace(
        new RegExp(
          `(url\\(['"]?)(${originalUrl.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1")})(['"]?\\))`,
          "g",
        ),
        `$1${processedUrl}$3`,
      );
    } catch {
      return cssText;
    }
  }

  processStyleSheets = async (styleSheets: CSSStyleSheet[], options: any) => {
    const rules: CSSStyleRule[] = [];
    const tasks: Promise<CssTextCacheItem>[] = [];

    styleSheets.forEach((sheet) => {
      if ("cssRules" in sheet) {
        try {
          arraify<CSSImportRule>(sheet.cssRules || []).forEach(
            (rule, index) => {
              if (rule.type === CSSRule.IMPORT_RULE) {
                let insertIndex = index + 1;
                const task = this.fetchCssText(rule.href)
                  .then((css) => this.processImportedCss(css, options))
                  .then((css) =>
                    this.parseCssRules(css).forEach((parsedRule) => {
                      try {
                        sheet.insertRule(
                          parsedRule,
                          parsedRule.startsWith("@import")
                            ? (insertIndex += 1)
                            : sheet.cssRules.length,
                        );
                      } catch {}
                    }),
                  )
                  .catch(() => {});
                tasks.push(task as Promise<CssTextCacheItem>);
              }
            },
          );
        } catch {
          const defaultSheet =
            styleSheets.find((s) => s.href == null) || document.styleSheets[0];
          if (sheet.href != null) {
            const task = this.fetchCssText(sheet.href)
              .then((css) => this.processImportedCss(css, options))
              .then((css) =>
                this.parseCssRules(css).forEach((rule) => {
                  defaultSheet.insertRule(rule, sheet.cssRules.length);
                }),
              )
              .catch(() => {});
            tasks.push(task);
          }
        }
      }
    });

    await Promise.all(tasks);

    styleSheets.forEach((sheet) => {
      if ("cssRules" in sheet) {
        try {
          arraify<CSSStyleRule>(sheet.cssRules || []).forEach((rule) =>
            rules.push(rule),
          );
        } catch {}
      }
    });

    return rules;
  };

  async fetchCssText(url: string): Promise<CssTextCacheItem> {
    if (cssTextCache.get(url) != null) return cssTextCache.get(url)!;
    const response = await fetch(url);
    const text = await response.text();
    const result = { url, cssText: text };
    cssTextCache.set(url, result);
    return result;
  }

  filterFontFaceRules(rules: CSSStyleRule[]) {
    return rules
      .filter((rule) => rule.type === CSSRule.FONT_FACE_RULE)
      .filter(
        (rule) => rule.style.getPropertyValue("src").search(urlRegex) !== -1,
      );
  }

  async processImportedCss(cssInfo: CssTextCache[number], options: any) {
    let css = cssInfo.cssText;
    const urlRegex = /url\(["']?([^"')]+)["']?\)/g;
    const matches = css.match(/url\([^)]+\)/g) || [];

    const promises = matches.map(async (match) => {
      let rawUrl = match.replace(urlRegex, "$1");
      if (!rawUrl.startsWith("https://")) {
        rawUrl = new URL(rawUrl, cssInfo.url).href;
      }

      const { result: newUrl } = await fetchWithOptions(
        rawUrl,
        options.fetchOptions,
        ({ result }) => ({ result }),
      );

      css = css.replace(match, `url(${newUrl})`);
      return [match, newUrl];
    });

    await Promise.all(promises);
    return css;
  }

  parseCssRules(cssText: string) {
    if (cssText == null) return [];
    const rules = [];
    cssText = cssText.replace(/(\/\*[\s\S]*?\*\/)/gi, "");

    // Parse keyframes
    const keyframesRegex = /((@.*?keyframes [\s\S]*?){([\s\S]*?}\s*?)})/gi;
    while (true) {
      const match = keyframesRegex.exec(cssText);
      if (match === null) break;
      rules.push(match[0]);
    }
    cssText = cssText.replace(keyframesRegex, "");

    // Parse imports and other rules
    const importsRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
    const generalRuleRegex =
      /((\s*?(?:\/\*[\s\S]*?\*\/)?\s*?@media[\s\S]*?){([\s\S]*?)}\s*?})|(([\s\S]*?){([\s\S]*?)})/gi;

    while (true) {
      let match = importsRegex.exec(cssText);
      if (match === null) {
        match = generalRuleRegex.exec(cssText);
        if (match === null) break;
        else importsRegex.lastIndex = generalRuleRegex.lastIndex;
      } else {
        generalRuleRegex.lastIndex = importsRegex.lastIndex;
      }
      rules.push(match[0]);
    }

    return rules;
  }

  private static filterFontSources(
    cssText: string,
    preferredFormat: string | null,
  ) {
    return preferredFormat
      ? cssText.replace(fontSrcRegex, (match) => {
          for (;;) {
            const [fullMatch, , format] = fontUrlFormatRegex.exec(match) || [],
              urlMatch = fullMatch,
              fontFormat = format;
            if (!fontFormat) return "";
            if (fontFormat === preferredFormat) return `src: ${urlMatch};`;
          }
        })
      : cssText;
  }

  private static extractUrlsFromCss(cssText: string): string[] {
    const urls: string[] = [];
    cssText.replace(urlRegex, (match: string, _quote: string, url: string) => {
      urls.push(url);
      return match;
    });
    return urls.filter((url) => !isDataUrl(url));
  }

  static async processStyleProperty(
    property: string,
    element: HTMLElement,
    options: any,
  ) {
    const value = element.style?.getPropertyValue(property);
    if (!value) return false;
    const result = await this.processUrlsInCss(value, null, options);
    element.style.setProperty(
      property,
      result,
      element.style.getPropertyPriority(property),
    );
    return true;
  }

  // ... (other private methods from original code)
}
