import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, Ref } from "react";

export function Input({
  className,
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text",
        "placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
      {...props}
    />
  );
}
