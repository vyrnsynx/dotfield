export const staticDocumentCacheHeaders = {
  "Cache-Control": "public, max-age=0, must-revalidate",
  "CDN-Cache-Control":
    "public, s-maxage=31536000, stale-while-revalidate=86400, stale-if-error=86400",
} as const;
