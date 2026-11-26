"use client";

import { useState } from "react";
import { CircleAlert, Info } from "lucide-react";
import { units } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import { useStore } from "@/store/data-store";
import { num, shortName, weekday } from "@/lib/format";
import { Button } from "@/ui/button";
import { Field, Select, TextInput } from "@/ui/field";
import { Modal } from "@/ui/modal";
import { Stepper } from "@/ui/number-field";
import type { SmallGroup } from "@/mocks/types";

/** Categorias que já existem no cadastro; o campo aceita outras. */
const CATEGORIES = [
  "Famílias",
  "Jovens",
  "Casais",
  "Mulheres",
  "Homens",
  "Adolescentes",
  "Misto",
];

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

interface Errors {
  name?: string;
  neighborhood?: string;
  startTime?: string;
  capacity?: string;
  leaderId?: string;
}

/**
 * Montado apenas quando aberto, então o estado nasce limpo a cada
 * abertura — sem efeito de reset.
 *
 * Bairro e anfitrião não são sincronizados por efeito: o bairro ainda
 * não digitado assume o do líder, e o anfitrião em branco é o próprio
 * líder. Tudo derivado no render.
 */
export function GroupFormModal({
  onOpenChange,
  onSaved,
}: {
  onOpenChange: (open: boolean) => void;
  onSaved?: (group: SmallGroup) => void;
}) {
  const { createGroup } = useStore();
  const { getGroup, listPeople } = useQueries();

  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [unitId, setUnitId] = useState(units[0]!.id);
  const [weekdayValue, setWeekdayValue] = useState(3);
  const [startTime, setStartTime] = useState("20:00");
  const [capacity, setCapacity] = useState(14);
  const [leaderId, setLeaderId] = useState("");
  const [pickedHostId, setPickedHostId] = useState("");
  const [typedNeighborhood, setTypedNeighborhood] = useState("");
  const [submitted, setSubmitted] = useState(false);

  /** Visitante não lidera grupo: o vínculo tem de existir primeiro. */
  const eligible = listPeople({ unitId }, { status: "all" }).filter(
    (p) => p.status === "member" || p.status === "regular",
  );

  const leader = eligible.find((p) => p.id === leaderId) ?? null;
  const hostId = eligible.some((p) => p.id === pickedHostId)
    ? pickedHostId
    : leaderId;
  const host = eligible.find((p) => p.id === hostId) ?? null;
  const neighborhood = typedNeighborhood || leader?.neighborhood || "";

  /* Quem já participa de outro grupo sai dele ao assumir este. */
  const leavingLeader =
    leader?.groupId && leader.groupId !== ""
      ? (getGroup(leader.groupId) ?? null)
      : null;
  const leavingHost =
    host && host.id !== leader?.id && host.groupId
      ? (getGroup(host.groupId) ?? null)
      : null;

  /**
   * Erros derivados no render depois da primeira tentativa: guardar o
   * resultado em estado deixava a mensagem na tela depois do campo já
   * corrigido, até alguém enviar de novo.
   */
  function validate(): Errors {
    const next: Errors = {};
    if (name.trim().length < 3) next.name = "Dê um nome ao grupo";
    if (!leaderId) next.leaderId = "Escolha quem lidera";
    if (!neighborhood.trim())
      next.neighborhood = "Informe o bairro onde o grupo se reúne";
    if (!/^\d{2}:\d{2}$/.test(startTime))
      next.startTime = "Informe o horário";
    else {
      const hour = Number(startTime.slice(0, 2));
      if (hour < 6 || hour > 23)
        next.startTime = "Horário fora de qualquer realidade de encontro";
    }
    if (capacity < 4)
      next.capacity = "Menos de quatro pessoas não sustenta um grupo";
    if (capacity > 40) next.capacity = "Acima de 40 vira culto, não grupo";
    return next;
  }

  const errors: Errors = submitted ? validate() : {};

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    /* Revalida aqui: na primeira tentativa `submitted` ainda é false
       neste render, então `errors` estaria vazio. */
    const found = validate();
    if (Object.keys(found).length > 0) return;

    const saved = createGroup({
      unitId,
      name: name.trim(),
      category,
      weekday: weekdayValue,
      startTime,
      neighborhood: neighborhood.trim(),
      capacity,
      leaderId,
      hostId,
    });

    onSaved?.(saved);
    onOpenChange(false);
  }

  return (
    <Modal
      open
      onOpenChange={onOpenChange}
      title="Novo pequeno grupo"
      description="O grupo nasce ativo, com o líder e o anfitrião já dentro."
      size="md"
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
          <Button size="sm" type="submit" form="group-form">
            Criar grupo
          </Button>
        </>
      }
    >
      <form id="group-form" onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Nome" required error={errors.name}>
          <TextInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            invalid={!!errors.name}
            placeholder="GC Taquaral"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Unidade" required>
            <Select
              value={unitId}
              onChange={(event) => setUnitId(event.target.value)}
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Perfil" required>
            <Select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Líder" required error={errors.leaderId}>
            <Select
              value={leaderId}
              onChange={(event) => setLeaderId(event.target.value)}
              invalid={!!errors.leaderId}
            >
              <option value="">Selecione…</option>
              {eligible.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Anfitrião"
            hint={
              leader && hostId === leader.id
                ? "Em branco, é o próprio líder"
                : undefined
            }
          >
            <Select
              value={hostId}
              onChange={(event) => setPickedHostId(event.target.value)}
            >
              <option value="">
                {leader ? `${shortName(leader.name)} (líder)` : "Selecione…"}
              </option>
              {eligible
                .filter((person) => person.id !== leaderId)
                .map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
            </Select>
          </Field>

          <Field
            label="Bairro"
            required
            error={errors.neighborhood}
            hint={
              !typedNeighborhood && leader
                ? "Assumiu o bairro do líder"
                : undefined
            }
          >
            <TextInput
              value={neighborhood}
              onChange={(event) => setTypedNeighborhood(event.target.value)}
              invalid={!!errors.neighborhood}
              placeholder="Taquaral"
            />
          </Field>

          <Field label="Dia" required>
            <Select
              value={String(weekdayValue)}
              onChange={(event) => setWeekdayValue(Number(event.target.value))}
            >
              {WEEKDAYS.map((day) => (
                <option key={day} value={day}>
                  {weekday(day)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Horário" required error={errors.startTime}>
            <TextInput
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              invalid={!!errors.startTime}
            />
          </Field>

          <Field
            label="Capacidade da casa"
            required
            error={errors.capacity}
            hint={
              capacity > 20 && !errors.capacity
                ? "Acima de 20 é hora de pensar em multiplicar"
                : "Quantas pessoas cabem no lugar do encontro"
            }
          >
            <Stepper
              value={capacity}
              onChange={setCapacity}
              min={1}
              max={60}
              invalid={!!errors.capacity}
            />
          </Field>
        </div>

        {(leavingLeader || leavingHost) && (
          <p className="flex items-start gap-2 rounded-lg bg-warning-bg px-3.5 py-3 text-[12px] leading-relaxed text-warning dark:bg-warning/10">
            <CircleAlert className="mt-px size-3.5 shrink-0" />
            <span>
              {leavingLeader && (
                <>
                  {shortName(leader!.name)} sai do{" "}
                  <strong className="font-semibold">
                    {leavingLeader.name}
                  </strong>{" "}
                  ao assumir este grupo.
                </>
              )}
              {leavingLeader && leavingHost && " "}
              {leavingHost && (
                <>
                  {shortName(host!.name)} sai do{" "}
                  <strong className="font-semibold">{leavingHost.name}</strong>.
                </>
              )}{" "}
              Cada pessoa participa de um grupo por vez.
            </span>
          </p>
        )}

        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-fg-muted">
          <Info className="mt-px size-3 shrink-0" />
          {leader
            ? `Começa com ${host && host.id !== leader.id ? "2 participantes" : "1 participante"} e ${num(capacity)} vagas, encontro ${weekday(weekdayValue).toLowerCase()} às ${startTime}. Os relatórios de encontro começam no primeiro encontro realizado.`
            : "Escolher o líder preenche bairro e anfitrião; tudo pode ser trocado depois."}
        </p>
      </form>
    </Modal>
  );
}
