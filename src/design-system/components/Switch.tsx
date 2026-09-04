"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

/** Switch — on/off toggle. Track fills coffee-fruit when on. */
export function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  id,
  label,
  description,
  className,
}: SwitchProps) {
  const reactId = React.useId();
  const switchId = id ?? reactId;
  const [internal, setInternal] = React.useState(defaultChecked ?? false);
  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked : internal;

  const toggle = () => {
    if (disabled) return;
    const next = !isOn;
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
  };

  const control = (
    <button
      type="button"
      role="switch"
      id={switchId}
      aria-checked={isOn}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-coffee-fruit/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        isOn ? "bg-coffee-fruit" : "bg-warm-roast/25",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow-sm transition-transform",
          isOn ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );

  if (!label && !description) return <span className={className}>{control}</span>;

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <label htmlFor={switchId} className={cn("flex flex-col", disabled ? "opacity-50" : "cursor-pointer")}>
        {label && <span className="text-sm font-medium text-expresso">{label}</span>}
        {description && <span className="text-xs text-expresso/50">{description}</span>}
      </label>
      {control}
    </div>
  );
}
