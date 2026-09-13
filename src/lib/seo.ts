import { site } from "../data/site";
import { writingCategoryPath, writingTagPath } from "../data/writings";
import { absoluteUrl, defaultOgImageUrl, siteOrigin } from "./site-url";
import type { WritingListItem } from "./writings";

export type JsonLd = Record<string, unknown>;

export function siteGraphJsonLd(extra: readonly JsonLd[] = []): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [personJsonLd(), websiteJsonLd(), ...extra],
  };
}

export function personJsonLd(): JsonLd {
  const origin = siteOrigin();

  return {
    "@type": "Person",
    "@id": `${origin}/#person`,
    name: site.identity.name,
    url: `${origin}/`,
    description: site.metadata.description,
    sameAs: site.importantLinks.items
      .filter((item) => item.external)
      .map((item) => item.href),
  };
}

export function websiteJsonLd(): JsonLd {
  const origin = siteOrigin();

  return {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    name: site.metadata.title,
    url: `${origin}/`,
    description: site.metadata.description,
    inLanguage: "en",
    publisher: { "@id": `${origin}/#person` },
  };
}

export function breadcrumbJsonLd(
  crumbs: readonly { name: string; path: string }[],
): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function writingsCollectionJsonLd(options: {
  path: string;
  name: string;
  description: string;
  articles: readonly WritingListItem[];
  breadcrumbs: readonly { name: string; path: string }[];
}): JsonLd[] {
  const pageUrl = absoluteUrl(options.path);

  return [
    breadcrumbJsonLd(options.breadcrumbs),
    {
      "@type": "CollectionPage",
      "@id": pageUrl,
      url: pageUrl,
      name: options.name,
      description: options.description,
      inLanguage: "en",
      isPartOf: { "@id": `${siteOrigin()}/#website` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: options.articles.length,
        itemListElement: options.articles.map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(article.url),
          name: article.title,
        })),
      },
    },
  ];
}

export function writingArticleJsonLd(
  article: WritingListItem,
  imageUrl = defaultOgImageUrl(),
): JsonLd[] {
  const pageUrl = absoluteUrl(article.url);
  const keywords = [
    article.category.label,
    ...article.tags.map((tag) => tag.label),
  ];

  return [
    breadcrumbJsonLd([
      { name: site.identity.name, path: "/" },
      { name: "Writings", path: "/writings/" },
      {
        name: article.category.label,
        path: writingCategoryPath(article.category.slug),
      },
      { name: article.title, path: article.url },
    ]),
    {
      "@type": "BlogPosting",
      "@id": pageUrl,
      mainEntityOfPage: pageUrl,
      headline: article.title,
      description: article.description,
      datePublished: article.pubDate.toISOString(),
      dateModified: (article.updatedDate ?? article.pubDate).toISOString(),
      inLanguage: "en",
      author: { "@id": `${siteOrigin()}/#person` },
      publisher: { "@id": `${siteOrigin()}/#person` },
      isPartOf: { "@id": `${siteOrigin()}/#website` },
      articleSection: article.category.label,
      keywords,
      wordCount: article.wordCount,
      timeRequired: `PT${article.readingMinutes}M`,
      image: absoluteUrl(imageUrl),
      url: pageUrl,
    },
  ];
}

export function writingsIndexBreadcrumbs(): { name: string; path: string }[] {
  return [
    { name: site.identity.name, path: "/" },
    { name: "Writings", path: "/writings/" },
  ];
}

export function writingsCategoryBreadcrumbs(
  categoryLabel: string,
  categorySlug: string,
): { name: string; path: string }[] {
  return [
    ...writingsIndexBreadcrumbs(),
    { name: categoryLabel, path: writingCategoryPath(categorySlug) },
  ];
}

export function writingsTagBreadcrumbs(
  tagLabel: string,
  tagSlug: string,
): { name: string; path: string }[] {
  return [
    ...writingsIndexBreadcrumbs(),
    { name: `#${tagLabel}`, path: writingTagPath(tagSlug) },
  ];
}
