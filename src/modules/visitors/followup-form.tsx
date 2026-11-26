"use client";

import { useState } from "react";
import { TODAY } from "@/mocks/queries";
import { useStore } from "@/store/data-store";
import { Button } from "@/ui/button";
import { Field, Select, TextInput } from "@/ui/field";
import { Modal } from "@/ui/modal";
import type { VisitorJourney } from "@/mocks/types";

const ISO_TODAY = TODAY.toISOString().slice(0, 10);

/** Datas relativas à referência do protótipo, não ao relógio da máquina. */
function isoIn(days: number) {
  const date = new Date(TODAY);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Contatos que uma igreja realmente faz com quem visitou. São sugestões
 * de texto, não lista fechada: o campo aceita qualquer coisa.
 */
const SUGGESTIONS = [
  "Ligar para agradecer a visita",
  "Mandar mensagem no WhatsApp",
  "Convidar para o pequeno grupo",
  "Visitar em casa",
  "Apresentar ao pastor",
  "Convidar para o almoço das famílias",
];

/**
 * Montado apenas quando aberto: o estado nasce do que está gravado na
 * jornada, sem efeito de sincronização.
 */
export function FollowupModal({
  journey,
  personName,
  onOpenChange,
}: {
  journey: VisitorJourney;
  personName: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { setFollowup } = useStore();

  const [label, setLabel] = useState(journey.nextActionLabel ?? SUGGESTIONS[0]!);
  const [date, setDate] = useState(journey.nextActionAt ?? isoIn(3));
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (label.trim().length < 3) {
      setError("Descreva o contato a fazer");
      return;
    }
    if (date && date < ISO_TODAY) {
      setError("A data não pode estar no passado");
      return;
    }
    setFollowup(journey.id, { label, date: date || null });
    onOpenChange(false);
  }

  return (
    <Modal
      open
      onOpenChange={onOpenChange}
      title="Agendar contato"
      description={personName}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button size="sm" type="submit" form="followup-form">
            Agendar
          </Button>
        </>
      }
    >
      <form
        id="followup-form"
        onSubmit={submit}
        className="space-y-5"
        noValidate
      >
        <Field label="O que fazer" required error={error ?? undefined}>
          <TextInput
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            invalid={!!error}
            placeholder="Ligar para agradecer a visita"
            list="followup-suggestions"
          />
          <datalist id="followup-suggestions">
            {SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>

        <Field
          label="Quando"
          hint="Aparece na lista de contatos vencidos a partir desta data"
        >
          <TextInput
            type="date"
            value={date}
            min={ISO_TODAY}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>

        <Field label="Responsável">
          <Select value={journey.ownerId} disabled>
            <option value={journey.ownerId}>
              Quem já acompanha este visitante
            </option>
          </Select>
        </Field>
        <p className="text-[11px] leading-relaxed text-fg-muted">
          Trocar o responsável depende de permissões por usuário, que entram
          com a autenticação na Fase 1.
        </p>
      </form>
    </Modal>
  );
}
