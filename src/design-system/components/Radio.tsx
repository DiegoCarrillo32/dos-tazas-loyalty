"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface RadioContextValue {
  name: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const RadioContext = React.createContext<RadioContextValue | null>(null);

export interface RadioGroupProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** RadioGroup + Radio — single-choice control sharing the Checkbox look. */
export function RadioGroup({
  name,
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
  children,
}: RadioGroupProps) {
  const reactId = React.useId();
  const [internal, setInternal] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const handleChange = (next: string) => {
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  };

  return (
    <RadioContext.Provider
      value={{ name: name ?? reactId, value: current, onValueChange: handleChange, disabled }}
    >
      <div role="radiogroup" className={cn("flex flex-col gap-2.5", className)}>
        {children}
      </div>
    </RadioContext.Provider>
  );
}

export interface RadioProps {
  value: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Radio({ value, label, description, disabled, className }: RadioProps) {
  const ctx = React.useContext(RadioContext);
  if (!ctx) throw new Error("Radio must be used inside a RadioGroup");
  const checked = ctx.value === value;
  const isDisabled = disabled || ctx.disabled;

  return (
    <label
      className={cn("group flex items-start gap-2.5", isDisabled ? "opacity-50" : "cursor-pointer", className)}
    >
      <span className="relative mt-0.5 flex">
        <input
          type="radio"
          name={ctx.name}
          value={value}
          checked={checked}
          disabled={isDisabled}
          onChange={() => ctx.onValueChange?.(value)}
          className="peer sr-only"
        />
        <span className="flex size-5 items-center justify-center rounded-full border-2 border-warm-roast/30 bg-white transition-colors peer-checked:border-coffee-fruit peer-focus-visible:ring-2 peer-focus-visible:ring-coffee-fruit/30 dark:bg-input/30">
          <span className="size-2.5 rounded-full bg-coffee-fruit opacity-0 transition-opacity peer-checked:opacity-100" />
        </span>
      </span>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-sm font-medium text-expresso">{label}</span>}
          {description && <span className="text-xs text-expresso/50">{description}</span>}
        </span>
      )}
    </label>
  );
}
