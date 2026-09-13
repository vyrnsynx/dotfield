import type { WritingSearchDocument } from "../lib/writings";

interface SearchState {
  query: string;
  category: string;
  tag: string;
}

interface SearchElements {
  form: HTMLFormElement;
  queryInput: HTMLInputElement;
  categorySelect: HTMLSelectElement;
  tagSelect: HTMLSelectElement;
  status: HTMLElement;
  results: HTMLElement;
  list: HTMLUListElement;
  defaultResults: HTMLElement;
  template: HTMLTemplateElement;
}

const debounceDelayMs = 160;
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

document
  .querySelectorAll<HTMLElement>("[data-writing-search]")
  .forEach((root) => initializeSearch(root));

function initializeSearch(root: HTMLElement): void {
  const elements = getSearchElements(root);
  const indexUrl = root.dataset.indexUrl;
  if (!elements || !indexUrl) {
    return;
  }

  let documentsPromise: Promise<WritingSearchDocument[]> | undefined;
  let requestVersion = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const loadDocuments = (): Promise<WritingSearchDocument[]> => {
    documentsPromise ??= fetchSearchDocuments(indexUrl);
    return documentsPromise;
  };

  const runSearch = async (): Promise<void> => {
    const state = readSearchState(elements);
    if (!hasActiveFilter(state)) {
      restoreDefaultResults(elements);
      updateBrowserUrl(state);
      return;
    }

    const currentRequest = ++requestVersion;
    elements.status.textContent = "Searching…";

    try {
      const documents = await loadDocuments();
      if (currentRequest !== requestVersion) {
        return;
      }

      const matches = searchDocuments(documents, state);
      renderSearchResults(elements, matches);
      updateBrowserUrl(state);
    } catch {
      if (currentRequest !== requestVersion) {
        return;
      }

      elements.status.textContent =
        "Search is temporarily unavailable. Browse by category or tag instead.";
      elements.results.hidden = true;
      elements.defaultResults.hidden = false;
    }
  };

  const scheduleSearch = (): void => {
    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(() => void runSearch(), debounceDelayMs);
  };

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    void runSearch();
  });
  elements.queryInput.addEventListener("input", scheduleSearch);
  elements.categorySelect.addEventListener("change", () => void runSearch());
  elements.tagSelect.addEventListener("change", () => void runSearch());
  elements.form.addEventListener("reset", () => {
    window.requestAnimationFrame(() => {
      elements.queryInput.value = "";
      elements.categorySelect.value = "";
      elements.tagSelect.value = "";

      if (window.location.pathname !== "/writings/") {
        window.location.assign("/writings/");
        return;
      }

      restoreDefaultResults(elements);
      updateBrowserUrl(readSearchState(elements));
    });
  });
  root.addEventListener("focusin", () => void loadDocuments(), { once: true });

  const hasUrlState = applyUrlState(elements);
  if (hasUrlState) {
    void runSearch();
  }
}

function getSearchElements(root: HTMLElement): SearchElements | undefined {
  const form = root.querySelector<HTMLFormElement>("form");
  const queryInput = root.querySelector<HTMLInputElement>('input[name="q"]');
  const categorySelect =
    root.querySelector<HTMLSelectElement>('select[name="category"]');
  const tagSelect =
    root.querySelector<HTMLSelectElement>('select[name="tag"]');
  const status = root.querySelector<HTMLElement>("[data-search-status]");
  const results = root.querySelector<HTMLElement>("[data-search-results]");
  const list = root.querySelector<HTMLUListElement>("[data-search-list]");
  const defaultResults = root.querySelector<HTMLElement>(
    "[data-default-results]",
  );
  const template = root.querySelector<HTMLTemplateElement>(
    "[data-search-result-template]",
  );

  if (
    !form ||
    !queryInput ||
    !categorySelect ||
    !tagSelect ||
    !status ||
    !results ||
    !list ||
    !defaultResults ||
    !template
  ) {
    return undefined;
  }

  return {
    form,
    queryInput,
    categorySelect,
    tagSelect,
    status,
    results,
    list,
    defaultResults,
    template,
  };
}

function readSearchState(elements: SearchElements): SearchState {
  return {
    query: elements.queryInput.value.trim(),
    category: elements.categorySelect.value,
    tag: elements.tagSelect.value,
  };
}

function hasActiveFilter(state: SearchState): boolean {
  return Boolean(state.query || state.category || state.tag);
}

function applyUrlState(elements: SearchElements): boolean {
  const parameters = new URLSearchParams(window.location.search);
  const query = parameters.get("q")?.trim() ?? "";
  const category = parameters.get("category") ?? "";
  const tag = parameters.get("tag") ?? "";

  elements.queryInput.value = query;
  setSelectValue(elements.categorySelect, category);
  setSelectValue(elements.tagSelect, tag);

  return Boolean(query || category || tag);
}

