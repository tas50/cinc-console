import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text",
        "placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
      {...props}
    />
  );
}
