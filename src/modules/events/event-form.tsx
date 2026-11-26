"use client";

import { useState } from "react";
import { CircleAlert, Info, Lock } from "lucide-react";
import { TODAY, units } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import { useStore } from "@/store/data-store";
import { dateTime, num } from "@/lib/format";
import { DURATIONS, clockOf, windowFrom } from "@/lib/datetime";
import { Button } from "@/ui/button";
import { Field, Select, TextInput } from "@/ui/field";
import { Modal } from "@/ui/modal";
import { Stepper } from "@/ui/number-field";
import { KIND_OPTIONS } from "@/modules/events/labels";
import type { ChurchEvent, EventKind } from "@/mocks/types";
import { cn } from "@/lib/utils";

const ISO_TODAY = TODAY.toISOString().slice(0, 10);

interface Errors {
  title?: string;
  date?: string;
  startTime?: string;
  capacity?: string;
  room?: string;
}

/**
 * Montado apenas quando aberto, então o estado nasce limpo — sem
 * efeito de reset. Sala e capacidade são derivadas no render: trocar a
 * unidade simplesmente deixa de casar com a sala escolhida.
 */
export function EventFormModal({
  onOpenChange,
  onSaved,
}: {
  onOpenChange: (open: boolean) => void;
  onSaved?: (event: ChurchEvent) => void;
}) {
  const { createEvent, data } = useStore();
  const { roomConflicts } = useQueries();

  const [kind, setKind] = useState<EventKind>("culto");
  const [title, setTitle] = useState("");
  const [unitId, setUnitId] = useState(units[0]!.id);
  const [date, setDate] = useState(ISO_TODAY);
  const [startTime, setStartTime] = useState("19:30");
  const [minutes, setMinutes] = useState(90);
  const [pickedRoomId, setPickedRoomId] = useState("");
  const [registrations, setRegistrations] = useState(false);
  const [capacity, setCapacity] = useState(60);
  const [expected, setExpected] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const rooms = data.rooms.filter((r) => r.unitId === unitId);
  const roomId = rooms.some((r) => r.id === pickedRoomId) ? pickedRoomId : "";
  const room = rooms.find((r) => r.id === roomId) ?? null;

  const validWindow = /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(startTime);
  const window = validWindow ? windowFrom(date, startTime, minutes) : null;

  /**
   * Mesma regra que a EXCLUDE constraint do AD-10 aplica no banco. O
   * aviso aqui é conveniência; a garantia é do banco.
   */
  const conflicts =
    room && window
      ? roomConflicts({
          roomId: room.id,
          startsAt: window.startsAt,
          endsAt: window.endsAt,
        })
      : [];

  const inThePast = window ? new Date(window.startsAt) < TODAY : false;
  const overRoom = Boolean(
    registrations && room && capacity > room.capacity,
  );

  /**
   * Erros derivados no render depois da primeira tentativa: guardar o
   * resultado em estado deixava a mensagem na tela depois do campo já
   * corrigido, até alguém enviar de novo.
   */
  function validate(): Errors {
    const next: Errors = {};
    if (title.trim().length < 3) next.title = "Dê um título ao evento";
    if (!validWindow) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = "Informe a data";
      if (!/^\d{2}:\d{2}$/.test(startTime))
        next.startTime = "Informe o horário";
    }
    if (registrations && capacity < 1)
      next.capacity = "Com inscrição aberta, defina quantas vagas";
    if (overRoom)
      next.capacity = `A sala ${room!.name} comporta ${num(room!.capacity)} pessoas`;
    if (conflicts.length > 0)
      next.room = "A sala já está ocupada neste horário";
    return next;
  }

  const errors: Errors = submitted ? validate() : {};

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    /* Revalida aqui: na primeira tentativa `submitted` ainda é false
       neste render, então `errors` estaria vazio. */
    const found = validate();
    if (Object.keys(found).length > 0 || !window) return;

    const saved = createEvent({
      unitId,
      kind,
      title: title.trim(),
      startsAt: window.startsAt,
      endsAt: window.endsAt,
      roomId: roomId || null,
      capacity: registrations ? capacity : null,
      expectedAttendance: expected > 0 ? expected : null,
    });

    onSaved?.(saved);
    onOpenChange(false);
  }

  return (
    <Modal
      open
      onOpenChange={onOpenChange}
      title="Novo evento"
      description="Entra na agenda. Com sala marcada, reserva o espaço no mesmo gesto."
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
          <Button size="sm" type="submit" form="event-form">
            Criar evento
          </Button>
        </>
      }
    >
      <form id="event-form" onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Título" required error={errors.title}>
          <TextInput
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            invalid={!!errors.title}
            placeholder="Culto de Celebração"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo" required>
            <Select
              value={kind}
              onChange={(event) => setKind(event.target.value as EventKind)}
            >
              {KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

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

          <Field
            label="Data"
            required
            error={errors.date}
            hint={inThePast && !errors.date ? "Entra no histórico" : undefined}
          >
            <TextInput
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              invalid={!!errors.date}
            />
          </Field>

          <Field label="Início" required error={errors.startTime}>
            <TextInput
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              invalid={!!errors.startTime}
            />
          </Field>

          <Field
            label="Duração"
            required
            hint={window ? `Termina às ${clockOf(window.endsAt)}` : undefined}
          >
            <Select
              value={String(minutes)}
              onChange={(event) => setMinutes(Number(event.target.value))}
            >
              {DURATIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Sala"
            error={errors.room}
            hint={
              room && !errors.room
                ? `${num(room.capacity)} lugares`
                : "Opcional — eventos fora da igreja não ocupam espaço"
            }
          >
            <Select
              value={roomId}
              onChange={(event) => setPickedRoomId(event.target.value)}
              invalid={!!errors.room}
            >
              <option value="">Sem sala</option>
              {rooms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {/* Conflito de sala — o que a EXCLUDE constraint rejeitaria */}
        {conflicts.length > 0 && (
          <div className="rounded-lg bg-danger-bg px-3.5 py-3 dark:bg-danger/10">
            <p className="flex items-center gap-2 text-[13px] font-medium text-danger">
              <CircleAlert className="size-3.5 shrink-0" />
              {room?.name} já está ocupada neste horário
            </p>
            <ul className="mt-2 space-y-1 pl-[22px]">
              {conflicts.map(({ reservation, requestedBy }) => (
                <li key={reservation.id} className="text-[12px] text-fg-secondary">
                  <strong className="font-medium text-fg">
                    {reservation.title}
                  </strong>{" "}
                  · {dateTime(reservation.startsAt)} →{" "}
                  {clockOf(reservation.endsAt)}
                  {requestedBy && ` · ${requestedBy.name}`}
                  {reservation.status === "pending" && " (pedido pendente)"}
                </li>
              ))}
            </ul>
            <p className="mt-2 pl-[22px] text-[11px] leading-relaxed text-fg-muted">
              O banco rejeita sobreposição na mesma sala (AD-10). Mude o
              horário, a sala, ou resolva a reserva existente antes.
            </p>
          </div>
        )}

        {/* Inscrições */}
        <div className="rounded-lg border border-subtle p-3.5">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={registrations}
              onChange={(event) => setRegistrations(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--chart-1)]"
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-fg">
                Abrir inscrições
              </span>
              <span className="block text-[12px] text-fg-muted">
                Define vagas, lista de espera e controle de pagamento. Culto
                normalmente não precisa.
              </span>
            </span>
          </label>

          {registrations && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Vagas" required error={errors.capacity}>
                <Stepper
                  value={capacity}
                  onChange={setCapacity}
                  min={1}
                  max={2000}
                  invalid={!!errors.capacity}
                />
              </Field>
              <Field
                label="Público esperado"
                hint="Zerado quando não há estimativa"
              >
                <Stepper
                  value={expected}
                  onChange={setExpected}
                  max={2000}
                />
              </Field>
            </div>
          )}
        </div>

        {!registrations && (
          <Field label="Público esperado" hint="Zerado quando não há estimativa">
            <Stepper value={expected} onChange={setExpected} max={2000} />
          </Field>
        )}

        {room && conflicts.length === 0 && (
          <p
            className={cn(
              "flex items-start gap-2 rounded-lg px-3.5 py-3 text-[12px] leading-relaxed",
              "bg-success-bg text-success dark:bg-success/10",
            )}
          >
            <Lock className="mt-px size-3.5 shrink-0" />
            {room.name} fica reservada para este evento — a reserva é a linha
            que impede outro grupo de pedir a mesma sala no horário.
          </p>
        )}

        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-fg-muted">
          <Info className="mt-px size-3 shrink-0" />
          A escala do evento é montada na tela de escalas, por ministério e
          função. Criar o evento não convida ninguém.
        </p>
      </form>
    </Modal>
  );
}
