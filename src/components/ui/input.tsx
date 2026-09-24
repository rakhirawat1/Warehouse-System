import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary transition-[border-color,box-shadow] placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-60";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={cn(fieldClasses, "h-10", className)} {...props} />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(fieldClasses, "h-10 cursor-pointer pr-8", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(fieldClasses, "py-2.5", className)} {...props} />
  );
}

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-primary", className)}
      {...props}
    />
  );
}

export function FieldHint({
  children,
  error = false,
  className,
}: {
  children: React.ReactNode;
  error?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-1.5 text-xs",
        error ? "text-danger" : "text-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}
