import { getCollection, type CollectionEntry } from "astro:content";
import {
  getWritingCategoryDefinition,
  writingCategoryPath,
  writingCategorySlugPattern,
  writingPostPath,
  writingTagPath,
  type WritingCategory,
  type WritingTaxonomyItem,
} from "../data/writings";
import { assertEnglishCopy } from "./english";

export type WritingEntry = CollectionEntry<"writings">;

export interface WritingTaxonomyReference {
  slug: string;
  label: string;
}

export interface WritingListItem {
  slug: string;
  url: string;
  title: string;
  description: string;
  author: string;
  pubDate: Date;
  updatedDate?: Date;
  category: WritingTaxonomyReference;
  tags: readonly WritingTaxonomyReference[];
  readingMinutes: number;
  wordCount: number;
  featured: boolean;
}

export interface WritingSearchDocument {
  slug: string;
  url: string;
  title: string;
  description: string;
  author: string;
  pubDate: string;
  updatedDate: string | null;
  category: WritingTaxonomyReference;
  tags: readonly WritingTaxonomyReference[];
  readingMinutes: number;
}

export interface SitemapEntry {
  path: string;
  lastmod: Date;
}

const wordsPerMinute = 220;
const excerptMaxLength = 240;
const taxonomyCollator = new Intl.Collator("en-US", {
  sensitivity: "base",
});

export async function getPublishedWritings(): Promise<WritingEntry[]> {
  const entries = await getCollection("writings", ({ data }) => !data.draft);
  assertUniquePostSlugs(entries);
  assertEnglishWritings(entries);

  return entries.sort((first, second) => {
    if (first.data.featured !== second.data.featured) {
      return first.data.featured ? -1 : 1;
    }

    const dateDifference =
      second.data.pubDate.valueOf() - first.data.pubDate.valueOf();
    if (dateDifference !== 0) {
      return dateDifference;
    }

    return taxonomyCollator.compare(first.data.title, second.data.title);
  });
}

export async function getWritingsByCategory(
  categorySlug: string,
): Promise<WritingEntry[]> {
  const entries = await getPublishedWritings();
  return filterWritingsByCategory(entries, categorySlug);
}

export async function getWritingsByTag(
  tagSlug: string,
): Promise<WritingEntry[]> {
  const entries = await getPublishedWritings();
  return filterWritingsByTag(entries, tagSlug);
}

export function filterWritingsByCategory(
  entries: readonly WritingEntry[],
  categorySlug: string,
): WritingEntry[] {
  return entries.filter((entry) => entry.data.category === categorySlug);
}

export function filterWritingsByTag(
  entries: readonly WritingEntry[],
  tagSlug: string,
): WritingEntry[] {
  return entries.filter((entry) =>
    entry.data.tags.some((tag) => normalizeTagSlug(tag) === tagSlug),
  );
}

