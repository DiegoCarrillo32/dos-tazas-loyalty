"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { IconButton } from "./IconButton";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}

const sizeMap = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" } as const;

/**
 * Modal — centered dialog on a floating brand surface with a scrim.
 * Closes on Escape / scrim click; locks body scroll while open. The app's own
 * `GenericModal` wraps the `@base-ui` Dialog — this is the standalone DS take.
 */
export function Modal({ open, onClose, title, description, footer, size = "md", children }: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-expresso/40 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-warm-roast/10 bg-card shadow-lg shadow-warm-roast/20 animate-in fade-in zoom-in-95",
          sizeMap[size],
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-warm-roast/10 px-6 py-4">
            <div>
              {title && <h2 className="text-lg font-heading text-expresso">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-expresso/60">{description}</p>}
            </div>
            <IconButton label="Close" variant="ghost" size="sm" onClick={onClose}>
              <X />
            </IconButton>
          </div>
        )}
        {children && <div className="px-6 py-5 text-sm text-expresso/80">{children}</div>}
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-warm-roast/10 bg-warm-roast/5 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