function setSelectValue(select: HTMLSelectElement, value: string): void {
  const valueExists = [...select.options].some((option) => option.value === value);
  if (valueExists) {
    select.value = value;
  }
}

async function fetchSearchDocuments(
  indexUrl: string,
): Promise<WritingSearchDocument[]> {
  const response = await fetch(indexUrl, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Search index request failed with ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || !payload.every(isWritingSearchDocument)) {
    throw new Error("Search index response has an invalid shape.");
  }

  return payload;
}

function isWritingSearchDocument(
  value: unknown,
): value is WritingSearchDocument {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.slug === "string" &&
    typeof value.url === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.author === "string" &&
    typeof value.pubDate === "string" &&
    (typeof value.updatedDate === "string" || value.updatedDate === null) &&
    isTaxonomyReference(value.category) &&
    Array.isArray(value.tags) &&
    value.tags.every(isTaxonomyReference) &&
    typeof value.readingMinutes === "number"
  );
}

function isTaxonomyReference(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.slug === "string" &&
    typeof value.label === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function searchDocuments(
  documents: readonly WritingSearchDocument[],
  state: SearchState,
): WritingSearchDocument[] {
  const queryTokens = normalizeSearchText(state.query)
    .split(/\s+/)
    .filter(Boolean);

  return documents
    .filter((document) => {
      if (state.category && document.category.slug !== state.category) {
        return false;
      }
      if (state.tag && !document.tags.some((tag) => tag.slug === state.tag)) {
        return false;
      }

      const searchableText = normalizeSearchText(
        [
          document.title,
          document.description,
          document.author,
          document.category.label,
          ...document.tags.map((tag) => tag.label),
        ].join(" "),
      );
      return queryTokens.every((token) => searchableText.includes(token));
    })
    .map((document) => ({
      document,
      score: scoreDocument(document, queryTokens),
    }))
    .sort(
      (first, second) =>
        second.score - first.score ||
        Date.parse(second.document.pubDate) -
          Date.parse(first.document.pubDate),
    )
    .map(({ document }) => document);
}

function scoreDocument(
  document: WritingSearchDocument,
  queryTokens: readonly string[],
): number {
  const title = normalizeSearchText(document.title);
  const description = normalizeSearchText(document.description);
  const author = normalizeSearchText(document.author);
  const category = normalizeSearchText(document.category.label);
  const tags = document.tags.map((tag) => normalizeSearchText(tag.label));

  return queryTokens.reduce((score, token) => {
    if (title === token) {
      return score + 120;
    }
    if (title.startsWith(token)) {
      return score + 80;
    }
    if (title.includes(token)) {
      return score + 60;
    }
    if (tags.some((tag) => tag === token)) {
      return score + 45;
    }
    if (category.includes(token)) {
      return score + 35;
    }
    if (description.includes(token)) {
      return score + 20;
    }
    if (author.includes(token)) {
      return score + 10;
    }
    return score;
  }, 0);
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US");
}

function renderSearchResults(
  elements: SearchElements,
  documents: readonly WritingSearchDocument[],
): void {
  const resultFragment = document.createDocumentFragment();

  documents.forEach((writing) => {
    const item = elements.template.content.cloneNode(true) as DocumentFragment;
    const link = item.querySelector<HTMLAnchorElement>("[data-result-link]");
    const title = item.querySelector<HTMLElement>("[data-result-title]");
    const description = item.querySelector<HTMLElement>(
      "[data-result-description]",
    );
    const tags = item.querySelector<HTMLElement>("[data-result-tags]");
    const date = item.querySelector<HTMLTimeElement>("[data-result-date]");
    const details = item.querySelector<HTMLElement>("[data-result-details]");

    if (!link || !title || !description || !tags || !date || !details) {
      return;
    }

    link.href = writing.url;
    link.rel = "prefetch";
    title.textContent = writing.title;
    description.textContent = writing.description;
    tags.textContent = writing.tags.map((tag) => `#${tag.label}`).join("  ");
    tags.hidden = writing.tags.length === 0;
    date.dateTime = writing.pubDate;
    date.textContent = dateFormatter.format(new Date(writing.pubDate));
    details.textContent = `${writing.readingMinutes} min read · ${writing.category.label}`;
    resultFragment.append(item);
  });

  elements.list.replaceChildren(resultFragment);
  elements.results.hidden = false;
  elements.defaultResults.hidden = true;
  elements.status.textContent =
    documents.length === 1
      ? "Showing 1 result."
      : `Showing ${documents.length} results.`;
}

function restoreDefaultResults(elements: SearchElements): void {
  elements.results.hidden = true;
  elements.defaultResults.hidden = false;
  elements.status.textContent = "";
}

function updateBrowserUrl(state: SearchState): void {
  const url = new URL("/writings/", window.location.origin);
  if (state.query) {
    url.searchParams.set("q", state.query);
  }
  if (state.category) {
    url.searchParams.set("category", state.category);
  }
  if (state.tag) {
    url.searchParams.set("tag", state.tag);
  }

  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}
