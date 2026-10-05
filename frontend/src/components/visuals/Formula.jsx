import katex from "katex";
import { useLayoutEffect, useRef } from "react";

function renderTex(tex) {
  try {
    return katex.renderToString(tex, { displayMode: true, throwOnError: true });
  } catch {
    return null;
  }
}

const BASE_EM = 1.35;
const MIN_EM = 0.7;

// Renders a LaTeX formula, shrinking the font so wide formulas fit the
// container instead of being clipped. Shows `fallback` if the LaTeX is invalid.
export default function Formula({ tex, fallback }) {
  const ref = useRef(null);
  const html = renderTex(tex);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = `${BASE_EM}em`;
      // .katex-display scrolls internally, so its scrollWidth is the formula's natural width.
      const display = el.querySelector(".katex-display") ?? el;
      const ratio = el.clientWidth / display.scrollWidth;
      if (ratio < 1) el.style.fontSize = `${Math.max(MIN_EM, BASE_EM * ratio * 0.97)}em`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [html]);

  if (!html) return fallback;
  return (
    <div
      ref={ref}
      className="w-full overflow-x-auto text-center text-fg [&_.katex-display]:my-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
