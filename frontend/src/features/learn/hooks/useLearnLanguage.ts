import { useCallback, useState } from "react";
import type { LearnLanguage } from "../types";

const STORAGE_KEY = "codeit:learn:lang:v1";
const DEFAULT_LANGUAGE: LearnLanguage = "python";

const VALID: ReadonlySet<string> = new Set(["cpp", "java", "python"]);

function readStored(): LearnLanguage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && VALID.has(raw)) return raw as LearnLanguage;
  } catch {
    // ignore
  }
  return DEFAULT_LANGUAGE;
}

export function useLearnLanguage() {
  const [language, setLanguageState] = useState<LearnLanguage>(readStored);

  const setLanguage = useCallback((next: LearnLanguage) => {
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  return { language, setLanguage };
}
