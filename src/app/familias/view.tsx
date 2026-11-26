"use client";

import { CircleAlert, Contact, Phone, Plus, ShieldAlert } from "lucide-react";
import { TODAY } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import { age, num, phone, shortName } from "@/lib/format";
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
import type { FamilyRole } from "@/mocks/types";


const ROLE_LABEL: Record<FamilyRole, string> = {
  head: "Responsável",
  spouse: "Cônjuge",
  child: "Filho(a)",
  relative: "Parente",
};

export function View() {
  const { familiesWithMembers, getEmergencyContacts, peopleWithoutFamily } = useQueries();
  const families = familiesWithMembers();
  const orphans = peopleWithoutFamily();

  const totalPeople = families.reduce((s, f) => s + f.members.length, 0);
  const totalChildren = families.reduce((s, f) => s + f.childCount, 0);
  const missingContact = families.flatMap((f) => f.childrenMissingContact);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Famílias"
        description={`${num(families.length)} núcleos · ${num(totalPeople)} pessoas vinculadas`}
        actions={
          <PlannedButton size="sm"
            reason="Cadastro de família ainda não construído"
          >
            <Plus />
            Nova família
          </PlannedButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Núcleos familiares" value={num(families.length)} />
        <Stat label="Pessoas vinculadas" value={num(totalPeople)} />
        <Stat label="Crianças" value={num(totalChildren)} />
        <Stat label="Sem família" value={num(orphans.length)} />
      </div>

      {missingContact.length > 0 && (
        <Card className="mt-6 border-warning/30 bg-warning-bg dark:bg-warning/10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
            <ShieldAlert className="size-4 shrink-0 text-warning" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-fg">
                {num(missingContact.length)}{" "}
                {missingContact.length === 1
                  ? "criança sem contato de emergência"
                  : "crianças sem contato de emergência"}
              </p>
              <p className="mt-0.5 text-[12px] text-fg-secondary">
                {missingContact.map((c) => shortName(c.person.name)).join(" · ")}
              </p>
            </div>
            <PlannedButton variant="secondary" size="sm"
              reason="Assistente de completar cadastros ainda não construído"
            >
              Completar cadastros
            </PlannedButton>
          </div>
        </Card>
      )}

      <h2 className="mb-3 mt-8 text-[15px] font-semibold text-fg">
        Todos os núcleos
      </h2>

      {families.length === 0 ? (
        <Card>
          <EmptyState
            icon={Contact}
            title="Nenhuma família cadastrada"
            description="Agrupe pessoas em núcleos familiares para organizar visitas, check-in infantil e comunicação."
            action={
              <PlannedButton size="sm"
                reason="Cadastro de família ainda não construído"
              >
                <Plus />
                Criar primeira família
              </PlannedButton>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {families.map((f) => (
            <Card key={f.family.id}>
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle>{f.family.name}</CardTitle>
                  <p className="mt-0.5 truncate text-[12px] text-fg-muted">
                    {f.family.neighborhood} · {f.unit?.name}
                  </p>
                </div>
                <Badge tone="outline">
                  <span className="tnum">{num(f.members.length)}</span>
                </Badge>
              </CardHeader>

              <ul className="divide-y divide-subtle">
                {f.members.map((m) => {
                  const years = age(m.person.birthDate, TODAY);
                  const contacts = getEmergencyContacts(m.person.id);
                  const needsContact = m.role === "child" && contacts.length === 0;
                  return (
                    <li
                      key={m.id}
                      className="flex items-center gap-2.5 px-5 py-2.5"
                    >
                      <Avatar name={m.person.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-fg">
                          {shortName(m.person.name)}
                        </span>
                        <span className="block truncate text-[12px] text-fg-muted">
                          {ROLE_LABEL[m.role]} · {years} anos
                        </span>
                      </span>
                      {needsContact && (
                        <span
                          title="Sem contato de emergência"
                          className="shrink-0 text-warning"
                        >
                          <CircleAlert className="size-3.5" />
                        </span>
                      )}
                      {m.isGuardian && (
                        <Badge tone="brand" className="shrink-0">
                          Guarda
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>

              {f.guardians.length > 0 && (
                <div className="border-t border-subtle px-5 py-2.5">
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-fg-muted">
                    Contato principal
                  </p>
                  <p className="flex items-center gap-1.5 text-[12px] text-fg-secondary">
                    <Phone className="size-3 shrink-0" />
                    <span className="tnum">
                      {phone(f.guardians[0]!.person.phone)}
                    </span>
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {orphans.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <div>
              <CardTitle>Pessoas sem família vinculada</CardTitle>
              <p className="mt-0.5 text-[12px] text-fg-muted">
                Nem todo mundo pertence a um núcleo — mas vale revisar
              </p>
            </div>
            <Badge tone="neutral">{num(orphans.length)}</Badge>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {orphans.slice(0, 40).map((person) => (
                <span
                  key={person.id}
                  className="flex items-center gap-1.5 rounded-full border border-subtle bg-canvas py-1 pl-1 pr-2.5"
                >
                  <Avatar name={person.name} size="xs" />
                  <span className="text-[12px] text-fg-secondary">
                    {shortName(person.name)}
                  </span>
                </span>
              ))}
              {orphans.length > 40 && (
                <span className="self-center text-[12px] text-fg-muted">
                  +{num(orphans.length - 40)}
                </span>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody className="py-4">
        <p className="text-[12px] text-fg-muted">{label}</p>
        <p className="tnum mt-1.5 font-display text-2xl font-semibold text-fg">
          {value}
        </p>
      </CardBody>
    </Card>
  );
}
