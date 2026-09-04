import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Crumb {
  label: React.ReactNode;
  href?: string;
}

/** Breadcrumb — hierarchical trail; the last item is the current page. */
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm", className)}>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {item.href && !last ? (
              <a href={item.href} className="font-medium text-expresso/60 transition-colors hover:text-coffee-fruit">
                {item.label}
              </a>
            ) : (
              <span className={cn(last ? "font-bold text-expresso" : "font-medium text-expresso/60")} aria-current={last ? "page" : undefined}>
                {item.label}
              </span>
            )}
            {!last && <ChevronRight className="size-4 text-expresso/30" aria-hidden />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
