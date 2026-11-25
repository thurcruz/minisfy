"use client";

import {
  Building2,
  Check,
  CircleAlert,
  Clock,
  Plus,
  TriangleAlert,
  X,
} from "lucide-react";
import { TODAY } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import { dateShort, num, shortName, time } from "@/lib/format";
import { HBarChart } from "@/ui/charts";
import { Button } from "@/ui/button";
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
} from "@/ui/primitives";
import type { ReservationStatus } from "@/mocks/types";
import { cn } from "@/lib/utils";


const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Aguardando aprovação",
  approved: "Aprovada",
  rejected: "Recusada",
  cancelled: "Cancelada",
};

const STATUS_TONE: Record<
  ReservationStatus,
  "warning" | "success" | "danger" | "neutral"
> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
};

export function View() {
  const { reservationsWithConflicts, roomUsage } = useQueries();
  const all = reservationsWithConflicts();
  const upcoming = all.filter(
    (r) => new Date(r.reservation.startsAt) >= TODAY,
  );
  const usage = roomUsage();

  const pending = upcoming.filter((r) => r.reservation.status === "pending");
  const conflicted = upcoming.filter((r) => r.conflictsWith.length > 0);
  const approved = upcoming.filter((r) => r.reservation.status === "approved");

  /* Agrupa por dia */
  const byDay = new Map<string, typeof upcoming>();
  for (const row of upcoming) {
    const key = new Date(row.reservation.startsAt).toISOString().slice(0, 10);
    const list = byDay.get(key) ?? [];
    list.push(row);
    byDay.set(key, list);
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Reservas de espaço"
        description={`${num(upcoming.length)} reservas futuras em ${num(usage.length)} ambientes`}
        actions={
          <Button size="sm">
            <Plus />
            Nova reserva
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Aprovadas" value={num(approved.length)} tone="success" />
        <Stat label="Aguardando aprovação" value={num(pending.length)} tone="warning" />
        <Stat label="Em conflito" value={num(conflicted.length)} tone="danger" />
        <Stat label="Ambientes" value={num(usage.length)} tone="neutral" />
      </div>

      {/* Conflitos */}
      {conflicted.length > 0 && (
        <Card className="mt-6 border-danger/30">
          <CardHeader className="border-danger/20 bg-danger-bg dark:bg-danger/10">
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-4 shrink-0 text-danger" />
              <CardTitle>Conflitos de horário</CardTitle>
            </div>
            <Badge tone="danger">{num(conflicted.length)}</Badge>
          </CardHeader>
          <ul className="divide-y divide-subtle">
            {conflicted.map((row) => (
              <li key={row.reservation.id} className="px-5 py-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[13px] font-medium text-fg">
                    {row.reservation.title}
                  </p>
                  <Badge tone={STATUS_TONE[row.reservation.status]}>
                    {STATUS_LABEL[row.reservation.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[12px] text-fg-muted">
                  {row.room.name} · {dateShort(row.reservation.startsAt)},{" "}
                  {time(row.reservation.startsAt)}–{time(row.reservation.endsAt)}
                </p>
                <ul className="mt-2 space-y-1">
                  {row.conflictsWith.map((other) => (
                    <li
                      key={other.id}
                      className="flex items-center gap-2 rounded-md bg-danger-bg px-2.5 py-1.5 text-[12px] text-fg-secondary dark:bg-danger/10"
                    >
                      <CircleAlert className="size-3 shrink-0 text-danger" />
                      Sobrepõe <strong className="font-medium">{other.title}</strong>
                      <span className="tnum text-fg-muted">
                        {time(other.startsAt)}–{time(other.endsAt)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2.5 flex gap-2">
                  <Button variant="secondary" size="sm">
                    Propor outro horário
                  </Button>
                  <Button variant="ghost" size="sm">
                    Recusar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <p className="border-t border-subtle px-5 py-2.5 text-[11px] leading-relaxed text-fg-muted">
            Com o banco em produção este conflito nem chega a existir: a
            constraint <code>EXCLUDE USING gist</code> rejeita a sobreposição na
            escrita (AD-10). Esta tela cobre o caso de pedidos ainda não
            aprovados, que convivem até alguém decidir.
          </p>
        </Card>
      )}

      {/* Aprovações pendentes */}
      {pending.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Aguardando sua aprovação</CardTitle>
            <Badge tone="warning">{num(pending.length)}</Badge>
          </CardHeader>
          <ul className="divide-y divide-subtle">
            {pending.map((row) => (
              <li
                key={row.reservation.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3"
              >
                <Avatar name={row.requestedBy.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-fg">
                    {row.reservation.title}
                  </span>
                  <span className="block truncate text-[12px] text-fg-muted">
                    {row.room.name} · {dateShort(row.reservation.startsAt)},{" "}
                    {time(row.reservation.startsAt)} · pedido por{" "}
                    {shortName(row.requestedBy.name)}
                  </span>
                  {row.reservation.notes && (
                    <span className="mt-0.5 block truncate text-[12px] text-fg-secondary">
                      {row.reservation.notes}
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    <X />
                    Recusar
                  </Button>
                  <Button size="sm" disabled={row.conflictsWith.length > 0}>
                    <Check />
                    Aprovar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Agenda das reservas */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-[15px] font-semibold text-fg">
            Próximas reservas
          </h2>
          {byDay.size === 0 ? (
            <Card>
              <EmptyState
                icon={Building2}
                title="Nenhuma reserva futura"
                description="Reserve salas e auditórios para ensaios, reuniões e eventos."
                action={
                  <Button size="sm">
                    <Plus />
                    Criar primeira reserva
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {[...byDay.entries()].map(([day, rows]) => (
                <Card key={day}>
                  <CardHeader>
                    <CardTitle className="text-[13px]">
                      {new Intl.DateTimeFormat("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      }).format(new Date(`${day}T12:00:00`))}
                    </CardTitle>
                  </CardHeader>
                  <ul className="divide-y divide-subtle">
                    {rows.map((row) => (
                      <li
                        key={row.reservation.id}
                        className="flex gap-4 px-5 py-3"
                      >
                        <span className="tnum w-24 shrink-0 text-[12px] text-fg-secondary">
                          {time(row.reservation.startsAt)}–
                          {time(row.reservation.endsAt)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] text-fg">
                            {row.reservation.title}
                          </span>
                          <span className="block truncate text-[12px] text-fg-muted">
                            {row.room.name} · {shortName(row.requestedBy.name)}
                          </span>
                        </span>
                        {row.conflictsWith.length > 0 && (
                          <span title="Em conflito" className="shrink-0 text-danger">
                            <TriangleAlert className="size-3.5" />
                          </span>
                        )}
                        <Badge
                          tone={STATUS_TONE[row.reservation.status]}
                          className="shrink-0"
                        >
                          {row.reservation.status === "approved" && (
                            <Check className="size-3" />
                          )}
                          {row.reservation.status === "pending" && (
                            <Clock className="size-3" />
                          )}
                          {STATUS_LABEL[row.reservation.status]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Uso dos ambientes */}
        <div>
          <h2 className="mb-3 text-[15px] font-semibold text-fg">Ambientes</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-[13px]">Horas reservadas</CardTitle>
            </CardHeader>
            <CardBody>
              <HBarChart
                data={usage.map((u) => ({ label: u.room.name, value: u.hours }))}
                format="number"
                unit="h"
              />
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-[13px]">Capacidade</CardTitle>
            </CardHeader>
            <ul className="divide-y divide-subtle">
              {usage.map((u) => (
                <li
                  key={u.room.id}
                  className="flex items-center gap-3 px-5 py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-fg">
                      {u.room.name}
                    </span>
                    <span className="tnum block text-[12px] text-fg-muted">
                      {num(u.bookings)}{" "}
                      {u.bookings === 1 ? "reserva" : "reservas"}
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-[12px] text-fg-secondary">
                    {num(u.room.capacity)} lugares
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  return (
    <Card>
      <CardBody className="py-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              tone === "success" && "bg-success",
              tone === "warning" && "bg-warning",
              tone === "danger" && "bg-danger",
              tone === "neutral" && "bg-fg-muted",
            )}
            aria-hidden="true"
          />
          <p className="text-[12px] text-fg-muted">{label}</p>
        </div>
        <p className="tnum mt-1.5 font-display text-2xl font-semibold text-fg">
          {value}
        </p>
      </CardBody>
    </Card>
  );
}
