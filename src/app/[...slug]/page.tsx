import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Construction } from "lucide-react";
import { navigation } from "@/config/navigation";
import { Button } from "@/ui/button";
import { Badge, Card, CardBody, PageHeader } from "@/ui/primitives";

/**
 * Rota de fallback para os módulos ainda não construídos.
 *
 * O item do menu NÃO é um botão morto: ele leva a uma página que diz
 * o que o módulo fará e em que fase do plano entra. Qualquer caminho
 * fora do menu cai em 404 normalmente.
 */

const DESCRIPTIONS: Record<string, string> = {
  "/familias":
    "Núcleos familiares, responsáveis, relacionamentos, endereço compartilhado e contatos de emergência.",
  "/discipulado":
    "Trilhas de discipulado, pares discipulador/discípulo e acompanhamento de progresso.",
  "/voluntarios":
    "Perfis de voluntário, habilidades, disponibilidade, bloqueios e histórico de serviço.",
  "/cultos":
    "Planejamento de culto: ordem, preletor, dirigente, equipes e programação item a item.",
  "/eventos":
    "Eventos com inscrição, capacidade, checklist e lista de presença.",
  "/reservas":
    "Reserva de salas e auditórios com bloqueio de conflito garantido pelo banco.",
  "/patrimonio":
    "Inventário, categorias, responsáveis, manutenção e empréstimo de bens.",
  "/estoque":
    "Itens, entradas, saídas, movimentações e alerta de estoque mínimo.",
  "/infraestrutura":
    "Ocorrências, solicitações de manutenção e histórico de uso dos ambientes.",
  "/pastoral":
    "Área de acesso restrito: solicitações, agendamento, encaminhamentos e registros de atendimento. Fica em schema isolado, fora da API pública.",
  "/oracao":
    "Pedidos de oração com visibilidade granular e acompanhamento de respostas.",
  "/escola-biblica":
    "Classes, turmas, professores, matrículas, frequência e materiais.",
  "/cursos":
    "Cursos, trilhas de formação, certificados e histórico do aluno.",
  "/comunicados":
    "Comunicados segmentados por unidade, ministério e pequeno grupo.",
  "/mensagens":
    "Mensagens diretas por e-mail e WhatsApp, respeitando consentimento no momento do envio.",
  "/campanhas":
    "Campanhas com modelos, agendamento e histórico de entregas.",
  "/relatorios":
    "Central de relatórios com filtros, comparativos, exportação e consolidação multiunidade.",
  "/intelligence":
    "Assistente que responde em linguagem natural usando um catálogo fechado de consultas — nunca SQL livre, sempre respeitando a permissão de quem pergunta.",
  "/flow":
    "Automações: gatilhos, condições, ações e log de execução.",
  "/config/organizacao": "Dados da organização, plano e preferências gerais.",
  "/config/unidades": "Árvore de unidades: sede, congregações e pontos de pregação.",
  "/config/usuarios": "Contas de acesso, convites e vínculos com a organização.",
  "/config/permissoes":
    "Papéis de sistema, papéis personalizados e permissões por módulo e unidade.",
  "/config/pass":
    "Carteirinha digital, QR com token opaco, check-in de evento e check-in infantil.",
  "/config/integracoes":
    "Google Calendar, YouTube, WhatsApp, e-mail, pagamentos e webhooks.",
  "/config/preferencias": "Preferências de conta, idioma, tema e notificações.",
};

/**
 * Pré-renderiza exatamente os caminhos que existem no menu.
 * Qualquer outro caminho cai no notFound() do próprio componente.
 */
export function generateStaticParams() {
  return navigation
    .flatMap((group) => group.items)
    .filter((item) => item.status === "planned")
    .map((item) => ({ slug: item.href.replace(/^\//, "").split("/") }));
}

export default async function PlannedModulePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const href = `/${slug.join("/")}`;

  const item = navigation
    .flatMap((group) => group.items.map((i) => ({ ...i, group: group.label })))
    .find((i) => i.href === href);

  if (!item) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={item.label} description={item.group} />

      <Card>
        <CardBody className="py-10 text-center">
          <span className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-sunken text-fg-muted">
            <Construction className="size-5" />
          </span>

          <Badge tone="brand" size="md">
            {item.phase ?? "Planejado"}
          </Badge>

          <p className="mx-auto mt-4 max-w-md text-[13px] leading-relaxed text-fg-secondary">
            {DESCRIPTIONS[href] ??
              "Módulo previsto no plano de desenvolvimento, ainda não construído."}
          </p>

          <p className="mx-auto mt-4 max-w-md text-[12px] leading-relaxed text-fg-muted">
            Esta tela existe de propósito: o item do menu não é um botão morto,
            ele informa o estado real do módulo. O escopo e os critérios de
            aceite estão em <code>docs/04-PLANO.md</code>.
          </p>

          <div className="mt-7">
            <Button variant="secondary" size="sm" asChild>
              <Link href="/">
                <ArrowLeft />
                Voltar ao dashboard
              </Link>
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
