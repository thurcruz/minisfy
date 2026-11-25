"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Lock } from "lucide-react";
import { TODAY, units } from "@/mocks/queries";
import { useQueries } from "@/store/use-queries";
import { useStore } from "@/store/data-store";
import { money } from "@/lib/format";
import { Button } from "@/ui/button";
import { Field, Select, TextInput } from "@/ui/field";
import { Modal } from "@/ui/modal";
import { CurrencyInput } from "@/ui/number-field";
import type { TransactionKind, TransactionStatus } from "@/mocks/types";
import { cn } from "@/lib/utils";

const ISO_TODAY = TODAY.toISOString().slice(0, 10);

interface Errors {
  description?: string;
  amountCents?: string;
  categoryId?: string;
  accountId?: string;
  competenceDate?: string;
  dueDate?: string;
}

/**
 * Montado apenas quando aberto, então o estado nasce limpo a cada
 * abertura — sem efeito de reset.
 *
 * Conta e categoria não são sincronizadas por efeito: são derivadas
 * no render a partir da unidade e do tipo escolhidos. Trocar a unidade
 * simplesmente deixa de casar com a conta anterior, e o valor efetivo
 * volta para a primeira conta válida.
 */
export function TransactionFormModal({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const { addTransaction, data } = useStore();
  const { getCategory } = useQueries();

  const [kind, setKind] = useState<TransactionKind>("income");
  const [description, setDescription] = useState("");
  const [amountCents, setAmountCents] = useState(0);
  const [unitId, setUnitId] = useState(units[0]!.id);
  const [pickedAccountId, setPickedAccountId] = useState("");
  const [pickedCategoryId, setPickedCategoryId] = useState("");
  const [competenceDate, setCompetenceDate] = useState(ISO_TODAY);
  const [dueDate, setDueDate] = useState(ISO_TODAY);
  const [status, setStatus] = useState<TransactionStatus>("paid");
  const [errors, setErrors] = useState<Errors>({});

  const accounts = data.financialAccounts.filter((a) => a.unitId === unitId);
  const categories = data.financialCategories.filter((c) => c.kind === kind);

  const accountId = accounts.some((a) => a.id === pickedAccountId)
    ? pickedAccountId
    : (accounts[0]?.id ?? "");
  const categoryId = categories.some((c) => c.id === pickedCategoryId)
    ? pickedCategoryId
    : "";

  function validate(): Errors {
    const next: Errors = {};
    if (description.trim().length < 3)
      next.description = "Descreva o lançamento";
    if (amountCents <= 0) next.amountCents = "O valor deve ser maior que zero";
    if (!categoryId) next.categoryId = "Selecione a categoria";
    if (!accountId) next.accountId = "Selecione a conta";
    if (!competenceDate) next.competenceDate = "Informe a competência";
    if (kind === "expense" && dueDate && dueDate < competenceDate)
      next.dueDate = "O vencimento não pode anteceder a competência";
    return next;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    addTransaction({
      unitId,
      accountId,
      categoryId,
      kind,
      amountCents,
      competenceDate,
      dueDate: kind === "expense" ? dueDate : null,
      status,
      description: description.trim(),
    });
    onOpenChange(false);
  }

  const category = categoryId ? getCategory(categoryId) : null;

  return (
    <Modal
      open
      onOpenChange={onOpenChange}
      title="Novo lançamento"
      description="Valores em reais. Internamente o sistema guarda centavos inteiros."
      size="md"
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
          <Button size="sm" type="submit" form="transaction-form">
            Lançar
          </Button>
        </>
      }
    >
      <form id="transaction-form" onSubmit={submit} className="space-y-5" noValidate>
        {/* Tipo */}
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "income", label: "Entrada", icon: ArrowUpRight },
              { value: "expense", label: "Saída", icon: ArrowDownLeft },
            ] as const
          ).map((option) => {
            const active = kind === option.value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setKind(option.value)}
                aria-pressed={active}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-medium transition-colors",
                  active
                    ? "border-interactive bg-interactive text-interactive-fg"
                    : "border-line text-fg-secondary hover:bg-hover",
                )}
              >
                <Icon className="size-4" />
                {option.label}
              </button>
            );
          })}
        </div>

        <Field label="Descrição" required error={errors.description}>
          <TextInput
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            invalid={!!errors.description}
            placeholder={
              kind === "income" ? "Dízimos — 1ª semana" : "Conta de energia"
            }
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valor" required error={errors.amountCents}>
            <CurrencyInput
              value={amountCents}
              onChange={setAmountCents}
              invalid={!!errors.amountCents}
            />
          </Field>

          <Field label="Categoria" required error={errors.categoryId}>
            <Select
              value={categoryId}
              onChange={(e) => setPickedCategoryId(e.target.value)}
              invalid={!!errors.categoryId}
            >
              <option value="">Selecione…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Unidade" required>
            <Select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Conta" required error={errors.accountId}>
            <Select
              value={accountId}
              onChange={(e) => setPickedAccountId(e.target.value)}
              invalid={!!errors.accountId}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Competência"
            required
            error={errors.competenceDate}
            hint="Mês a que o lançamento pertence"
          >
            <TextInput
              type="date"
              value={competenceDate}
              onChange={(e) => setCompetenceDate(e.target.value)}
              invalid={!!errors.competenceDate}
            />
          </Field>

          {kind === "expense" && (
            <Field label="Vencimento" error={errors.dueDate}>
              <TextInput
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                invalid={!!errors.dueDate}
              />
            </Field>
          )}

          <Field
            label="Situação"
            required
            className={kind === "income" ? "sm:col-span-2" : undefined}
          >
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as TransactionStatus)}
            >
              <option value="pending">Aguardando aprovação</option>
              <option value="approved">Aprovado</option>
              <option value="paid">
                {kind === "income" ? "Recebido" : "Pago"}
              </option>
              <option value="reconciled">Conciliado</option>
            </Select>
          </Field>
        </div>

        {amountCents > 0 && category && (
          <p
            className={cn(
              "rounded-lg px-3.5 py-3 text-[13px]",
              kind === "income"
                ? "bg-success-bg text-success dark:bg-success/10"
                : "bg-danger-bg text-danger dark:bg-danger/10",
            )}
          >
            {kind === "income" ? "Entrada" : "Saída"} de{" "}
            <strong className="tnum font-semibold">{money(amountCents)}</strong>{" "}
            em {category.name}
          </p>
        )}

        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-fg-muted">
          <Lock className="mt-px size-3 shrink-0" />
          Lançamento confirmado não é excluído — a correção é por estorno, que
          gera um lançamento inverso rastreável (AD-08).
        </p>
      </form>
    </Modal>
  );
}
