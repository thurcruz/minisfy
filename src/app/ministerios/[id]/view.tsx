"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarOff,
  Check,
  ChevronLeft,
  CircleAlert,
  Clock,
  TriangleAlert,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { TODAY } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import { useStore } from "@/store/data-store";
import { dateShort, dateTime, num, shortName } from "@/lib/format";
import { Button } from "@/ui/button";
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
} from "@/ui/primitives";
import { cn } from "@/lib/utils";

export function View({ id }: { id: string }) {
  const { ministryProfile } = useQueries();
  const { respondAssignment } = useStore();
  const m = ministryProfile(id);
  if (!m) notFound();

  /**
   * Funções com um único voluntário habilitado. É o risco que o líder
   * não vê numa lista de nomes: se essa pessoa viajar, a função fica
   * descoberta e não há a quem convidar.
   */
  const singlePoints = m.coverage.filter(
    (c) => c.qualified.length <= 1 && c.demand > 0,
  );

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-5">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ministerios">
            <ChevronLeft />
            Ministérios
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start gap-5 p-6">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-fg">
              {m.ministry.name}
            </h1>
            <p className="mt-1 text-[13px] text-fg-muted">
              {m.unit?.name} · {num(m.positions.length)}{" "}
              {m.positions.length === 1 ? "função" : "funções"}
            </p>
          </div>

          {m.leader && (
            <Link
              href={`/membros/${m.leader.id}`}
              className="flex items-center gap-2.5 rounded-lg bg-canvas px-3.5 py-2.5 transition-colors hover:bg-hover"
            >
              <Avatar name={m.leader.name} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-fg">
                  {shortName(m.leader.name)}
                </span>
                <span className="block text-[11px] text-fg-muted">Líder</span>
              </span>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 border-t border-subtle sm:grid-cols-4">
          <Metric label="Na equipe" value={num(m.team.length)} />
          <Metric
            label="Vagas sem convite"
            value={num(m.openNext)}
            tone={m.openNext > 0 ? "danger" : undefined}
          />
          <Metric
            label="Aguardando resposta"
            value={num(m.pendingNext)}
            tone={m.pendingNext > 0 ? "warning" : undefined}
          />
          <Metric label="Já servido" value={num(m.servedCount)} />
        </div>
      </Card>

      {singlePoints.length > 0 && (
        <Card className="mt-4 border-warning/30 bg-warning-bg dark:bg-warning/10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
            <TriangleAlert className="size-4 shrink-0 text-warning" />
            <p className="min-w-0 flex-1 text-[13px] text-fg">
              <strong className="font-semibold">
                {singlePoints.length === 1
                  ? "Uma função depende de uma só pessoa"
                  : `${num(singlePoints.length)} funções dependem de uma só pessoa`}
              </strong>{" "}
              <span className="text-fg-secondary">
                ({singlePoints.map((c) => c.position.name).join(", ")}) — se
                faltar, a escala fica descoberta sem quem chamar.
              </span>
            </p>
          </div>
        </Card>
      )}

      {m.withoutProfile.length > 0 && (
        <Card className="mt-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
            <CircleAlert className="size-4 shrink-0 text-fg-muted" />
            <p className="min-w-0 flex-1 text-[13px] text-fg-secondary">
              <strong className="font-medium text-fg">
                {num(m.withoutProfile.length)}{" "}
                {m.withoutProfile.length === 1 ? "pessoa" : "pessoas"}
              </strong>{" "}
              estão marcadas neste ministério no cadastro, mas sem função
              definida — por isso não entram em nenhuma escala:{" "}
              {m.withoutProfile.map((p) => shortName(p.name)).join(", ")}.
            </p>
          </div>
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Próximas escalas */}
          <Card>
            <CardHeader>
              <CardTitle>Próximas escalas</CardTitle>
              <span className="text-[12px] text-fg-muted">
                {num(m.upcomingSlots.length)}{" "}
                {m.upcomingSlots.length === 1 ? "vaga" : "vagas"}
              </span>
            </CardHeader>
            {m.upcomingSlots.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Nenhuma escala futura"
                description="Este ministério não foi escalado em nenhum evento à frente."
              />
            ) : (
              <ul className="divide-y divide-subtle">
                {m.upcomingSlots.map((slot) => (
                  <li key={slot.slotId} className="px-5 py-3.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <Link
                        href={`/eventos/${slot.event.id}`}
                        className="text-[13px] font-medium text-fg hover:underline"
                      >
                        {slot.event.title}
                      </Link>
                      <span className="text-[12px] text-fg-muted">
                        {dateTime(slot.event.startsAt)}
                      </span>
                      <span className="ml-auto flex items-center gap-1.5">
                        <Badge tone="outline">{slot.position.name}</Badge>
                        {slot.open > 0 ? (
                          <Badge tone="danger">
                            {num(slot.open)} sem convite
                          </Badge>
                        ) : slot.missing > 0 ? (
                          <Badge tone="warning">
                            {num(slot.missing)} a confirmar
                          </Badge>
                        ) : (
                          <Badge tone="success">
                            <Check className="size-3" />
                            Completa
                          </Badge>
                        )}
                      </span>
                    </div>

                    {slot.assignments.length > 0 && (
                      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
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
                            {a.status === "invited" ? (
                              <span className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  title={`Confirmar ${a.person.name}`}
                                  aria-label={`Confirmar ${a.person.name}`}
                                  onClick={() =>
                                    respondAssignment(a.id, "confirmed")
                                  }
                                  className="rounded-full p-0.5 text-fg-muted transition-colors hover:bg-success-bg hover:text-success dark:hover:bg-success/15"
                                >
                                  <Check className="size-3" />
                                </button>
                                <button
                                  type="button"
                                  title={`Registrar recusa de ${a.person.name}`}
                                  aria-label={`Registrar recusa de ${a.person.name}`}
                                  onClick={() =>
                                    respondAssignment(a.id, "declined")
                                  }
                                  className="rounded-full p-0.5 text-fg-muted transition-colors hover:bg-danger-bg hover:text-danger dark:hover:bg-danger/15"
                                >
                                  <X className="size-3" />
                                </button>
                              </span>
                            ) : a.status === "confirmed" ? (
                              <Check className="size-3 text-success" />
                            ) : (
                              <X className="size-3 text-danger" />
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Equipe */}
          <Card>
            <CardHeader>
              <CardTitle>Equipe</CardTitle>
              <span className="text-[12px] text-fg-muted">
                Carga do mês de{" "}
                {new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
                  TODAY,
                )}
              </span>
            </CardHeader>
            {m.team.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nenhum voluntário com função definida"
                description="Sem função definida, a pessoa não aparece nas sugestões de escala."
              />
            ) : (
              <ul className="divide-y divide-subtle">
                {m.team.map((t) => (
                  <li key={t.profile.id} className="flex gap-3 px-5 py-3">
                    <Avatar name={t.person.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1.5">
                        <Link
                          href={`/membros/${t.person.id}`}
                          className="truncate text-[13px] text-fg hover:underline"
                        >
                          {t.person.name}
                        </Link>
                        {t.isLeader && <Badge tone="brand">Líder</Badge>}
                        {t.overloaded && (
                          <Badge tone="warning">Acima do teto</Badge>
                        )}
                        {t.activeBlackout && (
                          <Badge tone="neutral">
                            <CalendarOff className="size-3" />
                            Indisponível
                          </Badge>
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-fg-muted">
                        {t.positions.length
                          ? t.positions.map((p) => p.name).join(", ")
                          : "Sem função definida"}
                      </p>
                      {t.activeBlackout && (
                        <p className="tnum mt-0.5 text-[11px] text-fg-muted">
                          {t.activeBlackout.reason} ·{" "}
                          {dateShort(t.activeBlackout.startsAt)} →{" "}
                          {dateShort(t.activeBlackout.endsAt)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "tnum text-[13px] font-semibold",
                          t.overloaded ? "text-warning" : "text-fg",
                        )}
                      >
                        {num(t.assignedThisMonth)}/{num(t.maxPerMonth)}
                      </p>
                      <p className="text-[11px] text-fg-muted">no mês</p>
                      {t.pending > 0 && (
                        <p className="tnum text-[11px] text-warning">
                          {num(t.pending)} sem resposta
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {/* Cobertura por função */}
          <Card>
            <CardHeader>
              <CardTitle>Cobertura por função</CardTitle>
            </CardHeader>
            {m.coverage.length === 0 ? (
              <EmptyState
                title="Nenhuma função cadastrada"
                description="Funções definem o que cada pessoa faz na escala."
              />
            ) : (
              <ul className="divide-y divide-subtle">
                {m.coverage.map((c) => {
                  const fragile = c.qualified.length <= 1;
                  return (
                    <li key={c.position.id} className="px-5 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[13px] text-fg">
                          {c.position.name}
                        </span>
                        <span
                          className={cn(
                            "tnum shrink-0 text-[13px] font-semibold",
                            fragile ? "text-warning" : "text-fg",
                          )}
                        >
                          {num(c.qualified.length)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-fg-muted">
                        {c.available < c.qualified.length
                          ? `${num(c.available)} disponíveis agora · `
                          : ""}
                        {c.demand > 0
                          ? `${num(c.demand)} ${c.demand === 1 ? "vaga" : "vagas"} à frente`
                          : "nenhuma escala à frente"}
                        {c.open > 0 && `, ${num(c.open)} sem convite`}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
            <CardBody className="border-t border-subtle pt-3 text-[11px] leading-relaxed text-fg-muted">
              Quantas pessoas sabem fazer cada função. Duas é o mínimo para
              alguém poder faltar.
            </CardBody>
          </Card>

          {/* Histórico */}
          <Card>
            <CardHeader>
              <CardTitle>Já realizadas</CardTitle>
            </CardHeader>
            {m.pastSlots.length === 0 ? (
              <EmptyState title="Sem histórico de escalas" />
            ) : (
              <ul className="divide-y divide-subtle">
                {m.pastSlots.slice(0, 8).map((slot) => (
                  <li key={slot.slotId} className="px-5 py-2.5">
                    <p className="truncate text-[13px] text-fg-secondary">
                      {slot.event.title}
                    </p>
                    <p className="tnum text-[11px] text-fg-muted">
                      {dateShort(slot.event.startsAt)} · {slot.position.name} ·{" "}
                      {num(slot.confirmed)}/{num(slot.required)} servindo
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Convidar para a equipe</CardTitle>
            </CardHeader>
            <EmptyState
              icon={UserPlus}
              title="Vínculo de voluntário vem na Fase 4"
              description="Definir função, teto mensal e disponibilidade depende do módulo de voluntários com autenticação — hoje a equipe vem do cadastro."
            />
          </Card>
        </div>
      </div>
    </div>
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
