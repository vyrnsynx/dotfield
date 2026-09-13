import type { APIRoute } from "astro";
import { staticDocumentCacheHeaders } from "../lib/cache-headers";
import { absoluteUrl } from "../lib/site-url";

export const prerender = true;

export const GET: APIRoute = () => {
  const sitemapUrl = absoluteUrl("/sitemap.xml");
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /writings/search-index.json",
    "",
    "User-agent: GPTBot",
    "Allow: /",
    "",
    "User-agent: ChatGPT-User",
    "Allow: /",
    "",
    "User-agent: ClaudeBot",
    "Allow: /",
    "",
    "User-agent: PerplexityBot",
    "Allow: /",
    "",
    "User-agent: Google-Extended",
    "Allow: /",
    "",
    `Sitemap: ${sitemapUrl}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      ...staticDocumentCacheHeaders,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
