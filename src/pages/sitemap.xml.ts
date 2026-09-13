import type { APIRoute } from "astro";
import { staticDocumentCacheHeaders } from "../lib/cache-headers";
import { absoluteUrl } from "../lib/site-url";
import { listSitemapEntries } from "../lib/writings";
import { escapeXml, w3cDate } from "../lib/xml";

export const prerender = true;

export const GET: APIRoute = async () => {
  const entries = await listSitemapEntries();
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.flatMap((entry) => [
      "  <url>",
      `    <loc>${escapeXml(absoluteUrl(entry.path))}</loc>`,
      `    <lastmod>${w3cDate(entry.lastmod)}</lastmod>`,
      "  </url>",
    ]),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      ...staticDocumentCacheHeaders,
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
