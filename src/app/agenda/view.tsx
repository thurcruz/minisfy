"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, MapPin, Plus, Users } from "lucide-react";
import { TODAY } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import { num, time, weekday } from "@/lib/format";
import { Button } from "@/ui/button";
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
} from "@/ui/primitives";
import { EventFormModal } from "@/modules/events/event-form";
import { KIND_LABEL, KIND_TONE } from "@/modules/events/labels";
import { cn } from "@/lib/utils";

export function View() {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const { getRoom, getUnit, pastEvents, registrationCount, upcomingEvents } = useQueries();
  const upcoming = upcomingEvents(undefined, 20);
  const past = pastEvents().slice(0, 5);

  /* Agrupa por dia */
  const byDay = new Map<string, typeof upcoming>();
  for (const event of upcoming) {
    const key = new Date(event.startsAt).toISOString().slice(0, 10);
    const list = byDay.get(key) ?? [];
    list.push(event);
    byDay.set(key, list);
  }

  const withRegistrations = upcoming.filter((e) => registrationCount(e.id) > 0);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Agenda"
        description={`${num(upcoming.length)} eventos agendados`}
        actions={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus />
            Novo evento
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {byDay.size === 0 ? (
            <Card>
              <EmptyState
                icon={CalendarDays}
                title="Agenda vazia"
                description="Cadastre cultos, ensaios e eventos para montar a programação da igreja."
                action={
                  <Button size="sm" onClick={() => setFormOpen(true)}>
                    <Plus />
                    Criar primeiro evento
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="space-y-5">
              {[...byDay.entries()].map(([day, dayEvents]) => {
                const date = new Date(`${day}T12:00:00`);
                const isToday =
                  date.toDateString() === TODAY.toDateString();
                return (
                  <section key={day}>
                    <header className="mb-2 flex items-baseline gap-2 px-1">
                      <h2
                        className={cn(
                          "text-[13px] font-semibold",
                          isToday ? "text-interactive" : "text-fg",
                        )}
                      >
                        {isToday ? "Hoje" : weekday(date.getDay())}
                      </h2>
                      <span className="tnum text-[12px] text-fg-muted">
                        {new Intl.DateTimeFormat("pt-BR", {
                          day: "2-digit",
                          month: "long",
                        }).format(date)}
                      </span>
                    </header>

                    <Card>
                      <ul className="divide-y divide-subtle">
                        {dayEvents.map((event) => {
                          const room = event.roomId
                            ? getRoom(event.roomId)
                            : null;
                          const unit = getUnit(event.unitId);
                          return (
                            <li
                              key={event.id}
                              className="flex gap-4 px-5 py-3.5"
                            >
                              <div className="w-14 shrink-0 text-right">
                                <p className="tnum text-[13px] font-semibold text-fg">
                                  {time(event.startsAt)}
                                </p>
                                <p className="tnum text-[11px] text-fg-muted">
                                  {time(event.endsAt)}
                                </p>
                              </div>

                              <div
                                className="w-0.5 shrink-0 rounded-full"
                                style={{ background: "var(--chart-1)" }}
                                aria-hidden="true"
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link
                                    href={`/eventos/${event.id}`}
                                    className="group/title flex items-center gap-1 text-[13px] font-medium text-fg hover:underline"
                                  >
                                    {event.title}
                                    <ChevronRight className="size-3 text-fg-muted opacity-0 transition-opacity group-hover/title:opacity-100" />
                                  </Link>
                                  <Badge tone={KIND_TONE[event.kind]}>
                                    {KIND_LABEL[event.kind]}
                                  </Badge>
                                </div>
                                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-fg-muted">
                                  {room && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="size-3" />
                                      {room.name}
                                    </span>
                                  )}
                                  <span>{unit?.name}</span>
                                  {event.expectedAttendance && (
                                    <span className="flex items-center gap-1">
                                      <Users className="size-3" />
                                      {num(event.expectedAttendance)} esperados
                                    </span>
                                  )}
                                </p>

                                {event.capacity && registrationCount(event.id) > 0 && (
                                  <div className="mt-2 max-w-xs">
                                    <div className="mb-1 flex items-baseline justify-between text-[11px]">
                                      <span className="text-fg-muted">
                                        Inscrições
                                      </span>
                                      <span className="tnum text-fg-secondary">
                                        {num(registrationCount(event.id))} /{" "}
                                        {num(event.capacity)}
                                      </span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
                                      <div
                                        className="h-full rounded-full bg-interactive"
                                        style={{
                                          width: `${Math.min(
                                            (registrationCount(event.id) /
                                              event.capacity) *
                                              100,
                                            100,
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </Card>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inscrições abertas</CardTitle>
            </CardHeader>
            {withRegistrations.length ? (
              <ul className="divide-y divide-subtle">
                {withRegistrations.map((event) => (
                  <li key={event.id} className="px-5 py-3">
                    <p className="text-[13px] font-medium text-fg">
                      {event.title}
                    </p>
                    <p className="tnum mt-1 text-[12px] text-fg-muted">
                      {num(registrationCount(event.id))} de {num(event.capacity ?? 0)}{" "}
                      vagas
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Nenhuma inscrição aberta"
                description="Eventos com capacidade definida aceitam inscrição pelo portal."
              />
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frequência registrada</CardTitle>
            </CardHeader>
            {past.length ? (
              <ul className="divide-y divide-subtle">
                {past.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-fg">
                        {event.title}
                      </span>
                      <span className="block text-[12px] text-fg-muted">
                        {new Intl.DateTimeFormat("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        }).format(new Date(event.startsAt))}
                      </span>
                    </span>
                    <span className="tnum shrink-0 text-[13px] font-medium text-fg">
                      {event.actualAttendance !== null
                        ? num(event.actualAttendance)
                        : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nenhum evento passado" />
            )}
          </Card>
        </div>
      </div>

      {formOpen && (
        <EventFormModal
          onOpenChange={setFormOpen}
          onSaved={(event) => router.push(`/eventos/${event.id}`)}
        />
      )}
    </div>
  );
}
