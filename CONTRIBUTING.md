# Contributing

Thank you for helping with Dotfield. This repository is a static Astro
site and a folder-driven Markdown blog. Read these documents before opening
an issue or a pull request:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system boundaries, routes, JavaScript budget
- [docs/WRITINGS.md](docs/WRITINGS.md) — how to add, draft, and remove articles
- [docs/ARTICLE-PARAMETERS.md](docs/ARTICLE-PARAMETERS.md) — frontmatter fields

## Principles

- Content lives in data and Markdown. Presentational components do not own
  editorial copy.
- Keep the homepage compact. Do not inflate type, spacing, or column width.
- Stay static. Do not add a CMS, MDX, a search library, a UI framework, or a
  backend.
- Public HTML must not name the edge host or the site generator.
- Docs, comments, UI strings, and commit messages are English.

## Commits

Use Conventional Commits in the present tense:

```text
feat(writings): add tag index empty state
fix(home): keep the 600px column on small screens
docs(writings): explain the draft flag
chore(repo): rename the npm package to dotfield
```

Include a body when the change is not obvious. Explain why, then what
changed.

## Pull requests

1. Keep the change focused.
2. Run `npm run build`.
3. Say whether docs or content collections moved.
4. Use the pull request template.
