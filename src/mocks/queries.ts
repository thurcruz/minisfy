/**
 * Camada de acesso a dados do protótipo.
 *
 * TODO AS MÉTRICAS SÃO DERIVADAS do seed — nenhum número é escrito à
 * mão num componente. Se um registro mudar em seed.ts, o dashboard
 * muda junto. É o que separa protótipo honesto de tela pintada.
 *
 * Quando o Supabase entrar, as assinaturas destas funções continuam
 * iguais; só o corpo passa a consultar o banco.
 */

import { age, toDate } from "@/lib/format";
import {
  events,
  financialAccounts,
  financialCategories,
  groupMeetings,
  ministries,
  people,
  positions,
  rooms,
  scheduleAssignments,
  scheduleSlots,
  smallGroups,
  TODAY,
  transactions,
  units,
  visitorJourneys,
  visitorStages,
} from "./seed";
import type { Person, Transaction } from "./types";

export { organization, units, TODAY, visitorStages } from "./seed";

/** Escopo da consulta: toda a organização ou uma unidade. */
export type Scope = { unitId: string | null };
export const ALL_UNITS: Scope = { unitId: null };

const inScope = <T extends { unitId: string }>(rows: T[], scope: Scope) =>
  scope.unitId ? rows.filter((r) => r.unitId === scope.unitId) : rows;

const byId = <T extends { id: string }>(rows: T[]) =>
  new Map(rows.map((r) => [r.id, r]));

const PEOPLE_BY_ID = byId(people);
const POSITIONS_BY_ID = byId(positions);
const MINISTRIES_BY_ID = byId(ministries);
const EVENTS_BY_ID = byId(events);
const ROOMS_BY_ID = byId(rooms);
const CATEGORIES_BY_ID = byId(financialCategories);
const ACCOUNTS_BY_ID = byId(financialAccounts);
const GROUPS_BY_ID = byId(smallGroups);
const UNITS_BY_ID = byId(units);

export const getPerson = (id: string) => PEOPLE_BY_ID.get(id);
export const getUnit = (id: string) => UNITS_BY_ID.get(id);
export const getGroup = (id: string) => GROUPS_BY_ID.get(id);
export const getMinistry = (id: string) => MINISTRIES_BY_ID.get(id);
export const getEvent = (id: string) => EVENTS_BY_ID.get(id);
export const getRoom = (id: string) => ROOMS_BY_ID.get(id);
export const getCategory = (id: string) => CATEGORIES_BY_ID.get(id);
export const getAccount = (id: string) => ACCOUNTS_BY_ID.get(id);

/* ================================================================== */
/* Pessoas                                                             */
/* ================================================================== */

/** Membros e congregados ativos — exclui visitantes e inativos. */
export function activeCongregation(scope: Scope = ALL_UNITS): Person[] {
  return inScope(people, scope).filter(
    (p) => p.status === "member" || p.status === "regular",
  );
}

