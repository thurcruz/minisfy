/**
 * Montagem de janelas de horário — usada por evento e por reserva.
 *
 * Os campos da interface são data (`YYYY-MM-DD`), hora (`HH:MM`) e
 * duração em minutos, porque é assim que alguém pensa ao agendar. O
 * modelo guarda dois instantes, como o `tstzrange` do Postgres.
 */
export function windowFrom(date: string, time: string, minutes: number) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  /* Construção componente a componente: `new Date("2026-11-25")` seria
     lido como UTC e cairia no dia anterior no Brasil. */
  const start = new Date(year!, month! - 1, day!, hour!, minute!, 0, 0);
  const end = new Date(start.getTime() + minutes * 60_000);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

/** Durações que cobrem a agenda de uma igreja. */
export const DURATIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2 horas" },
  { value: 180, label: "3 horas" },
  { value: 240, label: "4 horas" },
  { value: 360, label: "6 horas" },
  { value: 480, label: "8 horas" },
] as const;

/** `HH:MM` do instante, no fuso de quem está olhando. */
export function clockOf(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
