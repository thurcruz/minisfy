"use client";

import { useState } from "react";
import { CircleAlert, Users } from "lucide-react";
import { useStore } from "@/store/data-store";
import { dateShort, money, num } from "@/lib/format";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Modal } from "@/ui/modal";
import { CurrencyInput, Stepper } from "@/ui/number-field";
import type { GroupMeeting, SmallGroup } from "@/mocks/types";

/**
 * Relatório de encontro — o formulário mais usado de um sistema de
 * igreja: todo líder preenche toda semana, quase sempre no celular.
 * Por isso contadores grandes em vez de campos de digitação.
 */
/**
 * Montado apenas quando aberto e com `key={meeting.id}`: assim o estado
 * nasce dos dados do encontro, sem efeito de sincronização.
 */
export function MeetingReportModal({
  onOpenChange,
  group,
  meeting,
  memberCount,
}: {
  onOpenChange: (open: boolean) => void;
  group: SmallGroup;
  meeting: GroupMeeting;
  memberCount: number;
}) {
  const { reportMeeting } = useStore();

  const [present, setPresent] = useState(meeting.presentCount);
  const [visitors, setVisitors] = useState(meeting.visitorCount);
  const [offering, setOffering] = useState(meeting.offeringCents);
  const [touched, setTouched] = useState(false);

  const members = Math.max(0, present - visitors);
  const overflow = members > memberCount;
  const emptyAttendance = touched && present === 0;

  function submit() {
    setTouched(true);
    if (present === 0 || overflow) return;
    reportMeeting(meeting.id, {
      presentCount: present,
      visitorCount: visitors,
      offeringCents: offering,
    });
    onOpenChange(false);
  }

  return (
    <Modal
      open
      onOpenChange={onOpenChange}
      title="Relatório de encontro"
      description={`${group.name} · ${dateShort(meeting.scheduledFor)}`}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button size="sm" onClick={submit}>
            Enviar relatório
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field
          label="Total de presentes"
          required
          error={
            emptyAttendance
              ? "Informe quantas pessoas estiveram no encontro"
              : overflow
                ? `${num(members)} participantes presentes, mas o grupo tem ${num(memberCount)} cadastrados — registre o excedente como visitante`
                : undefined
          }
          hint={
            !emptyAttendance && !overflow
              ? `Grupo com ${num(memberCount)} participantes cadastrados`
              : undefined
          }
        >
          <Stepper
            value={present}
            onChange={(v) => {
              setPresent(v);
              setTouched(true);
            }}
            max={200}
            invalid={emptyAttendance || overflow}
          />
        </Field>

        <Field
          label="Destes, quantos eram visitantes"
          hint="Visitantes entram no funil de acompanhamento"
        >
          <Stepper
            value={visitors}
            onChange={setVisitors}
            max={present}
          />
        </Field>

        <Field label="Oferta recolhida" hint="Deixe zerado se não houve">
          <CurrencyInput value={offering} onChange={setOffering} />
        </Field>

        <div className="rounded-lg bg-canvas px-3.5 py-3 text-[12px]">
          <p className="mb-2 flex items-center gap-1.5 font-medium text-fg">
            <Users className="size-3.5" />
            Resumo
          </p>
          <dl className="space-y-1 text-fg-secondary">
            <div className="flex justify-between">
              <dt>Participantes do grupo</dt>
              <dd className="tnum">{num(members)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Visitantes</dt>
              <dd className="tnum">{num(visitors)}</dd>
            </div>
            <div className="flex justify-between border-t border-subtle pt-1 font-medium text-fg">
              <dt>Oferta</dt>
              <dd className="tnum">{money(offering)}</dd>
            </div>
          </dl>
        </div>

        {meeting.reported && (
          <p className="flex items-start gap-2 rounded-md bg-warning-bg px-3 py-2 text-[12px] text-warning dark:bg-warning/10">
            <CircleAlert className="mt-px size-3.5 shrink-0" />
            Este encontro já foi relatado. Enviar de novo substitui os
            números anteriores.
          </p>
        )}
      </div>
    </Modal>
  );
}
