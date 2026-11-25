/**
 * Formatação pt-BR.
 *
 * Dinheiro trafega SEMPRE em centavos (inteiro). Ver AD-08 em
 * docs/01-ARQUITETURA.md — nenhum valor monetário vira float em
 * lugar nenhum do sistema.
 */

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const BRL_COMPACT = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 150000 → "R$ 1.500,00" */
export function money(cents: number): string {
  return BRL.format(cents / 100);
}

/** 150000 → "R$ 1,5 mil" — só para cards de resumo, nunca em tabela */
export function moneyCompact(cents: number): string {
  return BRL_COMPACT.format(cents / 100);
}

/** Com sinal explícito, para extratos */
export function moneySigned(cents: number, kind: "income" | "expense"): string {
  const sign = kind === "expense" ? "−" : "+";
  return `${sign} ${money(Math.abs(cents))}`;
}

const NUM = new Intl.NumberFormat("pt-BR");
export function num(value: number): string {
  return NUM.format(value);
}

export function percent(value: number, digits = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Variação relativa, já com sinal: 0.12 → "+12%" */
export function delta(value: number): string {
  const s = percent(Math.abs(value));
  return value >= 0 ? `+${s}` : `−${s}`;
}

/* ------------------------------------------------------------------ */
/* Datas                                                               */
/* ------------------------------------------------------------------ */

/**
 * `new Date("2026-11-27")` é interpretado como meia-noite **UTC**, o que
 * no horário de Brasília vira 26/11 21:00 — toda data só-dia aparecia um
 * dia antes. Datas no formato YYYY-MM-DD são construídas no fuso local.
 */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function toDate(value: string | Date): Date {
  if (typeof value !== "string") return value;
  if (DATE_ONLY.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y!, m! - 1, d!);
  }
  return new Date(value);
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

/** "14 nov 2026" */
export function dateShort(value: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(toDate(value))
    .replace(/\./g, "");
}

/** "14/11/2026" */
export function dateNumeric(value: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(toDate(value));
}

/** "14 nov, 19:30" */
export function dateTime(value: string | Date): string {
  const d = toDate(value);
  return `${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(d)
    .replace(/\./g, "")}, ${new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)}`;
}

/** "19:30" */
export function time(value: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(value));
}

const RTF = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

/** "há 3 dias" · "em 2 semanas" */
export function relative(value: string | Date, now = new Date()): string {
  const diffMs = toDate(value).getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;

  if (abs < hour) return RTF.format(Math.round(diffMs / min), "minute");
  if (abs < day) return RTF.format(Math.round(diffMs / hour), "hour");
  if (abs < 30 * day) return RTF.format(Math.round(diffMs / day), "day");
  if (abs < 365 * day)
    return RTF.format(Math.round(diffMs / (30 * day)), "month");
  return RTF.format(Math.round(diffMs / (365 * day)), "year");
}

/**
 * Relativo em dias de calendário — para prazos e vencimentos, que são
 * datas sem hora. "há 9 horas" para uma tarefa de hoje não faz sentido.
 */
export function relativeDay(value: string | Date, now = new Date()): string {
  const days = Math.round(
    (startOfDay(toDate(value)).getTime() - startOfDay(now).getTime()) /
      86_400_000,
  );
  if (days === 0) return "hoje";
  if (Math.abs(days) < 7) return RTF.format(days, "day");
  if (Math.abs(days) < 30) return RTF.format(Math.round(days / 7), "week");
  if (Math.abs(days) < 365) return RTF.format(Math.round(days / 30), "month");
  return RTF.format(Math.round(days / 365), "year");
}

/** Idade em anos a partir da data de nascimento */
export function age(birthDate: string, now = new Date()): number {
  const b = toDate(birthDate);
  let years = now.getFullYear() - b.getFullYear();
  const monthDiff = now.getMonth() - b.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < b.getDate())) {
    years--;
  }
  return years;
}

const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export function weekday(index: number): string {
  return WEEKDAYS[index] ?? "";
}

/* ------------------------------------------------------------------ */
/* Pessoas                                                             */
/* ------------------------------------------------------------------ */

/** Primeiro + último nome — tabelas ficam legíveis, nomes longos não quebram */
export function shortName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 2) return full;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export function initials(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/** "11987654321" → "(11) 98765-4321" */
export function phone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11)
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}
