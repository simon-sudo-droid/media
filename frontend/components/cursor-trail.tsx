"use client";

import { useEffect, useRef, useState } from "react";

/* A connector line the color of the section heading (amber/primary).
   A "water drop" sits at the origin (under the Marketing Mastery tab);
   as the cursor visits cards marked [data-trail-card], the line grows
   — beside the intro into the first card, then from the end of each
   hovered card into the next. Only the visited path is ever drawn. */
export function CursorTrail({
  containerRef,
  originX = 26,
}: {
  containerRef: React.RefObject<HTMLElement>;
  originX?: number;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const visited = useRef<HTMLElement[]>([]);
  const prevLen = useRef(0);
  const [d, setD] = useState("");

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const node: HTMLElement = host;

    function point(el: HTMLElement, c: DOMRect) {
      const r = el.getBoundingClientRect();
      const x = r.left - c.left + 14; // just inside the card's left edge
      return { topX: x, topY: r.top - c.top, botX: x, botY: r.bottom - c.top };
    }

    function rebuild() {
      const c = node.getBoundingClientRect();
      // drop stale nodes (list re-mounted after closing a card)
      visited.current = visited.current.filter((el) => node.contains(el));
      const pts = visited.current.map((el) => point(el, c));
      if (!pts.length) { setD(""); prevLen.current = 0; return; }

      let path = `M ${originX} -58`;                 // the drop, above the panel
      const f = pts[0];
      // curl down beside the explanation into the first card
      path += ` C ${originX} -6, ${f.topX - 46} ${f.topY - 54}, ${f.topX} ${f.topY}`;
      path += ` L ${f.botX} ${f.botY}`;              // run through the card
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const mid = (a.botY + b.topY) / 2;
        path += ` C ${a.botX - 46} ${mid}, ${b.topX - 46} ${mid}, ${b.topX} ${b.topY}`;
        path += ` L ${b.botX} ${b.botY}`;
      }
      setD(path);
    }

    function onOver(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      const card = t?.closest("[data-trail-card]") as HTMLElement | null;
      if (!card || !node.contains(card)) return;
      const last = visited.current[visited.current.length - 1];
      if (card === last) return;
      visited.current.push(card);
      if (visited.current.length > 12) visited.current.shift();
      rebuild();
    }

    node.addEventListener("mouseover", onOver);
    const ro = new ResizeObserver(() => rebuild());
    ro.observe(node);
    return () => { node.removeEventListener("mouseover", onOver); ro.disconnect(); };
  }, [containerRef, originX]);

  // Grow only the newly-added tail each time the path extends.
  useEffect(() => {
    const el = pathRef.current;
    if (!el || !d) return;
    const total = el.getTotalLength();
    const start = Math.max(0, total - prevLen.current);
    el.style.strokeDasharray = `${total}`;
    el.animate(
      [{ strokeDashoffset: start }, { strokeDashoffset: 0 }],
      { duration: 480, easing: "cubic-bezier(0.3, 0.9, 0.3, 1)", fill: "forwards" },
    );
    el.style.strokeDashoffset = "0";
    prevLen.current = total;
  }, [d]);

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full overflow-visible md:block"
      fill="none"
      style={{ filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.7))" }}
    >
      {/* water-drop seed at the origin (under the Marketing Mastery tab) */}
      <circle cx={originX} cy={-58} r={5} fill="hsl(var(--primary))">
        <animate attributeName="r" values="5;6.5;5" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.75;1;0.75" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <path
        ref={pathRef}
        d={d}
        stroke="hsl(var(--primary))"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
