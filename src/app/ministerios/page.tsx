import type { Metadata } from "next";
import { Church, Plus } from "lucide-react";
import { getUnit, ministriesWithStats } from "@/mocks/queries";
import { num, shortName } from "@/lib/format";
import { Button } from "@/ui/button";
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
} from "@/ui/primitives";

export const metadata: Metadata = { title: "Ministérios" };

export default function MinisteriosPage() {
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
          <Button size="sm">
            <Plus />
            Novo ministério
          </Button>
        }
      />

      {ministries.length === 0 ? (
        <Card>
          <EmptyState
            icon={Church}
            title="Nenhum ministério cadastrado"
            description="Cadastre louvor, mídia, recepção e os demais para organizar equipes e escalas."
            action={
              <Button size="sm">
                <Plus />
                Criar primeiro ministério
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ministries.map((m) => {
            const unit = getUnit(m.ministry.unitId);
            return (
              <Card key={m.ministry.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-[15px] font-semibold text-fg">
                        {m.ministry.name}
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
