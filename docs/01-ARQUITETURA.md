# 01 — Arquitetura Recomendada

> Cada decisão traz as alternativas consideradas e a recomendação. As marcadas **⚠️** são caras de reverter e precisam da sua aprovação explícita.

---

## AD-01 · Stack base — **Next.js 16 (App Router) + React 19 + TypeScript strict**

> Instalado: Next 16.4.6 · React 19.3 · Tailwind 4.3.3 · Turbopack.

**Alternativas:** (a) Next.js App Router · (b) Vite SPA + API separada (NestJS/Fastify) · (c) Remix.

**Recomendação: (a).** Motivos concretos para *este* produto:

- Server Components eliminam a maior parte do JSON que trafegaria em telas densas (listas de membros, tabelas financeiras, relatórios).
- Server Actions dão mutações com validação no servidor sem construir uma camada REST inteira — reduzindo a superfície onde alguém "esquece" de checar permissão.
- Route Handlers cobrem o que precisa ser público ou externo: webhooks (pagamento, WhatsApp), formulário público de visitantes, páginas de evento, feed ICS para Google Calendar.
- Streaming/Suspense resolve um dashboard com 8 widgets de origens diferentes sem travar a tela.

**Contra (b):** duplicaria autenticação, tipos e deploy sem ganho nesta fase. Vale reconsiderar quando um app mobile nativo entrar no roadmap — e aí a API pública vira um pacote adicional, não uma reescrita.

**Configuração inegociável:** `strict: true`, `noUncheckedIndexedAccess: true` e build que falha com erro de TS. A regra "não ignore erros de TypeScript" só é executável se o CI quebrar.

---

## AD-02 · Backend — **Supabase (Postgres + Auth + Storage + Edge Functions)**

Postgres gerenciado com RLS é exatamente o que um SaaS multi-tenant precisa, e a CLI já está instalada nesta máquina — migrations versionadas e `supabase gen types typescript` desde o dia 1. Os tipos do banco viram a fonte de verdade do TypeScript, eliminando o descompasso entre schema e código.

**Divisão de responsabilidade:**

| Camada | Responde por |
|---|---|
| RLS (Postgres) | quem pode **ver/alterar uma linha** |
| Server Actions / Route Handlers | regras de negócio, transações, orquestração |
| Edge Functions | o que roda fora do request: webhooks assinados, envio em massa, jobs `pg_cron`, geração de PDF |
| Frontend | **nunca** é camada de segurança — esconde o que o usuário não pode usar, não decide se ele pode |

---

## AD-03 · ⚠️ Multi-tenancy — **schema compartilhado + `organization_id` + RLS**

| Modelo | Isolamento | Migrations | Relatório consolidado multiunidade | Custo |
|---|---|---|---|---|
| (a) Schema compartilhado + `org_id` + RLS | lógico (policy) | 1 conjunto | trivial | baixo |
| (b) Schema por tenant | forte | N schemas | caro (UNION dinâmico) | médio |
| (c) Banco por tenant | máximo | N bancos | muito caro | alto |

**Recomendação: (a).** O Módulo 20 (multiunidades, relatórios consolidados, transferência de pessoas entre unidades) é requisito de produto — e é exatamente o que (b) e (c) tornam doloroso. (a) também é o único que escala para milhares de igrejas pequenas sem custo proibitivo.

**O risco real de (a):** uma tabela sem policy vaza *tudo*. Mitigação obrigatória, implementada na Fase 0 e rodando no CI:

1. Teste que falha o build se **qualquer** tabela em `public` estiver sem RLS ativa **ou** sem ao menos uma policy.
2. Suíte pgTAP que, para cada módulo, autentica como usuário da Org A e afirma que `SELECT`, `UPDATE` e `DELETE` sobre dados da Org B retornam zero linhas.
3. `REVOKE ALL ON SCHEMA public FROM anon;` — acesso anônimo é concedido tabela a tabela, nunca por padrão.

Sem esses três itens, (a) é imprudente. Com eles, é a escolha certa.

### Hierarquia

```
organizations ──< units   (árvore auto-referenciada: sede → congregação → ponto de pregação)
```

**Não** criaremos uma entidade `churches` separada entre organização e unidade. Uma árvore de `units` com `parent_unit_id` cobre o caso simples (1 igreja, 1 unidade), o médio (sede + congregações) e o complexo (rede com regionais), sem forçar três níveis em quem só precisa de um.

---

## AD-04 · ⚠️ Performance da RLS — **função estável agora, JWT claims depois**

Este detalhe decide se o sistema é usável com 10.000 membros.

A policy ingênua é reavaliada **por linha** — numa tabela de 50 mil pessoas, são 50 mil subconsultas:

```sql
-- ❌ não fazer
USING (organization_id IN (
  SELECT organization_id FROM memberships WHERE profile_id = auth.uid()
))
```

**Fase 1 — função estável.** O `(SELECT ...)` externo força o planner a tratar o resultado como constante, avaliando uma vez por statement:

