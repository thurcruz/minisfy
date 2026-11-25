"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CircleAlert,
  Download,
  Lock,
  Plus,
} from "lucide-react";
import { useQueries } from "@/store/use-queries";
import { TransactionFormModal } from "@/modules/finance/transaction-form";
import { dateNumeric, delta, money, num } from "@/lib/format";
import { GroupedBarChart, HBarChart, Legend } from "@/ui/charts";
import { Button } from "@/ui/button";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
  Tr,
} from "@/ui/primitives";
import type { TransactionStatus } from "@/mocks/types";
import { cn } from "@/lib/utils";


const STATUS_LABEL: Record<TransactionStatus, string> = {
  pending: "Aguardando aprovação",
  approved: "Aprovado",
  paid: "Pago",
  reconciled: "Conciliado",
  reversed: "Estornado",
};

const STATUS_TONE: Record<
  TransactionStatus,
  "warning" | "brand" | "success" | "neutral" | "danger"
> = {
  pending: "warning",
  approved: "brand",
  paid: "success",
  reconciled: "neutral",
  reversed: "danger",
};

export function View() {
  const { balanceByAccount, currentBalance, expensesByCategory, financeSeries, financeSummary, getAccount, getCategory, listTransactions, upcomingPayables } = useQueries();
  const [formOpen, setFormOpen] = useState(false);

  const summary = financeSummary();
  const series = financeSeries(undefined, 6);
  const previous = series.at(-2);
  const balance = currentBalance();
  const accounts = balanceByAccount();
  const payables = upcomingPayables(undefined, 15);
  const byCategory = expensesByCategory();
  const transactions = listTransactions();

  const incomeDelta = previous
    ? (summary.incomeCents - previous.incomeCents) / previous.incomeCents
    : 0;
  const expenseDelta = previous
    ? (summary.expenseCents - previous.expenseCents) / previous.expenseCents
    : 0;
  const pendingApproval = payables.filter((t) => t.status === "pending");

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Financeiro"
        description="Novembro de 2026 · Comunidade Esperança · todas as unidades"
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Download />
              Exportar
            </Button>
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus />
              Novo lançamento
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardBody className="py-4">
            <p className="text-[12px] text-fg-muted">Saldo consolidado</p>
            <p className="tnum mt-1.5 font-display text-[26px] font-semibold leading-none text-fg">
              {money(balance)}
            </p>
            <p className="mt-2 text-[12px] text-fg-muted">
              {num(accounts.length)} contas
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="py-4">
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="size-3.5 text-success" />
              <p className="text-[12px] text-fg-muted">Entradas no mês</p>
            </div>
            <p className="tnum mt-1.5 font-display text-[26px] font-semibold leading-none text-fg">
              {money(summary.incomeCents)}
            </p>
            {previous && (
              <p
                className={cn(
                  "mt-2 text-[12px] font-medium",
                  incomeDelta >= 0 ? "text-success" : "text-danger",
                )}
              >
                {delta(incomeDelta)} vs. {previous.label}
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="py-4">
            <div className="flex items-center gap-1.5">
              <ArrowDownLeft className="size-3.5 text-danger" />
              <p className="text-[12px] text-fg-muted">Saídas no mês</p>
            </div>
            <p className="tnum mt-1.5 font-display text-[26px] font-semibold leading-none text-fg">
              {money(summary.expenseCents)}
            </p>
            {previous && (
              <p
                className={cn(
                  "mt-2 text-[12px] font-medium",
                  expenseDelta <= 0 ? "text-success" : "text-warning",
                )}
              >
                {delta(expenseDelta)} vs. {previous.label}
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="py-4">
            <p className="text-[12px] text-fg-muted">Resultado do mês</p>
            <p
              className={cn(
                "tnum mt-1.5 font-display text-[26px] font-semibold leading-none",
                summary.resultCents >= 0 ? "text-success" : "text-danger",
              )}
            >
              {money(summary.resultCents)}
            </p>
            <p className="mt-2 text-[12px] text-fg-muted">
              competência de novembro
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Entradas e saídas</CardTitle>
              <p className="mt-0.5 text-[12px] text-fg-muted">
                Últimos 6 meses
              </p>
            </div>
            <Legend
              items={[
                { label: "Entradas", color: "var(--chart-1)" },
                { label: "Saídas", color: "var(--chart-2)" },
              ]}
            />
          </CardHeader>
          <CardBody>
            <GroupedBarChart
              data={series.map((s) => ({
                label: s.label,
                values: [s.incomeCents, s.expenseCents],
              }))}
              seriesNames={["Entradas", "Saídas"]}
              format="moneyCompact"
              height={200}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Despesas por categoria</CardTitle>
            <span className="text-[12px] text-fg-muted">novembro</span>
          </CardHeader>
          <CardBody>
            {byCategory.length ? (
              <HBarChart
                data={byCategory.map((c) => ({
                  label: c.category.name,
                  value: c.cents,
                }))}
                format="money"
              />
            ) : (
              <EmptyState title="Nenhuma despesa no mês" />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Saldo por conta</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-subtle">
            {accounts.map(({ account, balanceCents }) => (
              <li
                key={account.id}
                className="flex items-center gap-3 px-5 py-3"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sunken text-fg-secondary">
                  <Banknote className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-fg">
                    {account.name}
                  </span>
                  <span className="block text-[11px] text-fg-muted">
                    {account.kind === "bank" ? "Conta bancária" : "Caixa"}
                  </span>
                </span>
                <span className="tnum shrink-0 text-[13px] font-medium text-fg">
                  {money(balanceCents)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-subtle px-5 py-3">
            <span className="text-[12px] font-medium text-fg-secondary">
              Total
            </span>
            <span className="tnum text-[13px] font-semibold text-fg">
              {money(balance)}
            </span>
          </div>
          <p className="border-t border-subtle px-5 py-2.5 text-[11px] leading-relaxed text-fg-muted">
            Saldo calculado a partir da razão (abertura + lançamentos
            liquidados). Nunca armazenado em coluna — ver AD-08.
          </p>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Contas a vencer</CardTitle>
            <Badge tone={pendingApproval.length ? "warning" : "neutral"}>
              {num(payables.length)} em 15 dias
            </Badge>
          </CardHeader>
          {payables.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Descrição</Th>
                  <Th className="hidden sm:table-cell">Situação</Th>
                  <Th numeric>Vencimento</Th>
                  <Th numeric>Valor</Th>
                </tr>
              </thead>
              <tbody>
                {payables.map((t) => (
                  <Tr key={t.id}>
                    <Td>
                      <p className="font-medium text-fg">{t.description}</p>
                      <p className="text-[12px] text-fg-muted">
                        {getCategory(t.categoryId)?.name}
                      </p>
                    </Td>
                    <Td className="hidden sm:table-cell">
                      <Badge tone={STATUS_TONE[t.status]}>
                        {STATUS_LABEL[t.status]}
                      </Badge>
                    </Td>
                    <Td numeric>{dateNumeric(t.dueDate!)}</Td>
                    <Td numeric className="font-medium text-fg">
                      {money(t.amountCents)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState
              title="Nenhuma conta a vencer"
              description="Não há despesas em aberto nos próximos 15 dias."
            />
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Lançamentos de novembro</CardTitle>
          <Badge tone="outline">{num(transactions.length)} registros</Badge>
        </CardHeader>
        <Table>
          <thead>
            <tr>
              <Th numeric className="w-24">
                Data
              </Th>
              <Th>Descrição</Th>
              <Th className="hidden lg:table-cell">Conta</Th>
              <Th className="hidden md:table-cell">Situação</Th>
              <Th numeric>Valor</Th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <Tr key={t.id}>
                <Td numeric>{dateNumeric(t.competenceDate)}</Td>
                <Td>
                  <p className="font-medium text-fg">{t.description}</p>
                  <p className="text-[12px] text-fg-muted">
                    {getCategory(t.categoryId)?.name}
                  </p>
                </Td>
                <Td className="hidden lg:table-cell">
                  {getAccount(t.accountId)?.name}
                </Td>
                <Td className="hidden md:table-cell">
                  <Badge tone={STATUS_TONE[t.status]}>
                    {STATUS_LABEL[t.status]}
                  </Badge>
                </Td>
                <Td
                  numeric
                  className={cn(
                    "font-medium",
                    t.kind === "income" ? "text-success" : "text-fg",
                  )}
                >
                  {t.kind === "income" ? "+" : "−"} {money(t.amountCents)}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-subtle bg-surface px-5 py-3.5 text-[12px] text-fg-muted">
        <span className="flex items-center gap-1.5">
          <Lock className="size-3.5" />
          Lançamento pago não é excluído — só estornado
        </span>
        <span className="flex items-center gap-1.5">
          <CircleAlert className="size-3.5" />
          Valores em centavos inteiros, nunca ponto flutuante
        </span>
      </div>

      {formOpen && <TransactionFormModal onOpenChange={setFormOpen} />}
    </div>
  );
}
