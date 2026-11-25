"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TODAY, units } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import { useStore } from "@/store/data-store";
import { Button } from "@/ui/button";
import { CheckboxPills, Field, Select, TextInput } from "@/ui/field";
import { Modal } from "@/ui/modal";
import type { Person } from "@/mocks/types";
import {
  personSchema,
  type PersonFormOutput,
  type PersonFormValues,
} from "./person-schema";

const STATUS_OPTIONS = [
  { value: "visitor", label: "Visitante" },
  { value: "regular", label: "Congregado" },
  { value: "member", label: "Membro" },
  { value: "inactive", label: "Inativo" },
  { value: "transferred", label: "Transferido" },
] as const;

function emptyValues(): PersonFormValues {
  return {
    name: "",
    gender: "F",
    birthDate: "",
    phone: "",
    email: "",
    neighborhood: "",
    unitId: units[0]!.id,
    status: "visitor",
    // TODAY e não new Date(): ler o relógio durante o render quebra
    // o prerender do Next 16, e o protótipo é determinístico de propósito.
    memberSince: TODAY.toISOString().slice(0, 10),
    groupId: "",
    ministryIds: [],
  };
}

function fromPerson(person: Person): PersonFormValues {
  return {
    name: person.name,
    gender: person.gender,
    birthDate: person.birthDate,
    phone: person.phone,
    email: person.email ?? "",
    neighborhood: person.neighborhood,
    unitId: person.unitId,
    status: person.status,
    memberSince: person.memberSince,
    groupId: person.groupId ?? "",
    ministryIds: person.ministryIds,
  };
}

export function PersonFormModal({
  open,
  onOpenChange,
  person,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ausente = cadastro novo */
  person?: Person;
  onSaved?: (person: Person) => void;
}) {
  const { createPerson, updatePerson } = useStore();
  const { groupsWithStats, ministriesWithStats } = useQueries();

  const groups = groupsWithStats();
  const ministries = ministriesWithStats();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormValues, unknown, PersonFormOutput>({
    resolver: zodResolver(personSchema),
    defaultValues: person ? fromPerson(person) : emptyValues(),
  });

  /* Reabrir o modal com outra pessoa precisa recarregar os campos */
  useEffect(() => {
    if (open) reset(person ? fromPerson(person) : emptyValues());
  }, [open, person, reset]);

  const status = useWatch({ control, name: "status" });

  const onSubmit = handleSubmit((values) => {
    const payload = {
      name: values.name,
      gender: values.gender,
      birthDate: values.birthDate,
      phone: values.phone,
      email: values.email === "" ? null : values.email,
      neighborhood: values.neighborhood,
      unitId: values.unitId,
      status: values.status,
      memberSince: values.memberSince,
      groupId: values.groupId === "" ? null : values.groupId,
      ministryIds: values.ministryIds,
    };

    // Atenção: `onSaved?.(createPerson(...))` NÃO funciona — com optional
    // chaining, se onSaved for indefinido o argumento nem é avaliado e o
    // cadastro silenciosamente não acontece. A gravação vem primeiro.
    let saved: Person;
    if (person) {
      updatePerson(person.id, payload);
      saved = { ...person, ...payload };
    } else {
      saved = createPerson(payload);
    }
    onSaved?.(saved);
    onOpenChange(false);
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={person ? "Editar pessoa" : "Nova pessoa"}
      description={
        person
          ? person.name
          : "Os campos marcados com * são obrigatórios."
      }
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button size="sm" type="submit" form="person-form" loading={isSubmitting}>
            {person ? "Salvar alterações" : "Cadastrar"}
          </Button>
        </>
      }
    >
      <form id="person-form" onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nome completo"
            required
            error={errors.name?.message}
            className="sm:col-span-2"
          >
            <TextInput
              {...register("name")}
              invalid={!!errors.name}
              placeholder="Maria Aparecida Souza"
              autoComplete="off"
            />
          </Field>

          <Field label="Data de nascimento" required error={errors.birthDate?.message}>
            <TextInput
              type="date"
              {...register("birthDate")}
              invalid={!!errors.birthDate}
            />
          </Field>

          <Field label="Gênero" required error={errors.gender?.message}>
            <Select {...register("gender")} invalid={!!errors.gender}>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
            </Select>
          </Field>

          <Field
            label="Telefone"
            required
            error={errors.phone?.message}
            hint="Com DDD, só números"
          >
            <TextInput
              {...register("phone")}
              invalid={!!errors.phone}
              inputMode="numeric"
              placeholder="19987654321"
            />
          </Field>

          <Field label="E-mail" error={errors.email?.message}>
            <TextInput
              type="email"
              {...register("email")}
              invalid={!!errors.email}
              placeholder="opcional"
              autoComplete="off"
            />
          </Field>

          <Field label="Bairro" required error={errors.neighborhood?.message}>
            <TextInput
              {...register("neighborhood")}
              invalid={!!errors.neighborhood}
              placeholder="Cambuí"
            />
          </Field>

          <Field label="Unidade" required error={errors.unitId?.message}>
            <Select {...register("unitId")} invalid={!!errors.unitId}>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="h-px bg-subtle" />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Situação" required error={errors.status?.message}>
            <Select {...register("status")} invalid={!!errors.status}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Na igreja desde"
            required
            error={errors.memberSince?.message}
          >
            <TextInput
              type="date"
              {...register("memberSince")}
              invalid={!!errors.memberSince}
            />
          </Field>

          <Field
            label="Pequeno grupo"
            error={errors.groupId?.message}
            className="sm:col-span-2"
          >
            <Select {...register("groupId")}>
              <option value="">Nenhum</option>
              {groups.map((g) => (
                <option key={g.group.id} value={g.group.id}>
                  {g.group.name} — {g.memberCount}/{g.group.capacity} vagas
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Ministérios"
          error={errors.ministryIds?.message}
          hint={
            status === "visitor"
              ? "Visitantes não entram em escala — mude a situação para vincular."
              : undefined
          }
        >
          <Controller
            control={control}
            name="ministryIds"
            render={({ field }) => (
              <CheckboxPills
                options={ministries.map((m) => ({
                  id: m.ministry.id,
                  label: m.ministry.name,
                }))}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Field>
      </form>
    </Modal>
  );
}