```sql
create or replace function app.current_org_ids()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $func$
  select coalesce(array_agg(m.organization_id), '{}'::uuid[])
  from public.memberships m
  where m.profile_id = (select auth.uid())
    and m.status = 'active'
$func$;

-- na policy:
USING (organization_id = any ((select app.current_org_ids())))
```

**Fase 2 — claims no JWT.** Quando houver volume, mover organizações e papéis para o token via *Custom Access Token Hook* do Supabase Auth. A policy passa a ler o JWT, sem tocar em tabela alguma.

**Trade-off honesto do JWT:** claims ficam obsoletos até o refresh (~1h) — revogar acesso não teria efeito imediato. Mitigação: coluna `security_version` na organização, incluída no token; a policy exige que bata com o valor atual, então qualquer mudança de permissão invalida todos os tokens antigos. Por isso começamos pela função (simples e sempre correta) e só otimizamos ao medir necessidade.

---

## AD-05 · Permissões — **RBAC com escopo por unidade e catálogo estático**

```
memberships ──< membership_roles >── roles ──< role_permissions >── permissions
                      │
                      └── unit_id NULL = vale para a organização inteira
```

- `permissions` é um **catálogo fixo em migration**, não dado editável pelo usuário. Chaves no formato `modulo.recurso.acao` (`financeiro.transacao.aprovar`, `pessoas.membro.exportar`). Isso permite tipagem literal no TypeScript — um typo em `can('financiero.…')` vira erro de compilação, não bug em produção.
- `roles` contém papéis de sistema (`is_system = true`, imutáveis) e papéis personalizados por organização, atendendo à exigência de funções customizadas.
- Permissão efetiva = união dos papéis do vínculo, filtrada pelo escopo de unidade.

**Três camadas de verificação, sempre:**

1. RLS no banco — a rede de segurança final;
2. `requirePermission()` na primeira linha de **toda** Server Action, sem exceção;
3. navegação e botões na UI — conveniência, nunca segurança.

---

## AD-06 · ⚠️ Identidade — **separar `profiles` de `people`**

É o erro estrutural mais comum em sistemas de igreja e o mais caro de corrigir depois.

| Entidade | O que é |
|---|---|
| `auth.users` | credencial de login (gerida pelo Supabase) |
| `profiles` | a conta de usuário (1:1 com `auth.users`), global, não pertence a nenhuma organização |
| `memberships` | vínculo de uma conta com uma organização, com seus papéis |
| `people` | um **ser humano conhecido pela igreja** — pertence à organização, pode nunca ter login |
| `church_memberships` | o **vínculo eclesiástico** dessa pessoa com uma unidade, **ao longo do tempo** |

Por que importa:

- A maioria dos membros nunca fará login. Criar `auth.users` para todos é inviável e caro.
- Um pastor que atende duas organizações tem **um** `profile` e **dois** `memberships`.
- Situação de membresia (visitante → congregado → membro → transferido → inativo) é **histórico**, não uma coluna que se sobrescreve. Modelada como linha com `started_at`/`ended_at`, o Módulo 18 ganha de graça: crescimento real, transferências, reativações, tempo médio até a membresia.
- A conversão visitante → membro (Módulo 03) vira a inserção de uma nova linha de vínculo — o histórico se preserva automaticamente, sem código especial.

`people.profile_id` é nullable e liga os dois mundos quando a pessoa ativa o Portal do Membro.

---

## AD-07 · ⚠️ Dados pastorais — **schema `pastoral`, fora do PostgREST**

O Módulo 13 contém o dado mais sensível do produto: aconselhamento, crises familiares, saúde mental. Um vazamento aqui é dano irreversível a pessoas reais e incidente grave de LGPD (dado sensível, Art. 5º II).

**Recomendação:** essas tabelas **não** ficam em `public`. Vão para um schema `pastoral`, que não é exposto pela API REST do Supabase. O acesso acontece apenas por funções `SECURITY DEFINER` explícitas, que validam o papel pastoral antes de retornar qualquer coisa.

Consequência prática: é **impossível** vazar via `?select=*` ou por uma policy esquecida — a rota HTTP nem existe. Além disso:

- excluído por padrão da busca global;
- excluído do catálogo de ferramentas do Minisfy Intelligence (AD-09);
- **toda leitura é auditada**, não só escrita. Em dado pastoral, quem leu importa tanto quanto quem alterou.

---

## AD-08 · Dinheiro — **inteiros em centavos, razão imutável**

- `bigint` em centavos. Nunca ponto flutuante. `numeric` apenas em agregações de relatório.
- `amount_cents` sempre positivo; o sinal vem de `kind` (`income` | `expense`).
- **Lançamento confirmado não é excluído.** Estorno gera lançamento inverso com `reversal_of_id`, atendendo diretamente à regra "não permita exclusão silenciosa de movimentações confirmadas" — e é o que um conselho fiscal espera encontrar.
- Transferência entre contas = duas linhas sob o mesmo `transfer_group_id`, criadas na mesma transação.
- Fechamento de período trava as linhas: trigger bloqueia `UPDATE`/`DELETE` em lançamento com `locked_by_closing_id` preenchido.
- Toda escrita passa por trigger de auditoria gravando `before`/`after` em `jsonb`.

