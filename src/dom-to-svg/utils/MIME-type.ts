export const fileExtensionToMimeType: Record<string, string> = {
  woff: "application/font-woff",
  woff2: "application/font-woff",
  ttf: "application/font-truetype",
  eot: "application/vnd.ms-fontobject",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  webp: "image/webp",
};

export const getMimeTypeFromUrl = (url: string) => {
  const extension = /\.([^./]*?)$/g.exec(url);
  return (
    fileExtensionToMimeType[(extension ? extension[1] : "").toLowerCase()] || ""
  );
};
