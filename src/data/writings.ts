export interface WritingCategoryDefinition {
  slug: string;
  label: string;
  description: string;
  order: number;
}

export interface WritingTaxonomyItem {
  slug: string;
  label: string;
  count: number;
}

export interface WritingCategory extends WritingTaxonomyItem {
  description: string;
  order: number;
}

export const writingCategorySlugPattern =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Optional presentation metadata for established categories. */
const writingCategoryDefinitions: readonly WritingCategoryDefinition[] = [
  {
    slug: "notes",
    label: "Notes",
    description: "Short observations while learning in public.",
    order: 10,
  },
  {
    slug: "engineering",
    label: "Engineering",
    description: "Backend, vibe coding, and small shipped experiments.",
    order: 20,
  },
  {
    slug: "ops",
    label: "Ops",
    description: "Quiet operational work behind communities and content.",
    order: 30,
  },
] as const;

const categoryDefinitionBySlug = new Map(
  writingCategoryDefinitions.map((category) => [category.slug, category]),
);

export function formatTaxonomyLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function getWritingCategoryDefinition(
  slug: string,
): WritingCategoryDefinition {
  const category = categoryDefinitionBySlug.get(slug);
  if (category) {
    return category;
  }

  const label = formatTaxonomyLabel(slug);
  return {
    slug,
    label,
    description: `Writing filed under ${label}.`,
    order: Number.MAX_SAFE_INTEGER,
  };
}

export function writingCategoryPath(slug: string): string {
  return `/writings/${encodeURIComponent(slug)}/`;
}

export function writingTagPath(slug: string): string {
  return `/writings/tag/${encodeURIComponent(slug)}/`;
}

export function writingPostPath(slug: string): string {
  return `/writings/post/${encodeURIComponent(slug)}/`;
}