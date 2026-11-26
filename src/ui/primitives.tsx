import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { initials as toInitials } from "@/lib/format";

/* ================================================================== */
/* Card                                                                */
/* ================================================================== */

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-subtle bg-surface shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-subtle px-5 py-3.5",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-[15px] font-semibold text-fg", className)}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

/* ================================================================== */
/* Badge                                                               */
/* ================================================================== */

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-sunken text-fg-secondary",
        brand: "bg-brand-50 text-brand-700 dark:bg-brand-800 dark:text-brand-200",
        success: "bg-success-bg text-success dark:bg-success/15",
        warning: "bg-warning-bg text-warning dark:bg-warning/15",
        danger: "bg-danger-bg text-danger dark:bg-danger/15",
        /** Lime como fundo com texto brand-900 — o único uso permitido */
        accent: "bg-accent-500 text-brand-900",
        outline: "border border-line text-fg-secondary",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: { tone: "neutral", size: "sm" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone, size }), className)} {...props} />;
}

/** Ponto colorido — sempre acompanhado de rótulo, nunca sozinho */
export function Dot({ className }: { className?: string }) {
  return (
    <span
      className={cn("size-1.5 shrink-0 rounded-full bg-current", className)}
      aria-hidden="true"
    />
  );
}

/* ================================================================== */
/* Avatar                                                              */
/* ================================================================== */

const avatarSizes = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-[11px]",
  md: "size-10 text-xs",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
} as const;

/**
 * Sem foto, deriva uma cor estável do nome — o mesmo membro tem
 * sempre a mesma cor em todas as telas.
 */
const AVATAR_TONES = [
  "bg-brand-100 text-brand-700",
  "bg-brand-200 text-brand-800",
  "bg-accent-300 text-brand-900",
  "bg-ink-300 text-brand-900",
  "bg-brand-50 text-brand-600",
] as const;

function toneFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length]!;
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof avatarSizes;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold",
        avatarSizes[size],
        toneFor(name),
        className,
      )}
      title={name}
    >
      {toInitials(name)}
    </span>
  );
}

/* ================================================================== */
/* Input                                                               */
/* ================================================================== */

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-fg",
        "placeholder:text-fg-muted",
        "transition-colors focus:border-interactive focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-xs font-medium text-fg-secondary", className)}
      {...props}
    />
  );
}

/* ================================================================== */
/* Tabela                                                              */
/* ================================================================== */

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function Th({
  className,
  numeric,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      className={cn(
        "border-b border-subtle px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-muted",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  numeric,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        "border-b border-subtle px-4 py-3 align-middle text-fg-secondary",
        numeric && "tnum text-right",
        className,
      )}
      {...props}
    />
  );
}

export function Tr({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors hover:bg-hover/60", className)}
      {...props}
    />
  );
}

/* ================================================================== */
/* Estados: vazio, carregando                                          */
/* ================================================================== */

/**
 * Estado vazio SEMPRE com saída. "Nenhum resultado" sozinho deixa a
 * pessoa parada — ver regra dos três estados no design system.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-sunken text-fg-muted">
          <Icon className="size-5" />
        </span>
      )}
      <p className="text-sm font-semibold text-fg">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-fg-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

/**
 * Esqueleto de tela de detalhe, usado enquanto o store do navegador
 * não foi lido. No HTML do servidor um registro criado no protótipo
 * ainda não existe: sem isto, abrir o perfil de alguém que você acabou
 * de cadastrar cairia no 404.
 */
export function RecordLoading() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-4" aria-busy="true">
      <span className="sr-only">Carregando registro</span>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-44 w-full rounded-lg" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-lg lg:col-span-2" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

/* ================================================================== */
/* Layout de página                                                    */
/* ================================================================== */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 pb-6">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-fg">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[13px] text-fg-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-subtle", className)} />;
}
