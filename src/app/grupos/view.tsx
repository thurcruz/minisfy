"use client";

import Link from "next/link";
import { MapPin, Plus, TrendingDown, TrendingUp, UsersRound } from "lucide-react";
import { useQueries } from "@/store/use-queries";
import { delta, money, num, percent, shortName, weekday } from "@/lib/format";
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
} from "@/ui/primitives";
import { cn } from "@/lib/utils";


export function View() {
  const { getUnit, groupAttendanceSeries, groupsWithStats } = useQueries();
  const groups = groupsWithStats();
  const attendance = groupAttendanceSeries(undefined, 8);
  const active = groups.filter((g) => g.group.status === "active");
  const totalMembers = active.reduce((s, g) => s + g.memberCount, 0);
  const avgOccupancy = active.length
    ? active.reduce((s, g) => s + g.occupancy, 0) / active.length
    : 0;
  const growing = active.filter((g) => g.trend > 0.001).length;
  const pendingReports = active.filter((g) => g.pendingReport).length;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Pequenos grupos"
        description={`${num(active.length)} grupos ativos · ${num(totalMembers)} participantes`}
        actions={
          <Button size="sm">
            <Plus />
            Novo grupo
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Grupos ativos" value={num(active.length)} />
        <Stat label="Participantes" value={num(totalMembers)} />
        <Stat label="Ocupação média" value={percent(avgOccupancy)} />
        <Stat
          label="Em crescimento"
          value={`${num(growing)} de ${num(active.length)}`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Presença semanal</CardTitle>
              <p className="mt-0.5 text-[12px] text-fg-muted">
                Soma de todos os grupos · últimas 8 semanas
              </p>
            </div>
          </CardHeader>
          <CardBody>
            {attendance.length ? (
              <AreaChart
                data={attendance.map((a) => ({
                  label: a.label,
                  value: a.total,
                }))}
                format="number"
                unit="presentes"
                height={180}
              />
            ) : (
              <EmptyState
                icon={UsersRound}
                title="Sem dados de presença"
                description="Os relatórios de encontro alimentam este gráfico."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatórios pendentes</CardTitle>
            <Badge tone={pendingReports ? "warning" : "success"}>
              {pendingReports ? num(pendingReports) : "em dia"}
            </Badge>
          </CardHeader>
          {pendingReports ? (
            <ul className="divide-y divide-subtle">
              {active
                .filter((g) => g.pendingReport)
                .map((g) => (
                  <li
                    key={g.group.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <Avatar name={g.leader.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-fg">
                        {g.group.name}
                      </span>
                      <span className="block truncate text-[12px] text-fg-muted">
                        {shortName(g.leader.name)}
                      </span>
                    </span>
                    <Button variant="ghost" size="sm">
                      Cobrar
                    </Button>
                  </li>
                ))}
            </ul>
          ) : (
            <EmptyState
              title="Todos os relatórios enviados"
              description="Nenhum líder está com encontro em aberto."
            />
          )}
        </Card>
      </div>

      {/* ---------- Grade de grupos ---------- */}
      <h2 className="mb-3 mt-8 text-[15px] font-semibold text-fg">
        Todos os grupos
      </h2>

      {active.length === 0 ? (
        <Card>
          <EmptyState
            icon={UsersRound}
            title="Nenhum pequeno grupo"
            description="Crie o primeiro grupo e vincule um líder para começar a acompanhar presença."
            action={
              <Button size="sm">
                <Plus />
                Criar primeiro grupo
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => {
            const unit = getUnit(g.group.unitId);
            const full = g.occupancy >= 0.9;
            return (
              <Card
                key={g.group.id}
                className="relative transition-colors hover:border-strong"
              >
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-semibold text-fg">
                        <Link
                          href={`/grupos/${g.group.id}`}
                          className="after:absolute after:inset-0 hover:text-interactive"
                        >
                          {g.group.name}
                        </Link>
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-fg-muted">
                        <MapPin className="size-3 shrink-0" />
                        {g.group.neighborhood} · {unit?.name}
                      </p>
                    </div>
                    <Badge tone="outline">{g.group.category}</Badge>
                  </div>

                  <p className="mt-3 text-[12px] text-fg-secondary">
                    {weekday(g.group.weekday)} às {g.group.startTime}
                  </p>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-fg-muted">
                        Média de presença
                      </p>
                      <p className="tnum font-display text-xl font-semibold text-fg">
                        {g.avgAttendance}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "tnum flex items-center gap-1 text-[12px] font-medium",
                        g.trend > 0.001
                          ? "text-success"
                          : g.trend < -0.001
                            ? "text-danger"
                            : "text-fg-muted",
                      )}
                    >
                      {g.trend > 0.001 ? (
                        <TrendingUp className="size-3.5" />
                      ) : g.trend < -0.001 ? (
                        <TrendingDown className="size-3.5" />
                      ) : null}
                      {delta(g.trend)}
                    </span>
                  </div>

                  {/* Ocupação */}
                  <div className="mt-4">
                    <div className="mb-1 flex items-baseline justify-between text-[11px]">
                      <span className="text-fg-muted">Ocupação</span>
                      <span className="tnum text-fg-secondary">
                        {num(g.memberCount)} / {num(g.group.capacity)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          full ? "bg-warning" : "bg-interactive",
                        )}
                        style={{
                          width: `${Math.min(g.occupancy * 100, 100)}%`,
                        }}
                      />
                    </div>
                    {full && (
                      <p className="mt-1.5 text-[11px] text-warning">
                        Perto do limite — considere multiplicar
                      </p>
                    )}
                  </div>

                  <footer className="mt-4 flex items-center gap-2 border-t border-subtle pt-3">
                    <Avatar name={g.leader.name} size="xs" />
                    <span className="min-w-0 flex-1 truncate text-[12px] text-fg-secondary">
                      {shortName(g.leader.name)}
                      <span className="text-fg-muted"> · líder</span>
                    </span>
                    {g.lastMeeting && (
                      <span className="tnum shrink-0 text-[11px] text-fg-muted">
                        oferta {money(g.lastMeeting.offeringCents)}
                      </span>
                    )}
                  </footer>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody className="py-4">
        <p className="text-[12px] text-fg-muted">{label}</p>
        <p className="tnum mt-1.5 font-display text-2xl font-semibold text-fg">
          {value}
        </p>
      </CardBody>
    </Card>
  );
}
