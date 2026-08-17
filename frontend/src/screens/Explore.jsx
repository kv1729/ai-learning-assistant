import { useState } from "react";

function Explore({ onBack }) {
  const [topic, setTopic] = useState("Machine Learning");
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic to generate a curriculum.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/curriculum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not generate curriculum.");
      }

      setCurriculum(data);
    } catch (err) {
      setError(err.message || "Something went wrong while generating the curriculum.");
    } finally {
      setLoading(false);
    }
  };

  const renderTree = () => {
    if (!curriculum || !curriculum.nodes) return null;

    const nodesById = new Map(curriculum.nodes.map((node) => [node.id, node]));
    const childrenByParent = new Map();

    curriculum.nodes.forEach((node) => {
      const parentId = node.parent_id || "root";
      if (!childrenByParent.has(parentId)) {
        childrenByParent.set(parentId, []);
      }
      childrenByParent.get(parentId).push(node);
    });

    const renderNode = (node, index) => {
      const children = childrenByParent.get(node.id) || [];

      return (
        <div key={node.id || `${node.name}-${index}`} className="ml-4 border-l border-slate-700 pl-4">
          <div className="my-2 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100">
            {node.name}
          </div>
          {children.length > 0 && (
            <div className="space-y-1">
              {children.map((child) => renderNode(child, `${node.id}-${child.id}`))}
            </div>
          )}
        </div>
      );
    };

    const rootNode = curriculum.nodes.find((node) => node.parent_id === null) || curriculum.nodes[0];
    return rootNode ? renderNode(rootNode, "root") : null;
  };

  return (
    <div className="flex h-full flex-col bg-[#050816] p-4 text-white">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300"
        >
          ← Back
        </button>
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">Explore</div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-4">
        <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-400">
          Generate curriculum
        </label>
        <div className="flex gap-2">
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Enter a topic, e.g. Machine Learning"
            className="flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>

      <div className="mt-4 flex-1 overflow-y-auto pb-4">
        {curriculum ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">Curriculum</p>
              <h2 className="mt-2 text-xl font-semibold">{curriculum.topic}</h2>
            </div>
            {renderTree()}
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-white/10 bg-slate-900/60 p-5 text-sm leading-7 text-slate-300">
            Generate a topic to create a learning roadmap. This connects the app to the backend LLM pipeline without exposing any API keys to the frontend.
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;