export const urlRegex = /url\((['"]?)([^'"]+?)\1\)/g;
export const fontSrcRegex =
  /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
export const fontUrlFormatRegex = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g;
