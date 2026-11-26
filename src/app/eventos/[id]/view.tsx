"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  ChevronLeft,
  CircleAlert,
  Clock,
  MapPin,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { TODAY } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import { useStore } from "@/store/data-store";
import {
  dateShort,
  dateTime,
  money,
  num,
  percent,
  shortName,
  time,
} from "@/lib/format";
import { Button } from "@/ui/button";
import { AreaChart, HBarChart } from "@/ui/charts";
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  RecordLoading,
} from "@/ui/primitives";
import { KIND_LABEL, KIND_TONE } from "@/modules/events/labels";
import { cn } from "@/lib/utils";

export function View({ id }: { id: string }) {
  const { eventNeighbours, eventProfile } = useQueries();
  const { hydrated } = useStore();
  const e = eventProfile(id);

  if (!e) {
    if (!hydrated) return <RecordLoading />;
    notFound();
  }

  const { previous, next } = eventNeighbours(id);
  const past = new Date(e.event.startsAt) < TODAY;
  const full = e.occupancy !== null && e.occupancy >= 1;

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/agenda">
            <ChevronLeft />
            Agenda
          </Link>
        </Button>
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="icon-sm"
            asChild={!!previous}
            disabled={!previous}
          >
            {previous ? (
              <Link
                href={`/eventos/${previous.id}`}
                aria-label={`Anterior: ${previous.title}`}
              >
                <ArrowLeft />
              </Link>
            ) : (
              <ArrowLeft />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            asChild={!!next}
            disabled={!next}
          >
            {next ? (
              <Link
                href={`/eventos/${next.id}`}
                aria-label={`Próximo: ${next.title}`}
              >
                <ArrowRight />
              </Link>
            ) : (
              <ArrowRight />
            )}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={KIND_TONE[e.event.kind]} size="md">
              {KIND_LABEL[e.event.kind]}
            </Badge>
            {past && <Badge tone="neutral" size="md">Já realizado</Badge>}
            {full && (
              <Badge tone="danger" size="md">
                <CircleAlert className="size-3" />
                Lotado
              </Badge>
            )}
          </div>

          <h1 className="mt-2.5 font-display text-2xl font-semibold tracking-[-0.02em] text-fg">
            {e.event.title}
          </h1>

          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-fg-secondary">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0 text-fg-muted" />
              <dt className="sr-only">Horário</dt>
              <dd className="tnum">
                {dateTime(e.event.startsAt)} → {time(e.event.endsAt)}
              </dd>
            </div>
            {e.room && (
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-fg-muted" />
                <dt className="sr-only">Sala</dt>
                <dd>
                  {e.room.name} ·{" "}
                  <span className="tnum">{num(e.room.capacity)}</span> lugares
                </dd>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0 text-fg-muted" />
              <dt className="sr-only">Unidade</dt>
              <dd>{e.unit?.name}</dd>
            </div>
          </dl>
        </div>

        <div className="grid grid-cols-2 border-t border-subtle sm:grid-cols-4">
          {e.event.capacity !== null ? (
            <>
              <Metric
                label="Confirmados"
                value={`${num(e.confirmed.length)} / ${num(e.event.capacity)}`}
              />
              <Metric
                label="Lista de espera"
                value={num(e.waitlist.length)}
                tone={e.waitlist.length > 0 ? "warning" : undefined}
              />
              <Metric label="Recebido" value={money(e.paidCents)} />
              <Metric
                label="A receber"
                value={money(e.pendingCents)}
                tone={e.pendingCents > 0 ? "warning" : undefined}
              />
            </>
          ) : (
            <>
              <Metric
                label="Esperado"
                value={
                  e.event.expectedAttendance !== null
                    ? num(e.event.expectedAttendance)
                    : "—"
                }
              />
              <Metric
                label="Presentes"
                value={
                  e.event.actualAttendance !== null
                    ? num(e.event.actualAttendance)
                    : "não registrado"
                }
              />
              <Metric
                label="Vagas de escala sem convite"
                value={num(e.openSlots)}
                tone={e.openSlots > 0 ? "danger" : undefined}
              />
              <Metric
                label="Convites sem resposta"
                value={num(e.pendingInvites)}
                tone={e.pendingInvites > 0 ? "warning" : undefined}
              />
            </>
          )}
        </div>
      </Card>

      {/* Conflitos reais de planejamento */}
      {e.roomShortfall > 0 && (
        <Warning>
          A sala <strong className="font-semibold">{e.room?.name}</strong>{" "}
          comporta <span className="tnum">{num(e.room?.capacity ?? 0)}</span>{" "}
          pessoas, mas o evento abriu{" "}
          <span className="tnum">{num(e.event.capacity ?? 0)}</span> vagas —{" "}
          <span className="tnum">{num(e.roomShortfall)}</span> inscritos a mais
          do que cabe. O sistema aceita as inscrições; o problema aparece na
          porta.
        </Warning>
      )}

      {e.overrunMinutes > 0 && (
        <Warning>
          A programação soma{" "}
          <span className="tnum">{num(e.plannedMinutes)} min</span> num horário
          de <span className="tnum">{num(e.scheduledMinutes)} min</span> —{" "}
          <span className="tnum">{num(e.overrunMinutes)} min</span> de
          estouro.
        </Warning>
      )}

      {!past && e.openSlots > 0 && e.event.capacity !== null && (
        <Warning>
          <span className="tnum">{num(e.openSlots)}</span>{" "}
          {e.openSlots === 1 ? "vaga de escala" : "vagas de escala"} sem
          ninguém convidado.{" "}
          <Link href="/escalas" className="font-medium underline">
            Abrir escalas
          </Link>
        </Warning>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Inscritos */}
          {e.event.capacity !== null && (
            <Card>
              <CardHeader>
                <CardTitle>Inscritos</CardTitle>
                <span className="text-[12px] text-fg-muted">
                  {e.remaining !== null && e.remaining > 0
                    ? `${num(e.remaining)} ${e.remaining === 1 ? "vaga" : "vagas"} restantes`
                    : "sem vagas"}
                </span>
              </CardHeader>

              {e.confirmed.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Nenhuma inscrição confirmada"
                  description="As inscrições chegam pelo portal do membro ou pelo cadastro manual."
                />
              ) : (
                <>
                  <CardBody className="pb-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-sunken">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          full ? "bg-danger" : "bg-interactive",
                        )}
                        style={{
                          width: `${Math.min((e.occupancy ?? 0) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-[12px] text-fg-muted">
                      {percent(e.occupancy ?? 0)} de ocupação
                    </p>
                  </CardBody>

                  <ul className="divide-y divide-subtle border-t border-subtle">
                    {e.confirmed.map(({ registration, person }) => (
                      <li
                        key={registration.id}
                        className="flex items-center gap-3 px-5 py-2.5"
                      >
                        <Avatar name={person.name} size="xs" />
                        <Link
                          href={`/membros/${person.id}`}
                          className="min-w-0 flex-1 truncate text-[13px] text-fg hover:underline"
                        >
                          {person.name}
                        </Link>
                        <span className="tnum shrink-0 text-[11px] text-fg-muted">
                          {dateShort(registration.registeredAt)}
                        </span>
                        {registration.amountCents > 0 &&
                          (registration.paid ? (
                            <Badge tone="success" className="shrink-0">
                              <Check className="size-3" />
                              {money(registration.amountCents)}
                            </Badge>
                          ) : (
                            <Badge tone="warning" className="shrink-0">
                              {money(registration.amountCents)} a pagar
                            </Badge>
                          ))}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {e.waitlist.length > 0 && (
                <>
                  <div className="border-t border-subtle px-5 py-2.5">
                    <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-fg-muted">
                      <Users className="size-3" />
                      Lista de espera · ordem de chegada
                    </p>
                  </div>
                  <ul className="divide-y divide-subtle border-t border-subtle">
                    {e.waitlist.map(({ registration, person }, index) => (
                      <li
                        key={registration.id}
                        className="flex items-center gap-3 px-5 py-2.5"
                      >
                        <span className="tnum w-4 shrink-0 text-[12px] text-fg-muted">
                          {index + 1}
                        </span>
                        <Avatar name={person.name} size="xs" />
                        <Link
                          href={`/membros/${person.id}`}
                          className="min-w-0 flex-1 truncate text-[13px] text-fg-secondary hover:underline"
                        >
                          {person.name}
                        </Link>
                        <span className="tnum shrink-0 text-[11px] text-fg-muted">
                          {dateShort(registration.registeredAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {e.cancelled.length > 0 && (
                <CardBody className="border-t border-subtle pt-3 text-[12px] text-fg-muted">
                  {num(e.cancelled.length)}{" "}
                  {e.cancelled.length === 1
                    ? "inscrição cancelada"
                    : "inscrições canceladas"}
                  : {e.cancelled.map((c) => shortName(c.person.name)).join(", ")}
                </CardBody>
              )}
            </Card>
          )}

          {/* Programação */}
          {e.program.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Programação</CardTitle>
                <span className="tnum text-[12px] text-fg-muted">
                  {num(e.plannedMinutes)} min previstos
                </span>
              </CardHeader>
              <ol className="divide-y divide-subtle">
                {e.program.map(({ item, responsible }) => (
                  <li key={item.id} className="flex gap-3 px-5 py-2.5">
                    <span className="tnum w-6 shrink-0 text-[12px] text-fg-muted">
                      {item.position}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-fg">
                        {item.title}
                      </span>
                      {responsible && (
                        <span className="block truncate text-[11px] text-fg-muted">
                          {shortName(responsible.name)}
                        </span>
                      )}
                    </span>
                    <span className="tnum shrink-0 text-[12px] text-fg-muted">
                      {item.durationMinutes} min
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {/* Equipe escalada */}
          <Card>
            <CardHeader>
              <CardTitle>Equipe escalada</CardTitle>
              {e.team.length > 0 && (
                <span className="text-[12px] text-fg-muted">
                  {num(e.team.length)}{" "}
                  {e.team.length === 1 ? "função" : "funções"}
                </span>
              )}
            </CardHeader>
            {e.team.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nenhuma escala neste evento"
                description="Eventos sem escala não precisam de equipe — reuniões internas, por exemplo."
              />
            ) : (
              <ul className="divide-y divide-subtle">
                {e.team.map((slot) => (
                  <li key={slot.slotId} className="px-5 py-3">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <Link
                        href={`/ministerios/${slot.ministry.id}`}
                        className="text-[13px] font-medium text-fg hover:underline"
                      >
                        {slot.ministry.name}
                      </Link>
                      <Badge tone="outline">{slot.position.name}</Badge>
                      <span className="tnum ml-auto text-[12px] text-fg-muted">
                        {num(slot.confirmed)}/{num(slot.required)}
                      </span>
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                      {slot.assignments.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center gap-1.5 text-[12px]"
                        >
                          <Avatar name={a.person.name} size="xs" />
                          <span
                            className={cn(
                              a.status === "declined"
                                ? "text-fg-muted line-through"
                                : "text-fg-secondary",
                            )}
                          >
                            {shortName(a.person.name)}
                          </span>
                          {a.status === "confirmed" ? (
                            <Check className="size-3 text-success" />
                          ) : a.status === "declined" ? (
                            <X className="size-3 text-danger" />
                          ) : (
                            <Clock className="size-3 text-warning" />
                          )}
                        </li>
                      ))}
                      {slot.open > 0 && (
                        <li className="text-[12px] text-danger">
                          {num(slot.open)} sem convite
                        </li>
                      )}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {/* Curva de inscrições */}
          {e.curve.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Ritmo das inscrições</CardTitle>
              </CardHeader>
              <CardBody>
                <AreaChart data={e.curve} format="number" height={130} />
                <p className="mt-2 text-[11px] leading-relaxed text-fg-muted">
                  Total acumulado por dia de inscrição. Curva que achata antes
                  de lotar significa divulgação parando antes da hora.
                </p>
              </CardBody>
            </Card>
          )}

          {/* Faixa etária */}
          {e.confirmed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Faixa etária dos inscritos</CardTitle>
              </CardHeader>
              <CardBody>
                <HBarChart
                  data={e.ageBands.filter((b) => b.value > 0)}
                  format="number"
                  unit="pessoas"
                />
                <p className="mt-3 text-[11px] leading-relaxed text-fg-muted">
                  Define o que a estrutura precisa ter: berçário, acessibilidade
                  ou nada além de cadeiras.
                </p>
              </CardBody>
            </Card>
          )}

          {/* Reserva de espaço */}
          <Card>
            <CardHeader>
              <CardTitle>Espaço</CardTitle>
            </CardHeader>
            {e.reservation ? (
              <CardBody className="space-y-2 text-[13px]">
                <div className="flex justify-between gap-3">
                  <span className="text-fg-muted">Sala</span>
                  <span className="text-fg">{e.room?.name}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-fg-muted">Reserva</span>
                  <Badge
                    tone={
                      e.reservation.status === "approved"
                        ? "success"
                        : e.reservation.status === "pending"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {e.reservation.status === "approved"
                      ? "Aprovada"
                      : e.reservation.status === "pending"
                        ? "Aguardando aprovação"
                        : e.reservation.status === "rejected"
                          ? "Recusada"
                          : "Cancelada"}
                  </Badge>
                </div>
                {e.reservation.notes && (
                  <p className="rounded-md bg-sunken px-3 py-2 text-[12px] text-fg-secondary">
                    {e.reservation.notes}
                  </p>
                )}
                <Button variant="secondary" size="sm" className="mt-1 w-full" asChild>
                  <Link href="/reservas">Ver reservas da sala</Link>
                </Button>
              </CardBody>
            ) : e.room ? (
              <CardBody className="text-[13px] text-fg-secondary">
                O evento aponta para {e.room.name}, mas não há reserva
                registrada — outro grupo pode pedir a mesma sala no horário.
                <Button variant="secondary" size="sm" className="mt-3 w-full" asChild>
                  <Link href="/reservas">Abrir reservas</Link>
                </Button>
              </CardBody>
            ) : (
              <EmptyState
                icon={CalendarClock}
                title="Sem sala definida"
                description="Eventos fora da igreja ou online não ocupam espaço."
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <Card className="mt-4 border-warning/30 bg-warning-bg dark:bg-warning/10">
      <div className="flex items-start gap-3 px-5 py-3.5">
        <TriangleAlert className="mt-px size-4 shrink-0 text-warning" />
        <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-fg">
          {children}
        </p>
      </div>
    </Card>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger" | "warning";
}) {
  return (
    <div className="border-r border-subtle px-5 py-3.5 last:border-r-0">
      <p className="text-[11px] uppercase tracking-wide text-fg-muted">
        {label}
      </p>
      <p
        className={cn(
          "tnum mt-0.5 text-[15px] font-semibold",
          tone === "danger"
            ? "text-danger"
            : tone === "warning"
              ? "text-warning"
              : "text-fg",
        )}
      >
        {value}
      </p>
    </div>
  );
}
