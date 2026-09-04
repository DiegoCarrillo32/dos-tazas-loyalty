import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const sizeMap = { sm: "size-4", md: "size-6", lg: "size-8" } as const;

/** Spinner — indeterminate loading indicator in coffee-fruit. */
export function Spinner({
  size = "md",
  className,
  label = "Loading",
}: {
  size?: keyof typeof sizeMap;
  className?: string;
  label?: string;
}) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn("animate-spin text-coffee-fruit", sizeMap[size], className)}
    />
  );
}
