import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Botões totalmente arredondados (rounded-full) — requisito da marca.
 * Cards e tabelas ficam em rounded-lg para não infantilizar a interface.
 */
const button = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-full font-medium",
    "whitespace-nowrap transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-interactive text-interactive-fg hover:bg-interactive-hover shadow-xs",
        secondary:
          "bg-surface text-fg border border-line hover:bg-hover shadow-xs",
        ghost: "text-fg-secondary hover:bg-hover hover:text-fg",
        danger: "bg-danger text-white hover:bg-danger/90 shadow-xs",
        /**
         * Lime só como preenchimento com texto escuro por cima.
         * Contraste 13,9:1. Ver §2 de docs/03-DESIGN-SYSTEM.md.
         */
        accent: "bg-accent-500 text-brand-900 hover:bg-accent-500/85 shadow-xs",
      },
      size: {
        sm: "h-8 px-3 text-[13px] [&_svg]:size-3.5",
        md: "h-9 px-4 text-sm [&_svg]:size-4",
        lg: "h-11 px-6 text-[15px] [&_svg]:size-[18px]",
        icon: "size-9 [&_svg]:size-4",
        "icon-sm": "size-8 [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(button({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}
