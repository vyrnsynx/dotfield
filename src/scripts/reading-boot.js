(function () {
  var KEY = "dotfield.reading.v1";
  var COLOR_PROPS = [
    "--color-canvas",
    "--color-ink",
    "--color-ink-strong",
    "--color-ink-soft",
    "--color-muted",
    "--color-label-muted",
    "--color-pill-ink",
    "--color-accent",
    "--color-rule",
    "--color-rule-strong",
    "--color-surface-soft",
  ];
  var METRIC_PROPS = [
    "--font-sans",
    "--font-size-article",
    "--font-size-article-title",
    "--font-size-body",
    "--font-size-list-title",
    "--font-size-caption",
    "--font-size-page-title",
    "--line-height-article",
    "--article-width",
    "--page-gutter",
    "--writings-width",
  ];
  var FONT_STACKS = {
    serif:
      '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
    mono:
      '"Cascadia Mono", "Segoe UI Mono", ui-monospace, Consolas, monospace',
  };
  var DEFAULTS = {
    v: 1,
    preset: "custom",
    colors: false,
    canvas: "#ffffff",
    ink: "#171717",
    accent: "#beadff",
    font: "sans",
    articleSize: 14,
    leading: 1.55,
    measure: 40,
    gutter: 1.5625,
  };
  var PRESETS = {
    paper: {
      v: 1,
      preset: "paper",
      colors: true,
      canvas: "#f4efe4",
      ink: "#1c1712",
      accent: "#beadff",
      font: "serif",
      articleSize: 18,
      leading: 1.7,
      measure: 38,
      gutter: 1.75,
    },
    night: {
      v: 1,
      preset: "night",
      colors: true,
      canvas: "#141414",
      ink: "#eceae4",
      accent: "#beadff",
      font: "sans",
      articleSize: 17,
      leading: 1.65,
      measure: 40,
      gutter: 1.5625,
    },
    focus: {
      v: 1,
      preset: "focus",
      colors: true,
      canvas: "#f7f7f5",
      ink: "#111111",
      accent: "#beadff",
      font: "sans",
      articleSize: 19,
      leading: 1.75,
      measure: 34,
      gutter: 2.25,
    },
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function hexColor(value) {
    return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
      ? value.toLowerCase()
      : "";
  }

  function finiteNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : NaN;
  }

  function luminance(color) {
    var channels = [
      parseInt(color.slice(1, 3), 16) / 255,
      parseInt(color.slice(3, 5), 16) / 255,
      parseInt(color.slice(5, 7), 16) / 255,
    ].map(function (channel) {
      return channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function mixTransparent(color, percent) {
    return "color-mix(in srgb, " + color + " " + percent + "%, transparent)";
  }

  function mixSolid(ink, canvas, amount) {
    return (
      "color-mix(in srgb, " +
      ink +
      " " +
      Math.round(amount * 100) +
      "%, " +
      canvas +
      ")"
    );
  }

  function normalize(raw) {
    if (!raw || raw.v !== 1) {
      return null;
    }

    var canvas = hexColor(raw.canvas);
    var ink = hexColor(raw.ink);
    var accent = hexColor(raw.accent);
    var font =
      raw.font === "sans" || raw.font === "serif" || raw.font === "mono"
        ? raw.font
        : "";
    var articleSize = finiteNumber(raw.articleSize);
    var leading = finiteNumber(raw.leading);
    var measure = finiteNumber(raw.measure);
    var gutter = finiteNumber(raw.gutter);

    if (
      !canvas ||
      !ink ||
      !accent ||
      !font ||
      Number.isNaN(articleSize) ||
      Number.isNaN(leading) ||
      Number.isNaN(measure) ||
      Number.isNaN(gutter)
    ) {
      return null;
    }

    var preset =
      raw.preset === "paper" ||
      raw.preset === "night" ||
      raw.preset === "focus" ||
      raw.preset === "custom"
        ? raw.preset
        : "custom";

    return {
      v: 1,
      preset: preset,
      colors: raw.colors === true,
      canvas: canvas,
      ink: ink,
      accent: accent,
      font: font,
      articleSize: Math.round(clamp(articleSize, 14, 22)),
      leading: Math.round(clamp(leading, 1.45, 1.9) * 100) / 100,
      measure: Math.round(clamp(measure, 32, 48)),
      gutter: Math.round(clamp(gutter, 1, 3) * 10000) / 10000,
    };
  }

  function isFactory(prefs) {
    return (
      prefs.colors === false &&
      prefs.font === "sans" &&
      prefs.articleSize === DEFAULTS.articleSize &&
      prefs.leading === DEFAULTS.leading &&
      prefs.measure === DEFAULTS.measure &&
      Math.abs(prefs.gutter - DEFAULTS.gutter) < 0.0001
    );
  }

  function readRaw() {
    try {
      return localStorage.getItem(KEY);
    } catch (error) {
      return null;
    }
  }

  function read() {
    var raw = readRaw();
    if (!raw) {
      return null;
    }

    try {
      var prefs = normalize(JSON.parse(raw));
      if (!prefs || isFactory(prefs)) {
        return null;
      }
      return prefs;
    } catch (error) {
      return null;
    }
  }

  function themeMeta() {
    return document.querySelector('meta[name="theme-color"]');
  }

  function emit() {
    window.dispatchEvent(new CustomEvent("dotfield-reading"));
  }

  function apply(prefs) {
    var root = document.documentElement;
    var dark = prefs.colors && luminance(prefs.canvas) < 0.42;
    var ui = Math.round(clamp((prefs.articleSize * 12) / 14, 12, 18));
    var title = Math.round((prefs.articleSize * 20) / 14);
    var theme = themeMeta();

    root.setAttribute("data-reading", "on");

    if (prefs.font === "sans") {
      root.removeAttribute("data-reading-font");
      root.style.removeProperty("--font-sans");
    } else {
      root.setAttribute("data-reading-font", prefs.font);
      root.style.setProperty("--font-sans", FONT_STACKS[prefs.font]);
    }

    if (prefs.colors) {
      root.setAttribute("data-reading-scheme", dark ? "dark" : "light");
      root.style.colorScheme = dark ? "dark" : "light";
      root.style.setProperty("--color-canvas", prefs.canvas);
      root.style.setProperty("--color-ink", prefs.ink);
      root.style.setProperty("--color-ink-strong", prefs.ink);
      root.style.setProperty("--color-ink-soft", mixTransparent(prefs.ink, 75));
      root.style.setProperty("--color-muted", mixTransparent(prefs.ink, 50));
      root.style.setProperty(
        "--color-label-muted",
        mixSolid(prefs.ink, prefs.canvas, 0.45),
      );
      root.style.setProperty("--color-pill-ink", prefs.canvas);
      root.style.setProperty("--color-accent", prefs.accent);
      root.style.setProperty(
        "--color-rule",
        mixSolid(prefs.ink, prefs.canvas, 0.12),
      );
      root.style.setProperty(
        "--color-rule-strong",
        mixSolid(prefs.ink, prefs.canvas, 0.28),
      );
      root.style.setProperty(
        "--color-surface-soft",
        mixSolid(prefs.ink, prefs.canvas, 0.06),
      );
      if (theme) {
        theme.setAttribute("content", prefs.canvas);
      }
    } else {
      root.removeAttribute("data-reading-scheme");
      root.style.colorScheme = "";
      COLOR_PROPS.forEach(function (name) {
        root.style.removeProperty(name);
      });
      if (theme) {
        theme.setAttribute("content", "#ffffff");
      }
    }

    root.style.setProperty("--font-size-article", prefs.articleSize + "px");
    root.style.setProperty("--font-size-article-title", title + "px");
    root.style.setProperty("--font-size-body", ui + "px");
    root.style.setProperty("--font-size-list-title", ui + "px");
    root.style.setProperty(
      "--font-size-caption",
      Math.max(11, ui - 1) + "px",
    );
    root.style.setProperty("--font-size-page-title", ui + "px");
    root.style.setProperty("--line-height-article", String(prefs.leading));
    root.style.setProperty("--article-width", prefs.measure + "rem");
    root.style.setProperty("--page-gutter", prefs.gutter + "rem");
    root.style.setProperty(
      "--writings-width",
      Math.min(68, prefs.measure + 12) + "rem",
    );
  }

  function clear() {
    var root = document.documentElement;
    var theme = themeMeta();
    root.removeAttribute("data-reading");
    root.removeAttribute("data-reading-font");
    root.removeAttribute("data-reading-scheme");
    root.style.colorScheme = "";
    COLOR_PROPS.concat(METRIC_PROPS).forEach(function (name) {
      root.style.removeProperty(name);
    });
    if (theme) {
      theme.setAttribute("content", "#ffffff");
    }
  }

  function reset() {
    try {
      localStorage.removeItem(KEY);
    } catch (error) {
      // Storage can be blocked. The page still returns to the tokens.
    }
    clear();
    emit();
  }

  function write(input) {
    var clean = normalize(input);
    if (!clean) {
      return null;
    }
    if (isFactory(clean)) {
      reset();
      return null;
    }

    try {
      localStorage.setItem(KEY, JSON.stringify(clean));
    } catch (error) {
      // Apply for this view even when the browser refuses storage.
    }

    apply(clean);
    emit();
    return clean;
  }

  Object.freeze(DEFAULTS);
  Object.freeze(PRESETS.paper);
  Object.freeze(PRESETS.night);
  Object.freeze(PRESETS.focus);
  Object.freeze(PRESETS);

  window.dotfieldReading = {
    defaults: DEFAULTS,
    presets: PRESETS,
    read: read,
    write: write,
    reset: reset,
  };

  var initial = read();
  if (initial) {
    apply(initial);
  } else if (readRaw()) {
    try {
      localStorage.removeItem(KEY);
    } catch (error) {
      // Ignore a corrupt key that cannot be removed.
    }
  }

  window.addEventListener("storage", function (event) {
    if (event.key !== KEY) {
      return;
    }

    var next = read();
    if (next) {
      apply(next);
    } else {
      clear();
    }
    emit();
  });
})();