---

## AD-09 · Minisfy Intelligence — **ferramentas tipadas, nunca SQL livre**

O LLM **não** escreve SQL. Recebe um catálogo fechado de funções (`contar_visitantes(periodo)`, `escalas_incompletas(unidade)`, `resumo_financeiro(periodo)`), e cada uma:

- executa **na sessão do usuário**, com RLS ativa — o assistente não enxerga o que o usuário não enxergaria;
- valida parâmetros com Zod antes de chegar ao banco;
- registra log da pergunta, das ferramentas chamadas e das linhas retornadas.

Texto-para-SQL sobre um banco multi-tenant com dado pastoral é inaceitável: uma injeção de prompt bem construída viraria exfiltração. O custo é um catálogo que cresce módulo a módulo — aceitável, e que torna as respostas determinísticas e auditáveis.

A resposta sempre cita números vindos do banco. Se a ferramenta não retornou dado, o assistente diz que não sabe — nunca estima, nunca afirma ter executado uma ação sem confirmação do sistema.

---

## AD-10 · Conflitos de agenda — **resolver no schema, não no código**

Reserva de sala validada na aplicação falha sob concorrência — duas pessoas reservando no mesmo instante passam as duas. Postgres resolve estruturalmente:

```sql
alter table room_reservations
  add column during tstzrange
  generated always as (tstzrange(starts_at, ends_at, '[)')) stored;

alter table room_reservations
  add constraint no_double_booking
  exclude using gist (room_id with =, during with &&)
  where (status <> 'cancelled');
```

Reserva sobreposta passa a ser **impossível**, não apenas improvável. O mesmo padrão cobre conflito de horário de voluntário no Módulo 07.

---

## AD-11 · Minisfy Pass — **token opaco, validação no servidor**

- O QR **nunca** contém `person_id`, nome ou qualquer dado pessoal. Carrega um token aleatório opaco (`person_credentials.token`), revogável e rotacionável.
- Validação sempre no servidor: o leitor envia o token, o servidor responde com o mínimo necessário (nome, foto, status, restrições).
- Check-in infantil gera um **código de retirada** por sessão, impresso na etiqueta do responsável e conferido na saída. Sem o código, não há liberação.

---

## AD-12 · Organização do código — **app único, módulos por domínio**

Monorepo (Turborepo) apenas quando existir um segundo consumidor real, como um app nativo. Hoje seria complexidade sem retorno.

```
src/
├── app/
│   ├── (auth)/                  login, cadastro, aceite de convite
│   ├── (app)/[orgSlug]/         área autenticada
│   ├── (public)/                formulário de visitante, páginas de evento
│   └── api/                     webhooks, ICS, validação de QR
├── modules/<dominio>/           people, finance, groups, schedules, …
│   ├── schema.ts                Zod — contrato único cliente + servidor
│   ├── queries.ts               leitura (Server Components)
│   ├── actions.ts               escrita (Server Actions, com requirePermission)
│   └── components/
├── core/
│   ├── auth/                    sessão, permissões, requirePermission()
│   ├── db/                      clientes Supabase + tipos gerados
│   └── audit/
├── ui/                          design system (zero regra de negócio)
└── lib/

supabase/migrations/             SQL versionado
supabase/tests/                  pgTAP — RLS e isolamento
```

**Regras de dependência:** `ui/` não importa de `modules/`; módulos não importam uns aos outros diretamente — a composição acontece em `app/`. É o que evita o emaranhado que mata produtos de 20 módulos.

---

## AD-13 · Segurança e LGPD — não negociável

- `SUPABASE_SERVICE_ROLE_KEY` nunca em código de cliente, nunca sob `NEXT_PUBLIC_*`. Validação de env com Zod na inicialização, separando variáveis de servidor e de cliente.
- Storage privado por padrão; arquivos servidos por URL assinada de curta duração, com caminho sempre prefixado por `org_id`.
- Credenciais de integração (WhatsApp, e-mail, pagamento) em **Supabase Vault**, não em coluna `jsonb`.
- `audit_logs` por trigger nas tabelas críticas: financeiro, permissões, pessoas, pastoral.
- Consentimento de comunicação por canal (`communication_preferences`), respeitado no momento do envio — não apenas registrado no cadastro.
- Rate limiting nos endpoints públicos: formulário de visitante, validação de QR, login.
- Exportação e exclusão de dados do titular como operação de produto, não script manual.

---

## AD-14 · Qualidade

| Camada | Ferramenta | Cobre |
|---|---|---|
| Unidade | Vitest | regras puras: cálculo financeiro, sugestão de escala, detecção de conflito |
| **RLS** | **pgTAP** | **isolamento entre organizações — o teste mais importante do produto** |
| Integração | Vitest + Supabase local | Server Actions com permissão real |
| E2E | Playwright | onboarding, cadastro de membro, montagem de escala, lançamento financeiro |

CI a cada push: `typecheck` → `lint` → `test` → `pgtap` → `build`. Qualquer vermelho bloqueia o merge.
