import { useEffect, useRef, useState } from "react";
import { getCaptchaConfig } from "../lib/api";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "dark" | "light" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

type Props = {
  onToken: (token: string | null) => void;
  /** Increment to force widget reset after CAPTCHA_FAILED */
  resetKey?: number;
};

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-turnstile]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Turnstile load failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.dataset.turnstile = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Turnstile load failed"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export default function TurnstileWidget({ onToken, resetKey = 0 }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  const [enabled, setEnabled] = useState(false);
  const [siteKey, setSiteKey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getCaptchaConfig()
      .then((cfg) => {
        if (cancelled) return;
        if (cfg.enabled && cfg.siteKey) {
          setEnabled(true);
          setSiteKey(cfg.siteKey);
        } else {
          setEnabled(false);
          onTokenRef.current("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEnabled(false);
          onTokenRef.current("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !siteKey || !hostRef.current) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !hostRef.current || !window.turnstile) return;
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            /* ignore */
          }
          widgetIdRef.current = null;
          hostRef.current.innerHTML = "";
        }
        widgetIdRef.current = window.turnstile.render(hostRef.current, {
          sitekey: siteKey,
          theme: "dark",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => {
            setError("Captcha failed to load.");
            onTokenRef.current(null);
          },
        });
      })
      .catch(() => {
        if (!cancelled) setError("Captcha failed to load.");
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
    };
  }, [enabled, siteKey]);

  useEffect(() => {
    if (!enabled || resetKey === 0 || !widgetIdRef.current || !window.turnstile) return;
    try {
      window.turnstile.reset(widgetIdRef.current);
      onTokenRef.current(null);
    } catch {
      /* ignore */
    }
  }, [resetKey, enabled]);

  if (!enabled) return null;

  return (
    <div className="space-y-2">
      <div ref={hostRef} className="flex justify-center" />
      {error && <p className="text-center text-sm text-[var(--err)]">{error}</p>}
    </div>
  );
}
