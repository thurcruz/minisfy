"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CakeSlice,
  CalendarOff,
  Check,
  ChevronLeft,
  Church,
  Clock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  UsersRound,
  X,
} from "lucide-react";
import { TODAY } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import { useStore } from "@/store/data-store";
import { PersonFormModal } from "@/modules/people/person-form";
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
import { PlannedButton } from "@/ui/planned";
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
import type { FamilyRole, MembershipStatus } from "@/mocks/types";
import { cn } from "@/lib/utils";



const STATUS_LABEL: Record<MembershipStatus, string> = {
  member: "Membro",
  regular: "Congregado",
  visitor: "Visitante",
  inactive: "Inativo",
  transferred: "Transferido",
};

const STATUS_TONE: Record<
  MembershipStatus,
  "brand" | "success" | "warning" | "neutral" | "outline"
> = {
  member: "brand",
  regular: "success",
  visitor: "warning",
  inactive: "neutral",
  transferred: "outline",
};

const ROLE_LABEL: Record<FamilyRole, string> = {
  head: "Responsável",
  spouse: "Cônjuge",
  child: "Filho(a)",
  relative: "Parente",
};

export function View({ id }: { id: string }) {
  const { personNeighbours, personProfile } = useQueries();
  const { hydrated } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const p = personProfile(id);

  if (!p) {
    if (!hydrated) return <RecordLoading />;
    notFound();
  }

  const { previous, next, index, total } = personNeighbours(id);
  const years = age(p.person.birthDate, TODAY);
  const isChild = years < 13;

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* Navegação de volta e entre registros */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/membros">
            <ChevronLeft />
            Membros
          </Link>
        </Button>
        <div className="flex items-center gap-1.5">
          <span className="tnum text-[12px] text-fg-muted">
            {num(index + 1)} de {num(total)}
          </span>
          <Button variant="secondary" size="icon-sm" asChild={!!previous} disabled={!previous}>
            {previous ? (
              <Link href={`/membros/${previous.id}`} aria-label={`Anterior: ${previous.name}`}>
                <ArrowLeft />
              </Link>
            ) : (
              <ArrowLeft />
            )}
          </Button>
          <Button variant="secondary" size="icon-sm" asChild={!!next} disabled={!next}>
            {next ? (
              <Link href={`/membros/${next.id}`} aria-label={`Próximo: ${next.name}`}>
                <ArrowRight />
              </Link>
            ) : (
              <ArrowRight />
            )}
          </Button>
        </div>
      </div>

      {/* Cabeçalho do perfil */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start gap-5 p-6">
          <Avatar name={p.person.name} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-fg">
                {p.person.name}
              </h1>
              <Badge tone={STATUS_TONE[p.person.status]} size="md">
                {STATUS_LABEL[p.person.status]}
              </Badge>
              {p.isGuardian && <Badge tone="outline" size="md">Responsável legal</Badge>}
            </div>

            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-fg-secondary">
              <div className="flex items-center gap-1.5">
                <CakeSlice className="size-3.5 shrink-0 text-fg-muted" />
                <dt className="sr-only">Idade</dt>
                <dd className="tnum">
                  {years} anos · {dateShort(p.person.birthDate)}
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="size-3.5 shrink-0 text-fg-muted" />
                <dt className="sr-only">Telefone</dt>
                <dd className="tnum">{fmtPhone(p.person.phone)}</dd>
              </div>
              {p.person.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="size-3.5 shrink-0 text-fg-muted" />
                  <dt className="sr-only">E-mail</dt>
                  <dd className="truncate">{p.person.email}</dd>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-fg-muted" />
                <dt className="sr-only">Bairro e unidade</dt>
                <dd>
                  {p.person.neighborhood} · {p.unit?.name}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil />
              Editar
            </Button>
          </div>
        </div>

        {/* Faixa de números */}
        <div className="grid grid-cols-2 border-t border-subtle sm:grid-cols-4">
          <Metric
            label="Na igreja desde"
            value={dateShort(p.person.memberSince)}
          />
          <Metric
            label="Ministérios"
            value={num(p.ministries.length)}
          />
          <Metric
            label="Já serviu"
            value={num(p.confirmedCount)}
          />
          <Metric
            label="Próximas escalas"
            value={num(p.upcomingAssignments.length)}
          />
        </div>
      </Card>

      {isChild && p.emergencyContacts.length === 0 && (
        <Card className="mt-4 border-warning/30 bg-warning-bg dark:bg-warning/10">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <ShieldAlert className="size-4 shrink-0 text-warning" />
            <p className="min-w-0 flex-1 text-[13px] text-fg">
              Criança sem contato de emergência cadastrado — obrigatório para o
              check-in infantil.
            </p>
            <PlannedButton variant="secondary" size="sm"
              reason="Cadastro de contato de emergência ainda não construído"
            >
              Adicionar contato
            </PlannedButton>
          </div>
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-4 lg:col-span-2">
          {/* Escalas */}
          <Card>
            <CardHeader>
              <CardTitle>Escalas</CardTitle>
              {p.upcomingAssignments.length > 0 && (
                <Badge tone="brand">
                  {num(p.upcomingAssignments.length)} próximas
                </Badge>
              )}
            </CardHeader>
            {p.upcomingAssignments.length === 0 &&
            p.pastAssignments.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Nunca foi escalado"
                description="Vincule a pessoa a um ministério para incluí-la nas escalas."
              />
            ) : (
              <ul className="divide-y divide-subtle">
                {[...p.upcomingAssignments, ...p.pastAssignments]
                  .slice(0, 8)
                  .map(({ slot, status }) => {
                    const past = new Date(slot.event.startsAt) < TODAY;
                    return (
                      <li
                        key={`${slot.slotId}-${slot.event.id}`}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block truncate text-[13px]",
                              past ? "text-fg-muted" : "text-fg",
                            )}
                          >
                            {slot.event.title}
                          </span>
                          <span className="block truncate text-[12px] text-fg-muted">
                            {slot.position.name} · {slot.ministry.name} ·{" "}
                            {dateTime(slot.event.startsAt)}
                          </span>
                        </span>
                        <StatusPill status={status} />
                      </li>
                    );
                  })}
              </ul>
            )}
          </Card>

          {/* Linha do tempo */}
          <Card>
            <CardHeader>
              <CardTitle>Linha do tempo</CardTitle>
              <span className="text-[12px] text-fg-muted">
                Só o que o sistema registrou
              </span>
            </CardHeader>
            <CardBody>
              <ol className="relative space-y-4 border-l border-subtle pl-5">
                {p.timeline.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span
                      className="absolute -left-[23px] top-1 size-2.5 rounded-full border-2 border-surface bg-interactive"
                      aria-hidden="true"
                    />
                    <p className="text-[13px] text-fg">{entry.label}</p>
                    <p className="tnum text-[12px] text-fg-muted">
                      {dateShort(entry.date)}
                      {entry.detail && ` · ${entry.detail}`}
                    </p>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          {/* Inscrições em eventos */}
          {p.registrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Inscrições em eventos</CardTitle>
              </CardHeader>
              <ul className="divide-y divide-subtle">
                {p.registrations.map(({ registration, event }) => (
                  <li
                    key={registration.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-fg">
                        {event.title}
                      </span>
                      <span className="block text-[12px] text-fg-muted">
                        {dateTime(event.startsAt)}
                      </span>
                    </span>
                    {registration.status === "waitlist" ? (
                      <Badge tone="warning">Lista de espera</Badge>
                    ) : registration.amountCents > 0 && !registration.paid ? (
                      <Badge tone="warning">Pagamento pendente</Badge>
                    ) : (
                      <Badge tone="success">
                        <Check className="size-3" />
                        Confirmada
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4">
          {/* Jornada de visitante */}
          {p.journey && p.stage && (
            <Card>
              <CardHeader>
                <CardTitle>Acompanhamento</CardTitle>
                <Badge tone={p.stage.kind === "won" ? "success" : "warning"}>
                  {p.stage.name}
                </Badge>
              </CardHeader>
              <CardBody className="space-y-2 text-[13px]">
                <Row label="Primeira visita" value={dateShort(p.journey.firstVisitAt)} />
                <Row label="Visitas" value={num(p.journey.visitCount)} />
                {p.journey.nextActionLabel && (
                  <div className="mt-3 rounded-md bg-sunken px-3 py-2">
                    <p className="text-[12px] text-fg-secondary">
                      {p.journey.nextActionLabel}
                    </p>
                    {p.journey.nextActionAt && (
                      <p className="mt-0.5 text-[11px] text-fg-muted">
                        {relativeDay(p.journey.nextActionAt, TODAY)}
                      </p>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Família */}
          <Card>
            <CardHeader>
              <CardTitle>Família</CardTitle>
              {p.family && <Badge tone="outline">{ROLE_LABEL[p.familyRole!]}</Badge>}
            </CardHeader>
            {p.family ? (
              <>
                <p className="px-5 pb-2 pt-1 text-[12px] text-fg-muted">
                  {p.family.name}
                </p>
                <ul className="divide-y divide-subtle border-t border-subtle">
                  {p.relatives.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/membros/${r.person.id}`}
                        className="flex items-center gap-2.5 px-5 py-2.5 transition-colors hover:bg-hover"
                      >
                        <Avatar name={r.person.name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] text-fg">
                            {shortName(r.person.name)}
                          </span>
                          <span className="block text-[12px] text-fg-muted">
                            {ROLE_LABEL[r.role]} · {age(r.person.birthDate, TODAY)} anos
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <EmptyState
                title="Sem família vinculada"
                description="Agrupar em um núcleo facilita visitas e check-in."
                action={
                  <PlannedButton variant="secondary" size="sm"
                    reason="Vínculo familiar ainda não construído"
                  >
                    Vincular a uma família
                  </PlannedButton>
                }
              />
            )}
          </Card>

          {/* Contatos de emergência */}
          {p.emergencyContacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Contatos de emergência</CardTitle>
              </CardHeader>
              <ul className="divide-y divide-subtle">
                {p.emergencyContacts.map((c) => (
                  <li key={c.id} className="px-5 py-2.5">
                    <p className="text-[13px] text-fg">{c.name}</p>
                    <p className="tnum text-[12px] text-fg-muted">
                      {c.relationship} · {fmtPhone(c.phone)}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Pequeno grupo */}
          <Card>
            <CardHeader>
              <CardTitle>Pequeno grupo</CardTitle>
            </CardHeader>
            {p.group ? (
              <Link
                href={`/grupos/${p.group.id}`}
                className="block px-5 py-4 transition-colors hover:bg-hover"
              >
                <p className="flex items-center gap-2 text-[13px] font-medium text-fg">
                  <UsersRound className="size-3.5 shrink-0 text-fg-muted" />
                  {p.group.name}
                </p>
                <p className="mt-1 text-[12px] text-fg-muted">
                  {weekday(p.group.weekday)} às {p.group.startTime} ·{" "}
                  {p.group.neighborhood}
                </p>
                {p.groupLeader && (
                  <p className="mt-0.5 text-[12px] text-fg-muted">
                    Líder: {shortName(p.groupLeader.name)}
                  </p>
                )}
              </Link>
            ) : (
              <EmptyState
                title="Não participa de um grupo"
                description="Pequenos grupos são o principal caminho de integração."
                action={
                  <PlannedButton variant="secondary" size="sm"
                    reason="Convite para pequeno grupo ainda não construído"
                  >
                    Convidar para um grupo
                  </PlannedButton>
                }
              />
            )}
          </Card>

          {/* Ministérios */}
          <Card>
            <CardHeader>
              <CardTitle>Ministérios</CardTitle>
            </CardHeader>
            {p.ministries.length ? (
              <ul className="divide-y divide-subtle">
                {p.ministries.map((m) => (
                  <li key={m.ministry.id} className="px-5 py-3">
                    <p className="flex items-center gap-2 text-[13px] text-fg">
                      <Church className="size-3.5 shrink-0 text-fg-muted" />
                      {m.ministry.name}
                      {m.isLeader && <Badge tone="brand">Líder</Badge>}
                    </p>
                    {m.positions.length > 0 && (
                      <p className="mt-1 text-[12px] text-fg-muted">
                        {m.positions.map((pos) => pos.name).join(", ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Não serve em nenhum ministério" />
            )}
          </Card>

          {/* Disponibilidade */}
          {(p.availability.length > 0 || p.blackouts.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Disponibilidade</CardTitle>
              </CardHeader>
              <CardBody className="space-y-2.5">
                {p.availability.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.availability.map((a) => (
                      <Badge key={a.id} tone="neutral">
                        {weekday(a.weekday)} {a.startTime}–{a.endTime}
                      </Badge>
                    ))}
                  </div>
                )}
                {p.blackouts.map((b) => (
                  <p
                    key={b.id}
                    className="flex items-start gap-2 rounded-md bg-sunken px-3 py-2 text-[12px] text-fg-secondary"
                  >
                    <CalendarOff className="mt-px size-3.5 shrink-0 text-fg-muted" />
                    <span>
                      {b.reason}
                      <span className="tnum block text-[11px] text-fg-muted">
                        {dateShort(b.startsAt)} → {dateShort(b.endsAt)}
                      </span>
                    </span>
                  </p>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <PersonFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        person={p.person}
      />
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
      <span className="tnum text-fg">{value}</span>
    </div>
  );
}

function StatusPill({
  status,
}: {
  status: "invited" | "confirmed" | "declined";
}) {
  if (status === "confirmed")
    return (
      <Badge tone="success" className="shrink-0">
        <Check className="size-3" />
        Confirmado
      </Badge>
    );
  if (status === "declined")
    return (
      <Badge tone="danger" className="shrink-0">
        <X className="size-3" />
        Recusou
      </Badge>
    );
  return (
    <Badge tone="warning" className="shrink-0">
      <Clock className="size-3" />
      Aguardando
    </Badge>
  );
}
