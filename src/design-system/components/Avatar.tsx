"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-warm-roast/15 font-bold text-warm-roast select-none",
  {
    variants: {
      size: {
        xs: "size-6 text-[10px]",
        sm: "size-8 text-xs",
        md: "size-10 text-sm",
        lg: "size-12 text-base",
        xl: "size-16 text-xl",
      },
    },
    defaultVariants: { size: "md" },
  },
);

type Presence = "online" | "busy" | "offline";

const presenceColor: Record<Presence, string> = {
  online: "bg-green-500",
  busy: "bg-yellow-500",
  offline: "bg-warm-roast/40",
};

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name: string;
  src?: string;
  presence?: Presence;
  className?: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Avatar — image with initials fallback and an optional presence dot. */
export function Avatar({ name, src, size, presence, className }: AvatarProps) {
  const [errored, setErrored] = React.useState(false);
  const showImage = src && !errored;

  return (
    <span className={cn("relative inline-flex", className)}>
      <span className={cn(avatarVariants({ size }))} title={name}>
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="size-full object-cover" onError={() => setErrored(true)} />
        ) : (
          initials(name)
        )}
      </span>
      {presence && (
        <span
          className={cn(
            "absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-card",
            presenceColor[presence],
          )}
          aria-label={presence}
        />
      )}
    </span>
  );
}

/** AvatarGroup — overlapping stack with a "+N" overflow chip. */
export function AvatarGroup({
  names,
  max = 4,
  size = "md",
}: {
  names: string[];
  max?: number;
  size?: AvatarProps["size"];
}) {
  const shown = names.slice(0, max);
  const overflow = names.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((n) => (
        <span key={n} className="rounded-full ring-2 ring-card">
          <Avatar name={n} size={size} />
        </span>
      ))}
      {overflow > 0 && (
        <span className={cn(avatarVariants({ size }), "ring-2 ring-card")}>+{overflow}</span>
      )}
    </div>
  );
}
