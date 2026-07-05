"use client";

import { useEffect } from "react";

// App-wide cursor-follow motion, event-delegated so pages need zero JS:
// - every `.lift` card tilts in 3D toward the pointer with a tracking
//   spotlight (see .lift::after in globals.css)
// - any `[data-parallax-zone]` element gets --hx/--hy pointer vars
//   (-0.5..0.5) that its `.parallax` children scale by their own depth.
// Skipped entirely on touch devices and for reduced-motion users.
const MAX_TILT = 7;
const SCALE = 1.012;

export function CursorMotion() {
  useEffect(() => {
    if (window.matchMedia("(hover: none), (prefers-reduced-motion: reduce)").matches) return;

    let tiltEl: HTMLElement | null = null;
    let zoneEl: HTMLElement | null = null;
    let ev: MouseEvent | null = null;
    let raf = 0;

    const resetTilt = () => {
      if (tiltEl) { tiltEl.style.transform = ""; tiltEl = null; }
    };
    const resetZone = () => {
      if (zoneEl) {
        zoneEl.style.setProperty("--hx", "0");
        zoneEl.style.setProperty("--hy", "0");
        zoneEl = null;
      }
    };

    function frame() {
      raf = 0;
      if (!ev) return;
      const target = ev.target instanceof Element ? ev.target : null;

      const card = (target?.closest(".lift") as HTMLElement | null) ?? null;
      if (card !== tiltEl) resetTilt();
      if (card) {
        tiltEl = card;
        const r = card.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width;
        const py = (ev.clientY - r.top) / r.height;
        card.style.transform =
          `perspective(900px) rotateX(${((0.5 - py) * MAX_TILT).toFixed(2)}deg) rotateY(${((px - 0.5) * MAX_TILT).toFixed(2)}deg) translateY(-3px) scale(${SCALE})`;
        card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      }

      const zone = (target?.closest("[data-parallax-zone]") as HTMLElement | null) ?? null;
      if (zone !== zoneEl) resetZone();
      if (zone) {
        zoneEl = zone;
        const r = zone.getBoundingClientRect();
        zone.style.setProperty("--hx", ((ev.clientX - r.left) / r.width - 0.5).toFixed(3));
        zone.style.setProperty("--hy", ((ev.clientY - r.top) / r.height - 0.5).toFixed(3));
      }
    }

    function onMove(e: MouseEvent) {
      ev = e;
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function onLeave() { resetTilt(); resetZone(); }

    document.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      resetTilt();
      resetZone();
    };
  }, []);

  return null;
}
