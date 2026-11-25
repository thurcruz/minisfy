"use client";

import * as React from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-fg-secondary">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        )}
      </span>
      {children}
      {error ? (
        <span className="mt-1 flex items-start gap-1 text-[11px] text-danger">
          <CircleAlert className="mt-px size-3 shrink-0" />
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-fg-muted">{hint}</span>
      ) : null}
    </label>
  );
}

const control =
  "h-9 w-full rounded-md border bg-surface px-3 text-sm text-fg transition-colors placeholder:text-fg-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function TextInput({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        control,
        invalid
          ? "border-danger focus:border-danger"
          : "border-line focus:border-interactive",
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        control,
        "appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-9",
        invalid
          ? "border-danger focus:border-danger"
          : "border-line focus:border-interactive",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237c7b88' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
});

/** Grupo de caixas de seleção em pílula — usado para ministérios. */
export function CheckboxPills({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; label: string }>;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const checked = value.includes(option.id);
        return (
          <label
            key={option.id}
            className={cn(
              "cursor-pointer select-none rounded-full border px-3 py-1.5 text-[12px] transition-colors",
              checked
                ? "border-interactive bg-interactive text-interactive-fg"
                : "border-line text-fg-secondary hover:bg-hover",
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={() =>
                onChange(
                  checked
                    ? value.filter((v) => v !== option.id)
                    : [...value, option.id],
                )
              }
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
