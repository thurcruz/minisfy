"use client";

import { Check, CircleAlert, Clock, Plus, RotateCcw, Sparkles, X } from "lucide-react";
import { TODAY } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import { useStore } from "@/store/data-store";
import { dateTime, num, shortName } from "@/lib/format";
import { PlannedButton } from "@/ui/planned";
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
  const { respondAssignment } = useStore();
  const { incompleteSchedules, pendingConfirmations, slotStatuses } = useQueries();
  const all = slotStatuses();
  const upcoming = all.filter((s) => new Date(s.event.startsAt) >= TODAY);
  const incomplete = incompleteSchedules();
  const pending = pendingConfirmations();

  const totalRequired = upcoming.reduce((s, x) => s + x.required, 0);
  const totalConfirmed = upcoming.reduce(
    (s, x) => s + Math.min(x.confirmed, x.required),
    0,
  );
  const totalOpen = upcoming.reduce((s, x) => s + x.open, 0);
  const declined = upcoming.reduce((s, x) => s + x.declined, 0);

  /* Agrupa por evento para montar a visão de escala */
  const byEvent = new Map<string, typeof upcoming>();
  for (const slot of upcoming) {
    const list = byEvent.get(slot.event.id) ?? [];
    list.push(slot);
    byEvent.set(slot.event.id, list);
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Escalas"
        description={`${num(totalConfirmed)} de ${num(totalRequired)} vagas confirmadas nos próximos eventos`}
        actions={
          <>
            <PlannedButton variant="secondary" size="sm"
              reason="Sugestão automática depende do motor de rodízio com disponibilidade e teto mensal — ainda não construído"
            >
              <Sparkles />
              Sugerir escala
            </PlannedButton>
            <PlannedButton size="sm"
              reason="Montar escala por evento e função ainda não construído"
            >
              <Plus />
              Nova escala
            </PlannedButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Vagas confirmadas" value={num(totalConfirmed)} tone="success" />
        <Stat label="Aguardando resposta" value={num(pending.length)} tone="warning" />
        <Stat label="Vagas sem convite" value={num(totalOpen)} tone="danger" />
        <Stat label="Recusas" value={num(declined)} tone="neutral" />
      </div>

      {/* ---------- Alerta de sugestão automática ---------- */}
      <Card className="mt-6 border-brand-200 bg-brand-50 dark:border-brand-700 dark:bg-brand-800/40">
        <div className="flex flex-wrap items-start gap-3 px-5 py-4">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-interactive" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-fg">
              A sugestão automática nunca confirma ninguém sozinha
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-fg-secondary">
              Ela respeita bloqueios, disponibilidade, teto mensal e conflito de
              horário, e cria convites com status <em>aguardando resposta</em>.
              A confirmação é sempre do voluntário ou do coordenador.
            </p>
          </div>
        </div>
      </Card>

      {/* ---------- Escalas incompletas ---------- */}
      {incomplete.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Escalas incompletas</CardTitle>
            <Badge tone="warning">{num(incomplete.length)} eventos</Badge>
          </CardHeader>
          <ul className="divide-y divide-subtle">
            {incomplete.map((e) => (
              <li
                key={e.event.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-fg">
                    {e.event.title}
                  </span>
                  <span className="block text-[12px] text-fg-muted">
                    {dateTime(e.event.startsAt)}
                  </span>
                </span>
                {e.open > 0 && (
                  <Badge tone="danger">
                    <CircleAlert className="size-3" />
                    {num(e.open)} sem convite
                  </Badge>
                )}
                {e.pending > 0 && (
                  <Badge tone="warning">
                    <Clock className="size-3" />
                    {num(e.pending)} sem resposta
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ---------- Escalas por evento ---------- */}
      <h2 className="mb-3 mt-8 text-[15px] font-semibold text-fg">
        Próximos eventos
      </h2>

      {byEvent.size === 0 ? (
        <Card>
          <EmptyState
            icon={Clock}
            title="Nenhuma escala montada"
            description="Crie uma escala a partir de um evento da agenda e convide os voluntários."
            action={
              <PlannedButton size="sm"
                reason="Montar escala por evento e função ainda não construído"
              >
                <Plus />
                Montar primeira escala
              </PlannedButton>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {[...byEvent.entries()].map(([eventId, slots]) => {
            const event = slots[0]!.event;
            const required = slots.reduce((s, x) => s + x.required, 0);
            const confirmed = slots.reduce(
              (s, x) => s + Math.min(x.confirmed, x.required),
              0,
            );
            const complete = confirmed >= required;

            return (
              <Card key={eventId}>
                <CardHeader className="flex-wrap">
                  <div>
                    <CardTitle>{event.title}</CardTitle>
                    <p className="mt-0.5 text-[12px] text-fg-muted">
                      {dateTime(event.startsAt)}
                    </p>
                  </div>
                  <Badge tone={complete ? "success" : "warning"}>
                    {complete ? (
                      <Check className="size-3" />
                    ) : (
                      <CircleAlert className="size-3" />
                    )}
                    <span className="tnum">
                      {num(confirmed)}/{num(required)}
                    </span>{" "}
                    confirmados
                  </Badge>
                </CardHeader>

                <CardBody className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {slots.map((slot) => (
                    <div
                      key={slot.slotId}
                      className={cn(
                        "rounded-lg border p-3.5",
                        slot.open > 0
                          ? "border-danger/30 bg-danger-bg/50 dark:bg-danger/5"
                          : "border-subtle bg-canvas",
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[13px] font-medium text-fg">
                          {slot.position.name}
                        </p>
                        <span className="tnum shrink-0 text-[11px] text-fg-muted">
                          {num(slot.confirmed)}/{num(slot.required)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-fg-muted">
                        {slot.ministry.name}
                      </p>

                      <ul className="mt-2.5 space-y-1.5">
                        {slot.assignments.map((a) => (
                          <li
                            key={a.id}
                            className="flex items-center gap-2 text-[12px]"
                          >
                            <Avatar name={a.person.name} size="xs" />
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate",
                                a.status === "declined"
                                  ? "text-fg-muted line-through"
                                  : "text-fg-secondary",
                              )}
                            >
                              {shortName(a.person.name)}
                            </span>
                            <AssignmentActions
                              id={a.id}
                              status={a.status}
                              name={a.person.name}
                              onRespond={respondAssignment}
                            />
                          </li>
                        ))}

                        {Array.from({ length: slot.open }).map((_, i) => (
                          <li
                            key={`gap-${i}`}
                            className="flex items-center gap-2 text-[12px]"
                          >
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-strong text-fg-muted">
                              <Plus className="size-3" />
                            </span>
                            <span className="text-fg-muted">Vaga em aberto</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Mostra a situação e, quando o convite ainda está em aberto, permite
 * responder ali mesmo — o coordenador quase sempre recebe a resposta por
 * mensagem e precisa registrar sem sair da tela.
 */
function AssignmentActions({
  id,
  status,
  name,
  onRespond,
}: {
  id: string;
  status: "invited" | "confirmed" | "declined";
  name: string;
  onRespond: (id: string, status: "confirmed" | "declined") => void;
}) {
  if (status === "invited") {
    return (
      <span className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          title={`Confirmar ${name}`}
          aria-label={`Confirmar ${name}`}
          onClick={() => onRespond(id, "confirmed")}
          className="rounded-full p-1 text-fg-muted transition-colors hover:bg-success-bg hover:text-success dark:hover:bg-success/15"
        >
          <Check className="size-3.5" />
        </button>
        <button
          type="button"
          title={`Registrar recusa de ${name}`}
          aria-label={`Registrar recusa de ${name}`}
          onClick={() => onRespond(id, "declined")}
          className="rounded-full p-1 text-fg-muted transition-colors hover:bg-danger-bg hover:text-danger dark:hover:bg-danger/15"
        >
          <X className="size-3.5" />
        </button>
      </span>
    );
  }

  if (status === "confirmed") {
    return (
      <button
        type="button"
        title={`Confirmado — desfazer resposta de ${name}`}
        aria-label={`Desfazer confirmação de ${name}`}
        onClick={() => onRespond(id, "declined")}
        className="group/status flex shrink-0 items-center text-success"
      >
        <Check className="size-3.5 group-hover/status:hidden" />
        <RotateCcw className="hidden size-3.5 group-hover/status:block" />
      </button>
    );
  }

  return (
    <button
      type="button"
      title={`Recusou — marcar ${name} como confirmado`}
      aria-label={`Confirmar ${name}`}
      onClick={() => onRespond(id, "confirmed")}
      className="group/status flex shrink-0 items-center text-danger"
    >
      <X className="size-3.5 group-hover/status:hidden" />
      <Check className="hidden size-3.5 group-hover/status:block" />
    </button>
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
              "size-2 rounded-full",
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
