interface ReadingPrefs {
  v: 1;
  preset: "paper" | "night" | "focus" | "custom";
  colors: boolean;
  canvas: string;
  ink: string;
  accent: string;
  font: "sans" | "serif" | "mono";
  articleSize: number;
  leading: number;
  measure: number;
  gutter: number;
}

interface ReadingApi {
  defaults: ReadingPrefs;
  presets: {
    paper: ReadingPrefs;
    night: ReadingPrefs;
    focus: ReadingPrefs;
  };
  read: () => ReadingPrefs | null;
  write: (prefs: ReadingPrefs) => ReadingPrefs | null;
  reset: () => void;
}

type ReadingControl = "size" | "leading" | "measure" | "gutter" | "canvas" | "ink";
type PresetName = "default" | "paper" | "night" | "focus";
type ReadingFont = ReadingPrefs["font"];

const mountedRoots = new WeakSet<HTMLElement>();

declare global {
  interface Window {
    dotfieldReading?: ReadingApi;
  }
}

if (typeof document !== "undefined") {
  document.querySelectorAll<HTMLElement>("[data-reading-root]").forEach(bindReadingPreferences);
}

function bindReadingPreferences(root: HTMLElement): void {
  if (mountedRoots.has(root)) {
    return;
  }
  mountedRoots.add(root);

  const api = window.dotfieldReading;
  const note = root.querySelector<HTMLElement>("[data-reading-note]");
  if (!api) {
    if (note) {
      note.hidden = false;
    }
    root.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input, button").forEach((control) => {
      if (control instanceof HTMLButtonElement && control.classList.contains("reading-orb")) {
        return;
      }
      if (control instanceof HTMLButtonElement && control.hasAttribute("popovertarget")) {
        return;
      }
      control.disabled = true;
    });
    return;
  }

  const sync = (): void => {
    paint(root, api.read() ?? api.defaults, api.read() === null);
  };

  sync();
  window.addEventListener("dotfield-reading", sync);
  root.querySelector("[data-reading-panel]")?.addEventListener("toggle", sync);

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const presetButton = target.closest<HTMLButtonElement>("[data-preset]");
    if (presetButton) {
      applyPreset(api, presetButton.dataset.preset ?? "");
      sync();
      return;
    }

    const fontButton = target.closest<HTMLButtonElement>("[data-font]");
    if (fontButton && isReadingFont(fontButton.dataset.font)) {
      const base = api.read() ?? api.defaults;
      api.write({ ...base, font: fontButton.dataset.font, preset: "custom" });
      sync();
      return;
    }

    if (target.closest("[data-reading-reset]")) {
      api.reset();
      sync();
    }
  });

  root.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const control = target.dataset.readingControl;
    if (!isReadingControl(control)) {
      return;
    }

    const base = api.read() ?? api.defaults;
    api.write(withControl(base, control, target.value));
    sync();
  });
}

function applyPreset(api: ReadingApi, name: string): void {
  switch (name) {
    case "default":
      api.reset();
      return;
    case "paper":
      api.write({ ...api.presets.paper });
      return;
    case "night":
      api.write({ ...api.presets.night });
      return;
    case "focus":
      api.write({ ...api.presets.focus });
      return;
    default:
      return;
  }
}

function withControl(
  base: ReadingPrefs,
  control: ReadingControl,
  rawValue: string,
): ReadingPrefs {
  const next: ReadingPrefs = { ...base, preset: "custom" };
  switch (control) {
    case "size":
      next.articleSize = Number(rawValue);
      return next;
    case "leading":
      next.leading = Number(rawValue);
      return next;
    case "measure":
      next.measure = Number(rawValue);
      return next;
    case "gutter":
      next.gutter = Number(rawValue);
      return next;
    case "canvas":
      next.colors = true;
      next.canvas = rawValue;
      return next;
    case "ink":
      next.colors = true;
      next.ink = rawValue;
      return next;
    default: {
      const exhaustive: never = control;
      return exhaustive;
    }
  }
}

function paint(root: HTMLElement, prefs: ReadingPrefs, isDefault: boolean): void {
  const activePreset: PresetName | "custom" = isDefault ? "default" : prefs.preset;
  root.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.preset === activePreset),
    );
  });
  root.querySelectorAll<HTMLButtonElement>("[data-font]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.font === prefs.font));
  });

  setRange(root, "size", prefs.articleSize);
  setRange(root, "leading", prefs.leading);
  setRange(root, "measure", prefs.measure);
  setRange(root, "gutter", prefs.gutter);
  setColor(root, "canvas", prefs.colors ? prefs.canvas : "#ffffff");
  setColor(root, "ink", prefs.colors ? prefs.ink : "#171717");
  setText(root, "size", `${prefs.articleSize}px`);
  setText(root, "leading", prefs.leading.toFixed(2));
  setText(root, "measure", `${prefs.measure * 16}px`);
  setText(root, "gutter", `${Math.round(prefs.gutter * 16)}px`);
}

function setRange(root: HTMLElement, control: ReadingControl, value: number): void {
  const input = root.querySelector<HTMLInputElement>(
    `[data-reading-control="${control}"]`,
  );
  if (input && document.activeElement !== input) {
    input.value = String(value);
  }
}

function setColor(root: HTMLElement, control: "canvas" | "ink", value: string): void {
  const input = root.querySelector<HTMLInputElement>(
    `[data-reading-control="${control}"]`,
  );
  if (input && document.activeElement !== input) {
    input.value = value;
  }
}

function setText(root: HTMLElement, name: string, value: string): void {
  const node = root.querySelector<HTMLElement>(`[data-reading-value="${name}"]`);
  if (node) {
    node.textContent = value;
  }
}

function isReadingControl(value: string | undefined): value is ReadingControl {
  switch (value) {
    case "size":
    case "leading":
    case "measure":
    case "gutter":
    case "canvas":
    case "ink":
      return true;
    default:
      return false;
  }
}

function isReadingFont(value: string | undefined): value is ReadingFont {
  switch (value) {
    case "sans":
    case "serif":
    case "mono":
      return true;
    default:
      return false;
  }
}
