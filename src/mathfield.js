/**
 * MathField wrapper for MathLive web components.
 * Configures local fonts and paper-style rendering without raw slashes or carets.
 */

// Configure MathLive font location to offline local vendor folder
if (window.MathfieldElement) {
  window.MathfieldElement.fontsDirectory = "./vendor/mathlive/fonts";
  window.MathfieldElement.soundsDirectory = null;
}

export function createMathField(container, initialLatex = "", options = {}) {
  const mf = new window.MathfieldElement();
  mf.value = initialLatex;
  mf.smartFence = true;
  mf.smartMode = true;
  mf.virtualKeyboardMode = "off"; // Use Prism custom palette & desktop keyboard
  
  // Custom styling
  mf.style.width = "100%";
  mf.style.fontSize = options.fontSize || "1.25rem";
  mf.style.padding = "6px 10px";
  mf.style.background = "transparent";
  mf.style.border = "none";
  mf.style.outline = "none";

  if (container) {
    container.appendChild(mf);
  }

  return mf;
}

export function getLatex(mf) {
  if (!mf) return "";
  return mf.getValue("latex-expanded") || mf.value || "";
}

export function setLatex(mf, latex) {
  if (!mf) return;
  mf.setValue(latex || "", { format: "latex" });
}

export function onInput(mf, callback) {
  if (!mf) return;
  mf.addEventListener("input", () => {
    callback(getLatex(mf));
  });
}
