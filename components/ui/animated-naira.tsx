"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

const format = (value: number, compact: boolean) =>
  compact && Math.abs(value) >= 1_000_000
    ? `₦${(value / 1_000_000).toLocaleString("en-NG", { maximumFractionDigits: value >= 100_000_000 ? 0 : 1 })}m`
    : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

/** A naira figure that counts smoothly to its new value (instant when reduced motion is on). */
export default function AnimatedNaira({ value, compact = false, className }: { value: number; compact?: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduce) {
      node.textContent = format(value, compact);
      previous.current = value;
      return;
    }
    const controls = animate(previous.current, value, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = format(latest, compact);
      },
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, compact, reduce]);

  return (
    <span ref={ref} className={className} aria-live="polite">
      {format(value, compact)}
    </span>
  );
}
