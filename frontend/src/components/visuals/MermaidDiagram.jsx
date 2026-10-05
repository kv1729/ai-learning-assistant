import { useEffect, useId, useState } from "react";
import { usePrefersDark } from "../../hooks/usePrefersDark.js";
import { renderMermaid } from "../../lib/mermaid.js";

// Renders Mermaid source to SVG (re-rendered when the theme changes);
// shows `fallback` if the diagram is invalid.
export default function MermaidDiagram({ code, fallback }) {
  const dark = usePrefersDark();
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const key = `${dark}|${code}`;
  const [result, setResult] = useState({ key: null, svg: null });

  useEffect(() => {
    let active = true;
    renderMermaid(id, code, dark).then(
      (svg) => active && setResult({ key, svg }),
      () => active && setResult({ key, svg: null }),
    );
    return () => {
      active = false;
    };
  }, [id, code, dark, key]);

  if (result.key !== key) return <div className="skeleton h-20 w-4/5" aria-hidden="true" />;
  if (!result.svg) return fallback;
  return (
    <div
      className="mermaid-diagram flex h-full w-full items-center justify-center"
      dangerouslySetInnerHTML={{ __html: result.svg }}
    />
  );
}
