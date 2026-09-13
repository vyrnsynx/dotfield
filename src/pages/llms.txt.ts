import type { APIRoute } from "astro";
import { site } from "../data/site";
import { staticDocumentCacheHeaders } from "../lib/cache-headers";
import { absoluteUrl } from "../lib/site-url";
import { getPublishedWritings, toWritingListItem } from "../lib/writings";

export const prerender = true;

export const GET: APIRoute = async () => {
  const articles = (await getPublishedWritings()).map(toWritingListItem);
  const lines = [
    `# ${site.identity.name}`,
    "",
    `> ${site.metadata.description}`,
    "",
    `Home: ${absoluteUrl("/")}`,
    `Writings: ${absoluteUrl("/writings/")}`,
    "",
    "## Writings",
    "",
    ...articles.map(
      (article) =>
        `- [${article.title}](${absoluteUrl(article.url)}): ${article.description}`,
    ),
    "",
  ];

  return new Response(`${lines.join("\n")}`, {
    headers: {
      ...staticDocumentCacheHeaders,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
