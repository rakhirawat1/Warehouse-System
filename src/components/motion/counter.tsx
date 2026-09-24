"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";

type CounterProps = {
  value: number;
  /** Rendered after the number, e.g. "%" or " units". */
  suffix?: string;
  separator?: boolean;
  className?: string;
};

/**
 * Counts up to a number when it scrolls into view. Writes to the DOM directly
 * to avoid a re-render per frame; jumps straight there for reduced motion.
 */
export default function Counter({
  value,
  suffix = "",
  separator = true,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);

  const format = (input: number) => {
    const rounded = Math.round(input);

    return separator ? rounded.toLocaleString("en-US") : String(rounded);
  };

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    if (reduceMotion || !inView) {
      node.textContent = `${format(inView ? value : 0)}${suffix}`;

      if (!inView) {
        return;
      }
    }

    if (reduceMotion) {
      return;
    }

    const controls = animate(motionValue, value, {
      duration: Math.min(1.1, 0.4 + Math.log10(Math.max(value, 1)) * 0.2),
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = `${format(latest)}${suffix}`;
      },
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, suffix, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}
