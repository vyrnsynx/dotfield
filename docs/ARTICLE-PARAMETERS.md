# Article parameters

This is the field-by-field contract for a Writings article. Every public
post is a Markdown file under `src/content/writings/`. The Zod schema in
`src/content.config.ts` validates the YAML frontmatter. Helpers in
`src/lib/writings.ts` derive extra values at build time. There is no CMS
and no per-article SEO form: you fill the fields below (or omit the
optional ones) and the next `npm run build` publishes, hides, or removes
the page.

Operations (create, rename, delete, taxonomy lifecycle) live in
`docs/WRITINGS.md`. This document is only the parameters.

All authored copy must be English. CJK characters in `title`,
`description`, `author`, `tags`, `coverAlt`, or the Markdown body fail
the build.

The repository currently has **no published articles**. The files and
examples below are the authoring contract, not a live inventory.

## Identity that is not a frontmatter key

The public URL is `/writings/post/<slug>/`. The slug is the filename
(`my-article.md`) or the folder name (`my-article/index.md`). There is
**no** `slug:` field. Nested folders deeper than `slug/index.md` are not
part of the URL contract.

| Rule | Detail |
| --- | --- |
| Pattern | Lowercase URL-safe: `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| Unique | Two files that resolve to the same slug fail the build |
| Not both shapes | Do not keep `my-article.md` and `my-article/index.md` together |
| Not `images` | Do not add `src/content/writings/images/index.md` |

## YAML envelope

Frontmatter is a YAML block between `---` lines at the top of the file.
Unknown keys are ignored by the schema; do not rely on that. Stick to the
fields in this document.

Minimal valid post:

```yaml
---
title: My first article
category: notes
pubDate: 2026-09-13
---

## Opening

The first prose paragraph becomes the public summary when `description`
is omitted.
```

Full post (every authored field):

```yaml
---
title: My first article
description: A concise summary used in lists, search, Open Graph, RSS, and llms.txt.
author: VyrnSynx
category: engineering
tags:
  - Astro
  - Static sites
pubDate: 2026-09-13
updatedDate: 2026-09-14
cover: ./images/field-notes-hero.webp
coverAlt: Notebook and a small circuit board on a desk.
featured: false
draft: false
---

## Opening

Body copy starts at `##`. The page `h1` is `title`.
```

From a post folder, the cover path is relative to `index.md`:

```yaml
cover: ../images/field-notes-hero.webp
```

or a sibling file:

```yaml
cover: ./architecture.webp
```

## Required fields

### `title`

| | |
| --- | --- |
| Type | String, trimmed |
| Length | 1–120 characters |
| Default | none; required |
| English | CJK rejected |

Used as the article `h1`, the browser title (`{title} — VyrnSynx`), Open
Graph / Twitter title, JSON-LD `headline`, search ranking (strongest
field), RSS `<title>`, `llms.txt` label, and breadcrumb leaf.

Write a human title, not a keyword string.

### `category`

| | |
| --- | --- |
| Type | String, trimmed |
| Length | 1–64 characters |
| Pattern | `^[a-z0-9]+(?:-[a-z0-9]+)*$` (lowercase URL-safe slug) |
| Default | none; required |
| Cardinality | Exactly one per article |

Used as `/writings/<category>/`, JSON-LD `articleSection`, listing
metadata, and search. Known slugs may have a label, description, and sort
order in `src/data/writings.ts`:

| Slug | Label | Typical use |
| --- | --- | --- |
| `notes` | Notes | Short observations |
| `engineering` | Engineering | Backend, vibe coding, shipped experiments |
| `ops` | Ops | Quiet operational work |

A new slug such as `field-notes` is valid. Without a definition it gets a
title-cased label (`Field Notes`) and a fallback description. A
definition with zero published posts does not emit a page.

Invalid: `Engineering`, `field notes`, `field_notes`, empty string.

### `pubDate`

| | |
| --- | --- |
| Type | Date (Zod coerces the YAML value) |
| Usual form | `2026-09-13` (ISO calendar date) |
| Default | none; required |

Used as the listing date, `<time datetime>`, Open Graph
`article:published_time`, JSON-LD `datePublished`, RSS `<pubDate>`, and
sitemap `lastmod` when `updatedDate` is absent. Sort order among
non-featured posts is newest `pubDate` first, then title.

## Optional authored fields

### `description`

| | |
| --- | --- |
| Type | String, trimmed |
| Length | 1–240 characters when set |
| Default | First prose paragraph of the body, collapsed whitespace, capped at 240 characters with an ellipsis; if the body has no paragraph, `title` |
| English | CJK rejected |

Used in listing cards, Open Graph / Twitter description, `<meta
name="description">`, search, RSS `<description>`, `llms.txt`, and
JSON-LD `description`. Write a real summary, not a keyword list.

An empty string is treated as omitted.

### `author`

| | |
| --- | --- |
| Type | String, trimmed |
| Length | 1–80 characters |
| Default | `site.identity.name` (`VyrnSynx` in `src/data/site.ts`) |
| English | CJK rejected |

Shown in the article byline and included in the search index. JSON-LD
points at the site `Person` node, not a per-post Person record.

### `tags`

| | |
| --- | --- |
| Type | Array of strings |
| Per tag | Trimmed, 1–48 characters, English |
| Count | 0–16 |
| Default | `[]` |
| Uniqueness | Case-insensitive inside one file |

Each distinct label creates `/writings/tag/<slug>/` while at least one
**published** post uses it. JSON-LD `keywords` are category label plus
these tags. Listing cards show `#Label`.

Slug rules (applied to each label):

1. Unicode NFKD, strip combining marks
2. Lowercase with `en-US`
3. Replace `&` with ` and `
4. Replace other non-alphanumerics with `-`
5. Trim leading and trailing hyphens

