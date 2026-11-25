"use client";

import Link from "next/link";
import {
  ArrowRight,
  CakeSlice,
  CalendarDays,
  CircleAlert,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { useQueries } from "@/store/use-queries";
import { dateShort, dateTime, delta, money, num, shortName } from "@/lib/format";
import { AreaChart, GroupedBarChart, Legend } from "@/ui/charts";
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
  const { actionCenter, averageServiceAttendance, countByStatus, financeSeries, financeSummary, getRoom, groupAttendanceSeries, groupsWithStats, newPeople, registrationCount, upcomingBirthdays, upcomingEvents, visitorsThisMonth } = useQueries();
  const status = countByStatus();
  const visitors = visitorsThisMonth();
  const recent = newPeople(undefined, 30);
  const groups = groupsWithStats();
  const activeGroups = groups.filter((g) => g.group.status === "active");
  const finance = financeSummary();
  const series = financeSeries(undefined, 6);
  const previous = series.at(-2);
  const attendance = groupAttendanceSeries(undefined, 8);
  const avgService = averageServiceAttendance();
  const birthdays = upcomingBirthdays(undefined, 14);
  const events = upcomingEvents(undefined, 5);
  const actions = actionCenter();

  const congregation = status.member + status.regular;
  const incomeDelta = previous
    ? (finance.incomeCents - previous.incomeCents) / previous.incomeCents
    : 0;
  const totalGroupMembers = activeGroups.reduce((s, g) => s + g.memberCount, 0);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Bom dia, Arthur"
        description="Terça-feira, 25 de novembro de 2026 · Comunidade Esperança"
        actions={
          <Button variant="secondary" size="sm" asChild>
            <Link href="/membros">
              <Users />
              Ver membros
            </Link>
          </Button>
        }
      />

      {/* ---------- Indicadores ---------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Congregação ativa"
          value={num(congregation)}
          hint={`${num(status.member)} membros · ${num(status.regular)} congregados`}
          href="/membros"
        />
        <StatCard
          icon={UserPlus}
          label="Visitantes no mês"
          value={num(visitors)}
          hint={`${num(recent.length)} cadastros em 30 dias`}
          href="/visitantes"
        />
        <StatCard
          icon={UsersRound}
          label="Pequenos grupos"
          value={num(activeGroups.length)}
          hint={`${num(totalGroupMembers)} pessoas participando`}
          href="/grupos"
        />
        <StatCard
          icon={CalendarDays}
          label="Frequência média"
          value={avgService ? num(avgService) : "—"}
          hint={avgService ? "por culto, últimos registros" : "sem cultos registrados"}
          href="/agenda"
        />
      </div>

      {/* ---------- Central de ações ---------- */}
      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Precisa da sua atenção</CardTitle>
            <Badge tone={actions.length ? "warning" : "success"}>
              {actions.length
                ? `${actions.reduce((s, a) => s + a.count, 0)} itens`
                : "tudo em dia"}
            </Badge>
          </CardHeader>
          {actions.length === 0 ? (
            <EmptyState
              title="Nada pendente"
              description="Nenhuma escala incompleta, visitante sem contato ou conta a vencer."
            />
          ) : (
            <ul className="divide-y divide-subtle">
              {actions.map((action) => (
                <li key={action.id}>
                  <Link
                    href={action.href}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-hover"
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tnum",
                        action.severity === "high" &&
                          "bg-danger-bg text-danger dark:bg-danger/15",
                        action.severity === "medium" &&
                          "bg-warning-bg text-warning dark:bg-warning/15",
                        action.severity === "low" && "bg-sunken text-fg-secondary",
                      )}
                    >
                      {action.count}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-fg">
                        {action.label}
                      </span>
                      <span className="block truncate text-[12px] text-fg-muted">
                        {action.detail}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-fg-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* ---------- Gráficos ---------- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Entradas e saídas</CardTitle>
              <p className="mt-0.5 text-[12px] text-fg-muted">
                Últimos 6 meses · regime de competência
              </p>
            </div>
            <Legend
              items={[
                { label: "Entradas", color: "var(--chart-1)" },
                { label: "Saídas", color: "var(--chart-2)" },
              ]}
            />
          </CardHeader>
          <CardBody>
            <div className="mb-5 flex flex-wrap items-end gap-x-8 gap-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-fg-muted">
                  Entradas em novembro
                </p>
                <p className="tnum font-display text-[26px] font-semibold leading-tight text-fg">
                  {money(finance.incomeCents)}
                </p>
                {previous && (
                  <p
                    className={cn(
                      "mt-0.5 flex items-center gap-1 text-[12px] font-medium",
                      incomeDelta >= 0 ? "text-success" : "text-danger",
                    )}
                  >
                    {incomeDelta >= 0 ? (
                      <TrendingUp className="size-3.5" />
                    ) : (
                      <TrendingDown className="size-3.5" />
                    )}
                    {delta(incomeDelta)} vs. {previous.label}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-fg-muted">
                  Resultado do mês
                </p>
                <p
                  className={cn(
                    "tnum font-display text-[26px] font-semibold leading-tight",
                    finance.resultCents >= 0 ? "text-fg" : "text-danger",
                  )}
                >
                  {money(finance.resultCents)}
                </p>
                <p className="mt-0.5 text-[12px] text-fg-muted">
                  saídas de {money(finance.expenseCents)}
                </p>
              </div>
            </div>
            <GroupedBarChart
              data={series.map((s) => ({
                label: s.label,
                values: [s.incomeCents, s.expenseCents],
              }))}
              seriesNames={["Entradas", "Saídas"]}
              format="moneyCompact"
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Presença nos pequenos grupos</CardTitle>
              <p className="mt-0.5 text-[12px] text-fg-muted">
                Soma semanal · últimas 8 semanas
              </p>
            </div>
          </CardHeader>
          <CardBody>
            {attendance.length ? (
              <>
                <p className="tnum font-display text-[26px] font-semibold leading-tight text-fg">
                  {num(attendance.at(-1)!.total)}
                  <span className="ml-1.5 text-[13px] font-normal text-fg-muted">
                    pessoas na última semana
                  </span>
                </p>
                <AreaChart
                  className="mt-5"
                  data={attendance.map((a) => ({
                    label: a.label,
                    value: a.total,
                  }))}
                  format="number"
                  unit="pessoas"
                />
              </>
            ) : (
              <EmptyState
                icon={UsersRound}
                title="Sem encontros registrados"
                description="Os líderes ainda não enviaram relatórios de encontro."
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* ---------- Listas ---------- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Próximos eventos</CardTitle>
            <Link
              href="/agenda"
              className="text-[12px] font-medium text-interactive hover:underline"
            >
              Ver agenda
            </Link>
          </CardHeader>
          {events.length ? (
            <ul className="divide-y divide-subtle">
              {events.map((event) => {
                const room = event.roomId ? getRoom(event.roomId) : null;
                return (
                  <li key={event.id} className="px-5 py-3">
                    <p className="text-[13px] font-medium text-fg">
                      {event.title}
                    </p>
                    <p className="mt-0.5 text-[12px] text-fg-muted">
                      {dateTime(event.startsAt)}
                      {room && ` · ${room.name}`}
                    </p>
                    {event.capacity && registrationCount(event.id) > 0 && (
                      <p className="mt-1 text-[12px] text-fg-secondary">
                        <span className="tnum font-medium">
                          {num(registrationCount(event.id))}
                        </span>{" "}
                        de {num(event.capacity)} inscritos
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={CalendarDays} title="Nenhum evento agendado" />
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aniversariantes</CardTitle>
            <Badge>{num(birthdays.length)} em 14 dias</Badge>
          </CardHeader>
          {birthdays.length ? (
            <ul className="divide-y divide-subtle">
              {birthdays.slice(0, 6).map(({ person, date, turning }) => (
                <li
                  key={person.id}
                  className="flex items-center gap-3 px-5 py-2.5"
                >
                  <Avatar name={person.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-fg">
                      {shortName(person.name)}
                    </span>
                    <span className="block text-[12px] text-fg-muted">
                      {dateShort(date)} · {turning} anos
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={CakeSlice}
              title="Nenhum aniversário"
              description="Ninguém faz aniversário nos próximos 14 dias."
            />
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grupos em destaque</CardTitle>
            <Link
              href="/grupos"
              className="text-[12px] font-medium text-interactive hover:underline"
            >
              Ver todos
            </Link>
          </CardHeader>
          <ul className="divide-y divide-subtle">
            {activeGroups
              .slice()
              .sort((a, b) => b.trend - a.trend)
              .slice(0, 5)
              .map((g) => (
                <li
                  key={g.group.id}
                  className="flex items-center gap-3 px-5 py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-fg">
                      {g.group.name}
                    </span>
                    <span className="block text-[12px] text-fg-muted">
                      média de {g.avgAttendance} presentes
                    </span>
                  </span>
                  <span
                    className={cn(
                      "tnum flex shrink-0 items-center gap-1 text-[12px] font-medium",
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
                </li>
              ))}
          </ul>
        </Card>
      </div>

      <p className="mt-8 flex items-start gap-2 text-[12px] leading-relaxed text-fg-muted">
        <CircleAlert className="mt-px size-3.5 shrink-0" />
        <span>
          Protótipo com dados de uma igreja fictícia. Todos os números acima
          são calculados a partir de <code>src/mocks/seed.ts</code> — nenhum
          valor é escrito à mão na tela.
        </span>
      </p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-subtle bg-surface p-5 shadow-xs transition-colors hover:border-strong"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-fg-muted">{label}</span>
        <Icon className="size-4 text-fg-muted transition-colors group-hover:text-interactive" />
      </div>
      <p className="tnum mt-2 font-display text-[30px] font-semibold leading-none text-fg">
        {value}
      </p>
      <p className="mt-2 text-[12px] text-fg-muted">{hint}</p>
    </Link>
  );
}
