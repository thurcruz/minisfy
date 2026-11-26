"use client";

import { useState } from "react";
import { CircleAlert, Clock, Info } from "lucide-react";
import { TODAY, currentUserId, units } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import { useStore } from "@/store/data-store";
import { dateTime, num, shortName } from "@/lib/format";
import { DURATIONS, clockOf, windowFrom } from "@/lib/datetime";
import { Button } from "@/ui/button";
import { Field, Select, TextInput } from "@/ui/field";
import { Modal } from "@/ui/modal";
import type { RoomReservation } from "@/mocks/types";

const ISO_TODAY = TODAY.toISOString().slice(0, 10);

interface Errors {
  title?: string;
  date?: string;
  startTime?: string;
  roomId?: string;
}

/**
 * Pedido de reserva de espaço.
 *
 * Nasce como "aguardando aprovação": quem pede não aprova. A
 * sobreposição é checada aqui para avisar antes, mas quem garante é a
 * EXCLUDE constraint do banco (AD-10) — o navegador nunca é mecanismo
 * de garantia.
 */
export function ReservationFormModal({
  onOpenChange,
  onSaved,
}: {
  onOpenChange: (open: boolean) => void;
  onSaved?: (reservation: RoomReservation) => void;
}) {
  const { createReservation, data } = useStore();
  const { getPerson, listPeople, roomConflicts } = useQueries();

  const [title, setTitle] = useState("");
  const [unitId, setUnitId] = useState(units[0]!.id);
  const [pickedRoomId, setPickedRoomId] = useState("");
  const [date, setDate] = useState(ISO_TODAY);
  const [startTime, setStartTime] = useState("19:00");
  const [minutes, setMinutes] = useState(120);
  const [requestedById, setRequestedById] = useState(currentUserId);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const rooms = data.rooms.filter((r) => r.unitId === unitId);
  const roomId = rooms.some((r) => r.id === pickedRoomId)
    ? pickedRoomId
    : (rooms[0]?.id ?? "");
  const room = rooms.find((r) => r.id === roomId) ?? null;

  const requesters = listPeople({ unitId: null }, { status: "all" }).filter(
    (p) => p.status === "member" || p.status === "regular",
  );
  const me = getPerson(currentUserId);

  const validWindow =
    /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(startTime);
  const window = validWindow ? windowFrom(date, startTime, minutes) : null;

  const conflicts =
    room && window
      ? roomConflicts({
          roomId: room.id,
          startsAt: window.startsAt,
          endsAt: window.endsAt,
        })
      : [];

  /** Sugestão honesta: salas livres na mesma janela. */
  const alternatives =
    conflicts.length > 0 && window
      ? rooms.filter(
          (candidate) =>
            candidate.id !== room?.id &&
            roomConflicts({
              roomId: candidate.id,
              startsAt: window.startsAt,
              endsAt: window.endsAt,
            }).length === 0,
        )
      : [];

  /**
   * Erros derivados no render depois da primeira tentativa: guardar o
   * resultado em estado deixava a mensagem na tela depois do campo já
   * corrigido, até alguém enviar de novo.
   */
  function validate(): Errors {
    const next: Errors = {};
    if (title.trim().length < 3) next.title = "Diga para que é a reserva";
    if (!roomId) next.roomId = "Escolha a sala";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = "Informe a data";
    else if (date < ISO_TODAY) next.date = "Não se reserva data passada";
    if (!/^\d{2}:\d{2}$/.test(startTime)) next.startTime = "Informe o horário";
    if (conflicts.length > 0) next.roomId = "A sala já está ocupada";
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

    const saved = createReservation({
      unitId,
      roomId,
      title: title.trim(),
      startsAt: window.startsAt,
      endsAt: window.endsAt,
      requestedById,
      notes: notes.trim() || null,
    });

    onSaved?.(saved);
    onOpenChange(false);
  }

  return (
    <Modal
      open
      onOpenChange={onOpenChange}
      title="Pedir reserva de espaço"
      description="O pedido entra como aguardando aprovação."
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
          <Button size="sm" type="submit" form="reservation-form">
            Enviar pedido
          </Button>
        </>
      }
    >
      <form
        id="reservation-form"
        onSubmit={submit}
        className="space-y-5"
        noValidate
      >
        <Field label="Para que" required error={errors.title}>
          <TextInput
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            invalid={!!errors.title}
            placeholder="Treinamento do Infantil"
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

          <Field
            label="Sala"
            required
            error={errors.roomId}
            hint={
              room && !errors.roomId
                ? `${num(room.capacity)} lugares`
                : undefined
            }
          >
            <Select
              value={roomId}
              onChange={(event) => setPickedRoomId(event.target.value)}
              invalid={!!errors.roomId}
            >
              {rooms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Data" required error={errors.date}>
            <TextInput
              type="date"
              value={date}
              min={ISO_TODAY}
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
            hint={window ? `Libera às ${clockOf(window.endsAt)}` : undefined}
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
            label="Solicitante"
            required
            hint={
              requestedById === currentUserId && me
                ? `Você, no protótipo: ${shortName(me.name)}`
                : undefined
            }
          >
            <Select
              value={requestedById}
              onChange={(event) => setRequestedById(event.target.value)}
            >
              {requesters.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Observações" hint="Som, projetor, montagem, chaves">
          <TextInput
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Precisa de projetor"
          />
        </Field>

        {conflicts.length > 0 && (
          <div className="rounded-lg bg-danger-bg px-3.5 py-3 dark:bg-danger/10">
            <p className="flex items-center gap-2 text-[13px] font-medium text-danger">
              <CircleAlert className="size-3.5 shrink-0" />
              {room?.name} já está ocupada neste horário
            </p>
            <ul className="mt-2 space-y-1 pl-[22px]">
              {conflicts.map(({ reservation, requestedBy }) => (
                <li
                  key={reservation.id}
                  className="text-[12px] text-fg-secondary"
                >
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
            {alternatives.length > 0 && (
              <p className="mt-2.5 pl-[22px] text-[12px] text-fg-secondary">
                Livres neste horário:{" "}
                {alternatives.map((item, index) => (
                  <span key={item.id}>
                    {index > 0 && ", "}
                    <button
                      type="button"
                      onClick={() => setPickedRoomId(item.id)}
                      className="font-medium text-interactive hover:underline"
                    >
                      {item.name}
                    </button>
                  </span>
                ))}
              </p>
            )}
          </div>
        )}

        {window && conflicts.length === 0 && room && (
          <p className="flex items-start gap-2 rounded-lg bg-canvas px-3.5 py-3 text-[12px] leading-relaxed text-fg-secondary">
            <Clock className="mt-px size-3.5 shrink-0 text-fg-muted" />
            {room.name} está livre de {clockOf(window.startsAt)} às{" "}
            {clockOf(window.endsAt)}. O pedido fica aguardando aprovação.
          </p>
        )}

        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-fg-muted">
          <Info className="mt-px size-3 shrink-0" />
          Quem pede não aprova. A sobreposição é verificada aqui por
          conveniência; quem garante é a restrição do banco (AD-10).
        </p>
      </form>
    </Modal>
  );
}