| Labels | Result |
| --- | --- |
| `Backend` and `backend` in one file | Schema error (duplicate ignoring case) |
| `AI/ML` and `AI ML` across files | Build error (same slug `ai-ml`) |
| `Astro` in one file and `ASTRO` in another | Allowed; first-seen label is kept |

A label that normalizes to an empty slug fails the build.

### `updatedDate`

| | |
| --- | --- |
| Type | Date (coerced) |
| Default | omitted |
| Constraint | Must be on or after `pubDate` |

Rendered as “Updated …” in the byline. Drives Open Graph
`article:modified_time`, JSON-LD `dateModified`, and sitemap `lastmod`.
RSS still uses `pubDate` as `<pubDate>`.

### `cover` and `coverAlt`

| Field | Type | Default | Rules |
| --- | --- | --- | --- |
| `cover` | Local image path | omitted | Relative to the Markdown file. Optimized by `astro:assets`. Remote URLs are not valid covers. |
| `coverAlt` | String, 1–180 characters | omitted | **Required when `cover` is set.** English only. |

`cover` is the article hero and the Open Graph / JSON-LD image when
present. Without a cover, pages use `/og.png`.

Paths:

| File shape | Typical `cover` |
| --- | --- |
| `src/content/writings/my-article.md` | `./images/hero.webp` |
| `src/content/writings/my-article/index.md` | `../images/hero.webp` or `./hero.webp` |

Do not store writings images in `public/`. Shared media belongs in
`src/content/writings/images/`. That folder is not a post.

### `featured`

| | |
| --- | --- |
| Type | Boolean |
| Default | `false` |

Featured published posts sort above all non-featured posts on every
listing, then by `pubDate`. The card shows a “Featured” caption.

### `draft`

| | |
| --- | --- |
| Type | Boolean |
| Default | `false` |

`true` keeps the file in git and still validates the schema, but excludes
it from:

- `/writings/post/<slug>/`
- `/writings/`, category pages, tag pages
- taxonomy counts
- `/writings/search-index.json`
- `/sitemap.xml`, `/rss.xml`, `/llms.txt`

`npm run dev` also 404s a draft URL. Set `draft: false` only when the
article should be public.

## Derived parameters (do not author these)

The build computes these. They are not YAML keys.

| Name | Source | Used for |
| --- | --- | --- |
| `slug` | Filename or folder name | URL, search document |
| `url` | `/writings/post/<slug>/` | Links, canonical, sitemap, RSS, JSON-LD |
| `description` (when omitted) | First body paragraph or `title` | Same surfaces as authored `description` |
| `category.label` | Definition or title-cased slug | UI, JSON-LD `articleSection` |
| `tags[].slug` | Normalized label | Tag URLs |
| `wordCount` | Body after stripping fences, inline code, images, most punctuation | JSON-LD `wordCount` |
| `readingMinutes` | `ceil(wordCount / 220)`, minimum 1 | Cards, byline, JSON-LD `timeRequired` |
| `lastmod` | `updatedDate ?? pubDate` | Sitemap, Open Graph modified time |
| JSON-LD `keywords` | Category label + tag labels | Structured data only (no `keywords` meta tag) |

## Body

The body is Markdown after the closing `---`. It is not a YAML field but
it is a validated input:

- English only; CJK fails the build
- CommonMark / GFM; no MDX; no raw HTML
- Start at `##` because `title` is already the `h1`
- `##` and `###` fill the table of contents

The first prose paragraph (after stripping fences, images, and Markdown
punctuation) feeds the auto `description` when that field is omitted.

## Where each field is consumed

| Field | Listing card | Article header | Search JSON | Canonical / OG | JSON-LD | Sitemap / RSS / llms.txt |
| --- | --- | --- | --- | --- | --- | --- |
| slug / url | link | — | yes | yes | yes | yes |
| `title` | yes | `h1` | yes | yes | `headline` | yes |
| `description` | yes | dek | yes | yes | yes | RSS + llms.txt |
| `author` | — | byline | yes | — | Person `@id` | — |
| `category` | yes | crumb | yes | — | `articleSection` | category URL |
| `tags` | `#Label` | pills | yes | — | `keywords` | tag URLs |
| `pubDate` | yes | `<time>` | yes | `published_time` | `datePublished` | lastmod fallback / RSS pubDate |
| `updatedDate` | — | “Updated …” | yes | `modified_time` | `dateModified` | sitemap lastmod |
| `cover` | — | hero | — | `og:image` | `image` | — |
| `coverAlt` | — | img alt | — | — | — | — |
| `featured` | caption + sort | — | — | — | — | — |
| `draft` | excluded | excluded | excluded | excluded | excluded | excluded |
| word count / reading time | minutes | minutes | minutes | — | `wordCount`, `timeRequired` | — |

## Cross-field rules

1. `cover` without `coverAlt` fails the build.
2. `updatedDate` earlier than `pubDate` fails the build.
3. Duplicate tags in one file, ignoring case, fail the build.
4. Two published files with the same slug fail the build.
5. Two different tag labels that share a slug fail the build.
6. CJK anywhere in the listed English fields or the body fails the build.
7. Deleting or drafting the last published post in a category or tag
   drops that taxonomy page on the next build. There is no sitemap
   registry to edit by hand.

## Empty site

With zero published Markdown files, `/writings/` still exists and shows
an empty list. Category and tag routes are not generated. Sitemap,
`llms.txt`, RSS, and the search index contain no posts. The build may
warn that the `writings` collection is empty; that warning is expected
until you add the first `.md` file. Add a file that passes this contract,
run `npm run build`, and the surfaces appear.
