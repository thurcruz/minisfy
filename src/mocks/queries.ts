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
  emergencyContacts,
  eventRegistrations,
  events,
  familyMembers,
  families,
  financialAccounts,
  financialCategories,
  groupMeetings,
  ministries,
  people,
  positions,
  roomReservations,
  rooms,
  scheduleAssignments,
  scheduleSlots,
  serviceItems,
  services,
  smallGroups,
  TODAY,
  transactions,
  units,
  visitorJourneys,
  visitorStages,
  volunteerAvailability,
  volunteerBlackouts,
  volunteerProfiles,
} from "./seed";
import type {
  FamilyRole,
  Person,
  RoomReservation,
  Transaction,
  VolunteerProfile,
} from "./types";

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

/* ================================================================== */
/* Famílias — Módulo 04                                                */
/* ================================================================== */

const ROLE_ORDER: Record<FamilyRole, number> = {
  head: 0,
  spouse: 1,
  child: 2,
  relative: 3,
};

export function familiesWithMembers(scope: Scope = ALL_UNITS) {
  return inScope(families, scope)
    .map((family) => {
      const members = familyMembers
        .filter((fm) => fm.familyId === family.id)
        .map((fm) => ({ ...fm, person: PEOPLE_BY_ID.get(fm.personId)! }))
        .filter((m) => m.person)
        .sort(
          (a, b) =>
            ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
            a.person.birthDate.localeCompare(b.person.birthDate),
        );

      const children = members.filter((m) => m.role === "child");

      return {
        family,
        unit: UNITS_BY_ID.get(family.unitId),
        members,
        guardians: members.filter((m) => m.isGuardian),
        childCount: children.length,
        /** Crianças sem nenhum contato de emergência cadastrado */
        childrenMissingContact: children.filter(
          (c) => !emergencyContacts.some((ec) => ec.personId === c.personId),
        ),
      };
    })
    .sort((a, b) => a.family.name.localeCompare(b.family.name, "pt-BR"));
}

/** Pessoas sem família vinculada — o trabalho que falta no cadastro. */
export function peopleWithoutFamily(scope: Scope = ALL_UNITS) {
  const linked = new Set(familyMembers.map((fm) => fm.personId));
  return inScope(people, scope).filter(
    (p) => !linked.has(p.id) && p.status !== "visitor",
  );
}

export const getEmergencyContacts = (personId: string) =>
  emergencyContacts.filter((ec) => ec.personId === personId);

/* ================================================================== */
/* Cultos — Módulo 09                                                  */
/* ================================================================== */

export function servicesWithProgram(scope: Scope = ALL_UNITS) {
  return inScope(services, scope)
    .map((service) => {
      const event = EVENTS_BY_ID.get(service.eventId)!;
      const items = serviceItems
        .filter((i) => i.serviceId === service.id)
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          item,
          responsible: item.responsibleId
            ? PEOPLE_BY_ID.get(item.responsibleId)
            : null,
        }));

      const plannedMinutes = items.reduce(
        (s, i) => s + i.item.durationMinutes,
        0,
      );
      const scheduledMinutes = Math.round(
        (new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime()) /
          60_000,
      );

      return {
        service,
        event,
        preacher: service.preacherId
          ? PEOPLE_BY_ID.get(service.preacherId)
          : null,
        host: service.hostId ? PEOPLE_BY_ID.get(service.hostId) : null,
        items,
        plannedMinutes,
        scheduledMinutes,
        /** Programação estourando o tempo reservado para o culto */
        overrunMinutes: Math.max(0, plannedMinutes - scheduledMinutes),
        team: slotStatuses(scope).filter((s) => s.event.id === event.id),
      };
    })
    .sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
}

/* ================================================================== */
/* Eventos e inscrições — Módulo 08                                    */
/* ================================================================== */

export function registrationsFor(eventId: string) {
  return eventRegistrations
    .filter((r) => r.eventId === eventId && r.status !== "cancelled")
    .map((r) => ({ registration: r, person: PEOPLE_BY_ID.get(r.personId)! }));
}

/** Contagem de confirmados — derivada das linhas, nunca um número solto. */
export function registrationCount(eventId: string) {
  return eventRegistrations.filter(
    (r) => r.eventId === eventId && r.status === "confirmed",
  ).length;
}

