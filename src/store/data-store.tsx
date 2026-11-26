"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { SEED_DATASET, TODAY, currentUserId } from "@/mocks/queries";
import type { Dataset } from "@/mocks/queries";
import type {
  ChurchEvent,
  GroupMeeting,
  Person,
  ReservationStatus,
  RoomReservation,
  SmallGroup,
  Transaction,
  VisitorJourney,
} from "@/mocks/types";

/**
 * Store do protótipo.
 *
 * É o "banco de dados" temporário: começa no seed e guarda no
 * localStorage o que os formulários salvam. Vale só neste navegador —
 * não é sincronizado, não é compartilhado, e some ao limpar os dados
 * do site. É exatamente o buraco que a Fase 1 (Supabase) fecha.
 *
 * A leitura passa por `useSyncExternalStore` com um snapshot de
 * servidor nulo: o HTML renderizado no servidor usa o seed, e o React
 * troca pelo conteúdo do localStorage logo após hidratar, sem efeito
 * colateral e sem divergência de marcação.
 */

const STORAGE_KEY = "minisfy.prototype.v1";

/**
 * Data de referência do protótipo, não o relógio da máquina: todo o
 * seed é construído em torno dela, e um registro gravado com a data
 * real apareceria fora de ordem nas telas.
 */
const ISO_TODAY = TODAY.toISOString().slice(0, 10);

/** Só as coleções que algum formulário altera são persistidas. */
type Persisted = Pick<
  Dataset,
  | "people"
  | "groupMeetings"
  | "transactions"
  | "scheduleAssignments"
  | "visitorJourneys"
  | "smallGroups"
  | "events"
  | "roomReservations"
>;

const PERSISTED_KEYS = [
  "people",
  "groupMeetings",
  "transactions",
  "scheduleAssignments",
  "visitorJourneys",
  "smallGroups",
  "events",
  "roomReservations",
] as const satisfies readonly (keyof Persisted)[];

/* ------------------------------------------------------------------ */
/* Fonte externa                                                       */
/* ------------------------------------------------------------------ */

let state: Persisted | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function readStorage(): Persisted | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    /**
     * Uma versão anterior pode ter gravado menos coleções. Completar
     * com o seed evita que a tela quebre com `undefined.filter`
     * depois de uma atualização do protótipo.
     */
    const merged = {} as Persisted;
    for (const key of PERSISTED_KEYS) {
      // @ts-expect-error — chaves homogêneas, tipos por coleção
      merged[key] = parsed[key] ?? SEED_DATASET[key];
    }
    return merged;
  } catch {
    // Janela anônima, armazenamento bloqueado ou JSON corrompido:
    // o protótipo segue funcionando a partir do seed.
    return null;
  }
}

function getSnapshot(): Persisted | null {
  if (!loaded) {
    state = readStorage();
    loaded = true;
  }
  return state;
}

/** No servidor não há localStorage: renderiza sempre o seed. */
function getServerSnapshot(): Persisted | null {
  return null;
}

const TRUE_SNAPSHOT = () => true;
const FALSE_SNAPSHOT = () => false;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function publish(next: Persisted | null) {
  state = next;
  loaded = true;
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* sem persistência; a sessão atual continua válida */
  }
  for (const listener of listeners) listener();
}

/** Identificador local — o banco usará uuid gerado pelo próprio Postgres. */
let sequence = 0;
function localId(prefix: string) {
  sequence += 1;
  return `${prefix}-new-${Date.now().toString(36)}${sequence.toString(36)}`;
}

/* ------------------------------------------------------------------ */
/* Contexto                                                            */
/* ------------------------------------------------------------------ */

export type NewPerson = Pick<
  Person,
  | "name"
  | "gender"
  | "birthDate"
  | "phone"
  | "email"
  | "status"
  | "unitId"
  | "neighborhood"
  | "groupId"
  | "ministryIds"
> & { memberSince: string };

export interface MeetingReport {
  presentCount: number;
  visitorCount: number;
  offeringCents: number;
}

export type NewTransaction = Pick<
  Transaction,
  | "unitId"
  | "accountId"
  | "categoryId"
  | "kind"
  | "amountCents"
  | "competenceDate"
  | "dueDate"
  | "status"
  | "description"
>;

export type NewGroup = Pick<
  SmallGroup,
  | "unitId"
  | "name"
  | "category"
  | "weekday"
  | "startTime"
  | "neighborhood"
  | "capacity"
  | "leaderId"
  | "hostId"
>;

export type NewEvent = Pick<
  ChurchEvent,
  | "unitId"
  | "kind"
  | "title"
  | "startsAt"
  | "endsAt"
  | "roomId"
  | "capacity"
  | "expectedAttendance"
