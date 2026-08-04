import { useEffect } from "react";

/** Adds `.active` to `.reveal` elements as they enter the viewport (Stitch scroll reveal). */
export function useRevealOnScroll(rootSelector = ".landing-page") {
  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return;

    const reveal = () => {
      const nodes = root.querySelectorAll(".reveal");
      const windowHeight = window.innerHeight;
      const visibleOffset = 150;
      nodes.forEach((el) => {
        if (el.getBoundingClientRect().top < windowHeight - visibleOffset) {
          el.classList.add("active");
        }
      });
    };

    reveal();
    window.addEventListener("scroll", reveal, { passive: true });
    return () => window.removeEventListener("scroll", reveal);
  }, [rootSelector]);
}
