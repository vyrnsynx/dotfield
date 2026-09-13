if (typeof document !== "undefined") {
  enhanceArticleCodeBlocks();
}

const copiedHoldMs = 1800;
const clipboardTimeoutMs = 400;

function enhanceArticleCodeBlocks(): void {
  document.querySelectorAll<HTMLPreElement>(".article-prose pre").forEach((pre) => {
    pre.querySelector(".copy-code-button")?.remove();
    pre.querySelector(".copy-code-toast")?.remove();

    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-code-button";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy code");

    const toast = document.createElement("span");
    toast.className = "copy-code-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.hidden = true;

    let resetTimer = 0;

    button.addEventListener("click", () => {
      void copyFence(pre, button, toast, () => {
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          resetCopyUi(button, toast);
        }, copiedHoldMs);
      });
    });

    pre.append(button, toast);
  });
}

async function copyFence(
  pre: HTMLPreElement,
  button: HTMLButtonElement,
  toast: HTMLSpanElement,
  onSettled: () => void,
): Promise<void> {
  try {
    await copyPlainText(getFenceText(pre));
    showCopyUi(button, toast, "Copied", false);
  } catch {
    showCopyUi(button, toast, "Copy failed", true);
  }

  onSettled();
}

function showCopyUi(
  button: HTMLButtonElement,
  toast: HTMLSpanElement,
  label: string,
  failed: boolean,
): void {
  button.textContent = label;
  button.setAttribute("aria-label", label);
  button.classList.toggle("is-copied", !failed);
  button.classList.toggle("is-failed", failed);
  toast.textContent = label;
  toast.classList.toggle("is-failed", failed);
  toast.hidden = false;
}

function resetCopyUi(button: HTMLButtonElement, toast: HTMLSpanElement): void {
  button.textContent = "Copy";
  button.setAttribute("aria-label", "Copy code");
  button.classList.remove("is-copied", "is-failed");
  toast.hidden = true;
  toast.classList.remove("is-failed");
  toast.textContent = "";
}

function getFenceText(pre: HTMLPreElement): string {
  const lines = pre.querySelectorAll(".line");
  if (lines.length > 0) {
    return Array.from(lines, (line) => line.textContent ?? "").join("\n");
  }

  return pre.querySelector("code")?.textContent ?? "";
}

async function copyPlainText(text: string): Promise<void> {
  const execCopied = copyWithExecCommand(text);

  if (navigator.clipboard?.writeText) {
    try {
      await Promise.race([
        navigator.clipboard.writeText(text),
        rejectAfter(clipboardTimeoutMs),
      ]);
      return;
    } catch {
      if (execCopied) {
        return;
      }
    }
  }

  if (execCopied) {
    return;
  }

  throw new Error("Copy failed");
}

function copyWithExecCommand(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.focus();
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  textarea.remove();
  return copied;
}

function rejectAfter(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    window.setTimeout(() => {
      reject(new Error("Clipboard timed out"));
    }, ms);
  });
}
