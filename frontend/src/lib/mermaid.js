// Mermaid is large, so it is loaded only when the first diagram renders.
// Renders are queued because mermaid.initialize() is global.
let mermaidPromise = null;
let queue = Promise.resolve();

export function renderMermaid(id, code, dark) {
  const task = queue.then(async () => {
    mermaidPromise ??= import("mermaid").then((module) => module.default);
    const mermaid = await mermaidPromise;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: dark ? "dark" : "neutral",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      // Compact spacing: diagrams are scaled to fit a phone-width card.
      flowchart: { nodeSpacing: 18, rankSpacing: 28, padding: 6, diagramPadding: 4 },
    });
    await mermaid.parse(code); // throws on invalid syntax before anything is drawn
    const { svg } = await mermaid.render(id, code);
    return svg;
  });
  queue = task.catch(() => {});
  return task;
}
