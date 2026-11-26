"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  CakeSlice,
  Check,
  ChevronLeft,
  Church,
  Mail,
  MapPin,
  Phone,
  Plus,
  TriangleAlert,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { TODAY } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import { useStore } from "@/store/data-store";
import { FollowupModal } from "@/modules/visitors/followup-form";
import {
  age,
  dateShort,
  dateTime,
  num,
  phone as fmtPhone,
  relativeDay,
  shortName,
  weekday,
} from "@/lib/format";
import { Button } from "@/ui/button";
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
import type { VisitorSource } from "@/mocks/types";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<VisitorSource, string> = {
  convite_membro: "Convite de membro",
  redes_sociais: "Redes sociais",
  evento: "Evento",
  espontaneo: "Espontâneo",
  site: "Site",
  pequeno_grupo: "Pequeno grupo",
};

export function View({ id }: { id: string }) {
  const { visitorNeighbours, visitorProfile } = useQueries();
  const { hydrated, logVisit, moveVisitor, updatePerson } = useStore();
  const [followupOpen, setFollowupOpen] = useState(false);

  const v = visitorProfile(id);

  if (!v) {
    if (!hydrated) return <RecordLoading />;
    notFound();
  }

  const { previous, next, index, total } = visitorNeighbours(id);
  const overdue = v.overdueDays !== null && v.overdueDays >= 0;
  const isMember = v.person.status === "member" || v.person.status === "regular";

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/visitantes">
            <ChevronLeft />
            Visitantes
          </Link>
        </Button>
        {index >= 0 && (
          <div className="flex items-center gap-1.5">
            <span className="tnum text-[12px] text-fg-muted">
              {num(index + 1)} de {num(total)}
            </span>
            <Button
              variant="secondary"
              size="icon-sm"
              asChild={!!previous}
              disabled={!previous}
            >
              {previous ? (
                <Link
                  href={`/visitantes/${previous.id}`}
                  aria-label={`Anterior: ${previous.name}`}
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
                  href={`/visitantes/${next.id}`}
                  aria-label={`Próximo: ${next.name}`}
                >
                  <ArrowRight />
                </Link>
              ) : (
                <ArrowRight />
              )}
            </Button>
          </div>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start gap-5 p-6">
          <Avatar name={v.person.name} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-fg">
                {v.person.name}
              </h1>
              {v.stage && (
                <Badge
                  tone={
                    v.stage.kind === "won"
                      ? "success"
                      : v.stage.kind === "lost"
                        ? "neutral"
                        : "warning"
                  }
                  size="md"
                >
                  {v.stage.name}
                </Badge>
              )}
              {isMember && (
                <Badge tone="brand" size="md">
                  Já integrado ao cadastro
                </Badge>
              )}
            </div>

            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-fg-secondary">
              <div className="flex items-center gap-1.5">
                <CakeSlice className="size-3.5 shrink-0 text-fg-muted" />
                <dt className="sr-only">Idade</dt>
                <dd className="tnum">{age(v.person.birthDate, TODAY)} anos</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="size-3.5 shrink-0 text-fg-muted" />
                <dt className="sr-only">Telefone</dt>
                <dd className="tnum">{fmtPhone(v.person.phone)}</dd>
              </div>
              {v.person.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="size-3.5 shrink-0 text-fg-muted" />
                  <dt className="sr-only">E-mail</dt>
                  <dd className="truncate">{v.person.email}</dd>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-fg-muted" />
                <dt className="sr-only">Bairro</dt>
                <dd>
                  {v.person.neighborhood} · {v.unit?.name}
                </dd>
              </div>
            </dl>
          </div>

          <Button variant="secondary" size="sm" asChild>
            <Link href={`/membros/${v.person.id}`}>Ver cadastro completo</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 border-t border-subtle sm:grid-cols-4">
          <Metric label="1ª visita" value={dateShort(v.journey.firstVisitAt)} />
          <Metric
            label="Acompanhando há"
            value={`${num(v.daysSinceFirstVisit)} dias`}
          />
          <Metric label="Visitas" value={num(v.journey.visitCount)} />
          <Metric
            label="Ritmo"
            value={
              v.visitsPerWeek !== null
                ? `${v.visitsPerWeek.toFixed(1)}/semana`
                : "pouco tempo"
            }
          />
        </div>
      </Card>

      {overdue && v.journey.nextActionLabel && (
        <Card className="mt-4 border-warning/30 bg-warning-bg dark:bg-warning/10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
            <TriangleAlert className="size-4 shrink-0 text-warning" />
            <p className="min-w-0 flex-1 text-[13px] text-fg">
              <strong className="font-semibold">
                {v.journey.nextActionLabel}
              </strong>{" "}
              <span className="text-fg-secondary">
                — {relativeDay(v.journey.nextActionAt!, TODAY)}
                {v.overdueDays! > 0 &&
                  `, ${num(v.overdueDays!)} ${v.overdueDays === 1 ? "dia" : "dias"} de atraso`}
              </span>
            </p>
            <Button size="sm" onClick={() => setFollowupOpen(true)}>
              Reagendar
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Etapa do funil */}
          <Card>
            <CardHeader>
              <CardTitle>Etapa do acompanhamento</CardTitle>
              <span className="text-[12px] text-fg-muted">
                Clique para mover
              </span>
            </CardHeader>
            <CardBody>
              <ol className="flex flex-wrap gap-2">
                {v.stages.map((stage) => {
                  const current = stage.id === v.journey.stageId;
                  return (
                    <li key={stage.id}>
                      <button
                        type="button"
                        onClick={() => moveVisitor(v.journey.id, stage.id)}
                        aria-current={current ? "step" : undefined}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-medium transition-colors",
                          current
                            ? "border-interactive bg-interactive text-interactive-fg"
                            : "border-line text-fg-secondary hover:bg-hover",
                        )}
                      >
                        {current && <Check className="size-3" />}
                        {stage.name}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-3 text-[11px] leading-relaxed text-fg-muted">
                Mover para uma etapa final encerra a tarefa de contato — deixar
                pendência aberta em quem já integrou suja a lista de vencidos.
              </p>
            </CardBody>
          </Card>

          {/* Próximo contato */}
          <Card>
            <CardHeader>
              <CardTitle>Próximo contato</CardTitle>
            </CardHeader>
            {v.journey.nextActionLabel ? (
              <CardBody className="space-y-3">
                <div
                  className={cn(
                    "rounded-lg px-3.5 py-3",
                    overdue
                      ? "bg-warning-bg dark:bg-warning/10"
                      : "bg-canvas",
                  )}
                >
                  <p className="flex items-center gap-2 text-[13px] font-medium text-fg">
                    <BellRing className="size-3.5 shrink-0 text-fg-muted" />
                    {v.journey.nextActionLabel}
                  </p>
                  {v.journey.nextActionAt && (
                    <p className="tnum mt-1 pl-[22px] text-[12px] text-fg-muted">
                      {dateShort(v.journey.nextActionAt)} ·{" "}
                      {relativeDay(v.journey.nextActionAt, TODAY)}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setFollowupOpen(true)}
                  >
                    Alterar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logVisit(v.journey.id)}
                  >
                    <Plus />
                    Registrar nova visita
                  </Button>
                </div>
              </CardBody>
            ) : (
              <EmptyState
                icon={BellRing}
                title="Nenhum contato agendado"
                description={
                  v.stage?.kind === "won"
                    ? "Visitante integrado: o funil terminou e não há tarefa pendente."
                    : "Sem próxima ação, o acompanhamento depende de alguém lembrar."
                }
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button size="sm" onClick={() => setFollowupOpen(true)}>
                      Agendar contato
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => logVisit(v.journey.id)}
                    >
                      <Plus />
                      Registrar visita
                    </Button>
                  </div>
                }
              />
            )}
          </Card>

          {/* Caminho de integração */}
          <Card>
            <CardHeader>
              <CardTitle>Pequenos grupos no bairro</CardTitle>
              <span className="text-[12px] text-fg-muted">
                {v.person.neighborhood}
              </span>
            </CardHeader>
            {v.person.groupId ? (
              <CardBody className="text-[13px] text-fg-secondary">
                Já participa de um grupo.{" "}
                <Link
                  href={`/grupos/${v.person.groupId}`}
                  className="font-medium text-interactive hover:underline"
                >
                  Abrir o grupo
                </Link>
              </CardBody>
            ) : v.nearbyGroups.length === 0 ? (
              <EmptyState
                icon={UsersRound}
                title="Nenhum grupo neste bairro"
                description="O convite mais provável de pegar é o grupo mais perto de casa — este bairro ainda não tem um."
              />
            ) : (
              <ul className="divide-y divide-subtle">
                {v.nearbyGroups.map((g) => {
                  const room = g.group.capacity - g.memberCount;
                  return (
                    <li
                      key={g.group.id}
                      className="flex flex-wrap items-center gap-3 px-5 py-3"
                    >
                      <span className="min-w-0 flex-1">
                        <Link
                          href={`/grupos/${g.group.id}`}
                          className="block truncate text-[13px] font-medium text-fg hover:underline"
                        >
                          {g.group.name}
                        </Link>
                        <span className="block truncate text-[12px] text-fg-muted">
                          {weekday(g.group.weekday)} às {g.group.startTime} ·{" "}
                          {shortName(g.leader.name)} ·{" "}
                          <span className="tnum">
                            {num(g.memberCount)}/{num(g.group.capacity)}
                          </span>
                        </span>
                      </span>
                      {room > 0 ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            updatePerson(v.person.id, { groupId: g.group.id })
                          }
                        >
                          Vincular
                        </Button>
                      ) : (
                        <Badge tone="warning">Sem vaga</Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {/* Origem e responsável */}
          <Card>
            <CardHeader>
              <CardTitle>Como chegou</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2.5 text-[13px]">
              <Row
                label="Origem"
                value={SOURCE_LABEL[v.journey.source]}
              />
              <Row
                label="Primeira visita"
                value={dateShort(v.journey.firstVisitAt)}
              />
              <Row
                label="Cadastro criado"
                value={dateShort(v.person.createdAt)}
              />
              {v.owner && (
                <div className="mt-3 flex items-center gap-2.5 border-t border-subtle pt-3">
                  <Avatar name={v.owner.name} size="sm" />
                  <span className="min-w-0">
                    <Link
                      href={`/membros/${v.owner.id}`}
                      className="block truncate text-[13px] text-fg hover:underline"
                    >
                      {shortName(v.owner.name)}
                    </Link>
                    <span className="block text-[11px] text-fg-muted">
                      Responsável pelo acompanhamento
                    </span>
                  </span>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Integrar ao cadastro */}
          {!isMember && (
            <Card>
              <CardHeader>
                <CardTitle>Integrar</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-[13px] leading-relaxed text-fg-secondary">
                  Passar a congregado muda a situação no cadastro e tira a
                  pessoa das contagens de visitante. O vínculo de membro, com
                  data e ata, é decisão da liderança.
                </p>
                <Button
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() =>
                    updatePerson(v.person.id, {
                      status: "regular",
                      memberSince: TODAY.toISOString().slice(0, 10),
                    })
                  }
                >
                  <UserCheck />
                  Registrar como congregado
                </Button>
              </CardBody>
            </Card>
          )}

          {/* Inscrições */}
          {v.registrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Inscrições</CardTitle>
              </CardHeader>
              <ul className="divide-y divide-subtle">
                {v.registrations.map(({ registration, event }) => (
                  <li key={registration.id} className="px-5 py-2.5">
                    <Link
                      href={`/eventos/${event.id}`}
                      className="block truncate text-[13px] text-fg hover:underline"
                    >
                      {event.title}
                    </Link>
                    <p className="tnum text-[11px] text-fg-muted">
                      {dateTime(event.startsAt)}
                      {registration.status === "waitlist" &&
                        " · lista de espera"}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Eventos para convidar */}
          {v.openEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Para convidar</CardTitle>
              </CardHeader>
              <ul className="divide-y divide-subtle">
                {v.openEvents.map((event) => (
                  <li key={event.id} className="px-5 py-2.5">
                    <Link
                      href={`/eventos/${event.id}`}
                      className="block truncate text-[13px] text-fg hover:underline"
                    >
                      {event.title}
                    </Link>
                    <p className="tnum text-[11px] text-fg-muted">
                      {dateTime(event.startsAt)}
                    </p>
                  </li>
                ))}
              </ul>
              <CardBody className="border-t border-subtle pt-3 text-[11px] leading-relaxed text-fg-muted">
                Eventos com inscrição aberta na unidade. Inscrever alguém pelo
                sistema entra com o módulo de inscrições.
              </CardBody>
            </Card>
          )}

          {/* Quem mora perto */}
          {v.neighbours.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quem mora perto</CardTitle>
                <span className="tnum text-[12px] text-fg-muted">
                  {num(v.neighbours.length)}
                </span>
              </CardHeader>
              <ul className="divide-y divide-subtle">
                {v.neighbours.slice(0, 6).map((person) => (
                  <li key={person.id}>
                    <Link
                      href={`/membros/${person.id}`}
                      className="flex items-center gap-2.5 px-5 py-2.5 transition-colors hover:bg-hover"
                    >
                      <Avatar name={person.name} size="xs" />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-fg">
                        {shortName(person.name)}
                      </span>
                      {person.ministryIds.length > 0 && (
                        <Church className="size-3 shrink-0 text-fg-muted" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              <CardBody className="border-t border-subtle pt-3 text-[11px] leading-relaxed text-fg-muted">
                Membros do mesmo bairro — quem pode buscar, trazer e
                apresentar.
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {followupOpen && (
        <FollowupModal
          journey={v.journey}
          personName={v.person.name}
          onOpenChange={setFollowupOpen}
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-subtle px-5 py-3.5 last:border-r-0">
      <p className="text-[11px] uppercase tracking-wide text-fg-muted">
        {label}
      </p>
      <p className="tnum mt-0.5 text-[15px] font-semibold text-fg">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-fg-muted">{label}</span>
      <span className="text-fg">{value}</span>
    </div>
  );
}
