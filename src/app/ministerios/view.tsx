"use client";

import Link from "next/link";
import { ChevronRight, Church, Plus } from "lucide-react";
import { useQueries } from "@/store/use-queries";
import { num, shortName } from "@/lib/format";
import { PlannedButton } from "@/ui/planned";
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
} from "@/ui/primitives";


export function View() {
  const { getUnit, ministriesWithStats } = useQueries();
  const ministries = ministriesWithStats();
  const totalVolunteers = new Set(
    ministries.flatMap((m) => m.members.map((p) => p.id)),
  ).size;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Ministérios"
        description={`${num(ministries.length)} ministérios · ${num(totalVolunteers)} pessoas servindo`}
        actions={
          <PlannedButton size="sm"
            reason="Cadastro de ministério ainda não construído"
          >
            <Plus />
            Novo ministério
          </PlannedButton>
        }
      />

      {ministries.length === 0 ? (
        <Card>
          <EmptyState
            icon={Church}
            title="Nenhum ministério cadastrado"
            description="Cadastre louvor, mídia, recepção e os demais para organizar equipes e escalas."
            action={
              <PlannedButton size="sm"
                reason="Cadastro de ministério ainda não construído"
              >
                <Plus />
                Criar primeiro ministério
              </PlannedButton>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ministries.map((m) => {
            const unit = getUnit(m.ministry.unitId);
            return (
              <Card
                key={m.ministry.id}
                className="transition-shadow hover:shadow-sm"
              >
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-[15px] font-semibold text-fg">
                        <Link
                          href={`/ministerios/${m.ministry.id}`}
                          className="group/title flex items-center gap-1 hover:underline"
                        >
                          {m.ministry.name}
                          <ChevronRight className="size-3.5 text-fg-muted opacity-0 transition-opacity group-hover/title:opacity-100" />
                        </Link>
                      </h2>
                      <p className="mt-0.5 truncate text-[12px] text-fg-muted">
                        {unit?.name}
                      </p>
                    </div>
                    <Badge tone="outline">
                      <span className="tnum">{num(m.memberCount)}</span> pessoas
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-canvas px-3 py-2.5">
                    <Avatar name={m.leader.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-fg">
                        {shortName(m.leader.name)}
                      </span>
                      <span className="block text-[11px] text-fg-muted">
                        Líder
                      </span>
                    </span>
                  </div>

                  {m.positions.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-fg-muted">
                        Funções
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.positions.map((p) => (
                          <Badge key={p.id} tone="neutral">
                            {p.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.members.length > 0 && (
                    <div className="mt-4 border-t border-subtle pt-3">
                      <div className="flex items-center gap-1.5">
                        {m.members.slice(0, 6).map((person) => (
                          <Avatar
                            key={person.id}
                            name={person.name}
                            size="xs"
                          />
                        ))}
                        {m.members.length > 6 && (
                          <span className="tnum text-[11px] text-fg-muted">
                            +{m.members.length - 6}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
