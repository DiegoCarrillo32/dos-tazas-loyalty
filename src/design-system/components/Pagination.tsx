"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Build a compact page list with ellipses, e.g. 1 … 4 5 6 … 20. */
function pageItems(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const items: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) items.push("…");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < pageCount - 1) items.push("…");
  items.push(pageCount);
  return items;
}

/** Pagination — page navigator with prev/next and ellipsis-aware page chips. */
export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  const items = pageItems(page, pageCount);
  const go = (p: number) => p >= 1 && p <= pageCount && p !== page && onPageChange(p);

  return (
    <nav className={cn("flex items-center gap-1", className)} aria-label="Pagination">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex size-9 items-center justify-center rounded-full text-expresso/70 transition-colors hover:bg-warm-roast/10 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>
      {items.map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} className="flex size-9 items-center justify-center text-sm text-expresso/40">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => go(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "flex size-9 items-center justify-center rounded-full text-sm font-bold transition-colors",
              item === page
                ? "bg-warm-roast text-white"
                : "text-expresso/70 hover:bg-warm-roast/10",
            )}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= pageCount}
        aria-label="Next page"
        className="flex size-9 items-center justify-center rounded-full text-expresso/70 transition-colors hover:bg-warm-roast/10 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
