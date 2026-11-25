import type { Metadata } from "next";
import {
  CalendarOff,
  Check,
  CircleAlert,
  Clock,
  HandHeart,
  Plus,
  TrendingUp,
} from "lucide-react";
import { idleVolunteers, TODAY, volunteersWithLoad } from "@/mocks/queries";
import { num, shortName, toDate, weekday } from "@/lib/format";
import { Button } from "@/ui/button";
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  PageHeader,
  Table,
  Td,
  Th,
  Tr,
} from "@/ui/primitives";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Voluntários" };

/** "20 nov" — sem o ano, que só ocupa espaço numa lista de prazos curtos. */
function dateCompact(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(toDate(value))
    .replace(".", "");
}

export default function VoluntariosPage() {
  const volunteers = volunteersWithLoad();
  const idle = idleVolunteers();

  const onBlackout = volunteers.filter((v) => v.activeBlackout);
  const overloaded = volunteers.filter((v) => v.overloaded);
  const serving = volunteers.filter((v) => v.assignedThisMonth > 0);

  const upcomingBlackouts = volunteers
    .flatMap((v) => v.blackouts.map((b) => ({ volunteer: v, blackout: b })))
    .filter(({ blackout }) => new Date(blackout.endsAt) >= TODAY)
    .sort((a, b) => a.blackout.startsAt.localeCompare(b.blackout.startsAt));

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Voluntários"
        description={`${num(volunteers.length)} pessoas servindo em ministérios`}
        actions={
          <Button size="sm">
            <Plus />
            Cadastrar voluntário
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Voluntários ativos" value={num(volunteers.length)} tone="neutral" />
        <Stat label="Escalados no mês" value={num(serving.length)} tone="success" />
        <Stat label="Sem escala no mês" value={num(idle.length)} tone="warning" />
        <Stat label="Indisponíveis hoje" value={num(onBlackout.length)} tone="danger" />
      </div>

      {/* Sobrecarregados */}
      {overloaded.length > 0 && (
        <Card className="mt-6 border-warning/30 bg-warning-bg dark:bg-warning/10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
            <CircleAlert className="size-4 shrink-0 text-warning" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-fg">
                {num(overloaded.length)} acima do próprio limite mensal
              </p>
              <p className="mt-0.5 text-[12px] text-fg-secondary">
                {overloaded
                  .map(
                    (v) =>
                      `${shortName(v.person.name)} (${v.assignedThisMonth}/${v.maxPerMonth})`,
                  )
                  .join(" · ")}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Ociosos — o dado mais acionável da tela */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Disponíveis, mas sem escala</CardTitle>
              <p className="mt-0.5 text-[12px] text-fg-muted">
                Gente pronta para servir este mês
              </p>
            </div>
            <Badge tone={idle.length ? "warning" : "success"}>
              {num(idle.length)}
            </Badge>
          </CardHeader>
          {idle.length ? (
            <ul className="max-h-[420px] divide-y divide-subtle overflow-y-auto">
              {idle.map((v) => (
                <li
                  key={v.person.id}
                  className="flex items-center gap-2.5 px-5 py-2.5"
                >
                  <Avatar name={v.person.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-fg">
                      {shortName(v.person.name)}
                    </span>
                    <span className="block truncate text-[12px] text-fg-muted">
                      {v.profiles.map((p) => p.ministry.name).join(", ")}
                    </span>
                  </span>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    Convidar
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Check}
              title="Todo mundo escalado"
              description="Nenhum voluntário disponível está fora das escalas do mês."
            />
          )}
        </Card>

        {/* Indisponibilidades */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Indisponibilidades</CardTitle>
              <p className="mt-0.5 text-[12px] text-fg-muted">
                Respeitadas pela sugestão automática
              </p>
            </div>
            <Badge tone="outline">{num(upcomingBlackouts.length)}</Badge>
          </CardHeader>
          {upcomingBlackouts.length ? (
            <ul className="divide-y divide-subtle">
              {upcomingBlackouts.map(({ volunteer, blackout }) => {
                const active = volunteer.activeBlackout?.id === blackout.id;
                return (
                  <li
                    key={blackout.id}
                    className="flex items-center gap-2.5 px-5 py-2.5"
                  >
                    <Avatar name={volunteer.person.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13px] text-fg">
                          {shortName(volunteer.person.name)}
                        </span>
                        {active && <Badge tone="danger">Agora</Badge>}
                      </span>
                      <span className="block truncate text-[12px] text-fg-muted">
                        {blackout.reason}
                      </span>
                      <span className="tnum block text-[11px] text-fg-muted">
                        {dateCompact(blackout.startsAt)} →{" "}
                        {dateCompact(blackout.endsAt)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={CalendarOff}
              title="Nenhuma indisponibilidade"
              description="Ninguém registrou férias, viagem ou impedimento."
            />
          )}
        </Card>

        {/* Carga por ministério */}
        <Card>
          <CardHeader>
            <CardTitle>Carga do mês</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {[...new Map(
              volunteers.flatMap((v) =>
                v.profiles.map((p) => [p.ministry.id, p.ministry] as const),
              ),
            ).values()].map((ministry) => {
              const team = volunteers.filter((v) =>
                v.profiles.some((p) => p.ministry.id === ministry.id),
              );
              const scheduled = team.filter((v) => v.assignedThisMonth > 0);
              const ratio = team.length ? scheduled.length / team.length : 0;
              return (
                <div key={ministry.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="truncate text-[12px] text-fg-secondary">
                      {ministry.name}
                    </span>
                    <span className="tnum shrink-0 text-[12px] text-fg">
                      {num(scheduled.length)}/{num(team.length)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(ratio * 100, 2)}%`,
                        background: "var(--chart-1)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      {/* Tabela */}
      <Card className="mt-6">
        <CardHeader className="flex-wrap gap-3">
          <CartTitleWithCount count={volunteers.length} />
          <Input placeholder="Buscar voluntário…" className="max-w-xs" />
        </CardHeader>

        {volunteers.length === 0 ? (
          <EmptyState
            icon={HandHeart}
            title="Nenhum voluntário cadastrado"
            description="Vincule pessoas a ministérios para montar escalas e acompanhar disponibilidade."
            action={
              <Button size="sm">
                <Plus />
                Cadastrar primeiro voluntário
              </Button>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Voluntário</Th>
                <Th className="hidden md:table-cell">Ministérios</Th>
                <Th className="hidden xl:table-cell">Funções</Th>
                <Th className="hidden lg:table-cell">Disponibilidade</Th>
                <Th numeric>Escalas no mês</Th>
                <Th className="hidden sm:table-cell">Situação</Th>
              </tr>
            </thead>
            <tbody>
              {volunteers.map((v) => (
                <Tr key={v.person.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={v.person.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-fg">
                          {v.person.name}
                        </p>
                        <p className="truncate text-[12px] text-fg-muted">
                          {v.person.neighborhood}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {v.profiles.map((p) => (
                        <Badge key={p.profile.id} tone="neutral">
                          {p.ministry.name}
                        </Badge>
                      ))}
                    </div>
                  </Td>
                  <Td className="hidden xl:table-cell">
                    <span className="text-[12px]">
                      {v.profiles
                        .flatMap((p) => p.positions.map((x) => x.name))
                        .join(", ") || "—"}
                    </span>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    <span className="text-[12px]">
                      {v.availability.length
                        ? [...new Set(v.availability.map((a) => weekday(a.weekday)))].join(
                            ", ",
                          )
                        : "—"}
                    </span>
                  </Td>
                  <Td numeric>
                    <span
                      className={cn(
                        "font-medium",
                        v.overloaded ? "text-warning" : "text-fg",
                      )}
                    >
                      {num(v.assignedThisMonth)}
                    </span>
                    <span className="text-fg-muted">/{num(v.maxPerMonth)}</span>
                  </Td>
                  <Td className="hidden sm:table-cell">
                    {v.activeBlackout ? (
                      <Badge tone="danger">
                        <CalendarOff className="size-3" />
                        Indisponível
                      </Badge>
                    ) : v.overloaded ? (
                      <Badge tone="warning">
                        <TrendingUp className="size-3" />
                        Acima do limite
                      </Badge>
                    ) : v.pending > 0 ? (
                      <Badge tone="warning">
                        <Clock className="size-3" />
                        {num(v.pending)} sem resposta
                      </Badge>
                    ) : v.assignedThisMonth > 0 ? (
                      <Badge tone="success">
                        <Check className="size-3" />
                        Escalado
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Disponível</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function CartTitleWithCount({ count }: { count: number }) {
  return (
    <div>
      <CardTitle>Todos os voluntários</CardTitle>
      <p className="mt-0.5 text-[12px] text-fg-muted">
        <span className="tnum">{num(count)}</span> pessoas
      </p>
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
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  return (
    <Card>
      <CardBody className="py-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              tone === "success" && "bg-success",
              tone === "warning" && "bg-warning",
              tone === "danger" && "bg-danger",
              tone === "neutral" && "bg-fg-muted",
            )}
            aria-hidden="true"
          />
          <p className="text-[12px] text-fg-muted">{label}</p>
        </div>
        <p className="tnum mt-1.5 font-display text-2xl font-semibold text-fg">
          {value}
        </p>
      </CardBody>
    </Card>
  );
}
