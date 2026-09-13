# Writings authoring and operations guide

Writings is a file-based static blog. There is no CMS, database, admin
server, or runtime content API. Every public article is a Markdown file on
disk. The Astro build discovers those files, validates their English
frontmatter, derives categories and tags, emits static HTML, and — for
published posts only — writes `/writings/search-index.json`, `/sitemap.xml`,
`/rss.xml`, and `/llms.txt`.

This document is the complete operations manual: where files live, how to
create and delete articles, how categories and tags appear and disappear,
and how the build turns a file into a URL. Read it before adding, renaming,
or removing a post.

Every YAML field, default, derived value, and validation rule is documented
in `docs/ARTICLE-PARAMETERS.md`. Use that file when filling frontmatter.
Most build failures come from slugs, dates, tag collisions, CJK copy, or a
cover image without alternative text.

## Mental model

| You do this | The build does this |
| --- | --- |
| Add a `.md` file under `src/content/writings/` | Validate it, emit `/writings/post/<slug>/`, and include it in listings, sitemap, RSS, and `llms.txt` if it is not a draft |
| Change frontmatter `category` | Move the article onto that category page; create the page if it is new |
| Add a string to `tags` | Create or update `/writings/tag/<slug>/` |
| Remove a tag from every published post | Drop that tag page and its directory link |
| Delete or draft the last post in a category | Drop that category page and its directory link |
| Delete the Markdown file | The article URL 404s after the next build; sitemap, RSS, `llms.txt`, and search no longer list it |
| Add a file under `src/content/writings/images/` | The file is available to covers and Markdown; it is not a post |

Nothing is stored in a database. Git is the history. `dist/` is only the
last successful build and can be regenerated at any time.

## Where articles live

All writings live in one folder:

```text
src/content/writings/
```

Astro loads `*.md` and `*/index.md` under that folder through the `writings`
content collection defined in `src/content.config.ts`. Files outside those
two shapes are not articles. `.mdx` is not collected. Nested series folders
such as `src/content/writings/series/part-one/index.md` are not part of the
URL contract.

Shared images for any article live in:

```text
src/content/writings/images/
```

