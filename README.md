# dotfield

A static personal site and folder-driven Markdown blog. The homepage is
static HTML with no executable JavaScript (JSON-LD is allowed). Writings
pages are also static: Astro discovers Markdown at build time, validates
English frontmatter, emits category, tag, and article routes, and writes a
metadata-only search index plus sitemap, robots, RSS, and `llms.txt` from
the published collection.

The compact homepage language is referenced from
[jckhlry.com](https://www.jckhlry.com/). Everything else — the Writings
system, taxonomy, search, article reader, tokens, and this repository’s
architecture — is original to this project.

This is not a CMS, not a backend, and not an MDX app. Adding a post means
adding a `.md` file and running the build.

## Architecture

Content and presentation are separate.

- Homepage copy lives in `src/data/site.ts` and is composed by presentational
Astro components. Those components must not contain editorial text.
- Articles live in `src/content/writings/` and are validated by the `writings`
collection in `src/content.config.ts`.
- `src/data/writings.ts` holds optional category labels and URL helpers, not
article bodies.
- `src/lib/writings.ts` derives published entries, slugs, taxonomy, reading
time, excerpts, search documents, and sitemap entries at build time.
- `src/data/site.ts` `metadata.origin` is the public site origin used for
canonical URLs, Open Graph, sitemap, robots, RSS, and `llms.txt`. Edit that
value when the production host changes.
- `src/pages/` only composes routes. `dist/` is generated output and is never
edited by hand.

```text
src/data/site.ts                  -> homepage modules -> /
src/content/writings/*.md         -> collection + helpers
                                  -> /writings/
                                  -> /writings/<category>/
                                  -> /writings/tag/<tag>/
                                  -> /writings/post/<slug>/
                                  -> /writings/search-index.json
                                  -> /sitemap.xml /robots.txt /rss.xml /llms.txt
```

There is no database and no runtime content API. Git is the history. The
next `npm run build` is what publishes, hides, or removes a page, including
every discovery document. Drafts and deleted files do not appear in the
sitemap, RSS feed, `llms.txt`, or search index.

The full system description is in `docs/ARCHITECTURE.md`. Article
parameters are in `docs/ARTICLE-PARAMETERS.md`. Category and tag
operations are in `docs/WRITINGS.md`.

## Tech stack


| Piece          | Choice                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| Runtime        | Node.js `22.12` or newer, npm `10` or newer                               |
| Framework      | Astro 7, static output                                                    |
| Language       | TypeScript, English UI and docs                                           |
| Content        | Astro Content Collections + Zod, CommonMark / GFM only                    |
| Highlighting   | Shiki `github-light`                                                      |
| Fonts          | `@fontsource/inter` Latin 400 and 500, hashed WOFF2 at build time         |
| Styling        | Scoped Astro CSS plus `src/styles/tokens.css`                             |
| Search         | Prerendered JSON + vanilla `src/scripts/writings-search.ts`               |
| Article extras | `src/scripts/article-code-blocks.ts` (Copy) and a tiny back-to-top toggle |


Astro 7 and `@fontsource/inter` are the only runtime dependencies. There
are no `/public/fonts/*` files and none should be added. Do not add a
search library, a UI framework, MDX, or a backend.

## Design system

Tokens in `src/styles/tokens.css` own colors, type, widths, and spacing.
Do not invent a second scale in a component.


| Token / surface      | Value                                         |
| -------------------- | --------------------------------------------- |
| Document root `html` | `16px` (`font-size: 100%`)                    |
| Body / chrome type   | Inter Medium, `12px`, line-height `1.2`       |
| Article body         | `14px` / `1.55` in a `40rem` (`640px`) column |
| Home column          | `37.5rem` (`600px`)                           |
| Writings shell       | `52rem` (`832px`)                             |
| Page inset           | `1.5625rem` (`25px`)                          |
| Section gap          | `1.875rem` (`30px`)                           |
| Link-row gap         | `0.1875rem` (`3px`)                           |
| Link pills           | square, `#000`, `2px 5px`, no radius          |
| Accent               | `#beadff` on hover and selection              |
| Brand mark           | `13px` square                                 |


**Do not set** `html { font-size: 12px }`**.** Body type is `12px` on `body`.
`rem` widths stay on a 16px root so `37.5rem` stays `600px`.

Writings reuses the same type, pills, and inset, then widens the shell so
a left taxonomy rail and a right article list can sit side by side. Page
titles stay 12px. Article titles are `1.25rem` (`20px`), not display type.

## Requirements

- Node.js `22.12` or newer
- npm `10` or newer



## Local development

```sh
npm install
npm run dev
```

Astro serves the site at `http://localhost:4321` by default.

```sh
npm run build
npm run preview
```

`npm run build` is the source of truth. It validates every Markdown file,
fails on invalid frontmatter or slug collisions, writes static HTML, and
emits `/writings/search-index.json`.

## Commands


| Command                      | Purpose                                  |
| ---------------------------- | ---------------------------------------- |
| `npm run dev`                | Local development server with hot reload |
| `npm run build`              | Production static build into `dist/`     |
| `npm run preview`            | Serve the production build locally       |
| `npm run astro -- <command>` | Forward a command to the Astro CLI       |




## What lives where

```text
public/                         Favicons and the 13px site mark
src/content/writings/           Markdown posts (`slug.md` or `slug/index.md`)
src/content/writings/images/    Shared article images (covers and body media)
src/content.config.ts           Writings collection schema
src/data/site.ts                Homepage copy, links, and document metadata
src/data/writings.ts            Category labels, path helpers, slug rules
src/lib/writings.ts             Published query, taxonomy, reading time, search docs
src/components/brand/           Site mark
src/components/identity/        Homepage name
src/components/bio/             Lead, body, practice line
src/components/links/           Important-links list and black pills
src/components/writings/        Directory, search, article reader pieces
src/scripts/writings-search.ts  Vanilla listing search (no UI framework)
src/scripts/article-code-blocks.ts  Article Copy control and “Copied” pill
src/pages/index.astro           Homepage composition
src/pages/writings/             All, category, tag, article, search-index routes
src/layouts/BaseLayout.astro    Document shell, fonts, global CSS
src/styles/tokens.css           Colors, type, widths, spacing
src/styles/global.css           Reset and body type
docs/ARCHITECTURE.md            System design and extension rules
docs/WRITINGS.md                Writings operations and authoring manual
```



## Editing homepage content

Change name, biography, practices, links, and default document metadata in
`src/data/site.ts`. Presentational components must not contain editorial copy.

The Writings pill on the homepage points at `/writings`. That route is the
all-articles directory, not a redirect.

## Managing writings

The complete operations manual is `docs/WRITINGS.md`. Every article field
is documented in `docs/ARTICLE-PARAMETERS.md`. This section is the short
version of the same rules.

There is no CMS. Articles, categories, and tags are files and frontmatter.
The next `npm run build` is what publishes, hides, or removes them.

### Where articles live

Every article is a Markdown file under `src/content/writings/`:

```text
src/content/writings/<slug>.md
src/content/writings/<slug>/index.md   # preferred when the post has images
```

The public URL is always `/writings/post/<slug>/`. The slug is the
filename or folder name, never a frontmatter field. Both shapes cannot
exist for the same slug.

Shared article images go in `src/content/writings/images/`. Do not put a
Markdown file in that folder. Per-post images can still sit next to
`index.md` in a post folder.

Do not put articles in `src/data/`, `src/pages/`, `public/`, or `dist/`.
`src/data/writings.ts` only stores optional category labels. `dist/` is
generated output.

### Create an article

1. Pick a unique lowercase slug (`my-first-article`, not `My Post`).
2. Add `src/content/writings/<slug>.md` or a folder with `index.md`.
3. Fill English frontmatter: `title`, `category`, `pubDate`. Optional:
  `description` (otherwise the build takes the first body paragraph),
  `author`, `tags`, `updatedDate`, `cover` + `coverAlt`, `featured`,
  `draft`. CJK characters are rejected.
4. Write the body in CommonMark / GFM starting at `##`. Put shared images
   in `src/content/writings/images/` and reference them as `./images/<file>`.
5. Set `draft: true` until it should be public. Drafts are validated but
  do not emit a page, a listing card, or a search document.
6. Set `draft: false` and run `npm run build` to publish.



### Edit or rename an article

- Edit the `.md` file to change title, body, category, or tags. The URL
stays the same.
- Rename the file or folder to change the URL. The old
`/writings/post/<old-slug>/` 404s. There are no redirects.
- Set `updatedDate` when a published piece changes in a way readers should
notice. It cannot be earlier than `pubDate`.



### Delete an article

1. Delete the Markdown file, or the whole post folder if it contains
  `index.md` and images.
2. Fix any remaining links to `/writings/post/<slug>/`.
3. Run `npm run build`. The article URL, listing card, search document,
  sitemap row, RSS item, and `llms.txt` line are gone.
4. Commit the deletion. Git is the only undelete path.

To hide a post without deleting the file, set `draft: true` and rebuild.

### Create or delete a category

A category is the `category:` slug on published posts. One post has one
category. Known slugs (`notes`, `engineering`, `ops`) have labels in
`src/data/writings.ts`.


| Action                            | How                                                                                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Create                            | Set `category: field-notes` on a published post and rebuild. `/writings/field-notes/` appears. Add a definition in `src/data/writings.ts` only if you want a custom label, description, or sort order. |
| Assign a post to another category | Change that post’s `category:` and rebuild.                                                                                                                                                            |
| Rename the URL                    | Change the slug on every post that used it, rename the definition, rebuild. The old category URL 404s.                                                                                                 |
| Delete                            | Move, draft, or delete every published post that uses that slug, then rebuild. The category page and sidebar link disappear. Optionally remove the leftover definition from `src/data/writings.ts`.    |


A definition with zero published posts does not create a page. Deleting
only the TypeScript definition while posts still use the slug does not
remove the category; the page stays and the label falls back to title case.

### Create or delete a tag

Tags are strings in each post’s `tags` array. There is no tag registry.


| Action               | How                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Create               | Add `- Astro` (or any label) under `tags` and rebuild. The first published use emits `/writings/tag/astro/`. |
| Remove from one post | Delete that string from that post’s `tags` and rebuild.                                                      |
| Delete from the site | Remove the label from every published post and rebuild. The tag page disappears.                             |
| Avoid collisions     | Do not use `AI/ML` and `AI ML` together; they share the slug `ai-ml` and fail the build.                     |


Up to 16 unique tags per post. Uniqueness ignores letter case.

### After every content change

Run `npm run build`. Confirm the article, category, and tag surfaces you
expect in `dist/`, and that `dist/writings/search-index.json`,
`dist/sitemap.xml`, `dist/rss.xml`, and `dist/llms.txt` match the
published set.

## Routes


| URL                           | What it is                                     |
| ----------------------------- | ---------------------------------------------- |
| `/`                           | Homepage. No executable JavaScript.            |
| `/writings/`                  | All published articles plus progressive search |
| `/writings/<category>/`       | One category                                   |
| `/writings/tag/<tag>/`        | One tag                                        |
| `/writings/post/<slug>/`      | One article                                    |
| `/writings/search-index.json` | Published metadata only, `noindex`             |
| `/sitemap.xml`                | Published HTML routes only                     |
| `/robots.txt`                 | Crawler rules plus sitemap pointer             |
| `/rss.xml`                    | Published writings feed                        |
| `/llms.txt`                   | Published titles, URLs, and summaries          |
| `/404/`                       | Not found, `noindex`                           |


Category and tag pages work without JavaScript. Search is a progressive
enhancement: it lazy-loads the JSON after the reader types or changes a
filter, ranks title matches first, and writes shareable `?q=&category=&tag=`
query parameters.

## Client JavaScript policy

- Homepage: no executable JavaScript. JSON-LD in the document head is
allowed. Public HTML must not name the edge host or the site generator.
- Writings listings: the bundled search controller, native `rel="prefetch"`
on article cards, and Chromium speculation rules for `/writings/*`.
- Articles: `article-code-blocks.ts` (Copy + “Copied” pill) and a tiny
back-to-top toggle after `scrollY > 240`. The footer `#top` link remains
the no-JavaScript fallback.

Do not add a search library, a UI framework, MDX, or a backend.

## Visual and responsive rules

- Colors, type, widths, and spacing come from `src/styles/tokens.css`.
- Homepage max-width is `37.5rem` (`600px`). Writings shell is `52rem`.
Article column is `40rem` with a `14px` reading size.
- Below `810px` (`50.625rem`) the homepage content starts at the top of the
viewport and writings navigation stacks above the list. At `810px` and
above, the homepage is vertically centered and writings keep a left rail.
- Article table of contents is a `<details>` block on smaller screens and a
sticky right rail from `64rem`.
- Wide code and tables scroll inside themselves. The page itself must not
scroll horizontally at `320`, `390`, `768`, `1024`, `1440`, or `1920` px.
- Hover geometry stays square. Focus rings stay visible. Honor
`prefers-reduced-motion`.



## Adding a homepage module

1. Model the content in `src/data/site.ts`.
2. Create a focused component under the matching `src/components/` domain.
3. Pass typed props only. Keep CSS scoped.
4. Compose it in `src/pages/index.astro`.
5. Recheck both sides of the `810px` breakpoint and run `npm run build`.

See `docs/WRITINGS.md` for the full article, category, and tag operations
manual, `docs/ARTICLE-PARAMETERS.md` for every frontmatter field, and
`docs/ARCHITECTURE.md` for data-flow, search, and accessibility
conventions.

## Commit convention

Use Conventional Commits in English:

```text
type(optional-scope): concise imperative subject
```

Examples:

```text
feat(writings): derive tag pages from published Markdown
fix(home): restore 12px Inter and 600px column
docs: document draft workflow and search index fields
```

Keep unrelated modules in separate commits. The commit body should explain
why the change exists, what it changes, and the reader or maintenance impact.