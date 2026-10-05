import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

// Markdown with tables (GFM) and LaTeX math ($…$, $$…$$). Raw HTML in the
// source is not rendered, so generated content cannot inject markup.
export default function Markdown({ children }) {
  return (
    <div className="reading">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
