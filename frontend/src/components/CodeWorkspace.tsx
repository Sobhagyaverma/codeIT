import Editor, { type OnMount } from "@monaco-editor/react";

const MONACO_LANG: Record<string, string> = {
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  go: "go",
  java: "java",
  javascript: "javascript",
  php: "php",
  python: "python",
  ruby: "ruby",
  rust: "rust",
  typescript: "typescript",
};

type Props = {
  language: string;
  value?: string;
  onChange?: (value: string) => void;
  onMount?: OnMount;
  readOnly?: boolean;
  height?: string;
};

/** Shared Monaco shell for solo and collaborative workspaces. */
export default function CodeWorkspace({
  language,
  value,
  onChange,
  onMount,
  readOnly = false,
  height = "100%",
}: Props) {
  return (
    <Editor
      height={height}
      language={MONACO_LANG[language] || language || "java"}
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange?.(v ?? "")}
      onMount={onMount}
      options={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 14,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        readOnly,
        tabSize: 2,
      }}
    />
  );
}

export { MONACO_LANG };
