import type { Monaco } from "@monaco-editor/react";

export const CODEIT_THEME = "codeit-dark";

/**
 * Monaco port of One Dark Pro Night Flat (binaryify).
 * Reference: keywords/operators purple, identifiers off-white,
 * functions blue, strings green, numbers orange, comments muted gray.
 */
export function defineCodeitTheme(monaco: Monaco) {
  monaco.editor.defineTheme(CODEIT_THEME, {
    base: "vs-dark",
    inherit: false,
    rules: [
      { token: "", foreground: "abb2bf", background: "0d1117" },

      // Comments
      { token: "comment", foreground: "7f848e", fontStyle: "italic" },
      { token: "comment.doc", foreground: "7f848e", fontStyle: "italic" },

      // Keywords & operators (purple / magenta)
      { token: "keyword", foreground: "c678dd" },
      { token: "keyword.control", foreground: "c678dd" },
      { token: "keyword.operator", foreground: "c678dd" },
      { token: "keyword.operator.logical", foreground: "c678dd" },
      { token: "keyword.operator.expression", foreground: "c678dd" },
      { token: "keyword.operator.bitwise", foreground: "c678dd" },
      { token: "keyword.operator.arithmetic", foreground: "c678dd" },
      { token: "keyword.operator.assignment", foreground: "c678dd" },
      { token: "storage", foreground: "c678dd" },
      { token: "storage.type", foreground: "c678dd" },
      { token: "storage.modifier", foreground: "c678dd" },
      { token: "operator", foreground: "c678dd" },
      { token: "operators", foreground: "c678dd" },

      // Punctuation — soft off-white
      { token: "delimiter", foreground: "abb2bf" },
      { token: "delimiter.bracket", foreground: "abb2bf" },
      { token: "delimiter.parenthesis", foreground: "abb2bf" },
      { token: "delimiter.square", foreground: "abb2bf" },
      { token: "delimiter.angle", foreground: "abb2bf" },
      { token: "punctuation", foreground: "abb2bf" },

      // Strings & regex (green)
      { token: "string", foreground: "98c379" },
      { token: "string.escape", foreground: "56b6c2" },
      { token: "string.key.json", foreground: "e06c75" },
      { token: "regexp", foreground: "98c379" },

      // Numbers & constants (orange)
      { token: "number", foreground: "d19a66" },
      { token: "number.hex", foreground: "d19a66" },
      { token: "number.float", foreground: "d19a66" },
      { token: "constant", foreground: "d19a66" },
      { token: "constant.language", foreground: "d19a66" },
      { token: "constant.numeric", foreground: "d19a66" },
      { token: "boolean", foreground: "d19a66" },

      // Types / classes (yellow)
      { token: "type", foreground: "e5c07b" },
      { token: "type.identifier", foreground: "e5c07b" },
      { token: "class", foreground: "e5c07b" },
      { token: "class.identifier", foreground: "e5c07b" },
      { token: "interface", foreground: "e5c07b" },
      { token: "enum", foreground: "e5c07b" },
      { token: "struct", foreground: "e5c07b" },
      { token: "namespace", foreground: "e5c07b" },
      { token: "annotation", foreground: "e5c07b" },
      { token: "metatag", foreground: "e5c07b" },

      // Functions & methods (blue)
      { token: "function", foreground: "61afef" },
      { token: "function.declaration", foreground: "61afef" },
      { token: "method", foreground: "61afef" },
      { token: "member", foreground: "61afef" },
      { token: "support.function", foreground: "61afef" },

      // Identifiers / variables — default off-white (not red)
      { token: "identifier", foreground: "abb2bf" },
      { token: "variable", foreground: "abb2bf" },
      { token: "variable.name", foreground: "abb2bf" },
      { token: "variable.parameter", foreground: "abb2bf" },
      { token: "variable.predefined", foreground: "e5c07b" },

      // HTML / markup accents
      { token: "tag", foreground: "e06c75" },
      { token: "attribute.name", foreground: "d19a66" },
      { token: "attribute.value", foreground: "98c379" },
      { token: "meta.preprocessor", foreground: "c678dd" },
      { token: "meta.tag", foreground: "e06c75" },
    ],
    colors: {
      // Darker Night Flat chrome (near-black editor surface)
      "editor.background": "#0d1117",
      "editor.foreground": "#abb2bf",
      "editorLineNumber.foreground": "#4b5263",
      "editorLineNumber.activeForeground": "#abb2bf",
      "editorCursor.foreground": "#528bff",
      "editor.selectionBackground": "#3e4451",
      "editor.inactiveSelectionBackground": "#3e445180",
      "editor.lineHighlightBackground": "#161b22",
      "editor.lineHighlightBorder": "#00000000",
      "editorIndentGuide.background1": "#21262d",
      "editorIndentGuide.activeBackground1": "#30363d",
      "editorWhitespace.foreground": "#21262d",
      "editorBracketMatch.background": "#3e445155",
      "editorBracketMatch.border": "#528bff",
      "editorWidget.background": "#161b22",
      "editorWidget.border": "#0d1117",
      "editorSuggestWidget.background": "#161b22",
      "editorSuggestWidget.border": "#0d1117",
      "editorSuggestWidget.selectedBackground": "#21262d",
      "editorSuggestWidget.foreground": "#abb2bf",
      "editorHoverWidget.background": "#161b22",
      "editorHoverWidget.border": "#0d1117",
      "scrollbarSlider.background": "#4e566680",
      "scrollbarSlider.hoverBackground": "#5a637580",
      "scrollbarSlider.activeBackground": "#747d9180",
      "editorGutter.background": "#0d1117",
      "editorOverviewRuler.border": "#0d1117",
      "focusBorder": "#528bff",
    },
  });
  monaco.editor.setTheme(CODEIT_THEME);
}
