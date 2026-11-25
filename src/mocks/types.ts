/**
 * Tipos da camada de dados do protótipo.
 *
 * Espelham o modelo relacional de docs/02-MODELO-DADOS.md. Quando o
 * Supabase entrar, estes tipos são substituídos pelos gerados por
 * `supabase gen types typescript` e só a camada de acesso muda —
 * os componentes continuam iguais.
 *
 * Dinheiro SEMPRE em centavos (inteiro). Ver AD-08.
 */

export type UUID = string;

export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  legalName: string;
  taxId: string;
  timezone: string;
}

export type UnitKind = "headquarters" | "congregation" | "preaching_point";

export interface Unit {
  id: UUID;
  organizationId: UUID;
  parentUnitId: UUID | null;
  name: string;
  slug: string;
  kind: UnitKind;
  city: string;
  state: string;
  isActive: boolean;
}

/* ------------------------------------------------------------------ */

export type MembershipStatus =
  | "member"
  | "regular"
  | "visitor"
  | "inactive"
  | "transferred";

export type Gender = "F" | "M";

export interface Person {
  id: UUID;
  unitId: UUID;
  name: string;
  gender: Gender;
  birthDate: string;
  phone: string;
  email: string | null;
  /** Situação do vínculo eclesiástico vigente (ver AD-06) */
  status: MembershipStatus;
  /** Início do vínculo atual */
  memberSince: string;
  /** Data do cadastro no sistema */
  createdAt: string;
  neighborhood: string;
  familyId: UUID | null;
  groupId: UUID | null;
  ministryIds: UUID[];
  isGuardian: boolean;
}

export interface Family {
  id: UUID;
  unitId: UUID;
  name: string;
  neighborhood: string;
}

/* ------------------------------------------------------------------ */

export interface VisitorStage {
  id: UUID;
  name: string;
  position: number;
  kind: "new" | "working" | "won" | "lost";
}

export type VisitorSource =
  | "convite_membro"
  | "redes_sociais"
  | "evento"
  | "espontaneo"
  | "site"
  | "pequeno_grupo";

export interface VisitorJourney {
  id: UUID;
  personId: UUID;
  stageId: UUID;
  ownerId: UUID;
  source: VisitorSource;
  firstVisitAt: string;
  visitCount: number;
  nextActionAt: string | null;
  nextActionLabel: string | null;
}

/* ------------------------------------------------------------------ */

export interface SmallGroup {
  id: UUID;
  unitId: UUID;
  name: string;
  category: string;
  weekday: number;
  startTime: string;
  neighborhood: string;
  capacity: number;
  leaderId: UUID;
  hostId: UUID;
  status: "active" | "paused" | "multiplied";
  startedAt: string;
}

export interface GroupMeeting {
  id: UUID;
  groupId: UUID;
  scheduledFor: string;
  heldAt: string | null;
  presentCount: number;
  visitorCount: number;
  offeringCents: number;
  reported: boolean;
}

/* ------------------------------------------------------------------ */

export interface Ministry {
  id: UUID;
  unitId: UUID;
  name: string;
  leaderId: UUID;
  color: string;
}

export interface Position {
  id: UUID;
  ministryId: UUID;
  name: string;
}

export type AssignmentStatus = "invited" | "confirmed" | "declined";

export interface ScheduleSlot {
  id: UUID;
  eventId: UUID;
  positionId: UUID;
  requiredCount: number;
}

export interface ScheduleAssignment {
  id: UUID;
  slotId: UUID;
  personId: UUID;
  status: AssignmentStatus;
  respondedAt: string | null;
}

/* ------------------------------------------------------------------ */

export type EventKind =
  | "culto"
  | "ensaio"
  | "reuniao"
  | "evento"
  | "curso"
  | "celula";

export interface ChurchEvent {
  id: UUID;
  unitId: UUID;
  kind: EventKind;
  title: string;
  startsAt: string;
  endsAt: string;
  roomId: UUID | null;
  capacity: number | null;
  expectedAttendance: number | null;
  actualAttendance: number | null;
}

export interface Room {
  id: UUID;
  unitId: UUID;
  name: string;
  capacity: number;
}

/* ------------------------------------------------------------------ */

export type TransactionKind = "income" | "expense";
export type TransactionStatus =
  | "pending"
  | "approved"
  | "paid"
  | "reconciled"
  | "reversed";

export interface FinancialAccount {
  id: UUID;
  unitId: UUID;
  name: string;
  kind: "bank" | "cash";
  openingBalanceCents: number;
}

export interface FinancialCategory {
  id: UUID;
  name: string;
  kind: TransactionKind;
}

export interface Transaction {
  id: UUID;
  unitId: UUID;
  accountId: UUID;
  categoryId: UUID;
  kind: TransactionKind;
  /** Sempre positivo. O sinal vem de `kind`. Ver AD-08. */
  amountCents: number;
  competenceDate: string;
  dueDate: string | null;
  status: TransactionStatus;
  description: string;
  personId: UUID | null;
  reversalOfId: UUID | null;
}

/* ================================================================== */
/* Famílias — Módulo 04                                                */
/* ================================================================== */

export type FamilyRole = "head" | "spouse" | "child" | "relative";

export interface FamilyMember {
  id: UUID;
  familyId: UUID;
  personId: UUID;
  role: FamilyRole;
  isGuardian: boolean;
}

export interface EmergencyContact {
  id: UUID;
  personId: UUID;
  name: string;
  phone: string;
  relationship: string;
}

/* ================================================================== */
/* Cultos — Módulo 09                                                  */
/* ================================================================== */

export type ServiceItemKind =
  | "worship"
  | "word"
  | "notice"
  | "offering"
  | "prayer"
  | "ordinance"
  | "welcome";

export interface Service {
  id: UUID;
  unitId: UUID;
  eventId: UUID;
  serviceType: string;
  theme: string | null;
  scripture: string | null;
  preacherId: UUID | null;
  hostId: UUID | null;
  notes: string | null;
}

export interface ServiceItem {
  id: UUID;
  serviceId: UUID;
  position: number;
  title: string;
  kind: ServiceItemKind;
  durationMinutes: number;
  responsibleId: UUID | null;
  notes: string | null;
}

/* ================================================================== */
/* Inscrições em eventos — Módulo 08                                   */
/* ================================================================== */

export type RegistrationStatus = "confirmed" | "waitlist" | "cancelled";

export interface EventRegistration {
  id: UUID;
  eventId: UUID;
  personId: UUID;
  status: RegistrationStatus;
  registeredAt: string;
  amountCents: number;
  paid: boolean;
}

/* ================================================================== */
/* Reservas de espaço — Módulos 08 e 12                                */
/* ================================================================== */

export type ReservationStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface RoomReservation {
  id: UUID;
  unitId: UUID;
  roomId: UUID;
  eventId: UUID | null;
  title: string;
  startsAt: string;
  endsAt: string;
  status: ReservationStatus;
  requestedById: UUID;
  approvedById: UUID | null;
  notes: string | null;
}

/* ================================================================== */
/* Voluntários — Módulo 07                                             */
/* ================================================================== */

export interface VolunteerProfile {
  id: UUID;
  personId: UUID;
  ministryId: UUID;
  positionIds: UUID[];
  /** Teto de escalas por mês definido pelo próprio voluntário */
  maxPerMonth: number;
  since: string;
}

export interface VolunteerAvailability {
  id: UUID;
  personId: UUID;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface VolunteerBlackout {
  id: UUID;
  personId: UUID;
  startsAt: string;
  endsAt: string;
  reason: string;
}
