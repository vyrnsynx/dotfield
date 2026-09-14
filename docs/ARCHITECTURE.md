# Architecture

This document is the system description for Dotfield. It explains why the
project is structured the way it is, how data moves from files to static
HTML, how the visual scale is locked to [jckhlry.com](https://www.jckhlry.com/),
and how to extend the site without collapsing those boundaries.

## Goals

1. Keep a faithful, compact remake of the official homepage language.
2. Host a static Markdown blog that appears automatically from files on disk.
3. Stay backend-free: no database, no admin UI, no runtime content API.
4. Keep JavaScript optional and tiny. The homepage ships no UI JavaScript
   (JSON-LD and a DevTools console signature are allowed).
5. Make content, presentation, and route composition independently editable.
6. Stay fully static at the edge: no server adapter, no runtime API, no
   origin work per reader.

The site is small on purpose. New features should reuse the existing tokens,
content collections, and presentational components instead of introducing a
second design language or a client application.

## Official visual contract

The homepage is measured against the live official site, not against a
redesign instinct. Confirmed desktop computed styles:

- `html` font-size is `16px`. Body type is independently `12px`.
- Identity, biography, practice line, labels, and pills all use Inter Medium
  at `12px` with a `1.2` line-height (`14.4px`).
- The content column is `max-width: 600px`.
- The page wrapper uses `25px` padding.
- Major homepage blocks are separated by a `30px` gap.
- Important-link rows are separated by `3px`.
- Pills are square, black (`#000`), `2px 5px` padding, no border radius.
- Hover and text selection use the lavender accent `#beadff`.
- The brand mark is a `13px` square.

Writings does not exist on the official site. It inherits the same type,
pills, inset, and accent, then uses a wider `52rem` (`832px`) shell so a
taxonomy rail and an article list can share one row. Article body copy is
`14px` / `1.55` so long-form reading stays comfortable without enlarging the
chrome around it.

### Root font-size rule

`src/styles/global.css` sets `html { font-size: 100%; }` and
`body { font-size: var(--font-size-body); }` where the body token is `12px`.

Never assign the body token to `html`. When that happened previously, every
`rem` layout value rendered at 75% of its intended size (`37.5rem` became
`450px` instead of `600px`). The later over-correction — `14px` body type,
`clamp()` display titles, `48rem` home width, `76rem` writings width — made
the whole product feel larger than the official site.

Correct pairing:

| Token | Value | Rendered size at 16px root |
| --- | --- | --- |
| `--font-size-body` | `12px` | 12px type |
| `--content-width` | `37.5rem` | 600px |
| `--writings-width` | `52rem` | 832px |
| `--article-width` | `40rem` | 640px |
| `--page-gutter` / `--page-padding-block` | `1.5625rem` | 25px |
| `--section-gap` | `1.875rem` | 30px |
| `--link-row-gap` | `0.1875rem` | 3px |
| `--writings-sidebar-width` | `9.5rem` | 152px |

Media queries cannot read custom properties, so the stack breakpoint is
written as `50.624rem` / `50.625rem` (`810px`) in each route that needs it.

## High-level data flow

```text
src/data/site.ts
        -> typed props
src/components/{brand,identity,bio,links}
        -> composition
src/pages/index.astro
        -> document shell
src/layouts/BaseLayout.astro


src/content/writings/*.md
src/content/writings/*/index.md
src/content/writings/images/*   (shared media, not posts)
        -> Astro content collection (`writings`)
        -> schema in src/content.config.ts
        -> helpers in src/lib/writings.ts
        -> category labels in src/data/writings.ts
        -> static HTML routes
        -> /writings/search-index.json
        -> /sitemap.xml, /robots.txt, /rss.xml, /llms.txt
        -> optional vanilla search on listing pages
```

Two content boundaries exist and must stay separate:

- `src/data/site.ts` owns homepage identity, biography, practices, important
  links, default document metadata, and `metadata.origin` (the public site
  origin for canonical URLs and discovery documents).
- `src/content/writings/` owns every article. The collection schema is the
  contract. Components never hard-code article copy.

`src/data/writings.ts` is not article content. It is optional presentation
metadata for known category slugs, plus URL helpers and the shared slug
pattern. Creating or deleting a category or tag is a frontmatter change
(and, for a polished category, a definition change) followed by a rebuild.
The authoring steps live in `docs/WRITINGS.md`. The field contract lives
in `docs/ARTICLE-PARAMETERS.md`.

## Module boundaries

| Domain | Responsibility |
| --- | --- |
| `components/brand` | Reusable mark. The 13px favicon SVG is the only mark. |
| `components/identity` | Primary personal name on the homepage. |
| `components/bio` | Lead, body, and practice line. |
| `components/links` | Important-links landmark, rows, and black pills. |
| `components/writings` | Directory chrome, taxonomy, search UI, cards, reader. |
| `layouts` | Document metadata, Fontsource Inter, global CSS, JSON-LD, per-page canonicals. |
| `pages` | Route-level composition and page-specific placement. |
| `styles/tokens.css` | Shared visual constants. |
| `styles/global.css` | Reset, root/body type, reduced-motion. |
| `lib/writings.ts` | Published query, taxonomy, slugs, excerpts, reading time, view models, sitemap entries. |
| `lib/seo.ts` | JSON-LD graphs for Person, WebSite, CollectionPage, BlogPosting, breadcrumbs. |
| `lib/site-url.ts` | Absolute URLs from `site.metadata.origin`. |
| `lib/english.ts` | CJK rejection for English-only copy. |
| `scripts/writings-search.ts` | Client search against the static metadata index. |

Components are presentational Astro files with typed props and scoped CSS.
Small components are deliberate: a hover treatment in `LinkPill` must not
leak into `ArticleCard`, even though both invert to black on hover.

## Homepage composition

`src/pages/index.astro` is the only homepage route. It centers a
`max-width: var(--content-width)` column and stacks:

1. `SiteMark`
2. `HeroName`, `BioLead`, `BioBody`, `PracticeTags`
3. `ImportantLinks`

Below `810px` the column is top-aligned. At `810px` and above it is
vertically centered. Safe-area insets are added on top of the 25px gutter so
notched phones do not clip the content.

The homepage must remain free of executable JavaScript. JSON-LD is allowed.
Do not attach third-party analytics widgets, search, or hydration islands here. Vercel Web Analytics and Speed Insights may load via `@vercel/analytics/astro` and `@vercel/speed-insights/astro` in `BaseLayout` only — no other analytics SDKs.

## Writings content pipeline

Astro Content Collections is the only content pipeline.

1. `src/content.config.ts` loads `*.md` and `*/index.md` under
   `src/content/writings/` and validates them with Zod. Shared images live
   in `src/content/writings/images/` and are not articles.
2. Drafts (`draft: true`) are excluded by `getPublishedWritings()`.
3. Helpers derive unique slugs, categories, tags, reading time, excerpts,
   list items, search documents, and sitemap entries.
4. Routes call those helpers at build time and emit static HTML.
5. Discovery routes emit published metadata only: search index, sitemap,
   robots, RSS, and `llms.txt`.

### Schema

Required: `title`, `category`, `pubDate`.

Optional: `description` (when omitted, the first prose paragraph of the
body is used, capped at 240 characters), `author` (defaults to
`site.identity.name`), `tags`, `updatedDate`, `cover` + `coverAlt`,
`featured`, `draft`.

Build-time validation rejects:

- empty or oversized strings
- CJK characters in title, description, author, tags, cover alternative
  text, or body
- category slugs that are not lowercase URL-safe
- duplicate tags ignoring case
- `updatedDate` earlier than `pubDate`
- a `cover` without `coverAlt`
- two posts that resolve to the same slug
- two tag labels that collapse to the same slug but are not case-variants of
  the same word

Category is a string, not a closed enum. A new slug such as `field-notes`
appears as a page on the next build. `src/data/writings.ts` may attach a
human label, description, and sort order; unknown slugs receive a title-cased
fallback label.

### Post files

Both shapes are valid and produce `/writings/post/<slug>/`:

```text
src/content/writings/my-article.md
src/content/writings/my-article/index.md
```

Shared images for any post go in `src/content/writings/images/`. A post
folder may still keep images next to `index.md`. The slug is the filename
or the folder name, never a frontmatter `slug` field. Nested folders
deeper than `slug/index.md` are not part of the URL contract. Do not add
`images/index.md`; that would publish a post at `/writings/post/images/`.

### Sorting

Published entries sort featured-first, then newest `pubDate`, then title.
Reading time is `ceil(wordCount / 220)` with a minimum of one minute. Fenced
code, images, and most Markdown punctuation are stripped before the count.

### Taxonomy collisions

Tag labels are normalized to slugs by lowercasing, stripping diacritics,
replacing `&` with `and`, and collapsing other non-alphanumerics to hyphens.
`Backend` and `backend` share a slug and are allowed. `AI/ML` and `AI ML`
also share a slug and fail the build so authors can pick one label.

### Taxonomy lifecycle

Categories and tags are not rows in a database. They exist only while at
least one published post uses them.

- **Create a category:** set a new lowercase `category:` slug on a
  published post. Optionally add `label`, `description`, and `order` in
  `writingCategoryDefinitions`. A definition with zero published posts
  does not emit a page.
- **Delete a category:** move, draft, or delete every published post that
  uses that slug, then rebuild. Optionally remove the leftover definition.
- **Create a tag:** add a label to a post’s `tags` array. The first
  published use emits `/writings/tag/<slug>/`.
- **Delete a tag:** remove that label from every published post and
  rebuild.

There is no redirect layer. Renaming a category slug or a tag slug 404s
the old URL. Step-by-step authoring operations are in `docs/WRITINGS.md`.

## Routes and progressive search

| Route file | URL | Role |
| --- | --- | --- |
| `src/pages/index.astro` | `/` | Homepage |
| `src/pages/writings/index.astro` | `/writings/` | All articles + search |
| `src/pages/writings/[category]/index.astro` | `/writings/<category>/` | Category listing |
| `src/pages/writings/tag/[tag]/index.astro` | `/writings/tag/<tag>/` | Tag listing |
| `src/pages/writings/post/[slug].astro` | `/writings/post/<slug>/` | Article reader |
| `src/pages/writings/search-index.json.ts` | `/writings/search-index.json` | Metadata index |
| `src/pages/sitemap.xml.ts` | `/sitemap.xml` | Published HTML URLs |
| `src/pages/robots.txt.ts` | `/robots.txt` | Crawler rules |
| `src/pages/rss.xml.ts` | `/rss.xml` | Published feed |
| `src/pages/llms.txt.ts` | `/llms.txt` | Published titles and summaries |
| `src/pages/404.astro` | `/404/` | Not found |

`/writings/` is a real page. It must not redirect to a default category.

Listing pages compose `WritingsDirectory`, which is `WritingsShell` +
`SearchFilters` + `ArticleList`. Category and tag navigation is ordinary
static links, so a reader with JavaScript disabled can still move through the
taxonomy.

`SearchFilters` hydrates only on listing pages. The controller:

1. Does nothing until the query, category, or tag control changes.
2. Fetches `/writings/search-index.json` once and caches it.
3. Filters by substring on title, description, author, and tag labels.
4. Intersects the optional category and tag selects.
5. Ranks documents whose title matches before other matches.
6. Replaces the default list, announces the count through `aria-live`, and
   writes `?q=&category=&tag=` to the URL.

The JSON payload contains only:

`slug`, `url`, `title`, `description`, `author`, `pubDate`, `updatedDate`,
`category`, `tags`, `readingMinutes`.

Article bodies, draft files, Markdown source, and cover assets never enter
the search payload.

Delete or draft a Markdown file and rebuild: its HTML route, listing card,
search document, sitemap row, RSS item, `llms.txt` line, and empty category
or tag pages all disappear. There is no separate sitemap registry to edit.

Listing cards use native `rel="prefetch"`. Writings routes also emit a
`speculationrules` block that moderately prefetches `/writings/*` in
Chromium. Do not enable sitewide Astro prefetch or a client router; both
would inject executable JavaScript on the homepage.

## Article reader

`src/pages/writings/post/[slug].astro` calls `render(entry)` from
`astro:content`. Astro converts standard Markdown to HTML at build time,
including Shiki `github-light` highlighting. `ArticleProse` then wraps each
fence in Mac-style chrome: a title bar, traffic-light dots, a line-number
gutter, a Copy control, and a 400px scroll region.

The page assembles:

- brand mark and back links
- `ArticleHeader` (crumb, title, description, author, dates, tags, reading time)
- optional `astro:assets` cover image
- `ArticleProse` around the rendered body
- `ArticleTableOfContents` for `h2` / `h3`
- footer back links and a progressive `BackToTop`

MDX is disabled. Raw HTML in Markdown is not part of the authoring contract.
Supported surfaces are documented in `docs/WRITINGS.md`.

Wide `pre` and `table` elements scroll inside their own region. The article
column stays at `40rem` so line length does not track the wider writings
shell. From `64rem`, the table of contents becomes a sticky right rail in
otherwise empty space. Below that it is a `<details>` block above the body.

`BackToTop` is a real `#top` link. A 12-line inline script only toggles
`.is-visible` when `window.scrollY > 240`. If JavaScript is absent, the
footer “Back to top” link still works.

## Fonts and document shell

`BaseLayout.astro` imports:

```ts
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
```

The build emits hashed `_astro/inter-latin-*.woff2` files. Do not restore
broken `/fonts/*` preloads. Do not load Google Fonts at runtime.

`BaseLayout.astro` builds a per-page canonical URL from
`site.metadata.origin` plus the route path. Open Graph and Twitter tags,
`og:image` (article cover or `/og.png`), article times, robots, RSS
alternate, and JSON-LD follow that origin. The document must not include a
generator meta tag or other vendor strings.

JSON-LD always includes `Person` and `WebSite`. Listing pages add
`CollectionPage`, `ItemList`, and `BreadcrumbList`. Article pages add
`BlogPosting` and breadcrumbs. Keywords and section come from tags and
category; authors do not fill extra SEO fields.

## Edge delivery

The site is `output: "static"` with `compressHTML` and `trailingSlash:
"always"`. There is no server adapter and no middleware. Concurrent readers
and volumetric abuse are absorbed by the edge cache, not by Node.

`vercel.json` sets security headers (CSP, referrer policy, frame denial,
HSTS, permissions policy) and cache policy:

- HTML, JSON, and discovery documents: browsers revalidate
  (`max-age=0, must-revalidate`); the CDN keeps a long-lived copy with
  stale-while-revalidate.
- Hashed `/_astro/*` assets: immutable, one-year cache.
- `/writings/search-index.json`: same CDN policy, plus `X-Robots-Tag:
  noindex`.

Do not add a second reverse proxy in front of this host. Do not add
per-request functions for rate limiting. Platform DDoS mitigation stays on.
Operator firewall rules (probe-path denies, generous per-IP rate limits
with challenge, GET/HEAD only) are staged in the host firewall CLI and
published by a human after reviewing traffic. Verified search crawlers
must remain allowed.

Public pages never display the host vendor name.

## Responsive model

Target viewports: `320`, `390`, `768`, `1024`, `1440`, `1920`.

| Width | Homepage | Writings directory | Article |
| --- | --- | --- | --- |
| 320–809px | Top-aligned 600px column, 25px inset, wrapping pills | Taxonomy stacks above the list; tags collapse into `<details>` | Single column, mobile TOC |
| 810–1023px | Vertically centered 600px column | Left rail + list inside 832px shell | Single column until 1024px |
| 1024px+ | Same centered homepage | Same split directory | Optional sticky TOC |

Rules that must hold at every width:

- no horizontal page overflow
- visible `:focus-visible` rings
- `aria-current="page"` on the active taxonomy link
- hover treatments that do not shift layout
- `prefers-reduced-motion` disables smooth scrolling and shortens transitions

## Client JavaScript budget

| Page | Scripts | Purpose |
| --- | --- | --- |
| `/` | console signature | JSON-LD plus a DevTools author/source banner |
| `/writings/**` listings | `writings-search.ts` | Combined filters |
| `/writings/post/**` | `article-code-blocks.ts` and `BackToTop` | Copy confirmation; show / hide the control |

Every page includes the same non-network console signature. Writings listing
and article pages also include a non-executable `speculationrules` block. If
a feature needs more JavaScript than that, it is probably the wrong feature
for this site.

## Accessibility

- One `h1` per page.
- Homepage important links are a labeled `<section>` containing a real list.
- Writings taxonomy is a `<nav>` with category and tag headings.
- Search is a `<form role="search">` with an `aria-live` status.
- External homepage links use `target="_blank"` and `rel="noreferrer"`.
- Email-style or same-origin links stay in the current tab.
- The site mark has an accessible name.
- Article dates use `<time datetime>`.

## Adding a homepage section

1. Model the content in `src/data/site.ts`. Export an interface when records
   share a repeatable shape.
2. Add a domain folder under `src/components/` only when no existing domain
   fits.
3. Build one component per stable visual responsibility. Pass content through
   typed props.
4. Use existing tokens. Add a token only when a value is shared or expresses
   a design-system decision.
5. Compose the module in `src/pages/index.astro`.
6. Check heading order, keyboard focus, external-link safety, and both sides
   of the 810px breakpoint.
7. Run `npm run build`. Confirm the homepage still has no UI JavaScript.
   JSON-LD and the DevTools console signature are allowed.

## Adding writings behavior

1. Prefer a new Markdown field and a helper in `src/lib/writings.ts` over a
   client store.
2. If the value must be searchable, add it to `WritingSearchDocument` and to
   the JSON route. Never add body text to that payload.
3. Keep new listing UI inside `components/writings` and style it with the
   existing 12px / square-pill language.
4. Do not introduce MDX, a search library, or a hydrated framework.

## Commit conventions

Use English Conventional Commits with a focused scope:

```text
feat(projects): add selected project grid module
fix(home): restore official 12px type and 600px column
fix(links): preserve long labels on narrow screens
docs: explain draft workflow and search index fields
```

Each substantial commit body should explain the motivation, implementation,
and impact. Keep data, module, route-composition, and documentation changes
separate when they can be reviewed independently.