export function eventsWithRegistrations(scope: Scope = ALL_UNITS) {
  return inScope(events, scope)
    .filter((e) => e.capacity !== null)
    .map((event) => {
      const rows = registrationsFor(event.id);
      const confirmed = rows.filter(
        (r) => r.registration.status === "confirmed",
      );
      const waitlist = rows.filter((r) => r.registration.status === "waitlist");
      const paidCents = confirmed
        .filter((r) => r.registration.paid)
        .reduce((s, r) => s + r.registration.amountCents, 0);
      const pendingCents = confirmed
        .filter((r) => !r.registration.paid)
        .reduce((s, r) => s + r.registration.amountCents, 0);

      return {
        event,
        unit: UNITS_BY_ID.get(event.unitId),
        room: event.roomId ? ROOMS_BY_ID.get(event.roomId) : null,
        confirmed,
        waitlist,
        occupancy: event.capacity ? confirmed.length / event.capacity : 0,
        paidCents,
        pendingCents,
        isPaid: confirmed.some((r) => r.registration.amountCents > 0),
      };
    })
    .sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
}

/* ================================================================== */
/* Reservas de espaço — Módulos 08 e 12                                */
/* ================================================================== */

function overlaps(a: RoomReservation, b: RoomReservation) {
  return (
    new Date(a.startsAt) < new Date(b.endsAt) &&
    new Date(b.startsAt) < new Date(a.endsAt)
  );
}

export function reservationsWithConflicts(scope: Scope = ALL_UNITS) {
  const rows = inScope(roomReservations, scope);
  const live = rows.filter(
    (r) => r.status === "approved" || r.status === "pending",
  );

  return rows
    .map((reservation) => ({
      reservation,
      room: ROOMS_BY_ID.get(reservation.roomId)!,
      requestedBy: PEOPLE_BY_ID.get(reservation.requestedById)!,
      approvedBy: reservation.approvedById
        ? PEOPLE_BY_ID.get(reservation.approvedById)
        : null,
      event: reservation.eventId ? EVENTS_BY_ID.get(reservation.eventId) : null,
      /**
       * No banco isto é impossível: a EXCLUDE constraint do AD-10 rejeita
       * a sobreposição no momento da escrita. Aqui o protótipo mostra o
       * conflito para desenhar a tela de resolução.
       */
      /**
       * Quem "tem" o conflito é o pedido mais novo, não a reserva que já
       * estava aprovada. Uma aprovada só conflita com outra aprovada —
       * caso que o banco impede (AD-10) e que aqui seria um erro de dado.
       */
      conflictsWith: live.filter((other) => {
        if (other.id === reservation.id) return false;
        if (other.roomId !== reservation.roomId) return false;
        if (!overlaps(reservation, other)) return false;
        if (reservation.status === "pending") return true;
        if (reservation.status === "approved") return other.status === "approved";
        return false;
      }),
    }))
    .sort((a, b) =>
      a.reservation.startsAt.localeCompare(b.reservation.startsAt),
    );
}

export function roomUsage(scope: Scope = ALL_UNITS) {
  const rows = inScope(roomReservations, scope).filter(
    (r) => r.status === "approved",
  );
  return inScope(rooms, scope).map((room) => {
    const bookings = rows.filter((r) => r.roomId === room.id);
    const minutes = bookings.reduce(
      (s, r) =>
        s +
        (new Date(r.endsAt).getTime() - new Date(r.startsAt).getTime()) / 60_000,
      0,
    );
    return {
      room,
      bookings: bookings.length,
      hours: Math.round(minutes / 6) / 10,
    };
  });
}

/* ================================================================== */
/* Voluntários — Módulo 07                                             */
/* ================================================================== */

