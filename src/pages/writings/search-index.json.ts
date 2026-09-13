import type { APIRoute } from "astro";
import { staticDocumentCacheHeaders } from "../../lib/cache-headers";
import {
  getPublishedWritings,
  toWritingSearchDocument,
} from "../../lib/writings";

export const prerender = true;

export const GET: APIRoute = async () => {
  const entries = await getPublishedWritings();
  const documents = entries.map(toWritingSearchDocument);

  return new Response(JSON.stringify(documents), {
    headers: {
      ...staticDocumentCacheHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
};
