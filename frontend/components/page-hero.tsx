import type { LucideIcon } from "lucide-react";

// Glowing-horizon hero header, reused across section landing pages
// (Learning Hub, AI Tools, …) to match the landing page + dashboard.
type Tile = { icon: LucideIcon; x: string; y: string; d?: string };

export function PageHero({
  eyebrow,
  icon: Icon,
  title,
  subtitle,
  tiles = [],
  children,
}: {
  eyebrow?: string;
  icon?: LucideIcon;
  title: React.ReactNode;
  subtitle?: string;
  tiles?: Tile[];
  children?: React.ReactNode;
}) {
  return (
    <div data-parallax-zone className="animate-in relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 px-6 py-12 text-center backdrop-blur-xl md:py-16">
      {/* Glowing horizon rising from the bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-1/3">
        <div className="absolute inset-0 horizon" />
        <div className="absolute inset-x-0 bottom-0 h-3/4 horizon-arc" />
      </div>

      {/* Floating tiles — each drifts with the cursor at its own depth */}
      {tiles.length > 0 && (
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          {tiles.map((t, i) => (
            <div
              key={i}
              className={`parallax absolute ${t.x} ${t.y}`}
              style={{ transform: `translate(calc(var(--hx, 0) * ${(i % 2 ? -1 : 1) * (18 + i * 8)}px), calc(var(--hy, 0) * ${20 + i * 7}px))` }}
            >
              <div className="hero-tile animate-drift h-12 w-12" style={{ animationDelay: t.d ?? "0s" }}>
                <t.icon className="h-5 w-5 text-primary/80" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className="parallax relative mx-auto flex max-w-2xl flex-col items-center"
        style={{ transform: "translate(calc(var(--hx, 0) * -14px), calc(var(--hy, 0) * -10px))" }}
      >
        {eyebrow && (
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/40 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            {Icon && <Icon className="h-3.5 w-3.5 text-primary" />} {eyebrow}
          </div>
        )}
        <h1 className="text-3xl font-bold leading-[1.1] tracking-tight md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-xl text-muted-foreground">{subtitle}</p>}
        {children && <div className="mt-7 flex flex-col gap-3 sm:flex-row">{children}</div>}
      </div>
    </div>
  );
}