export function volunteersWithLoad(scope: Scope = ALL_UNITS) {
  const monthStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const monthEnd = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0);
  const slots = slotStatuses(ALL_UNITS);

  const byPerson = new Map<string, VolunteerProfile[]>();
  for (const profile of volunteerProfiles) {
    const list = byPerson.get(profile.personId) ?? [];
    list.push(profile);
    byPerson.set(profile.personId, list);
  }

  return [...byPerson.entries()]
    .map(([personId, profiles]) => {
      const person = PEOPLE_BY_ID.get(personId)!;

      const assignments = slots.flatMap((slot) =>
        slot.assignments
          .filter((a) => a.person.id === personId)
          .map((a) => ({ ...a, slot })),
      );
      const thisMonth = assignments.filter((a) => {
        const date = new Date(a.slot.event.startsAt);
        return date >= monthStart && date <= monthEnd;
      });

      const blackouts = volunteerBlackouts.filter(
        (b) => b.personId === personId,
      );
      const activeBlackout = blackouts.find(
        (b) => toDate(b.startsAt) <= TODAY && toDate(b.endsAt) >= TODAY,
      );
      const maxPerMonth = Math.max(...profiles.map((p) => p.maxPerMonth));

      return {
        person,
        profiles: profiles.map((p) => ({
          profile: p,
          ministry: MINISTRIES_BY_ID.get(p.ministryId)!,
          positions: p.positionIds
            .map((id) => POSITIONS_BY_ID.get(id)!)
            .filter(Boolean),
        })),
        availability: volunteerAvailability.filter(
          (a) => a.personId === personId,
        ),
        blackouts,
        activeBlackout: activeBlackout ?? null,
        assignedThisMonth: thisMonth.length,
        confirmedThisMonth: thisMonth.filter((a) => a.status === "confirmed")
          .length,
        pending: assignments.filter((a) => a.status === "invited").length,
        maxPerMonth,
        /** Acima do teto que o próprio voluntário definiu */
        overloaded: thisMonth.length > maxPerMonth,
      };
    })
    .filter(({ person }) => !scope.unitId || person.unitId === scope.unitId)
    .sort((a, b) => a.person.name.localeCompare(b.person.name, "pt-BR"));
}

/** Voluntários disponíveis mas sem nenhuma escala no mês. */
export function idleVolunteers(scope: Scope = ALL_UNITS) {
  return volunteersWithLoad(scope).filter(
    (v) => v.assignedThisMonth === 0 && !v.activeBlackout,
  );
}

/* ================================================================== */
/* Perfil de pessoa — tela de detalhe                                  */
/* ================================================================== */

export interface TimelineEntry {
  id: string;
  date: string;
  label: string;
  detail: string | null;
  kind: "membership" | "group" | "ministry" | "visit" | "record";
}

