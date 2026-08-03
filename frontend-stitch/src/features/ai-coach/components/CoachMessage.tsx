import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
}

export default function CoachMessage({ content }: Props) {
  return (
    <div className="prose-coach text-sm leading-relaxed text-on-surface">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-secondary underline underline-offset-2"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          code: ({ children, className }) => {
            const inline = !className;
            if (inline) {
              return (
                <code className="rounded bg-surface-container-highest px-1 py-0.5 font-code-sm text-[12px] text-primary">
                  {children}
                </code>
              );
            }
            return (
              <pre className="my-2 overflow-x-auto rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-3 font-code-sm text-[12px]">
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