>;

export type NewReservation = Pick<
  RoomReservation,
  "unitId" | "roomId" | "title" | "startsAt" | "endsAt" | "requestedById" | "notes"
>;

export interface Followup {
  label: string;
  date: string | null;
}

interface StoreValue {
  data: Dataset;
  /** true quando há alterações por cima do seed */
  dirty: boolean;
  /**
   * false no HTML do servidor, true depois de hidratar.
   *
   * Uma tela de detalhe precisa disto: no servidor o dataset é sempre
   * o seed, então um registro criado no protótipo "não existe" ali.
   * Chamar notFound() nesse momento mandaria a pessoa para o 404 de um
   * cadastro que ela acabou de fazer.
   */
  hydrated: boolean;
  createPerson: (input: NewPerson) => Person;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  archivePerson: (id: string) => void;
  reportMeeting: (meetingId: string, report: MeetingReport) => void;
  addTransaction: (input: NewTransaction) => Transaction;
  respondAssignment: (
    assignmentId: string,
    status: "confirmed" | "declined",
  ) => void;
  moveVisitor: (journeyId: string, stageId: string) => void;
  logVisit: (journeyId: string) => void;
  setFollowup: (journeyId: string, followup: Followup) => void;
  createGroup: (input: NewGroup) => SmallGroup;
  createEvent: (input: NewEvent, options?: { bookRoom?: boolean }) => ChurchEvent;
  createReservation: (input: NewReservation) => RoomReservation;
  decideReservation: (id: string, status: ReservationStatus) => void;
  reset: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function DataStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const persisted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  /* Sem efeito: o React já troca o snapshot do servidor ao hidratar. */
  const hydrated = useSyncExternalStore(
    subscribe,
    TRUE_SNAPSHOT,
    FALSE_SNAPSHOT,
  );

  const data: Dataset = useMemo(
    () => (persisted ? { ...SEED_DATASET, ...persisted } : SEED_DATASET),
    [persisted],
  );

  const commit = useCallback(
    (next: Partial<Persisted>) => {
      const base = {} as Persisted;
      for (const key of PERSISTED_KEYS) {
        // @ts-expect-error — chaves homogêneas, tipos por coleção
        base[key] = data[key];
      }
      publish({ ...base, ...next });
    },
    [data],
  );

  const createPerson = useCallback(
    (input: NewPerson) => {
      const person: Person = {
        ...input,
        id: localId("p"),
        createdAt: ISO_TODAY,
        familyId: null,
        isGuardian: false,
      };
      commit({ people: [...data.people, person] });
      return person;
    },
    [commit, data.people],
  );

  const updatePerson = useCallback(
    (id: string, patch: Partial<Person>) => {
      commit({
        people: data.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      });
    },
    [commit, data.people],
  );

  const archivePerson = useCallback(
    (id: string) => {
      commit({
        people: data.people.map((p) =>
          p.id === id ? { ...p, status: "inactive", groupId: null } : p,
        ),
      });
    },
    [commit, data.people],
  );

  const reportMeeting = useCallback(
    (meetingId: string, report: MeetingReport) => {
      const next: GroupMeeting[] = data.groupMeetings.map((m) =>
        m.id === meetingId
          ? {
              ...m,
              ...report,
              heldAt: m.heldAt ?? m.scheduledFor,
              reported: true,
            }
          : m,
      );
      commit({ groupMeetings: next });
    },
    [commit, data.groupMeetings],
  );

  const addTransaction = useCallback(
    (input: NewTransaction) => {
      const transaction: Transaction = {
        ...input,
        id: localId("t"),
        personId: null,
        reversalOfId: null,
      };
      commit({ transactions: [...data.transactions, transaction] });
      return transaction;
    },
    [commit, data.transactions],
  );

  const respondAssignment = useCallback(
    (assignmentId: string, status: "confirmed" | "declined") => {
      commit({
        scheduleAssignments: data.scheduleAssignments.map((a) =>
          a.id === assignmentId ? { ...a, status, respondedAt: ISO_TODAY } : a,
        ),
      });
    },
    [commit, data.scheduleAssignments],
  );

  /* ---------------------------------------------------------------- */
  /* Funil de visitantes                                              */
  /* ---------------------------------------------------------------- */

  const patchJourney = useCallback(
    (journeyId: string, patch: Partial<VisitorJourney>) => {
      commit({
        visitorJourneys: data.visitorJourneys.map((j) =>
          j.id === journeyId ? { ...j, ...patch } : j,
        ),
      });
    },
    [commit, data.visitorJourneys],
  );

