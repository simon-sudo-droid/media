import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({
  value = 0,
  className,
  indicatorClassName,
}: {
  value?: number;
  className?: string;
  indicatorClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all duration-500",
          indicatorClassName,
        )}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
