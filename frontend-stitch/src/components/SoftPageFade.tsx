import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

/**
 * Subliminal page enter: short opacity + micro lift.
 * Felt as polish, not noticed as an animation.
 */
export default function SoftPageFade({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div key={pathname} className="page-soft-enter">
      {children}
    </div>
  );
}