export function listWritingCategories(
  entries: readonly WritingEntry[],
): WritingCategory[] {
  const counts = new Map<string, number>();
  entries.forEach((entry) => {
    counts.set(entry.data.category, (counts.get(entry.data.category) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([slug, count]) => ({
      ...getWritingCategoryDefinition(slug),
      count,
    }))
    .sort((first, second) => {
      const orderDifference = first.order - second.order;
      return orderDifference === 0
        ? taxonomyCollator.compare(first.label, second.label)
        : orderDifference;
    });
}

export function listWritingTags(
  entries: readonly WritingEntry[],
): WritingTaxonomyItem[] {
  const tags = new Map<
    string,
    { label: string; normalizedLabel: string; count: number }
  >();

  entries.forEach((entry) => {
    entry.data.tags.forEach((label) => {
      const slug = normalizeTagSlug(label);
      const normalizedLabel = label.toLocaleLowerCase("en-US");
      const existing = tags.get(slug);

      if (existing && existing.normalizedLabel !== normalizedLabel) {
        throw new Error(
          `Tag slug collision: "${existing.label}" and "${label}" both resolve to "${slug}".`,
        );
      }

      tags.set(slug, {
        label: existing?.label ?? label,
        normalizedLabel,
        count: (existing?.count ?? 0) + 1,
      });
    });
  });

  return [...tags.entries()]
    .map(([slug, tag]) => ({
      slug,
      label: tag.label,
      count: tag.count,
    }))
    .sort(
      (first, second) =>
        second.count - first.count ||
        taxonomyCollator.compare(first.label, second.label),
    );
}

export function writingSlug(entry: WritingEntry): string {
  const pathParts = entry.id
    .replace(/\\/g, "/")
    .replace(/\.(md|mdx)$/i, "")
    .split("/")
    .filter(Boolean);

  if (pathParts.at(-1) === "index") {
    pathParts.pop();
  }

  const slug = pathParts.at(-1);
  if (!slug || !writingCategorySlugPattern.test(slug)) {
    throw new Error(
      `Writing "${entry.id}" must use a lowercase URL-safe filename or folder name.`,
    );
  }

  return slug;
}

export function normalizeTagSlug(label: string): string {
  const slug = label
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new Error(`Tag "${label}" does not contain any URL-safe characters.`);
  }

  return slug;
}

export function excerptFromMarkdown(
  markdown: string,
  fallback: string,
): string {
  const paragraph = markdownPlainText(markdown)
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .find((block) => block.length > 0);

  if (!paragraph) {
    return fallback;
  }

  if (paragraph.length <= excerptMaxLength) {
    return paragraph;
  }

  const truncated = paragraph.slice(0, excerptMaxLength - 1);
  const lastSpace = truncated.lastIndexOf(" ");
  const clipped = (lastSpace > 160 ? truncated.slice(0, lastSpace) : truncated)
    .replace(/[,:;–—-]+$/u, "")
    .trim();

  return `${clipped}…`;
}

export function estimateWordCount(entry: WritingEntry): number {
  return writingWords(entry.body ?? "").length;
}

export function estimateReadingMinutes(entry: WritingEntry): number {
  return Math.max(1, Math.ceil(estimateWordCount(entry) / wordsPerMinute));
}

export function articleLastmod(article: WritingListItem): Date {
  return article.updatedDate ?? article.pubDate;
}

export function toWritingListItem(entry: WritingEntry): WritingListItem {
  const slug = writingSlug(entry);
  const categoryDefinition = getWritingCategoryDefinition(entry.data.category);
  const wordCount = estimateWordCount(entry);

  return {
    slug,
    url: writingPostPath(slug),
    title: entry.data.title,
    description:
      entry.data.description?.trim() ||
      excerptFromMarkdown(entry.body ?? "", entry.data.title),
    author: entry.data.author,
    pubDate: entry.data.pubDate,
    updatedDate: entry.data.updatedDate,
    category: {
      slug: categoryDefinition.slug,
      label: categoryDefinition.label,
    },
    tags: entry.data.tags.map((label) => ({
      slug: normalizeTagSlug(label),
      label,
    })),
    readingMinutes: Math.max(1, Math.ceil(wordCount / wordsPerMinute)),
    wordCount,
    featured: entry.data.featured,
  };
}

export function toWritingSearchDocument(
  entry: WritingEntry,
): WritingSearchDocument {
  const article = toWritingListItem(entry);

  return {
    slug: article.slug,
    url: article.url,
    title: article.title,
    description: article.description,
    author: article.author,
    pubDate: article.pubDate.toISOString(),
    updatedDate: article.updatedDate?.toISOString() ?? null,
    category: article.category,
    tags: article.tags,
    readingMinutes: article.readingMinutes,
  };
}

export async function listSitemapEntries(): Promise<SitemapEntry[]> {
  const entries = await getPublishedWritings();
  const articles = entries.map(toWritingListItem);
  const categories = listWritingCategories(entries);
  const tags = listWritingTags(entries);
  const latest = latestLastmod(articles) ?? new Date();

  return [
    { path: "/", lastmod: latest },
    { path: "/writings/", lastmod: latest },
    ...categories.map((category) => ({
      path: writingCategoryPath(category.slug),
      lastmod:
        latestLastmod(
          articles.filter((article) => article.category.slug === category.slug),
        ) ?? latest,
    })),
    ...tags.map((tag) => ({
      path: writingTagPath(tag.slug),
      lastmod:
        latestLastmod(
          articles.filter((article) =>
            article.tags.some((articleTag) => articleTag.slug === tag.slug),
          ),
        ) ?? latest,
    })),
    ...articles.map((article) => ({
      path: article.url,
      lastmod: articleLastmod(article),
    })),
  ];
}

function latestLastmod(articles: readonly WritingListItem[]): Date | undefined {
  if (articles.length === 0) {
    return undefined;
  }

  return articles
    .map(articleLastmod)
    .reduce((latest, date) => (date > latest ? date : latest));
}

function markdownPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/[*_~|=]/g, " ");
}

function writingWords(markdown: string): string[] {
  return markdownPlainText(markdown).match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/gi) ?? [];
}

function assertUniquePostSlugs(entries: readonly WritingEntry[]): void {
  const entryBySlug = new Map<string, string>();

  entries.forEach((entry) => {
    const slug = writingSlug(entry);
    const existingId = entryBySlug.get(slug);
    if (existingId) {
      throw new Error(
        `Writing slug collision: "${existingId}" and "${entry.id}" both resolve to "${slug}".`,
      );
    }

    entryBySlug.set(slug, entry.id);
  });
}

function assertEnglishWritings(entries: readonly WritingEntry[]): void {
  entries.forEach((entry) => {
    assertEnglishCopy(entry.data.title, `Writing "${entry.id}" title`);
    if (entry.data.description) {
      assertEnglishCopy(
        entry.data.description,
        `Writing "${entry.id}" description`,
      );
    }
    assertEnglishCopy(entry.data.author, `Writing "${entry.id}" author`);
    if (entry.data.coverAlt) {
      assertEnglishCopy(entry.data.coverAlt, `Writing "${entry.id}" coverAlt`);
    }
    entry.data.tags.forEach((tag) => {
      assertEnglishCopy(tag, `Writing "${entry.id}" tag "${tag}"`);
    });
    assertEnglishCopy(entry.body ?? "", `Writing "${entry.id}" body`);
  });
}
