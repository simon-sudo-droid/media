"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

// Cursor-follow tilt: the card leans toward the pointer and a soft
// amber spotlight tracks it. Eases back to flat on leave.
export function Tilt({
  children,
  className,
  max = 8,
  scale = 1.015,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;    // max tilt in degrees
  scale?: number;  // hover scale
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  function move(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;   // 0..1
    const py = (e.clientY - r.top) / r.height;
    el.style.transform =
      `perspective(900px) rotateX(${((0.5 - py) * max).toFixed(2)}deg) rotateY(${((px - 0.5) * max).toFixed(2)}deg) scale(${scale})`;
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
  }

  function leave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
  }

  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={leave} className={cn("tilt", className)}>
      {children}
    </div>
  );
}