export function personProfile(personId: string) {
  const person = PEOPLE_BY_ID.get(personId);
  if (!person) return null;

  const unit = UNITS_BY_ID.get(person.unitId);
  const group = person.groupId ? GROUPS_BY_ID.get(person.groupId) : null;
  const groupLeader = group ? PEOPLE_BY_ID.get(group.leaderId) : null;

  const familyLink = familyMembers.find((fm) => fm.personId === personId);
  const family = familyLink
    ? families.find((f) => f.id === familyLink.familyId)
    : null;
  const relatives = family
    ? familyMembers
        .filter((fm) => fm.familyId === family.id && fm.personId !== personId)
        .map((fm) => ({ ...fm, person: PEOPLE_BY_ID.get(fm.personId)! }))
        .filter((r) => r.person)
    : [];

  const personMinistries = person.ministryIds
    .map((id) => MINISTRIES_BY_ID.get(id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .map((ministry) => ({
      ministry,
      isLeader: ministry.leaderId === personId,
      positions: volunteerProfiles
        .filter((v) => v.personId === personId && v.ministryId === ministry.id)
        .flatMap((v) => v.positionIds.map((id) => POSITIONS_BY_ID.get(id)!))
        .filter(Boolean),
    }));

  const assignments = slotStatuses(ALL_UNITS)
    .flatMap((slot) =>
      slot.assignments
        .filter((a) => a.person.id === personId)
        .map((a) => ({ status: a.status, slot })),
    )
    .sort((a, b) =>
      b.slot.event.startsAt.localeCompare(a.slot.event.startsAt),
    );

  const upcomingAssignments = assignments.filter(
    (a) => new Date(a.slot.event.startsAt) >= TODAY,
  );
  const pastAssignments = assignments.filter(
    (a) => new Date(a.slot.event.startsAt) < TODAY,
  );

  const registrations = eventRegistrations
    .filter((r) => r.personId === personId && r.status !== "cancelled")
    .map((r) => ({ registration: r, event: EVENTS_BY_ID.get(r.eventId)! }))
    .filter((r) => r.event)
    .sort((a, b) => b.event.startsAt.localeCompare(a.event.startsAt));

  const journey = visitorJourneys.find((j) => j.personId === personId) ?? null;
  const stage = journey
    ? (visitorStages.find((s) => s.id === journey.stageId) ?? null)
    : null;

  const blackouts = volunteerBlackouts.filter((b) => b.personId === personId);
  const availability = volunteerAvailability.filter(
    (a) => a.personId === personId,
  );

  /* Linha do tempo — montada só com o que o sistema realmente sabe */
  const timeline: TimelineEntry[] = [
    {
      id: "t-created",
      date: person.createdAt,
      label: "Cadastro criado",
      detail: null,
      kind: "record",
    },
  ];

  if (person.memberSince !== person.createdAt || person.status !== "visitor") {
    timeline.push({
      id: "t-membership",
      date: person.memberSince,
      label:
        person.status === "member"
          ? "Tornou-se membro"
          : person.status === "regular"
            ? "Passou a congregar"
            : "Início do vínculo",
      detail: unit?.name ?? null,
      kind: "membership",
    });
  }

  if (journey) {
    timeline.push({
      id: "t-visit",
      date: journey.firstVisitAt,
      label: "Primeira visita",
      detail: `${journey.visitCount} ${journey.visitCount === 1 ? "visita" : "visitas"} registradas`,
      kind: "visit",
    });
  }

  for (const m of personMinistries) {
    const profile = volunteerProfiles.find(
      (v) => v.personId === personId && v.ministryId === m.ministry.id,
    );
    if (profile) {
      timeline.push({
        id: `t-min-${m.ministry.id}`,
        date: profile.since,
        label: `Entrou no ministério de ${m.ministry.name}`,
        detail: m.isLeader ? "Como líder" : null,
        kind: "ministry",
      });
    }
  }

  if (group) {
    timeline.push({
      id: "t-group",
      date: group.startedAt > person.memberSince ? group.startedAt : person.memberSince,
      label: `Participa do ${group.name}`,
      detail:
        group.leaderId === personId
          ? "Como líder"
          : groupLeader
            ? `Líder: ${groupLeader.name}`
            : null,
      kind: "group",
    });
  }

  timeline.sort((a, b) => b.date.localeCompare(a.date));

  return {
    person,
    unit,
    family,
    familyRole: familyLink?.role ?? null,
    isGuardian: familyLink?.isGuardian ?? false,
    relatives,
    group,
    groupLeader,
    ministries: personMinistries,
    upcomingAssignments,
    pastAssignments,
    confirmedCount: pastAssignments.filter((a) => a.status === "confirmed").length,
    registrations,
    journey,
    stage,
    blackouts,
    availability,
    emergencyContacts: emergencyContacts.filter((c) => c.personId === personId),
    timeline,
  };
}

/** Pessoa anterior e seguinte na listagem, para navegar sem voltar. */
export function personNeighbours(personId: string, scope: Scope = ALL_UNITS) {
  const list = listPeople(scope);
  const index = list.findIndex((p) => p.id === personId);
  if (index === -1) return { previous: null, next: null, index: -1, total: list.length };
  return {
    previous: index > 0 ? list[index - 1]! : null,
    next: index < list.length - 1 ? list[index + 1]! : null,
    index,
    total: list.length,
  };
}

/* ================================================================== */
/* Perfil de pequeno grupo — tela de detalhe                           */
/* ================================================================== */

export function groupProfile(groupId: string) {
  const group = GROUPS_BY_ID.get(groupId);
  if (!group) return null;

  const stats = groupsWithStats(ALL_UNITS).find((g) => g.group.id === groupId);
  if (!stats) return null;

  const members = people
    .filter((p) => p.groupId === groupId)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const meetings = groupMeetings
    .filter((m) => m.groupId === groupId)
    .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor));

  const held = meetings.filter((m) => m.heldAt);
  const totalOffering = held.reduce((s, m) => s + m.offeringCents, 0);
  const totalVisitors = held.reduce((s, m) => s + m.visitorCount, 0);

  const series = held
    .slice()
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
    .map((m) => ({
      label: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }).format(new Date(m.scheduledFor)),
      value: m.presentCount,
    }));

  /** Participantes do grupo que também servem em algum ministério */
  const serving = members.filter((m) => m.ministryIds.length > 0);

  return {
    ...stats,
    unit: UNITS_BY_ID.get(group.unitId),
    members,
    meetings,
    series,
    totalOffering,
    totalVisitors,
    serving,
    nextMeeting: meetings.find((m) => !m.heldAt) ?? null,
  };
}
