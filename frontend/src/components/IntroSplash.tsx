import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type Phase =
  | "enter"
  | "pause"
  | "expand"
  | "hold"
  | "collapse"
  | "fade"
  | "done";

const REST = ["o", "g", "e", "t", "h", "e", "r"] as const;

/** Once per full page load (SPA remounts / route changes do not re-trigger). */
let playedThisPageLoad = false;

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function shouldPlayIntro(): boolean {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  if (playedThisPageLoad) return false;
  playedThisPageLoad = true;
  return true;
}

type IntroSplashProps = {
  children: ReactNode;
};

/**
 * Preloader: CodeT → CodeTogether → CodeT → fade to site.
 * App shell stays mounted so finishing the intro does not remount routes.
 */
export default function IntroSplash({ children }: IntroSplashProps) {
  const [active, setActive] = useState(shouldPlayIntro);
  const [phase, setPhase] = useState<Phase>(active ? "enter" : "done");

  const showOverlay = active && phase !== "done";

  const finish = useCallback(() => {
    setPhase("done");
    setActive(false);
    document.documentElement.classList.remove(
      "intro-splash-active",
      "intro-splash-revealed",
    );
  }, []);

  useLayoutEffect(() => {
    if (!showOverlay) {
      document.documentElement.classList.remove(
        "intro-splash-active",
        "intro-splash-revealed",
      );
      return;
    }
    document.documentElement.classList.add("intro-splash-active");
    return () =>
      document.documentElement.classList.remove(
        "intro-splash-active",
        "intro-splash-revealed",
      );
  }, [showOverlay]);

  useEffect(() => {
    if (!showOverlay) return;

    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });

    let cancelled = false;

    (async () => {
      await wait(850);
      if (cancelled) return;
      setPhase("pause");

      await wait(480);
      if (cancelled) return;
      setPhase("expand");

      await wait(1400);
      if (cancelled) return;
      setPhase("hold");

      await wait(700);
      if (cancelled) return;
      setPhase("collapse");

      await wait(1100);
      if (cancelled) return;
      setPhase("fade");

      await wait(550);
      if (cancelled) return;
      finish();
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [showOverlay, finish]);

  const expanding = phase === "expand" || phase === "hold";
  const collapsing = phase === "collapse";

  const markClass = [
    "intro-mark",
    phase === "enter" ? "intro-mark--enter" : "intro-mark--shown",
    expanding ? "intro-mark--expanded" : "",
    collapsing ? "intro-mark--collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {showOverlay && (
        <div
          className={
            phase === "fade"
              ? "intro-splash intro-splash--fade"
              : "intro-splash"
          }
          role="dialog"
          aria-label="Loading CodeT"
          aria-live="polite"
        >
          <div className="intro-splash-stage">
            <div className={markClass} aria-hidden="true">
              <span className="intro-mark-code">Code</span>
              <span className="intro-mark-script">
                <span className="intro-mark-t">t</span>
                <span className="intro-mark-rest" aria-hidden="true">
                  {REST.map((ch, i) => (
                    <span
                      key={`${ch}-${i}`}
                      className="intro-mark-letter"
                      style={
                        {
                          "--i": i,
                          "--ri": REST.length - 1 - i,
                        } as CSSProperties
                      }
                    >
                      {ch}
                    </span>
                  ))}
                </span>
              </span>
            </div>
          </div>

          <button
            type="button"
            className="intro-splash-skip"
            onClick={() => finish()}
          >
            Skip
          </button>
        </div>
      )}
      {/* Stable shell — never remount when overlay toggles off */}
      <div className="intro-app-shell">{children}</div>
    </>
  );
}
