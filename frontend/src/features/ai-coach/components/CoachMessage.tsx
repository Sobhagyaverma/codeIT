import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
}

export default function CoachMessage({ content }: Props) {
  return (
    <div className="prose-coach text-sm leading-relaxed text-[var(--text)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} className="text-[var(--info)] underline" rel="noreferrer">
              {children}
            </a>
          ),
          code: ({ children, className }) => {
            const inline = !className;
            if (inline) {
              return (
                <code className="mono rounded bg-[var(--bg-inset)] px-1 py-0.5 text-[var(--info)]">
                  {children}
                </code>
              );
            }
            return (
              <pre className="mono my-2 overflow-x-auto rounded-md bg-[var(--bg-inset)] p-3 text-xs">
                <code>{children}</code>
              </pre>
            );
          },
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
