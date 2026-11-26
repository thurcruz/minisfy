"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  CircleAlert,
  Clock,
  MapPin,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { useQueries } from "@/store/use-queries";
import { EventFormModal } from "@/modules/events/event-form";
import { dateTime, money, num, percent, shortName } from "@/lib/format";
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
import { cn } from "@/lib/utils";


export function View() {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const { eventsWithRegistrations } = useQueries();
  const events = eventsWithRegistrations();
  const withSignups = events.filter((e) => e.confirmed.length > 0);

  const totalConfirmed = withSignups.reduce(
    (s, e) => s + e.confirmed.length,
    0,
  );
  const totalWaitlist = withSignups.reduce((s, e) => s + e.waitlist.length, 0);
  const totalPending = withSignups.reduce((s, e) => s + e.pendingCents, 0);
  const totalPaid = withSignups.reduce((s, e) => s + e.paidCents, 0);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Eventos"
        description={`${num(withSignups.length)} eventos com inscrição aberta`}
        actions={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus />
            Novo evento
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Inscritos confirmados" value={num(totalConfirmed)} />
        <Stat label="Lista de espera" value={num(totalWaitlist)} />
        <Stat label="Recebido" value={money(totalPaid)} />
        <Stat
          label="A receber"
          value={money(totalPending)}
          tone={totalPending > 0 ? "warning" : undefined}
        />
      </div>

      {withSignups.length === 0 ? (
        <Card className="mt-6">
          <EmptyState
            icon={Sparkles}
            title="Nenhum evento com inscrição"
            description="Defina capacidade num evento da agenda para abrir inscrições pelo portal do membro."
            action={
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus />
                Criar evento com inscrição
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="mt-6 space-y-5">
          {withSignups.map((e) => {
            const full = e.occupancy >= 1;
            const nearFull = e.occupancy >= 0.85 && !full;
            return (
              <Card key={e.event.id}>
                <CardHeader className="flex-wrap gap-3">
                  <div className="min-w-0">
                    <CardTitle>
                      <Link
                        href={`/eventos/${e.event.id}`}
                        className="group/title flex items-center gap-1 hover:underline"
                      >
                        {e.event.title}
                        <ChevronRight className="size-3.5 text-fg-muted opacity-0 transition-opacity group-hover/title:opacity-100" />
                      </Link>
                    </CardTitle>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-fg-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {dateTime(e.event.startsAt)}
                      </span>
                      {e.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {e.room.name}
                        </span>
                      )}
                      <span>{e.unit?.name}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {full && (
                      <Badge tone="danger" size="md">
                        <CircleAlert className="size-3" />
                        Lotado
                      </Badge>
                    )}
                    {nearFull && (
                      <Badge tone="warning" size="md">
                        Quase lotado
                      </Badge>
                    )}
                    {e.isPaid && (
                      <Badge tone="outline" size="md">
                        Inscrição paga
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardBody className="grid gap-6 lg:grid-cols-5">
                  <div className="lg:col-span-2">
                    <div className="flex items-baseline gap-2">
                      <p className="tnum font-display text-[30px] font-semibold leading-none text-fg">
                        {num(e.confirmed.length)}
                      </p>
                      <p className="tnum text-[13px] text-fg-muted">
                        de {num(e.event.capacity ?? 0)} vagas
                      </p>
                    </div>

                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sunken">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          full
                            ? "bg-danger"
                            : nearFull
                              ? "bg-warning"
                              : "bg-interactive",
                        )}
                        style={{ width: `${Math.min(e.occupancy * 100, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[12px] text-fg-muted">
                      {percent(e.occupancy)} de ocupação
                      {e.waitlist.length > 0 &&
                        ` · ${num(e.waitlist.length)} na espera`}
                    </p>

                    {e.isPaid && (
                      <dl className="mt-5 space-y-1.5 border-t border-subtle pt-4 text-[12px]">
                        <div className="flex justify-between gap-2">
                          <dt className="text-fg-muted">Recebido</dt>
                          <dd className="tnum font-medium text-success">
                            {money(e.paidCents)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-fg-muted">A receber</dt>
                          <dd
                            className={cn(
                              "tnum font-medium",
                              e.pendingCents > 0 ? "text-warning" : "text-fg",
                            )}
                          >
                            {money(e.pendingCents)}
                          </dd>
                        </div>
                      </dl>
                    )}
                  </div>

                  <div className="lg:col-span-3">
                    <div className="mb-2 flex items-baseline justify-between">
                      <p className="text-[11px] uppercase tracking-wide text-fg-muted">
                        Inscritos
                      </p>
                      <Link
                        href={`/eventos/${e.event.id}`}
                        className="text-[12px] font-medium text-interactive hover:underline"
                      >
                        Ver lista completa
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {e.confirmed.slice(0, 24).map(({ registration, person }) => (
                        <span
                          key={registration.id}
                          title={`${person.name}${
                            registration.amountCents > 0
                              ? registration.paid
                                ? " · pago"
                                : " · pagamento pendente"
                              : ""
                          }`}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5",
                            registration.amountCents > 0 && !registration.paid
                              ? "border-warning/40 bg-warning-bg dark:bg-warning/10"
                              : "border-subtle bg-canvas",
                          )}
                        >
                          <Avatar name={person.name} size="xs" />
                          <span className="text-[12px] text-fg-secondary">
                            {shortName(person.name)}
                          </span>
                        </span>
                      ))}
                      {e.confirmed.length > 24 && (
                        <span className="self-center text-[12px] text-fg-muted">
                          +{num(e.confirmed.length - 24)}
                        </span>
                      )}
                    </div>

                    {e.waitlist.length > 0 && (
                      <div className="mt-4 border-t border-subtle pt-3">
                        <p className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-fg-muted">
                          <Users className="size-3" />
                          Lista de espera
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {e.waitlist.map(({ registration, person }) => (
                            <span
                              key={registration.id}
                              className="flex items-center gap-1.5 rounded-full border border-dashed border-line py-1 pl-1 pr-2.5"
                            >
                              <Avatar name={person.name} size="xs" />
                              <span className="text-[12px] text-fg-muted">
                                {shortName(person.name)}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {formOpen && (
        <EventFormModal
          onOpenChange={setFormOpen}
          onSaved={(event) => router.push(`/eventos/${event.id}`)}
        />
      )}
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
  tone?: "warning";
}) {
  return (
    <Card>
      <CardBody className="py-4">
        <p className="text-[12px] text-fg-muted">{label}</p>
        <p
          className={cn(
            "tnum mt-1.5 font-display text-2xl font-semibold",
            tone === "warning" ? "text-warning" : "text-fg",
          )}
        >
          {value}
        </p>
      </CardBody>
    </Card>
  );
}