  /**
   * Mover para etapa final encerra a tarefa de contato: deixar uma
   * pendência aberta num visitante já integrado (ou perdido) suja a
   * lista de vencidos e some com o número que importa.
   */
  const moveVisitor = useCallback(
    (journeyId: string, stageId: string) => {
      const stage = data.visitorStages.find((s) => s.id === stageId);
      const closes = stage?.kind === "won" || stage?.kind === "lost";
      patchJourney(journeyId, {
        stageId,
        ...(closes ? { nextActionAt: null, nextActionLabel: null } : {}),
      });
    },
    [data.visitorStages, patchJourney],
  );

  const logVisit = useCallback(
    (journeyId: string) => {
      const journey = data.visitorJourneys.find((j) => j.id === journeyId);
      if (!journey) return;
      patchJourney(journeyId, { visitCount: journey.visitCount + 1 });
    },
    [data.visitorJourneys, patchJourney],
  );

  const setFollowup = useCallback(
    (journeyId: string, followup: Followup) => {
      patchJourney(journeyId, {
        nextActionLabel: followup.label.trim() || null,
        nextActionAt: followup.date,
      });
    },
    [patchJourney],
  );

  /* ---------------------------------------------------------------- */
  /* Criação de grupo, evento e reserva                               */
  /* ---------------------------------------------------------------- */

  /**
   * Líder e anfitrião passam a participar do grupo que abriram — é o
   * que acontece na prática, e sem isso o grupo nasce com zero
   * participantes e as médias saem erradas.
   */
  const createGroup = useCallback(
    (input: NewGroup) => {
      const group: SmallGroup = {
        ...input,
        id: localId("g"),
        status: "active",
        startedAt: ISO_TODAY,
      };
      const moving = new Set([input.leaderId, input.hostId]);
      commit({
        smallGroups: [...data.smallGroups, group],
        people: data.people.map((p) =>
          moving.has(p.id) ? { ...p, groupId: group.id } : p,
        ),
      });
      return group;
    },
    [commit, data.people, data.smallGroups],
  );

  /**
   * Evento com sala reserva a sala no mesmo gesto: no banco a reserva
   * é a linha que a EXCLUDE constraint do AD-10 protege, então marcar
   * a sala no evento sem gravar a reserva deixaria o espaço livre para
   * outro grupo pedir.
   */
  const createEvent = useCallback(
    (input: NewEvent, options?: { bookRoom?: boolean }) => {
      const event: ChurchEvent = {
        ...input,
        id: localId("e"),
        actualAttendance: null,
      };
      const next: Partial<Persisted> = { events: [...data.events, event] };

      if (input.roomId && options?.bookRoom !== false) {
        const reservation: RoomReservation = {
          id: localId("rr"),
          unitId: input.unitId,
          roomId: input.roomId,
          eventId: event.id,
          title: input.title,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          status: "approved",
          requestedById: currentUserId,
          approvedById: currentUserId,
          notes: "Reserva criada junto com o evento",
        };
        next.roomReservations = [...data.roomReservations, reservation];
      }

      commit(next);
      return event;
    },
    [commit, data.events, data.roomReservations],
  );

  const createReservation = useCallback(
    (input: NewReservation) => {
      const reservation: RoomReservation = {
        ...input,
        id: localId("rr"),
        eventId: null,
        status: "pending",
        approvedById: null,
      };
      commit({ roomReservations: [...data.roomReservations, reservation] });
      return reservation;
    },
    [commit, data.roomReservations],
  );

  const decideReservation = useCallback(
    (id: string, status: ReservationStatus) => {
      commit({
        roomReservations: data.roomReservations.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                approvedById: status === "approved" ? currentUserId : null,
              }
            : r,
        ),
      });
    },
    [commit, data.roomReservations],
  );

  const reset = useCallback(() => publish(null), []);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      dirty: persisted !== null,
      hydrated,
      createPerson,
      updatePerson,
      archivePerson,
      reportMeeting,
      addTransaction,
      respondAssignment,
      moveVisitor,
      logVisit,
      setFollowup,
      createGroup,
      createEvent,
      createReservation,
      decideReservation,
      reset,
    }),
    [
      data,
      persisted,
      hydrated,
      createPerson,
      updatePerson,
      archivePerson,
      reportMeeting,
      addTransaction,
      respondAssignment,
      moveVisitor,
      logVisit,
      setFollowup,
      createGroup,
      createEvent,
      createReservation,
      decideReservation,
      reset,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) {
    throw new Error("useStore precisa estar dentro de <DataStoreProvider>");
  }
  return value;
}
