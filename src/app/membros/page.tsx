import type { Metadata } from "next";
import { Download, Filter, Plus, Upload, Users } from "lucide-react";
import {
  ageDistribution,
  countByStatus,
  getGroup,
  getUnit,
  listPeople,
  membershipGrowth,
  newPeople,
  TODAY,
  units,
} from "@/mocks/queries";
import { age, dateShort, num, phone } from "@/lib/format";
import { AreaChart, HBarChart } from "@/ui/charts";
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
import type { MembershipStatus } from "@/mocks/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Membros" };

const STATUS_LABEL: Record<MembershipStatus, string> = {
  member: "Membro",
  regular: "Congregado",
  visitor: "Visitante",
  inactive: "Inativo",
  transferred: "Transferido",
};

const STATUS_TONE: Record<
  MembershipStatus,
  "brand" | "neutral" | "warning" | "success" | "outline"
> = {
  member: "brand",
  regular: "success",
  visitor: "warning",
  inactive: "neutral",
  transferred: "outline",
};

export default function MembrosPage() {
  const people = listPeople();
  const status = countByStatus();
  const growth = membershipGrowth(undefined, 12);
  const ages = ageDistribution();
  const recent = newPeople(undefined, 90);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Membros"
        description={`${num(status.total)} pessoas cadastradas em ${units.length} unidades`}
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Upload />
              Importar
            </Button>
            <Button variant="secondary" size="sm">
              <Download />
              Exportar
            </Button>
            <Button size="sm">
              <Plus />
              Nova pessoa
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Crescimento da congregação</CardTitle>
              <p className="mt-0.5 text-[12px] text-fg-muted">
                Vínculos ativos ao fim de cada mês · 12 meses
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <AreaChart
              data={growth.map((g) => ({ label: g.label, value: g.total }))}
              format="number"
              unit="pessoas"
              height={170}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faixa etária</CardTitle>
          </CardHeader>
          <CardBody>
            <HBarChart
              data={ages.map((a) => ({ label: a.label, value: a.count }))}
              format="number"
            />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Membros" value={status.member} tone="brand" />
        <MiniStat label="Congregados" value={status.regular} tone="success" />
        <MiniStat label="Visitantes" value={status.visitor} tone="warning" />
        <MiniStat label="Novos em 90 dias" value={recent.length} tone="neutral" />
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-wrap gap-3">
          <CardTitle>Todas as pessoas</CardTitle>
          <div className="flex flex-1 items-center justify-end gap-2">
            <Input
              placeholder="Buscar por nome, e-mail ou bairro…"
              className="max-w-xs"
            />
            <Button variant="secondary" size="sm">
              <Filter />
              Filtros
            </Button>
          </div>
        </CardHeader>

        {people.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhuma pessoa cadastrada"
            description="Comece importando sua planilha atual ou cadastrando a primeira pessoa."
            action={
              <Button size="sm">
                <Plus />
                Cadastrar primeira pessoa
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Pessoa</Th>
                  <Th className="hidden md:table-cell">Situação</Th>
                  <Th className="hidden lg:table-cell">Unidade</Th>
                  <Th className="hidden xl:table-cell">Pequeno grupo</Th>
                  <Th className="hidden sm:table-cell">Contato</Th>
                  <Th numeric className="hidden lg:table-cell">
                    Idade
                  </Th>
                  <Th numeric className="hidden xl:table-cell">
                    Desde
                  </Th>
                </tr>
              </thead>
              <tbody>
                {people.slice(0, 25).map((person) => {
                  const unit = getUnit(person.unitId);
                  const group = person.groupId ? getGroup(person.groupId) : null;
                  return (
                    <Tr key={person.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={person.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-fg">
                              {person.name}
                            </p>
                            <p className="truncate text-[12px] text-fg-muted">
                              {person.neighborhood}
                            </p>
                          </div>
                        </div>
                      </Td>
                      <Td className="hidden md:table-cell">
                        <Badge tone={STATUS_TONE[person.status]}>
                          {STATUS_LABEL[person.status]}
                        </Badge>
                      </Td>
                      <Td className="hidden lg:table-cell">{unit?.name}</Td>
                      <Td className="hidden xl:table-cell">
                        {group ? (
                          group.name
                        ) : (
                          <span className="text-fg-muted">—</span>
                        )}
                      </Td>
                      <Td className="hidden sm:table-cell">
                        <span className="tnum">{phone(person.phone)}</span>
                      </Td>
                      <Td numeric className="hidden lg:table-cell">
                        {age(person.birthDate, TODAY)}
                      </Td>
                      <Td numeric className="hidden xl:table-cell">
                        {dateShort(person.memberSince)}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>

            <div className="flex items-center justify-between px-5 py-3 text-[12px] text-fg-muted">
              <span>
                Mostrando <span className="tnum">25</span> de{" "}
                <span className="tnum">{num(people.length)}</span> pessoas
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled>
                  Anterior
                </Button>
                <Button variant="secondary" size="sm">
                  Próxima
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "brand" | "success" | "warning" | "neutral";
}) {
  return (
    <Card>
      <CardBody className="py-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              tone === "brand" && "bg-interactive",
              tone === "success" && "bg-success",
              tone === "warning" && "bg-warning",
              tone === "neutral" && "bg-fg-muted",
            )}
            aria-hidden="true"
          />
          <span className="text-[12px] text-fg-muted">{label}</span>
        </div>
        <p className="tnum mt-1.5 font-display text-2xl font-semibold text-fg">
          {num(value)}
        </p>
      </CardBody>
    </Card>
  );
}
