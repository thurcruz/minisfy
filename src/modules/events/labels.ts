import type { EventKind } from "@/mocks/types";

/**
 * Rótulos e tons de evento num só lugar: agenda, tela do evento e
 * formulário mostram o mesmo nome para o mesmo tipo.
 */
export const KIND_LABEL: Record<EventKind, string> = {
  culto: "Culto",
  ensaio: "Ensaio",
  reuniao: "Reunião",
  evento: "Evento",
  curso: "Curso",
  celula: "Célula",
};

export const KIND_TONE: Record<
  EventKind,
  "brand" | "neutral" | "accent" | "outline"
> = {
  culto: "brand",
  ensaio: "neutral",
  reuniao: "outline",
  evento: "accent",
  curso: "outline",
  celula: "neutral",
};

export const KIND_OPTIONS = (
  Object.keys(KIND_LABEL) as EventKind[]
).map((kind) => ({ value: kind, label: KIND_LABEL[kind] }));
