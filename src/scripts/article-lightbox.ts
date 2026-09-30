interface ZoomItem {
  src: string;
  alt: string;
  caption: string;
}

const readyRoots = new WeakSet<Element>();

if (typeof document !== "undefined") {
  mountArticleLightbox();
}

function mountArticleLightbox(): void {
  const dialog = document.querySelector<HTMLDialogElement>(
    "[data-article-lightbox]",
  );
  if (!dialog || readyRoots.has(dialog)) {
    return;
  }

  const stageImage = dialog.querySelector<HTMLImageElement>(
    "[data-lightbox-image]",
  );
  const caption = dialog.querySelector<HTMLElement>("[data-lightbox-caption]");
  const count = dialog.querySelector<HTMLElement>("[data-lightbox-count]");
  const previous = dialog.querySelector<HTMLButtonElement>(
    "[data-lightbox-prev]",
  );
  const next = dialog.querySelector<HTMLButtonElement>("[data-lightbox-next]");
  if (!stageImage || !caption || !count || !previous || !next) {
    return;
  }

  readyRoots.add(dialog);

  const items: ZoomItem[] = [];
  document
    .querySelectorAll<HTMLImageElement>(".article-prose img, .article-page__cover img")
    .forEach((image) => {
      const item = enableZoom(image, items.length, openAt);
      if (item) {
        items.push(item);
      }
    });

  if (items.length === 0) {
    return;
  }

  let activeIndex = 0;
  let pointerStartX = 0;
  let pointerId = -1;

  previous.hidden = items.length < 2;
  next.hidden = items.length < 2;

  previous.addEventListener("click", () => step(-1));
  next.addEventListener("click", () => step(1));
  dialog.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    if (target.closest("[data-lightbox-keep]")) {
      return;
    }
    dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("lightbox-open");
  });
  dialog.addEventListener("keydown", (event) => {
    if (items.length < 2) {
      return;
    }
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        step(1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        step(-1);
        break;
      default:
        break;
    }
  });
  dialog.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    pointerStartX = event.clientX;
    pointerId = event.pointerId;
  });
  dialog.addEventListener("pointerup", (event) => {
    if (event.pointerId !== pointerId || items.length < 2) {
      return;
    }
    const delta = event.clientX - pointerStartX;
    pointerId = -1;
    if (delta <= -48) {
      step(1);
    } else if (delta >= 48) {
      step(-1);
    }
  });

  function openAt(index: number): void {
    show(index);
    if (!dialog.open) {
      document.body.classList.add("lightbox-open");
      dialog.showModal();
    }
  }

  function step(direction: -1 | 1): void {
    show((activeIndex + direction + items.length) % items.length);
  }

  function show(index: number): void {
    const item = items[index];
    if (!item) {
      return;
    }

    activeIndex = index;
    stageImage.src = item.src;
    stageImage.alt = item.caption ? "" : item.alt || "Enlarged image";
    caption.textContent = item.caption;
    caption.hidden = item.caption.length === 0;
    count.textContent = `${index + 1} / ${items.length}`;
    preload(items[(index + 1) % items.length]?.src);
    preload(items[(index - 1 + items.length) % items.length]?.src);
  }
}

function enableZoom(
  image: HTMLImageElement,
  index: number,
  openAt: (index: number) => void,
): ZoomItem | null {
  if (image.closest(".zoom-frame") || image.closest("[data-article-lightbox]")) {
    return null;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "zoom-frame";
  const label = image.alt.trim() || "image";
  button.setAttribute("aria-label", `Enlarge ${label}`);
  button.addEventListener("click", () => openAt(index));

  const host = image.closest("picture") ?? image;
  const parent = host.parentElement;
  host.replaceWith(button);
  button.append(host);

  if (parent?.tagName === "P") {
    const hasOtherContent = [...parent.childNodes].some((node) => {
      if (node === button) {
        return false;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        return Boolean(node.textContent?.trim());
      }
      return true;
    });
    if (!hasOtherContent) {
      parent.replaceWith(button);
    }
  }

  return {
    src: largestSource(image),
    alt: image.alt.trim(),
    caption: captionFor(image, button),
  };
}

function captionFor(image: HTMLImageElement, button: HTMLButtonElement): string {
  const figcaption = image
    .closest("figure")
    ?.querySelector("figcaption")
    ?.textContent?.trim();
  if (figcaption) {
    return figcaption;
  }

  const sibling = button.nextElementSibling;
  const siblingText = sibling?.textContent?.trim() ?? "";
  if (/^figure\b/i.test(siblingText)) {
    return siblingText;
  }

  return image.alt.trim();
}

function largestSource(image: HTMLImageElement): string {
  const srcset = image.getAttribute("srcset");
  if (!srcset) {
    return image.currentSrc || image.src;
  }

  let bestUrl = image.currentSrc || image.src;
  let bestWidth = 0;
  srcset.split(",").forEach((candidate) => {
    const [url, descriptor] = candidate.trim().split(/\s+/);
    if (!url) {
      return;
    }
    const width = descriptor?.endsWith("w")
      ? Number.parseInt(descriptor, 10)
      : 0;
    if (width >= bestWidth) {
      bestWidth = width;
      bestUrl = url;
    }
  });

  return bestUrl;
}

function preload(src: string | undefined): void {
  if (!src) {
    return;
  }
  const image = new Image();
  image.decoding = "async";
  image.src = src;
}
