"use client";

import { Minus, Plus } from "lucide-react";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Contador com botões grandes.
 *
 * O relatório de encontro é preenchido no celular, em pé, no fim da
 * reunião. Digitar número em teclado virtual é pior que tocar em
 * + e −, então os dois caminhos existem.
 */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  invalid,
  id,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  invalid?: boolean;
  id?: string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden rounded-md border",
        invalid ? "border-danger" : "border-line",
      )}
    >
      <button
        type="button"
        aria-label="Diminuir"
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className="flex w-11 shrink-0 items-center justify-center bg-canvas text-fg-secondary transition-colors hover:bg-hover disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const parsed = Number.parseInt(e.target.value, 10);
          onChange(Number.isNaN(parsed) ? min : clamp(parsed));
        }}
        className="tnum h-11 w-full min-w-0 border-x border-line bg-surface text-center text-base font-medium text-fg focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Aumentar"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className="flex w-11 shrink-0 items-center justify-center bg-canvas text-fg-secondary transition-colors hover:bg-hover disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/**
 * Campo monetário.
 *
 * O valor trafega SEMPRE em centavos inteiros (AD-08). A digitação
 * acumula dígitos da direita para a esquerda, como numa maquininha —
 * não há como digitar um valor que não seja um inteiro de centavos.
 */
export function CurrencyInput({
  value,
  onChange,
  invalid,
  id,
  placeholder,
}: {
  value: number;
  onChange: (cents: number) => void;
  invalid?: boolean;
  id?: string;
  placeholder?: string;
}) {
  return (
    <input
      id={id}
      inputMode="numeric"
      value={value === 0 ? "" : money(value)}
      placeholder={placeholder ?? money(0)}
      aria-invalid={invalid || undefined}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
        onChange(digits === "" ? 0 : Number.parseInt(digits, 10));
      }}
      className={cn(
        "tnum h-9 w-full rounded-md border bg-surface px-3 text-sm text-fg transition-colors placeholder:text-fg-muted focus:outline-none",
        invalid
          ? "border-danger focus:border-danger"
          : "border-line focus:border-interactive",
      )}
    />
  );
}
