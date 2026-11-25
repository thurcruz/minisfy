"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  CircleAlert,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Split,
  TrendingDown,
  TrendingUp,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { TODAY } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import {
  age,
  dateShort,
  delta,
  money,
  num,
  percent,
  shortName,
  weekday,
} from "@/lib/format";
import { AreaChart } from "@/ui/charts";
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
  Table,
  Td,
  Th,
  Tr,
} from "@/ui/primitives";
import { cn } from "@/lib/utils";



export function View({ id }: { id: string }) {
  const { groupProfile } = useQueries();
  const g = groupProfile(id);
  if (!g) notFound();

  const full = g.occupancy >= 0.9;
  const held = g.meetings.filter((m) => m.heldAt);
  const pending = held.filter((m) => !m.reported);

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-5">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/grupos">
            <ChevronLeft />
            Pequenos grupos
          </Link>
        </Button>
      </div>

      <PageHeader
        title={g.group.name}
        description={`${weekday(g.group.weekday)} às ${g.group.startTime} · ${g.group.neighborhood} · ${g.unit?.name}`}
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Pencil />
              Editar
            </Button>
            <Button size="sm">
              <Plus />
              Registrar encontro
            </Button>
          </>
        }
      />

      {pending.length > 0 && (
        <Card className="mb-4 border-warning/30 bg-warning-bg dark:bg-warning/10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
            <CircleAlert className="size-4 shrink-0 text-warning" />
            <p className="min-w-0 flex-1 text-[13px] text-fg">
              {num(pending.length)}{" "}
              {pending.length === 1
                ? "encontro realizado sem relatório"
                : "encontros realizados sem relatório"}
            </p>
            <Button variant="secondary" size="sm">
              Enviar relatório
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Participantes" value={num(g.memberCount)} />
        <Stat label="Média de presença" value={String(g.avgAttendance)} />
        <Stat
          label="Tendência"
          value={delta(g.trend)}
          tone={g.trend > 0.001 ? "up" : g.trend < -0.001 ? "down" : undefined}
        />
        <Stat label="Ocupação" value={percent(g.occupancy)} tone={full ? "warn" : undefined} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Presença */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Presença por encontro</CardTitle>
                <p className="mt-0.5 text-[12px] text-fg-muted">
                  {num(held.length)} encontros registrados
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {g.series.length > 1 ? (
                <AreaChart
                  data={g.series}
                  format="number"
                  unit="presentes"
                  height={170}
                />
              ) : (
                <EmptyState
                  icon={UsersRound}
                  title="Dados insuficientes"
                  description="São necessários ao menos dois encontros registrados."
                />
              )}
            </CardBody>
          </Card>

          {/* Histórico */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de encontros</CardTitle>
              <Badge tone="outline">{num(g.meetings.length)}</Badge>
            </CardHeader>
            <Table>
              <thead>
                <tr>
                  <Th>Data</Th>
                  <Th numeric>Presentes</Th>
                  <Th numeric className="hidden sm:table-cell">
                    Visitantes
                  </Th>
                  <Th numeric className="hidden md:table-cell">
                    Oferta
                  </Th>
                  <Th>Relatório</Th>
                </tr>
              </thead>
              <tbody>
                {g.meetings.map((m) => {
                  const future = !m.heldAt;
                  return (
                    <Tr key={m.id}>
                      <Td>
                        <span className={future ? "text-fg-muted" : "text-fg"}>
                          {dateShort(m.scheduledFor)}
                        </span>
                        {future && (
                          <span className="ml-2 text-[12px] text-fg-muted">
                            agendado
                          </span>
                        )}
                      </Td>
                      <Td numeric>{future ? "—" : num(m.presentCount)}</Td>
                      <Td numeric className="hidden sm:table-cell">
                        {future ? "—" : m.visitorCount || "—"}
                      </Td>
                      <Td numeric className="hidden md:table-cell">
                        {future ? "—" : money(m.offeringCents)}
                      </Td>
                      <Td>
                        {future ? (
                          <Badge tone="neutral">
                            <Clock className="size-3" />
                            Futuro
                          </Badge>
                        ) : m.reported ? (
                          <Badge tone="success">Enviado</Badge>
                        ) : (
                          <Badge tone="warning">Pendente</Badge>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        </div>

        {/* Lateral */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liderança</CardTitle>
            </CardHeader>
            <ul className="divide-y divide-subtle">
              <LeaderRow person={g.leader} role="Líder" />
              {g.host.id !== g.leader.id && (
                <LeaderRow person={g.host} role="Anfitrião" />
              )}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participantes</CardTitle>
              <Badge tone="outline">
                <span className="tnum">
                  {num(g.memberCount)}/{num(g.group.capacity)}
                </span>
              </Badge>
            </CardHeader>

            <div className="px-5 pb-3 pt-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
                <div
                  className={cn(
                    "h-full rounded-full",
                    full ? "bg-warning" : "bg-interactive",
                  )}
                  style={{ width: `${Math.min(g.occupancy * 100, 100)}%` }}
                />
              </div>
              {full && (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-warning">
                  <Split className="mt-px size-3 shrink-0" />
                  Perto do limite — considere multiplicar o grupo.
                </p>
              )}
            </div>

            {g.members.length ? (
              <ul className="divide-y divide-subtle border-t border-subtle">
                {g.members.map((person) => (
                  <li key={person.id}>
                    <Link
                      href={`/membros/${person.id}`}
                      className="flex items-center gap-2.5 px-5 py-2.5 transition-colors hover:bg-hover"
                    >
                      <Avatar name={person.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-fg">
                          {shortName(person.name)}
                        </span>
                        <span className="block truncate text-[12px] text-fg-muted">
                          {age(person.birthDate, TODAY)} anos
                          {person.id === g.leader.id && " · líder"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={UserPlus}
                title="Nenhum participante"
                action={
                  <Button variant="secondary" size="sm">
                    Adicionar participante
                  </Button>
                }
              />
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2 text-[13px]">
              <Row label="Categoria" value={g.group.category} />
              <Row label="Iniciado em" value={dateShort(g.group.startedAt)} />
              <Row label="Visitantes recebidos" value={num(g.totalVisitors)} />
              <Row label="Ofertas acumuladas" value={money(g.totalOffering)} />
              <Row label="Servem em ministérios" value={num(g.serving.length)} />
            </CardBody>
            <p className="flex items-center gap-1.5 border-t border-subtle px-5 py-2.5 text-[12px] text-fg-muted">
              <MapPin className="size-3 shrink-0" />
              {g.group.neighborhood}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LeaderRow({
  person,
  role,
}: {
  person: { id: string; name: string; phone: string };
  role: string;
}) {
  return (
    <li>
      <Link
        href={`/membros/${person.id}`}
        className="flex items-center gap-2.5 px-5 py-3 transition-colors hover:bg-hover"
      >
        <Avatar name={person.name} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] text-fg">
            {shortName(person.name)}
          </span>
          <span className="block text-[12px] text-fg-muted">{role}</span>
        </span>
      </Link>
    </li>
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

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down" | "warn";
}) {
  return (
    <Card>
      <CardBody className="py-4">
        <p className="text-[12px] text-fg-muted">{label}</p>
        <p
          className={cn(
            "tnum mt-1.5 flex items-center gap-1 font-display text-2xl font-semibold",
            tone === "up" && "text-success",
            tone === "down" && "text-danger",
            tone === "warn" && "text-warning",
            !tone && "text-fg",
          )}
        >
          {tone === "up" && <TrendingUp className="size-4" />}
          {tone === "down" && <TrendingDown className="size-4" />}
          {value}
        </p>
      </CardBody>
    </Card>
  );
}