export function listPeople(
  scope: Scope = ALL_UNITS,
  filters: {
    search?: string;
    status?: Person["status"] | "all";
    unitId?: string | "all";
    groupId?: string | "all";
  } = {},
): Person[] {
  const search = filters.search?.trim().toLowerCase() ?? "";
  const normalized = search
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  return inScope(people, scope)
    .filter((p) => {
      if (filters.status && filters.status !== "all" && p.status !== filters.status)
        return false;
      if (filters.unitId && filters.unitId !== "all" && p.unitId !== filters.unitId)
        return false;
      if (filters.groupId && filters.groupId !== "all" && p.groupId !== filters.groupId)
        return false;
      if (!normalized) return true;
      const haystack = `${p.name} ${p.email ?? ""} ${p.neighborhood}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
      return haystack.includes(normalized);
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function countByStatus(scope: Scope = ALL_UNITS) {
  const rows = inScope(people, scope);
  return {
    member: rows.filter((p) => p.status === "member").length,
    regular: rows.filter((p) => p.status === "regular").length,
    visitor: rows.filter((p) => p.status === "visitor").length,
    inactive: rows.filter((p) => p.status === "inactive").length,
    total: rows.length,
  };
}

/** Aniversariantes dentro da janela de dias à frente (inclui hoje). */
export function upcomingBirthdays(scope: Scope = ALL_UNITS, days = 14) {
  const rows = inScope(people, scope).filter((p) => p.status !== "inactive");
  const out: Array<{ person: Person; date: Date; turning: number }> = [];

  for (const person of rows) {
    const birth = toDate(person.birthDate);
    const next = new Date(
      TODAY.getFullYear(),
      birth.getMonth(),
      birth.getDate(),
    );
    if (next < startOfDay(TODAY)) next.setFullYear(next.getFullYear() + 1);
    const diffDays = Math.round(
      (next.getTime() - startOfDay(TODAY).getTime()) / 86_400_000,
    );
    if (diffDays <= days) {
      out.push({
        person,
        date: next,
        turning: next.getFullYear() - birth.getFullYear(),
      });
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Novos cadastros nos últimos N dias. */
export function newPeople(scope: Scope = ALL_UNITS, days = 30): Person[] {
  const cutoff = new Date(TODAY.getTime() - days * 86_400_000);
  return inScope(people, scope)
    .filter((p) => toDate(p.createdAt) >= cutoff)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Crescimento mês a mês da congregação ativa, pelos últimos N meses. */
export function membershipGrowth(scope: Scope = ALL_UNITS, months = 12) {
  const rows = inScope(people, scope).filter((p) => p.status !== "visitor");
  const series: Array<{ label: string; month: Date; total: number }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const end = new Date(TODAY.getFullYear(), TODAY.getMonth() - i + 1, 0);
    const total = rows.filter((p) => toDate(p.memberSince) <= end).length;
    series.push({
      label: new Intl.DateTimeFormat("pt-BR", { month: "short" })
        .format(end)
        .replace(".", ""),
      month: end,
      total,
    });
  }
  return series;
}

export function ageDistribution(scope: Scope = ALL_UNITS) {
  const rows = activeCongregation(scope);
  const buckets = [
    { label: "0–11", min: 0, max: 11 },
    { label: "12–17", min: 12, max: 17 },
    { label: "18–29", min: 18, max: 29 },
    { label: "30–44", min: 30, max: 44 },
    { label: "45–59", min: 45, max: 59 },
    { label: "60+", min: 60, max: 200 },
  ];
  return buckets.map((b) => ({
    label: b.label,
    count: rows.filter((p) => {
      const a = age(p.birthDate, TODAY);
      return a >= b.min && a <= b.max;
    }).length,
  }));
}

/* ================================================================== */
/* Visitantes                                                          */
/* ================================================================== */

export function visitorBoard(scope: Scope = ALL_UNITS) {
  return visitorStages
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((stage) => ({
      stage,
      cards: visitorJourneys
        .filter((j) => j.stageId === stage.id)
        .map((j) => ({
          journey: j,
          person: PEOPLE_BY_ID.get(j.personId)!,
          owner: PEOPLE_BY_ID.get(j.ownerId)!,
        }))
        .filter(
          ({ person }) => !scope.unitId || person.unitId === scope.unitId,
        )
        .sort((a, b) =>
          b.journey.firstVisitAt.localeCompare(a.journey.firstVisitAt),
        ),
    }));
}

/** Visitantes com tarefa de contato vencida ou para hoje. */
export function overdueFollowups(scope: Scope = ALL_UNITS) {
  const today = startOfDay(TODAY);
  return visitorJourneys
    .filter((j) => j.nextActionAt !== null)
    .map((j) => ({
      journey: j,
      person: PEOPLE_BY_ID.get(j.personId)!,
      owner: PEOPLE_BY_ID.get(j.ownerId)!,
      due: toDate(j.nextActionAt!),
    }))
    .filter(({ person, due }) => {
      if (scope.unitId && person.unitId !== scope.unitId) return false;
      return due <= today;
    })
    .sort((a, b) => a.due.getTime() - b.due.getTime());
}

export function visitorsThisMonth(scope: Scope = ALL_UNITS) {
  const start = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  return visitorJourneys.filter((j) => {
    const person = PEOPLE_BY_ID.get(j.personId)!;
    if (scope.unitId && person.unitId !== scope.unitId) return false;
    return toDate(j.firstVisitAt) >= start;
  }).length;
}

/* ================================================================== */
/* Pequenos grupos                                                     */
/* ================================================================== */

export function groupsWithStats(scope: Scope = ALL_UNITS) {
  return inScope(smallGroups, scope).map((group) => {
    const meetings = groupMeetings
      .filter((m) => m.groupId === group.id && m.heldAt)
      .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));

    const members = people.filter((p) => p.groupId === group.id);
    const recent = meetings.slice(-4);
    const previous = meetings.slice(-8, -4);

    const avg = (rows: typeof meetings) =>
      rows.length
        ? rows.reduce((s, m) => s + m.presentCount, 0) / rows.length
        : 0;

    const avgRecent = avg(recent);
    const avgPrevious = avg(previous);

    return {
      group,
      leader: PEOPLE_BY_ID.get(group.leaderId)!,
      host: PEOPLE_BY_ID.get(group.hostId)!,
      memberCount: members.length,
      avgAttendance: Math.round(avgRecent * 10) / 10,
      trend:
        avgPrevious > 0 ? (avgRecent - avgPrevious) / avgPrevious : 0,
      occupancy: group.capacity > 0 ? members.length / group.capacity : 0,
      lastMeeting: meetings.at(-1) ?? null,
      pendingReport: groupMeetings.some(
        (m) => m.groupId === group.id && m.heldAt && !m.reported,
      ),
      meetings,
    };
  });
}

export function groupAttendanceSeries(scope: Scope = ALL_UNITS, weeks = 8) {
  const groupIds = new Set(inScope(smallGroups, scope).map((g) => g.id));
  const buckets = new Map<string, { label: string; total: number; date: Date }>();

  for (const m of groupMeetings) {
    if (!groupIds.has(m.groupId) || !m.heldAt) continue;
    const date = new Date(m.heldAt);
    const key = date.toISOString().slice(0, 10);
    const current = buckets.get(key);
    if (current) current.total += m.presentCount;
    else
      buckets.set(key, {
        label: new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }).format(date),
        total: m.presentCount,
        date,
      });
  }

  return [...buckets.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-weeks);
}

/* ================================================================== */
/* Escalas                                                             */
/* ================================================================== */

export interface SlotStatus {
  slotId: string;
  event: (typeof events)[number];
  position: (typeof positions)[number];
  ministry: (typeof ministries)[number];
  required: number;
  confirmed: number;
  invited: number;
  declined: number;
  /** Vagas sem ninguém confirmado (pode haver convite pendente cobrindo) */
  missing: number;
  /** Vagas sem ninguém — nem confirmado, nem convidado. Precisa convidar. */
  open: number;
  assignments: Array<{
    id: string;
    person: Person;
    status: "invited" | "confirmed" | "declined";
  }>;
}

export function slotStatuses(scope: Scope = ALL_UNITS): SlotStatus[] {
  return scheduleSlots
    .map((slot) => {
      const event = EVENTS_BY_ID.get(slot.eventId)!;
      const position = POSITIONS_BY_ID.get(slot.positionId)!;
      const ministry = MINISTRIES_BY_ID.get(position.ministryId)!;
      const assignments = scheduleAssignments
        .filter((a) => a.slotId === slot.id)
        .map((a) => ({
          id: a.id,
          person: PEOPLE_BY_ID.get(a.personId)!,
          status: a.status,
        }));

      const confirmed = assignments.filter((a) => a.status === "confirmed").length;
      const invited = assignments.filter((a) => a.status === "invited").length;
      const declined = assignments.filter((a) => a.status === "declined").length;

      return {
        slotId: slot.id,
        event,
        position,
        ministry,
        required: slot.requiredCount,
        confirmed,
        invited,
        declined,
        missing: Math.max(0, slot.requiredCount - confirmed),
        open: Math.max(0, slot.requiredCount - confirmed - invited),
        assignments,
      };
    })
    .filter((s) => !scope.unitId || s.event.unitId === scope.unitId)
    .sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
}

/** Eventos futuros cuja escala ainda não está completa. */
export function incompleteSchedules(scope: Scope = ALL_UNITS) {
  const slots = slotStatuses(scope).filter(
    (s) => new Date(s.event.startsAt) >= TODAY,
  );
  const byEvent = new Map<
    string,
    {
      event: (typeof events)[number];
      missing: number;
      open: number;
      pending: number;
      slots: SlotStatus[];
    }
  >();

  for (const slot of slots) {
    const entry = byEvent.get(slot.event.id) ?? {
      event: slot.event,
      missing: 0,
      open: 0,
      pending: 0,
      slots: [],
    };
    entry.missing += slot.missing;
    entry.open += slot.open;
    entry.pending += slot.invited;
    entry.slots.push(slot);
    byEvent.set(slot.event.id, entry);
  }

  return [...byEvent.values()]
    .filter((e) => e.missing > 0 || e.pending > 0)
    .sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
}

export function pendingConfirmations(scope: Scope = ALL_UNITS) {
  return slotStatuses(scope)
    .filter((s) => new Date(s.event.startsAt) >= TODAY)
    .flatMap((s) =>
      s.assignments
        .filter((a) => a.status === "invited")
        .map((a) => ({ ...a, event: s.event, position: s.position })),
    );
}

/* ================================================================== */
/* Agenda                                                             */
/* ================================================================== */

export function upcomingEvents(scope: Scope = ALL_UNITS, limit = 6) {
  return inScope(events, scope)
    .filter((e) => new Date(e.startsAt) >= TODAY)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, limit);
}

export function pastEvents(scope: Scope = ALL_UNITS) {
  return inScope(events, scope)
    .filter((e) => new Date(e.startsAt) < TODAY)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}

/** Frequência média dos cultos já realizados. */
export function averageServiceAttendance(scope: Scope = ALL_UNITS) {
  const rows = pastEvents(scope).filter(
    (e) => e.kind === "culto" && e.actualAttendance !== null,
  );
  if (!rows.length) return null;
  return Math.round(
    rows.reduce((s, e) => s + (e.actualAttendance ?? 0), 0) / rows.length,
  );
}

/* ================================================================== */
/* Financeiro                                                          */
/* ================================================================== */

/** Lançamentos que contam no resultado — estornos e estornados saem. */
function effective(rows: Transaction[]): Transaction[] {
  const reversed = new Set(
    rows.filter((t) => t.reversalOfId).map((t) => t.reversalOfId!),
  );
  return rows.filter((t) => !t.reversalOfId && !reversed.has(t.id));
}

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export function financeSummary(scope: Scope = ALL_UNITS, month?: string) {
  const key = month ?? TODAY.toISOString().slice(0, 7);
  const rows = effective(inScope(transactions, scope)).filter(
    (t) => monthKey(t.competenceDate) === key,
  );

  const income = rows
    .filter((t) => t.kind === "income")
    .reduce((s, t) => s + t.amountCents, 0);
  const expense = rows
    .filter((t) => t.kind === "expense")
    .reduce((s, t) => s + t.amountCents, 0);

  return { month: key, incomeCents: income, expenseCents: expense, resultCents: income - expense };
}

export function financeSeries(scope: Scope = ALL_UNITS, months = 6) {
  const rows = effective(inScope(transactions, scope));
  const out: Array<{
    key: string;
    label: string;
    incomeCents: number;
    expenseCents: number;
    resultCents: number;
  }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const ref = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1);
    const key = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
    const monthRows = rows.filter((t) => monthKey(t.competenceDate) === key);
    const income = monthRows
      .filter((t) => t.kind === "income")
      .reduce((s, t) => s + t.amountCents, 0);
    const expense = monthRows
      .filter((t) => t.kind === "expense")
      .reduce((s, t) => s + t.amountCents, 0);
    out.push({
      key,
      label: new Intl.DateTimeFormat("pt-BR", { month: "short" })
        .format(ref)
        .replace(".", ""),
      incomeCents: income,
      expenseCents: expense,
      resultCents: income - expense,
    });
  }
  return out;
}

/** Saldo = abertura das contas + razão. Nunca guardado em coluna (AD-08). */
export function currentBalance(scope: Scope = ALL_UNITS) {
  const accounts = inScope(financialAccounts, scope);
  const opening = accounts.reduce((s, a) => s + a.openingBalanceCents, 0);
  const accountIds = new Set(accounts.map((a) => a.id));
  const ledger = effective(transactions)
    .filter((t) => accountIds.has(t.accountId) && t.status !== "pending")
    .reduce((s, t) => s + (t.kind === "income" ? t.amountCents : -t.amountCents), 0);
  return opening + ledger;
}

export function balanceByAccount(scope: Scope = ALL_UNITS) {
  return inScope(financialAccounts, scope).map((account) => {
    const ledger = effective(transactions)
      .filter((t) => t.accountId === account.id && t.status !== "pending")
      .reduce(
        (s, t) => s + (t.kind === "income" ? t.amountCents : -t.amountCents),
        0,
      );
    return { account, balanceCents: account.openingBalanceCents + ledger };
  });
}

/** Contas a pagar em aberto, com vencimento nos próximos N dias. */
export function upcomingPayables(scope: Scope = ALL_UNITS, days = 15) {
  const limit = new Date(TODAY.getTime() + days * 86_400_000);
  return effective(inScope(transactions, scope))
    .filter(
      (t) =>
        t.kind === "expense" &&
        (t.status === "pending" || t.status === "approved") &&
        t.dueDate !== null &&
        toDate(t.dueDate) <= limit,
    )
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
}

export function expensesByCategory(scope: Scope = ALL_UNITS, month?: string) {
  const key = month ?? TODAY.toISOString().slice(0, 7);
  const rows = effective(inScope(transactions, scope)).filter(
    (t) => t.kind === "expense" && monthKey(t.competenceDate) === key,
  );
  const map = new Map<string, number>();
  for (const t of rows) {
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amountCents);
  }
  return [...map.entries()]
    .map(([categoryId, cents]) => ({
      category: CATEGORIES_BY_ID.get(categoryId)!,
      cents,
    }))
    .sort((a, b) => b.cents - a.cents);
}

export function listTransactions(
  scope: Scope = ALL_UNITS,
  filters: { kind?: "income" | "expense" | "all"; month?: string } = {},
) {
  const key = filters.month ?? TODAY.toISOString().slice(0, 7);
  return inScope(transactions, scope)
    .filter((t) => monthKey(t.competenceDate) === key)
    .filter((t) =>
      !filters.kind || filters.kind === "all" ? true : t.kind === filters.kind,
    )
    .sort((a, b) => b.competenceDate.localeCompare(a.competenceDate));
}

/* ================================================================== */
/* Ministérios                                                         */
/* ================================================================== */

export function ministriesWithStats(scope: Scope = ALL_UNITS) {
  return inScope(ministries, scope).map((ministry) => {
    const members = people.filter((p) => p.ministryIds.includes(ministry.id));
    const ministryPositions = positions.filter(
      (p) => p.ministryId === ministry.id,
    );
    return {
      ministry,
      leader: PEOPLE_BY_ID.get(ministry.leaderId)!,
      memberCount: members.length,
      members,
      positions: ministryPositions,
    };
  });
}

/* ================================================================== */
/* Central de pendências do dashboard                                  */
/* ================================================================== */

export interface ActionItem {
  id: string;
  label: string;
  detail: string;
  href: string;
  severity: "high" | "medium" | "low";
  count: number;
}

/** Tudo que precisa de atenção hoje, derivado dos dados reais. */
export function actionCenter(scope: Scope = ALL_UNITS): ActionItem[] {
  const items: ActionItem[] = [];

  const followups = overdueFollowups(scope);
  if (followups.length) {
    items.push({
      id: "followups",
      label: "Visitantes aguardando contato",
      detail: followups
        .slice(0, 3)
        .map((f) => f.person.name.split(" ")[0])
        .join(", "),
      href: "/visitantes",
      severity: "high",
      count: followups.length,
    });
  }

  const incomplete = incompleteSchedules(scope);
  const openTotal = incomplete.reduce((s, e) => s + e.open, 0);
  if (openTotal) {
    items.push({
      id: "schedule-gaps",
      label: "Vagas de escala sem ninguém convidado",
      detail: incomplete
        .filter((e) => e.open > 0)
        .slice(0, 2)
        .map((e) => e.event.title)
        .join(" · "),
      href: "/escalas",
      severity: "high",
      count: openTotal,
    });
  }

  const pending = pendingConfirmations(scope);
  if (pending.length) {
    items.push({
      id: "schedule-pending",
      label: "Convites de escala sem resposta",
      detail: pending
        .slice(0, 3)
        .map((p) => p.person.name.split(" ")[0])
        .join(", "),
      href: "/escalas",
      severity: "medium",
      count: pending.length,
    });
  }

  const payables = upcomingPayables(scope);
  if (payables.length) {
    items.push({
      id: "payables",
      label: "Contas a vencer em 15 dias",
      detail: payables.slice(0, 2).map((t) => t.description).join(" · "),
      href: "/financeiro",
      severity: payables.some((t) => t.status === "pending") ? "medium" : "low",
      count: payables.length,
    });
  }

  const unreported = groupsWithStats(scope).filter((g) => g.pendingReport);
  if (unreported.length) {
    items.push({
      id: "group-reports",
      label: "Relatórios de encontro pendentes",
      detail: unreported.slice(0, 3).map((g) => g.group.name).join(", "),
      href: "/grupos",
      severity: "medium",
      count: unreported.length,
    });
  }

  const order = { high: 0, medium: 1, low: 2 } as const;
  return items.sort((a, b) => order[a.severity] - order[b.severity]);
}

/* ================================================================== */

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
