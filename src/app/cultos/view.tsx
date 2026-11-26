"use client";

import {
  BookOpen,
  Check,
  Church,
  CircleAlert,
  Clock,
  Mic,
  Plus,
} from "lucide-react";
import { useQueries } from "@/store/use-queries";
import { dateTime, num, shortName, time } from "@/lib/format";
import { PlannedButton } from "@/ui/planned";
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
import type { ServiceItemKind } from "@/mocks/types";
import { cn } from "@/lib/utils";


const KIND_LABEL: Record<ServiceItemKind, string> = {
  welcome: "Acolhida",
  worship: "Louvor",
  word: "Palavra",
  notice: "Avisos",
  offering: "Oferta",
  prayer: "Oração",
  ordinance: "Ordenança",
};

/** Barra lateral do item: só o louvor e a palavra usam a cor de marca. */
const KIND_BAR: Record<ServiceItemKind, string> = {
  welcome: "bg-ink-300",
  worship: "bg-interactive",
  word: "bg-brand-700 dark:bg-brand-300",
  notice: "bg-ink-300",
  offering: "bg-ink-300",
  prayer: "bg-brand-400",
  ordinance: "bg-accent-500",
};

function duration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

export function View() {
  const { servicesWithProgram } = useQueries();
  const services = servicesWithProgram();

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Cultos"
        description={`${num(services.length)} cultos planejados`}
        actions={
          <PlannedButton size="sm"
            reason="Editor de ordem do culto ainda não construído"
          >
            <Plus />
            Planejar culto
          </PlannedButton>
        }
      />

      {services.length === 0 ? (
        <Card>
          <EmptyState
            icon={Church}
            title="Nenhum culto planejado"
            description="Monte a ordem do culto, defina preletor e dirigente e conecte com as escalas."
            action={
              <PlannedButton size="sm"
                reason="Editor de ordem do culto ainda não construído"
              >
                <Plus />
                Planejar primeiro culto
              </PlannedButton>
            }
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {services.map((s) => {
            const confirmedTeam = s.team.reduce(
              (acc, slot) => acc + Math.min(slot.confirmed, slot.required),
              0,
            );
            const requiredTeam = s.team.reduce(
              (acc, slot) => acc + slot.required,
              0,
            );

            return (
              <Card key={s.service.id}>
                <CardHeader className="flex-wrap gap-3">
                  <div className="min-w-0">
                    <CardTitle>{s.event.title}</CardTitle>
                    <p className="mt-0.5 text-[12px] text-fg-muted">
                      {dateTime(s.event.startsAt)} · {s.service.serviceType}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={s.overrunMinutes > 0 ? "warning" : "neutral"}
                      size="md"
                    >
                      <Clock className="size-3" />
                      {duration(s.plannedMinutes)} de{" "}
                      {duration(s.scheduledMinutes)}
                    </Badge>
                    {requiredTeam > 0 && (
                      <Badge
                        tone={
                          confirmedTeam >= requiredTeam ? "success" : "warning"
                        }
                        size="md"
                      >
                        {confirmedTeam >= requiredTeam ? (
                          <Check className="size-3" />
                        ) : (
                          <CircleAlert className="size-3" />
                        )}
                        <span className="tnum">
                          {num(confirmedTeam)}/{num(requiredTeam)}
                        </span>{" "}
                        na equipe
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                {s.overrunMinutes > 0 && (
                  <p className="flex items-center gap-2 border-b border-subtle bg-warning-bg px-5 py-2.5 text-[12px] text-warning dark:bg-warning/10">
                    <CircleAlert className="size-3.5 shrink-0" />
                    A programação passa{" "}
                    <strong className="font-semibold">
                      {duration(s.overrunMinutes)}
                    </strong>{" "}
                    do tempo reservado para o culto.
                  </p>
                )}

                <CardBody className="grid gap-6 lg:grid-cols-5">
                  {/* Tema e responsáveis */}
                  <div className="lg:col-span-2">
                    {s.service.theme && (
                      <div className="mb-4">
                        <p className="text-[11px] uppercase tracking-wide text-fg-muted">
                          Tema
                        </p>
                        <p className="mt-0.5 font-display text-[17px] font-semibold leading-snug text-fg">
                          {s.service.theme}
                        </p>
                        {s.service.scripture && (
                          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-fg-secondary">
                            <BookOpen className="size-3 shrink-0" />
                            {s.service.scripture}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      {s.preacher && (
                        <Role
                          label="Preletor"
                          name={s.preacher.name}
                          icon={Mic}
                        />
                      )}
                      {s.host && <Role label="Dirigente" name={s.host.name} />}
                    </div>

                    {s.service.notes && (
                      <p className="mt-4 rounded-md bg-canvas px-3 py-2 text-[12px] leading-relaxed text-fg-secondary">
                        {s.service.notes}
                      </p>
                    )}

                    {s.team.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-1.5 text-[11px] uppercase tracking-wide text-fg-muted">
                          Equipe escalada
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {s.team.map((slot) => (
                            <Badge
                              key={slot.slotId}
                              tone={slot.open > 0 ? "danger" : "neutral"}
                            >
                              {slot.position.name}{" "}
                              <span className="tnum opacity-70">
                                {num(slot.confirmed)}/{num(slot.required)}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ordem do culto */}
                  <div className="lg:col-span-3">
                    <p className="mb-2 text-[11px] uppercase tracking-wide text-fg-muted">
                      Ordem do culto
                    </p>
                    <ol className="space-y-1">
                      {s.items.map(({ item, responsible }, index) => {
                        const offset = s.items
                          .slice(0, index)
                          .reduce((acc, i) => acc + i.item.durationMinutes, 0);
                        const startsAt = new Date(
                          new Date(s.event.startsAt).getTime() +
                            offset * 60_000,
                        );
                        return (
                          <li
                            key={item.id}
                            className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-hover"
                          >
                            <span className="tnum w-11 shrink-0 text-[12px] text-fg-muted">
                              {time(startsAt)}
                            </span>
                            <span
                              className={cn(
                                "h-7 w-0.5 shrink-0 rounded-full",
                                KIND_BAR[item.kind],
                              )}
                              aria-hidden="true"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] text-fg">
                                {item.title}
                              </span>
                              <span className="block text-[11px] text-fg-muted">
                                {KIND_LABEL[item.kind]}
                                {responsible &&
                                  ` · ${shortName(responsible.name)}`}
                              </span>
                            </span>
                            <span className="tnum shrink-0 text-[12px] text-fg-muted">
                              {item.durationMinutes}′
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Role({
  label,
  name,
  icon: Icon,
}: {
  label: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-canvas px-3 py-2">
      <Avatar name={name} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-fg">
          {shortName(name)}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-fg-muted">
          {Icon && <Icon className="size-3" />}
          {label}
        </span>
      </span>
    </div>
  );
}
