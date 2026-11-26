"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Filter, Plus, Upload, Users } from "lucide-react";
import { TODAY, units } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import { PersonFormModal } from "@/modules/people/person-form";
import { Select } from "@/ui/field";
import { age, dateShort, num, phone } from "@/lib/format";
import { AreaChart, HBarChart } from "@/ui/charts";
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
  Input,
  PageHeader,
  Table,
  Td,
  Th,
  Tr,
} from "@/ui/primitives";
import type { MembershipStatus } from "@/mocks/types";
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
  "brand" | "neutral" | "warning" | "success" | "outline"
> = {
  member: "brand",
  regular: "success",
  visitor: "warning",
  inactive: "neutral",
  transferred: "outline",
};

const PAGE_SIZE = 25;

export function View() {
  const {
    ageDistribution,
    countByStatus,
    getGroup,
    getUnit,
    listPeople,
    membershipGrowth,
    newPeople,
  } = useQueries();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | "all">("all");
  const [unitId, setUnitId] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  const people = listPeople(undefined, { search, status: statusFilter, unitId });
  const pageCount = Math.max(1, Math.ceil(people.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = people.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  function changeFilter(fn: () => void) {
    fn();
    setPage(0);
  }
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
            <PlannedButton variant="secondary" size="sm"
              reason="Importação de planilha ainda não construída"
            >
              <Upload />
              Importar
            </PlannedButton>
            <PlannedButton variant="secondary" size="sm"
              reason="Exportação da lista ainda não construída"
            >
              <Download />
              Exportar
            </PlannedButton>
            <Button size="sm" onClick={() => setFormOpen(true)}>
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
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <Input
              value={search}
              onChange={(e) => changeFilter(() => setSearch(e.target.value))}
              placeholder="Buscar por nome, e-mail ou bairro…"
              className="max-w-xs"
              aria-label="Buscar pessoas"
            />
            <Select
              value={statusFilter}
              onChange={(e) =>
                changeFilter(() =>
                  setStatusFilter(e.target.value as MembershipStatus | "all"),
                )
              }
              className="w-auto"
              aria-label="Filtrar por situação"
            >
              <option value="all">Todas as situações</option>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select
              value={unitId}
              onChange={(e) => changeFilter(() => setUnitId(e.target.value))}
              className="w-auto"
              aria-label="Filtrar por unidade"
            >
              <option value="all">Todas as unidades</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>

        {people.length === 0 ? (
          search || statusFilter !== "all" || unitId !== "all" ? (
            <EmptyState
              icon={Filter}
              title="Nenhuma pessoa encontrada"
              description="Nenhum cadastro corresponde à busca e aos filtros aplicados."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    changeFilter(() => {
                      setSearch("");
                      setStatusFilter("all");
                      setUnitId("all");
                    })
                  }
                >
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Users}
              title="Nenhuma pessoa cadastrada"
              description="Comece importando sua planilha atual ou cadastrando a primeira pessoa."
              action={
                <Button size="sm" onClick={() => setFormOpen(true)}>
                  <Plus />
                  Cadastrar primeira pessoa
                </Button>
              }
            />
          )
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
                {visible.map((person) => {
                  const unit = getUnit(person.unitId);
                  const group = person.groupId ? getGroup(person.groupId) : null;
                  return (
                    <Tr key={person.id} className="group cursor-pointer">
                      <Td>
                        <Link
                          href={`/membros/${person.id}`}
                          className="flex items-center gap-2.5"
                        >
                          <Avatar name={person.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-fg group-hover:text-interactive">
                              {person.name}
                            </p>
                            <p className="truncate text-[12px] text-fg-muted">
                              {person.neighborhood}
                            </p>
                          </div>
                        </Link>
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

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[12px] text-fg-muted">
              <span>
                <span className="tnum">
                  {num(current * PAGE_SIZE + 1)}–
                  {num(current * PAGE_SIZE + visible.length)}
                </span>{" "}
                de <span className="tnum">{num(people.length)}</span> pessoas
              </span>
              <div className="flex items-center gap-2">
                <span className="tnum">
                  Página {num(current + 1)} de {num(pageCount)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={current === 0}
                  onClick={() => setPage(current - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={current >= pageCount - 1}
                  onClick={() => setPage(current + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <PersonFormModal open={formOpen} onOpenChange={setFormOpen} />
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
