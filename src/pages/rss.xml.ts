import type { APIRoute } from "astro";
import { site } from "../data/site";
import { staticDocumentCacheHeaders } from "../lib/cache-headers";
import { absoluteUrl } from "../lib/site-url";
import {
  articleLastmod,
  getPublishedWritings,
  toWritingListItem,
} from "../lib/writings";
import { escapeXml } from "../lib/xml";

export const prerender = true;

export const GET: APIRoute = async () => {
  const articles = (await getPublishedWritings()).map(toWritingListItem);
  const lastBuildDate = articles.reduce((latest, article) => {
    const stamp = articleLastmod(article);
    return stamp > latest ? stamp : latest;
  }, new Date(0));
  const channelLastBuild =
    articles.length === 0 ? new Date() : lastBuildDate;
  const channelItems = articles.map((article) => {
    const link = absoluteUrl(article.url);

    return [
      "    <item>",
      `      <title>${escapeXml(article.title)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `      <pubDate>${article.pubDate.toUTCString()}</pubDate>`,
      `      <description>${escapeXml(article.description)}</description>`,
      `      <category>${escapeXml(article.category.label)}</category>`,
      "    </item>",
    ].join("\n");
  });

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(`${site.identity.name} Writings`)}</title>`,
    `    <link>${escapeXml(absoluteUrl("/writings/"))}</link>`,
    `    <description>${escapeXml(site.metadata.description)}</description>`,
    "    <language>en</language>",
    `    <lastBuildDate>${channelLastBuild.toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(absoluteUrl("/rss.xml"))}" rel="self" type="application/rss+xml" />`,
    ...channelItems,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      ...staticDocumentCacheHeaders,
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
};
