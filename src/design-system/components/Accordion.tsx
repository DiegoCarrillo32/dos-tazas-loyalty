"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AccordionItemData {
  value: string;
  title: React.ReactNode;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItemData[];
  /** Allow multiple panels open at once. */
  multiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

/** Accordion — collapsible disclosure list on the brand surface. */
export function Accordion({ items, multiple, defaultOpen = [], className }: AccordionProps) {
  const [open, setOpen] = React.useState<string[]>(defaultOpen);

  const toggle = (value: string) => {
    setOpen((prev) => {
      const isOpen = prev.includes(value);
      if (multiple) return isOpen ? prev.filter((v) => v !== value) : [...prev, value];
      return isOpen ? [] : [value];
    });
  };

  return (
    <div className={cn("divide-y divide-warm-roast/10 overflow-hidden rounded-2xl border border-warm-roast/10 bg-card", className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.value);
        return (
          <div key={item.value}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(item.value)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-expresso transition-colors outline-none hover:bg-warm-roast/5 focus-visible:bg-warm-roast/5"
            >
              {item.title}
              <ChevronDown
                className={cn("size-4 shrink-0 text-expresso/50 transition-transform duration-200", isOpen && "rotate-180")}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-200 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-4 text-sm text-expresso/70">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
