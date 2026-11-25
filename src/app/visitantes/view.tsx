"use client";

import { CircleAlert, ExternalLink, Plus, UserPlus } from "lucide-react";
import { TODAY } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import { dateShort, num, relativeDay, shortName } from "@/lib/format";
import { Button } from "@/ui/button";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
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

export function View() {
  const { overdueFollowups, visitorBoard, visitorsThisMonth } = useQueries();
  const board = visitorBoard();
  const overdue = overdueFollowups();
  const monthCount = visitorsThisMonth();
  const total = board.reduce((s, c) => s + c.cards.length, 0);
  const integrated =
    board.find((c) => c.stage.kind === "won")?.cards.length ?? 0;

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        title="Visitantes"
        description={`${num(total)} em acompanhamento · ${num(monthCount)} primeiras visitas este mês`}
        actions={
          <>
            <Button variant="secondary" size="sm">
              <ExternalLink />
              Formulário público
            </Button>
            <Button size="sm">
              <Plus />
              Registrar visitante
            </Button>
          </>
        }
      />

      {overdue.length > 0 && (
        <Card className="mb-6 border-warning/30 bg-warning-bg dark:bg-warning/10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
            <CircleAlert className="size-4 shrink-0 text-warning" />
            <p className="text-[13px] font-medium text-fg">
              {num(overdue.length)}{" "}
              {overdue.length === 1 ? "contato vencido" : "contatos vencidos"}
            </p>
            <ul className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-[12px] text-fg-secondary">
              {overdue.slice(0, 3).map(({ person, journey, due, owner }) => (
                <li key={journey.id} className="truncate">
                  <span className="font-medium">{shortName(person.name)}</span>
                  {" · "}
                  {journey.nextActionLabel}
                  {" · "}
                  <span className="text-fg-muted">
                    {relativeDay(due, TODAY)} · {shortName(owner.name)}
                  </span>
                </li>
              ))}
            </ul>
            <Button variant="secondary" size="sm" className="ml-auto">
              Ver tarefas
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="p-5">
            <p className="text-[12px] text-fg-muted">Em acompanhamento</p>
            <p className="tnum mt-1.5 font-display text-2xl font-semibold text-fg">
              {num(total - integrated)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="text-[12px] text-fg-muted">Integrados</p>
            <p className="tnum mt-1.5 font-display text-2xl font-semibold text-fg">
              {num(integrated)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="text-[12px] text-fg-muted">Taxa de integração</p>
            <p className="tnum mt-1.5 font-display text-2xl font-semibold text-fg">
              {total ? Math.round((integrated / total) * 100) : 0}%
            </p>
          </div>
        </Card>
      </div>

      {/* ---------- Kanban ---------- */}
      <div className="mt-6 -mx-4 overflow-x-auto px-4 lg:-mx-7 lg:px-7">
        <div className="flex min-w-max gap-4 pb-2">
          {board.map(({ stage, cards }) => (
            <section key={stage.id} className="w-[286px] shrink-0">
              <header className="mb-2.5 flex items-center gap-2 px-1">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    stage.kind === "new" && "bg-interactive",
                    stage.kind === "working" && "bg-warning",
                    stage.kind === "won" && "bg-success",
                    stage.kind === "lost" && "bg-fg-muted",
                  )}
                  aria-hidden="true"
                />
                <h2 className="text-[13px] font-semibold text-fg">
                  {stage.name}
                </h2>
                <span className="tnum ml-auto rounded-full bg-sunken px-2 py-0.5 text-[11px] font-medium text-fg-secondary">
                  {cards.length}
                </span>
              </header>

              <div className="space-y-2.5">
                {cards.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-line py-10 text-center text-[12px] text-fg-muted">
                    Nenhum visitante aqui
                  </div>
                ) : (
                  cards.map(({ journey, person, owner }) => {
                    const isOverdue =
                      journey.nextActionAt !== null &&
                      new Date(journey.nextActionAt) <= TODAY;
                    return (
                      <article
                        key={journey.id}
                        className="rounded-lg border border-subtle bg-surface p-3.5 shadow-xs transition-shadow hover:shadow-sm"
                      >
                        <div className="flex items-start gap-2.5">
                          <Avatar name={person.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-fg">
                              {person.name}
                            </p>
                            <p className="truncate text-[11px] text-fg-muted">
                              {person.neighborhood}
                            </p>
                          </div>
                        </div>

                        <dl className="mt-3 space-y-1 text-[11px]">
                          <div className="flex justify-between gap-2">
                            <dt className="text-fg-muted">Origem</dt>
                            <dd className="truncate text-fg-secondary">
                              {SOURCE_LABEL[journey.source]}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-fg-muted">1ª visita</dt>
                            <dd className="tnum text-fg-secondary">
                              {dateShort(journey.firstVisitAt)}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-fg-muted">Visitas</dt>
                            <dd className="tnum text-fg-secondary">
                              {journey.visitCount}
                            </dd>
                          </div>
                        </dl>

                        {journey.nextActionLabel && (
                          <p
                            className={cn(
                              "mt-3 rounded-md px-2 py-1.5 text-[11px] leading-snug",
                              isOverdue
                                ? "bg-warning-bg text-warning dark:bg-warning/15"
                                : "bg-sunken text-fg-secondary",
                            )}
                          >
                            {journey.nextActionLabel}
                            {journey.nextActionAt && (
                              <span className="block opacity-80">
                                {relativeDay(journey.nextActionAt, TODAY)}
                              </span>
                            )}
                          </p>
                        )}

                        <footer className="mt-3 flex items-center gap-1.5 border-t border-subtle pt-2.5">
                          <Avatar name={owner.name} size="xs" />
                          <span className="truncate text-[11px] text-fg-muted">
                            {shortName(owner.name)}
                          </span>
                          {stage.kind === "won" && (
                            <Badge tone="success" className="ml-auto">
                              Integrado
                            </Badge>
                          )}
                        </footer>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      {total === 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Nenhum visitante</CardTitle>
          </CardHeader>
          <EmptyState
            icon={UserPlus}
            title="Nenhum visitante em acompanhamento"
            description="Publique o formulário público para que visitantes se cadastrem sozinhos no culto."
            action={<Button size="sm">Publicar formulário</Button>}
          />
        </Card>
      )}
    </div>
  );
}
