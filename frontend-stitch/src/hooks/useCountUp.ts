import { useEffect, useRef, useState } from "react";

/** Animates a number from 0 to `target` when the element scrolls into view. */
export function useCountUp(target: number, enabled = true) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    started.current = false;
    setValue(0);
  }, [target]);

  useEffect(() => {
    if (!enabled || target <= 0) {
      setValue(target);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const speed = 200;
    let raf = 0;
    let cancelled = false;

    const run = () => {
      if (started.current || cancelled) return;
      started.current = true;
      let count = 0;
      const step = () => {
        if (cancelled) return;
        const inc = Math.max(target / speed, 1);
        count = Math.min(target, Math.ceil(count + inc));
        setValue(count);
        if (count < target) {
          raf = window.setTimeout(step, 1);
        }
      };
      step();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(raf);
    };
  }, [target, enabled]);

  return { ref, value };
}