That folder is not a post. Do not put `index.md` or any other Markdown
file there. See [Article images](#article-images).

Two on-disk shapes are valid. Both become `/writings/post/<slug>/`.

### Single file (text-only notes)

```text
src/content/writings/my-article.md
```

Use this for text-only notes, or when every image lives in the shared
`images/` folder.

### Shared image folder

Put images that one or more posts can reuse here:

```text
src/content/writings/images/
├── field-notes-hero.webp
└── architecture.png
```

From a root-level post (`src/content/writings/my-article.md`):

```yaml
cover: ./images/field-notes-hero.webp
coverAlt: Notebook and a small circuit board on a desk.
```

```md
![Architecture diagram](./images/architecture.png)
```

From a post folder (`src/content/writings/my-article/index.md`):

```yaml
cover: ../images/field-notes-hero.webp
coverAlt: Notebook and a small circuit board on a desk.
```

```md
![Architecture diagram](../images/architecture.png)
```

Astro optimizes these files through `astro:assets`. Prefer lowercase,
URL-safe filenames (`field-notes-hero.webp`, not `Hero Shot.PNG`).

Do not store writings images in `public/`. A file at `public/writings/…`
would collide with the `/writings/` routes. Favicons and the default Open
Graph image stay in `public/`.

### Folder bundle (images that belong to one post)

```text
src/content/writings/
└── my-first-article/
    ├── index.md
    ├── architecture.webp
    └── result.png
```

The Markdown file must be named `index.md`. Sibling images are bundled and
resized by `astro:assets`. Use this when the files are only for that
article. Reference them with a relative path:

```md
![Architecture diagram](./architecture.webp)
```

or in frontmatter:

```yaml
cover: ./architecture.webp
coverAlt: Diagram showing the static content build flow.
```

### Current repository files

There are currently **no** published Markdown posts. Shared image storage
is the empty folder `src/content/writings/images/`. Add a file that
follows `docs/ARTICLE-PARAMETERS.md` and rebuild to publish the first
article.

### What is not an article location

| Location | Role |
| --- | --- |
| `src/data/site.ts` | Homepage identity and default author name |
| `src/data/writings.ts` | Optional category labels, descriptions, and URL helpers |
| `src/lib/writings.ts` | Published query, taxonomy, excerpts, reading time, search documents |
| `src/content/writings/images/` | Shared article images, not posts |
| `src/pages/writings/` | Route files, not content |
| `dist/writings/` | Generated HTML. Never edit this by hand |
| `public/` | Favicons, the 13px site mark, and `/og.png` |

## Article images

`src/content/writings/images/` is the shared store for covers and body
images. The collection loader only picks up `*.md` and `*/index.md`, so
files in `images/` never become posts.

| Kind | Where to put the file | How to point at it |
| --- | --- | --- |
| Shared cover or body image | `src/content/writings/images/<file>` | `./images/<file>` from `slug.md`, `../images/<file>` from `slug/index.md` |
| Image used by only one post | Next to that post’s `index.md` | `./<file>` |
| Remote image | Nowhere in the repo | `https://…` in Markdown only. Do not use a remote URL as `cover` |

### Add an image

1. Copy the file into `src/content/writings/images/`.
2. Use a lowercase URL-safe name with a real extension: `.webp`, `.png`,
   `.jpg`, `.jpeg`, or `.gif`.
3. Set `cover` + `coverAlt` in frontmatter, and / or add
   `![descriptive alt](./images/<file>)` in the body.
4. Run `npm run dev` and check the article. The image should be resized
   to the `40rem` column.

### Delete an image

1. Search `src/content/writings` for the filename.
2. Remove every `cover:` path and Markdown `![]()` that pointed at it.
3. Delete the file from `images/` or from the post folder.
4. Rebuild. An unused file left on disk is harmless; a leftover path
   fails the build if it was a `cover`.

Do not add `src/content/writings/images/index.md`. That would publish
`/writings/post/images/`.

## How a file becomes a page

```text
src/content/writings/my-article.md
        or
src/content/writings/my-article/index.md

        -> content collection `writings`
        -> Zod schema in src/content.config.ts
        -> getPublishedWritings() drops drafts
        -> writingSlug() reads the filename or folder name
        -> routes emit:
              /writings/
              /writings/<category>/
              /writings/tag/<tag>/
              /writings/post/<slug>/
        -> /writings/search-index.json receives metadata only
```

The URL slug is the file or folder name. There is no frontmatter `slug`
field. `my-article.md` and `my-article/index.md` both become
`/writings/post/my-article/`. You cannot have both at once; the build
reports a slug collision.

## Slug rules

Folder and file slugs must be lowercase and URL-safe:

```text
good: my-first-article
good: quiet-ops-notes
bad:  My First Article
bad:  quiet_ops_notes
bad:  quiet-ops-notes.mdx
```

The allowed pattern is `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Keep one slug
segment. Do not nest deeper than `slug/index.md`.

## Create a new article

1. Choose a unique lowercase slug that is not already used as a filename or
   folder under `src/content/writings/`.
2. Create either `src/content/writings/<slug>.md` or
   `src/content/writings/<slug>/index.md`.
3. Paste the frontmatter template below and fill every required field.
4. Set `draft: true` while the piece is unfinished.
5. Write the body in standard CommonMark / GFM. Start headings at `##`.
   The page already provides the `h1` from `title`.
6. Run `npm run dev` and open the article URL after you set `draft: false`
   (drafts do not emit routes; see [Draft workflow](#draft-workflow)).
7. When the article should be public, keep `draft: false` and run
   `npm run build`. Confirm it appears on `/writings/`, its category page,
   each of its tag pages, and in `dist/writings/search-index.json`.

A new lowercase category slug or a new tag label is enough to generate a
crawlable page. You do not register tags in a config file. Established
categories can receive a custom label in `src/data/writings.ts`.

## Edit an article

1. Open the Markdown file (or `index.md` inside the post folder).
2. Change frontmatter and / or body copy.
3. If you changed the meaning of the piece after publication, set
   `updatedDate` to today. It must be on or after `pubDate`.
4. Save. `npm run dev` hot-reloads the rendered page.
5. Run `npm run build` before you treat the change as shipped.

Editing `title`, `description`, `author`, `category`, or `tags` updates
listings and the search index on the next build. The public URL does not
change unless you rename the file or folder.

## Rename or move an article

The public path is `/writings/post/<slug>/`, and `<slug>` is the filename
or folder name.

| Goal | What to do |
| --- | --- |
| Keep the URL, change the title | Edit `title` only |
| Change the URL | Rename `old-slug.md` to `new-slug.md`, or rename the folder `old-slug/` to `new-slug/` |
| Convert a single file into a folder bundle | Create `new-or-same-slug/index.md`, move the body, delete the old `.md` file. Do not leave both |

There is no redirect layer. After a slug rename, the old URL 404s. Update
any in-body links that pointed at the old path.

Do not create both `my-article.md` and `my-article/index.md`. That
is a slug collision and fails the build.

## Delete an article

There is no admin “delete” button. Removing a post is a file operation
plus a rebuild.

### Permanently remove a post

1. Delete the Markdown file, or delete the whole post folder if you used
   the bundle form (`index.md` plus images).
2. Search the remaining Markdown for links to `/writings/post/<old-slug>/`
   and update or remove them.
3. If that post was the last published article in its category, the
   category page will disappear on the next build. If it was the last
   published article that used a tag, that tag page will disappear too.
4. Run `npm run build`. Confirm:
   - `/writings/post/<slug>/` is gone from `dist/`
   - the card is gone from `/writings/`
   - the slug is gone from `dist/writings/search-index.json`
5. Commit the deletion. Git remains the only undelete path.

Do not delete files from `dist/` by hand. The next build will recreate
whatever is still in `src/content/writings/`.

### Hide a post without deleting the file

Set `draft: true` and rebuild. The file stays in the repository and still
has to pass the schema, but it is excluded from:

- `/writings/`
- `/writings/<category>/`
- `/writings/tag/<tag>/`
- `/writings/post/<slug>/` (no static path is emitted)
- `/writings/search-index.json`
- `/sitemap.xml`
- `/rss.xml`
- `/llms.txt`
- category and tag counts

Use this for unfinished work or for temporarily taking a piece down.

### What happens to taxonomy after a deletion

Categories and tags are derived from **published** posts only.

- If three published posts use `category: engineering` and you delete one,
  the Engineering page remains and its count drops from 3 to 2.
- If you delete or draft the last published `engineering` post, `/writings/engineering/`
  is not generated. The optional definition in `src/data/writings.ts` can
  stay; it is unused until another published post uses that slug again.
- The same rule applies to tags. Removing `Astro` from every published
  `tags` list deletes `/writings/tag/astro/` on the next build.

## Draft workflow

1. Create the Markdown file or post folder.
2. Set `draft: true`.
3. Understand the production rule: `getPublishedWritings()` drops drafts,
   and every writings route calls that helper. Drafts therefore do **not**
   receive a static path in `npm run dev` or `npm run build`. Opening
   `/writings/post/<slug>/` for a draft returns 404.
4. To proof a draft locally, temporarily set `draft: false` in the working
   tree, view the page, then set it back to `true` before you commit — or
   keep it `false` only when you intend to publish.
5. When the article is ready, set `draft: false` and run `npm run build`.

Drafts are still validated. Invalid frontmatter fails the build even when
`draft: true`.

## Categories

A category is a **slug**, not a display label and not a closed TypeScript
enum. The published Markdown set is the taxonomy. One article has exactly
one category.

Established categories are defined in `src/data/writings.ts` as
`writingCategoryDefinitions`:

| Slug | Label | Typical use |
| --- | --- | --- |
| `notes` | Notes | Short observations while learning in public |
| `engineering` | Engineering | Backend, vibe coding, shipped experiments |
| `ops` | Ops | Quiet operational work |

The directory sorts these by `order` (10, 20, 30), then by label. Unknown
slugs sort last and receive a title-cased fallback label.

Do not put spaces, capitals, or underscores in the `category` field.
`Engineering` fails the schema. `field_notes` fails the schema.
`field-notes` is valid.

### Create a category

There is no category admin and no extra Markdown file for the category
itself.

**Minimum path (enough for a live page):**

1. In one or more published posts, set:

   ```yaml
   category: field-notes
   ```

2. Run `npm run build`.

The build emits `/writings/field-notes/`, shows a sidebar link labelled
`Field Notes`, and uses the fallback description `Writing filed under Field Notes.`

**Permanent path (custom label, description, and sort order):**

Add an entry to `writingCategoryDefinitions` in `src/data/writings.ts`:

```ts
{
  slug: "field-notes",
  label: "Field Notes",
  description: "On-site notes and longer field reports.",
  order: 40,
}
```

The `slug` must match the frontmatter value exactly. `order` is a number;
smaller values appear first after “All writings”.

A definition with no published posts does **not** create a page. The
sidebar only lists categories that currently have at least one published
article.

### Change a category label without changing the URL

Edit `label` and `description` on the existing definition in
`src/data/writings.ts`. Leave every post’s `category:` slug unchanged.

### Rename a category slug (URL change)

1. Decide the new slug, for example `field-notes` → `reports`.
2. Change `category:` on every post that used the old slug.
3. Rename the definition in `src/data/writings.ts` so `slug` matches.
4. Rebuild. `/writings/field-notes/` 404s. `/writings/reports/` is the new
   page. There is no automatic redirect.

### Delete a category

A category exists only while at least one **published** post uses its slug.

1. Open every post with that `category`.
2. Either move each post to another category (`category: notes`), or
   draft / delete those posts.
3. Run `npm run build`. `/writings/<old-slug>/` is no longer emitted and
   the sidebar link is gone.
4. Optional cleanup: remove the matching object from
   `writingCategoryDefinitions` in `src/data/writings.ts` so unused labels
   do not linger. Leaving the definition in place is harmless; it will
   apply again if you reuse the slug later.

Do not delete a category by removing only the TypeScript definition while
posts still use that slug. Those posts keep the slug, the page still
builds, and the label falls back to title case.

### Assign an article to a different category

Edit that article’s frontmatter:

```yaml
category: ops
```

Save and rebuild. The article leaves its old category page and appears on
the new one. If it was the last published post in the old category, that
old page disappears.

## Tags

Tags are free-form labels on the article, not a registry. An article may
have zero to sixteen tags. Tags are optional (`tags` defaults to `[]`).

There is no `src/data` list of allowed tags. Creating or deleting a tag is
always a frontmatter edit plus a rebuild.

### How a label becomes a URL

The build turns each label into a slug:

1. Trim whitespace.
2. Unicode-normalize and strip combining marks.
3. Lowercase with `en-US`.
4. Replace `&` with `and`.
5. Replace every other non-alphanumeric run with `-`.
6. Strip leading and trailing hyphens.

Examples:

| Label | Slug | URL |
| --- | --- | --- |
| `Astro` | `astro` | `/writings/tag/astro/` |
| `Static sites` | `static-sites` | `/writings/tag/static-sites/` |
| `AI & ML` | `ai-and-ml` | `/writings/tag/ai-and-ml/` |

`Astro` and `astro` may appear in different files; they share one tag page
and the first-seen capitalization is kept. `AI/ML` and `AI ML` both become
`ai-ml` and the build throws a collision error. Pick one spelling and use
it everywhere.

A tag with no URL-safe characters (for example `???`) fails the build.

### Create a tag

1. Open the article’s frontmatter.
2. Add a label to `tags`:

   ```yaml
   tags:
     - Astro
     - Static sites
   ```

3. Keep labels unique inside that file, ignoring letter case. `Astro` and
   `astro` in the same file fail the schema.
4. Rebuild. If this is the first published post to use that slug, the
   build emits `/writings/tag/<slug>/` and a directory link.

You do not create a tag page by adding a file under `src/pages` or
`src/data`. Empty tags (`tags: []`) simply omit tag links on that article.

### Rename a tag

Decide whether you want a new display label, a new URL, or both.

| Intent | Edit |
| --- | --- |
| Same URL, nicer capitalization | Change `Astro` to `ASTRO` only if no other file already reserved a different capitalization for `astro`. Prefer one spelling everywhere |
| New URL | Change the label so it normalizes to a different slug, for example `Static sites` → `Static publishing`. Update every post that should move |
| Merge two tags | Rewrite every post that used tag A so they use tag B’s label. After the rebuild, tag A’s page is gone |

There is no redirect from an old tag URL.

### Delete a tag from one article

Remove that string from the article’s `tags` array and rebuild. The
article leaves that tag page. If other published posts still use the tag,
the page remains.

### Delete a tag from the whole site

1. Search `src/content/writings` for the label (and obvious case variants).
2. Remove it from every `tags` list.
3. Rebuild. `/writings/tag/<slug>/` is no longer generated and the sidebar
   count disappears.

There is nothing else to delete. Tags are not registered in
`src/data/writings.ts`.

### Tag collisions to avoid

| Situation | Result |
| --- | --- |
| Two labels in one file that differ only by case | Schema error: `Tags must be unique, ignoring letter case` |
| Two different labels that normalize to the same slug (`AI/ML` and `AI ML`) | Build error: `Tag slug collision` |
| Reusing the same slug with the same letters, different case, across files | Allowed. One tag page. First-seen label is kept |

## Frontmatter template

Copy the blocks in `docs/ARTICLE-PARAMETERS.md`. That document is the
source of truth for required fields, optional fields, defaults, derived
values, English-only rules, and every surface that reads a field.

A minimal published post is:

```yaml
---
title: My first article
category: notes
pubDate: 2026-09-13
---
```

`description` may be omitted. The build then uses the first prose paragraph
of the body, trimmed to 240 characters.

Unknown frontmatter keys are ignored by the schema. Do not rely on that.

## Supported Markdown

Author standard CommonMark / GFM. Do not enable MDX. Do not paste raw HTML.

The article title is already the page `h1`. Body copy should start at `##`.
`##` and `###` populate the table of contents. Deeper headings render but do
not enter the TOC.

````md
## A section heading

Use **bold text**, *italic text*, `inline code`, and
[descriptive links](https://example.com).

![Architecture diagram](./architecture.webp)

> A short quotation or callout.

- An unordered item
- Another item

1. A numbered step
2. Another step

- [x] Completed task
- [ ] Open task

```ts
const greeting = "Hello, static blog";
```

| Field | Purpose |
| --- | --- |
| `title` | Article title |
| `tags` | Automatic taxonomy |

---
````

### Images

See [Article images](#article-images) for the shared folder and per-post
files. In short:

- Shared files live in `src/content/writings/images/`.
- Local images next to `index.md` are bundled and resized by Astro.
- Remote `https://` images also render and are constrained to the article
  width.
- Do not use the 13px site mark, or any other tiny chrome asset, as a
  full-width article image. It will upscale badly.
- Decorative images still need `coverAlt` or Markdown alt text because the
  reader is treated as content.

### Code and tables

Fenced code is highlighted with Shiki's `github-light` theme at build time
and wrapped in Mac-style chrome: a 36px title bar, traffic-light dots, a
muted left gutter of line numbers, a Copy control that confirms with a
black “Copied” pill, and a 400px max-height scroll region. Print expands
the fence and hides Copy. Wide tables still scroll horizontally so the
page itself does not overflow on a 320px phone.

### What is intentionally unsupported

- MDX / JSX components inside posts
- Arbitrary raw HTML
- Runtime embeds that need a client widget
- Per-post custom CSS
- Drafts in the public search index

If a post needs a component, the feature belongs in the Astro article
chrome, not in the Markdown file.

## Search behavior

`/writings/search-index.json` is prerendered from published posts only.
Each document contains:

```json
{
  "slug": "my-article",
  "url": "/writings/post/my-article/",
  "title": "My first article",
  "description": "…",
  "author": "VyrnSynx",
  "pubDate": "2026-09-13T00:00:00.000Z",
  "updatedDate": null,
  "category": { "slug": "notes", "label": "Notes" },
  "tags": [{ "slug": "writing", "label": "Writing" }],
  "readingMinutes": 3
}
```

Bodies, drafts, and Markdown source are never included. Deleting or
drafting a post removes its document on the next build.

On `/writings/`, `/writings/<category>/`, and `/writings/tag/<tag>/` the
search form is a progressive enhancement:

- No JavaScript: category and tag links still work.
- With JavaScript: the controller lazy-loads the JSON once, combines the
  query with the category and tag selects, ranks title matches first,
  updates the list, announces the result count, and writes shareable URL
  parameters (`?q=backend&category=engineering&tag=astro`).

Search does not need a library and must not grow into one.

## Reading time

Reading time is estimated at 220 words per minute from the Markdown body
after fenced code, inline code, images, and most punctuation are stripped.
The displayed value is at least one minute. It is metadata for lists and
the article crumb, not a promise about the reader.

## Rendering and layout expectations

Articles use the compact site chrome (12px Inter, square pills, 25px
inset) and a `40rem` (`640px`) reading column at `14px` / `1.55`. Page
titles stay 12px. Article titles are `1.25rem` (`20px`), not display type.

On viewports narrower than `810px`, taxonomy stacks above the list. From
`64rem`, articles with `h2` / `h3` headings gain a sticky “On this page”
rail. The back-to-top control appears after the reader scrolls roughly
`240` pixels; the footer link is the no-JavaScript equivalent.

## Publishing checklist

1. Slug is lowercase and unique.
2. Frontmatter passes every required field.
3. Category slug is URL-safe.
4. Tags are unique and will not collide with a different label.
5. `updatedDate`, if present, is not earlier than `pubDate`.
6. Cover image, if present, has `coverAlt`.
7. Body starts at `##` and uses only supported Markdown.
8. `draft: false` only when the article should be public.
9. `npm run build` succeeds.
10. The article appears on `/writings/`, its category page, its tag pages,
    `dist/writings/search-index.json`, `dist/sitemap.xml`, `dist/rss.xml`,
    and `dist/llms.txt`.

## Common build errors

| Message | What to fix |
| --- | --- |
| `Use a lowercase URL-safe category slug` | Change `category` to `engineering`, not `Engineering`. |
| `Tags must be unique, ignoring letter case` | Remove the duplicate tag in that file. |
| `updatedDate cannot be earlier than pubDate` | Move the update date forward or drop it. |
| `coverAlt is required when cover is set` | Add alternative text. |
| `Writing slug collision` | Rename one of the two files or folders that share a slug. |
| `Tag slug collision` | Two different labels normalized to the same slug. Rename one. |
| `Use English copy. CJK characters are not allowed` | Remove Chinese (or other CJK) from that field or the body. |
| `must use a lowercase URL-safe filename` | Rename `My Post.md` to `my-post.md`. |

## Related files

- `src/content.config.ts` — collection schema
- `src/data/writings.ts` — optional category definitions and URL helpers
- `src/lib/writings.ts` — published query, taxonomy, excerpts, view models
- `src/lib/seo.ts` — JSON-LD graphs
- `src/pages/writings/` — article routes
- `src/pages/sitemap.xml.ts`, `src/pages/robots.txt.ts`, `src/pages/rss.xml.ts`, `src/pages/llms.txt.ts` — discovery documents
- `src/components/writings/` — directory and reader UI
- `src/scripts/writings-search.ts` — listing search
- `src/scripts/article-code-blocks.ts` — article Copy control
- `docs/ARTICLE-PARAMETERS.md` — field-by-field frontmatter and derived values
- `docs/ARCHITECTURE.md` — system design
- `README.md` — project overview and the short operations summary
