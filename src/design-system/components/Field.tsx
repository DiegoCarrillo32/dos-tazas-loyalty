import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Field — composable label + hint + error wrapper for any control
 * (Input, Textarea, Select, Switch…). Keeps form layout consistent.
 */
export interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, error, required, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-bold text-expresso">
          {label}
          {required && <span className="ml-0.5 text-coffee-fruit">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-expresso/50">{hint}</p>
      ) : null}
    </div>
  );
}
