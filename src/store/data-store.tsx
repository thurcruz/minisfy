"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { SEED_DATASET, type Dataset } from "@/mocks/queries";
import type { GroupMeeting, Person, Transaction } from "@/mocks/types";

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

/** Só as coleções que algum formulário altera são persistidas. */
type Persisted = Pick<
  Dataset,
  "people" | "groupMeetings" | "transactions" | "scheduleAssignments"
>;

/* ------------------------------------------------------------------ */
/* Fonte externa                                                       */
/* ------------------------------------------------------------------ */

let state: Persisted | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function readStorage(): Persisted | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Persisted) : null;
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

interface StoreValue {
  data: Dataset;
  /** true quando há alterações por cima do seed */
  dirty: boolean;
  createPerson: (input: NewPerson) => Person;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  archivePerson: (id: string) => void;
  reportMeeting: (meetingId: string, report: MeetingReport) => void;
  addTransaction: (input: NewTransaction) => Transaction;
  respondAssignment: (
    assignmentId: string,
    status: "confirmed" | "declined",
  ) => void;
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

  const data: Dataset = useMemo(
    () => (persisted ? { ...SEED_DATASET, ...persisted } : SEED_DATASET),
    [persisted],
  );

  const commit = useCallback(
    (next: Partial<Persisted>) => {
      const base: Persisted = persisted ?? {
        people: SEED_DATASET.people,
        groupMeetings: SEED_DATASET.groupMeetings,
        transactions: SEED_DATASET.transactions,
        scheduleAssignments: SEED_DATASET.scheduleAssignments,
      };
      publish({ ...base, ...next });
    },
    [persisted],
  );

  const createPerson = useCallback(
    (input: NewPerson) => {
      const person: Person = {
        ...input,
        id: `p-new-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString().slice(0, 10),
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
        id: `t-new-${Date.now().toString(36)}`,
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
          a.id === assignmentId
            ? {
                ...a,
                status,
                respondedAt: new Date().toISOString().slice(0, 10),
              }
            : a,
        ),
      });
    },
    [commit, data.scheduleAssignments],
  );

  const reset = useCallback(() => publish(null), []);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      dirty: persisted !== null,
      createPerson,
      updatePerson,
      archivePerson,
      reportMeeting,
      addTransaction,
      respondAssignment,
      reset,
    }),
    [
      data,
      persisted,
      createPerson,
      updatePerson,
      archivePerson,
      reportMeeting,
      addTransaction,
      respondAssignment,
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
