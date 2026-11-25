# 04 — Plano de Desenvolvimento

> Ordenado por **dependência técnica**, não por apelo visual. Cada fase entrega banco + backend + permissões + interface + testes — nada é considerado pronto só porque a tela existe (Seção 15 do brief).

## Princípio de sequenciamento

Três coisas travam todo o resto e por isso vêm primeiro: **tenancy**, **permissões** e **o cadastro de pessoas**. Dezesseis dos vinte e um módulos referenciam `people`. Construir qualquer módulo de ponta antes disso significa refazê-lo.

A ordem também segue o valor para a igreja: ao fim da Fase 3 o sistema **já é usável de verdade** — uma igreja consegue cadastrar membros, receber visitantes, acompanhar integração e rodar seus pequenos grupos. Isso permite validar com uma igreja real antes de investir nos módulos pesados.

---

## Fase 0 — Fundação técnica

**Entrega:** repositório que compila, faz deploy e tem portões de qualidade ativos. Nenhuma funcionalidade de produto.

- `git init`, estrutura de pastas do AD-12, `.gitignore`, convenção de commits
- Next.js 15 + TS strict + Tailwind + ESLint/Prettier
- Projeto Supabase (dev) + `supabase init` + ambiente local
- Design tokens do doc 03 (claro e escuro) + 8 primitivos: Button, Input, Select, Card, Badge, Modal, Toast, Skeleton
- Validação de env com Zod, separando servidor e cliente
- **Portão de RLS:** script que falha se alguma tabela em `public` estiver sem RLS ou sem policy
- Harness pgTAP + CI (typecheck → lint → test → pgtap → build) + deploy em preview
- Logos convertidos para SVG

**Aceite:** CI verde · tema claro/escuro funcional · deploy acessível · o portão de RLS reprova de propósito uma tabela de teste sem policy.

---

## Fase 1 — Núcleo multi-tenant

**Entrega:** alguém cria uma igreja, convida pessoas e elas entram com permissões corretas.

- Migrations 001–006 (extensões, tenancy, RBAC, helpers de RLS, auditoria, policies do núcleo)
- Auth: e-mail/senha, magic link, recuperação, convite por e-mail
- Onboarding: criar organização → primeira unidade → papéis padrão → owner
- Gestão de unidades (árvore), usuários, papéis e permissões personalizadas
- Seletor de organização/unidade no shell; navegação filtrada por permissão
- `requirePermission()` e `<PermissionGate>`
- Auditoria por trigger ativa
- Dashboard em estado vazio honesto ("cadastre seu primeiro membro"), sem widget falso

**Aceite:** pgTAP prova que usuário da Org A não lê, altera nem apaga nada da Org B em nenhuma tabela · papel limitado a uma unidade não vê dados das outras · toda ação crítica aparece em `audit_logs` · nenhum número inventado na tela.

**Risco:** é a fase mais lenta e com menos tela para mostrar. Encurtar aqui é o erro que compromete o produto inteiro.

---

## Fase 2 — Pessoas, famílias e membresia

**Entrega:** o cadastro que todos os outros módulos consomem.

- `people`, `families`, `family_members`, `person_relationships`, `church_memberships`, contatos de emergência, consentimentos
- CRUD completo, foto em Storage privado com URL assinada
- Busca full-text + filtros avançados; `DataTable` com paginação no servidor
- Importação CSV/Excel com pré-visualização, mapeamento de colunas e relatório de erros por linha
- Exportação permissionada e auditada
- Detecção e fusão de duplicatas
- Linha do tempo da pessoa, aniversariantes, transferência entre unidades, arquivamento
- Gestão de famílias com visualização da composição

**Aceite:** importar 1.000 pessoas sem erro e sem timeout · transferência gera histórico correto, sem sobrescrever · exportação registrada na auditoria · a constraint `EXCLUDE` impede dois vínculos abertos na mesma unidade.

---

## Fase 3 — Comunidade: visitantes e pequenos grupos

**Entrega:** o ciclo que a igreja mais sente no dia a dia — e o marco de **validação com igreja real**.

- CRM de visitantes: pipeline com etapas personalizáveis, kanban, dono, tarefas de follow-up, origem, retornos
- Formulário público de visitante (rota pública, rate limit, sem exigir login)
- Conversão em membro preservando histórico
- Pequenos grupos: cadastro, liderança, participantes, encontros, presença, multiplicação, transferência
- Relatório de encontro pelo líder (mobile-first — é no celular que isso acontece)
- Painel de desempenho e mapa de distribuição geográfica

**Aceite:** visitante entra pelo formulário público, percorre o pipeline e vira membro sem perder nada · líder registra presença pelo celular em menos de 1 minuto · frequência do grupo bate com os registros · líder só enxerga o próprio grupo.

> **Marco:** rodar com uma igreja piloto antes da Fase 4. Os módulos seguintes são caros; feedback real agora economiza retrabalho.

---

## Fase 4 — Programação: agenda, eventos, espaços e cultos

- Agenda mensal/semanal/diária, tipos de evento, recorrência por RRULE
- Salas e reservas com a `EXCLUDE` constraint (AD-10) e fluxo de aprovação
- Inscrições em evento, capacidade, lista de presença, check-in simples
- Cultos: ordem do culto, preletor, dirigente, equipes, programação item a item

**Aceite:** reserva conflitante é rejeitada **pelo banco** (teste concorrente comprova) · editar uma ocorrência não afeta a série · capacidade esgotada bloqueia inscrição sem condição de corrida.

---

## Fase 5 — Ministérios, voluntários e escalas

Depende de pessoas (F2) e eventos (F4).

- Ministérios com hierarquia, subequipes, liderança, funções
- Perfil de voluntário: habilidades, disponibilidade, bloqueios, teto mensal
- Montagem de escala manual + sugestão automática respeitando todas as restrições
- Convite, confirmação, recusa, substituição, lista de espera
- Notificações; visões por dia, semana, mês, ministério, evento e voluntário
- Histórico de serviço e frequência

**Aceite:** sugestão automática nunca grava `confirmed` · voluntário em bloqueio nunca é sugerido · teto mensal respeitado · conflito de horário detectado entre ministérios diferentes · voluntário confirma pelo celular em dois toques.

---

## Fase 6 — Financeiro

A fase mais sensível. Vai depois porque depende de pessoas (dízimo nominal), unidades (financeiro por unidade) e ministérios (centro de custo).

- Contas, categorias, centros de custo, fornecedores
- Razão com as quatro invariantes de trigger do doc 02
- Receitas, despesas, dízimos, ofertas, recorrências, transferências
- Contas a pagar/receber, fluxo de aprovação, comprovantes em Storage privado
- Orçamento mensal/anual/por ministério, fluxo de caixa, metas
- Conciliação bancária, fechamento de período com travamento
- Relatórios com exportação PDF e Excel

**Aceite:** nenhum valor em ponto flutuante em lugar nenhum · lançamento pago não pode ser excluído, só estornado · período fechado rejeita alteração · transferência sempre soma zero · tesoureiro de uma unidade não vê o financeiro das outras · saldo bate com a soma da razão em teste de 10.000 lançamentos.

---

## Fase 7 — Cuidado pastoral e ensino

- Schema `pastoral` isolado, funções `SECURITY DEFINER`, log de leitura (AD-07)
- Solicitações, agendamento, encaminhamentos, registros de atendimento
- Pedidos de oração com visibilidade granular
- Escola bíblica: cursos, turmas, matrículas, frequência, materiais, trilhas, certificados

**Aceite:** tentativa de acesso direto via PostgREST ao schema `pastoral` retorna erro · dado pastoral não aparece na busca global · leitura de prontuário fica registrada · quem não é pastor não vê nem a existência do registro.

---

## Fase 8 — Pass, check-in e Portal do Membro

- Credenciais com token opaco, carteirinha digital, revogação e rotação
- Check-in de evento e check-in infantil com código de retirada
- Portal do Membro: perfil, atualização cadastral, agenda, inscrições, escalas pessoais, confirmações, comunicados, carteirinha

**Aceite:** QR não contém nenhum dado pessoal (inspeção do payload comprova) · token revogado falha na validação · criança só é liberada com o código correto · membro no portal só enxerga o que é dele.

---

## Fase 9 — Comunicação

- Comunicados, segmentação por unidade/ministério/grupo, modelos, campanhas
- Integração de e-mail (Resend) e WhatsApp (provedor oficial — Cloud API)
- Agendamento, histórico de entregas, webhooks de status
- Preferências e consentimento verificados **no envio**

**Aceite:** envio a quem optou por sair é impossível · falha de provedor não perde a campanha (reprocessável) · webhook idempotente.

---

## Fase 10 — Patrimônio, estoque e infraestrutura

Último entre os operacionais: alto esforço, urgência menor que o restante.

- Patrimônio, manutenção, empréstimos
- Estoque com movimentações e alerta de mínimo
- Ocorrências e solicitações de manutenção

---

## Fase 11 — Inteligência, automações e integrações

- Central de relatórios com filtros, comparativos, consolidação multiunidade e relatórios personalizados
- **Minisfy Intelligence** com o catálogo de ferramentas tipadas do AD-09
- **Minisfy Flow**: gatilhos, condições, ações, execuções com log
- Integrações: Google Calendar, YouTube, pagamentos, site institucional, webhooks, API pública

**Aceite:** o assistente nunca produz número que não veio de uma ferramenta · respeita a permissão do usuário que pergunta (teste: usuário sem acesso ao financeiro pergunta sobre caixa e não recebe valor) · nunca afirma ter executado ação sem confirmação do sistema · toda execução de automação fica logada.

---

## Dependências

```
F0 ─ F1 ─ F2 ─┬─ F3 ──────────────┐
              ├─ F4 ─ F5 ─────────┤
              ├─ F6 ──────────────┤
              ├─ F7 ──────────────┼─ F11
              ├─ F8 ──────────────┤
              ├─ F9 ──────────────┤
              └─ F10 ─────────────┘
```

F3 a F10 são independentes entre si depois da F2 (exceto F5, que precisa da F4) — ou seja, a ordem delas pode ser renegociada conforme a prioridade da igreja piloto. F0→F1→F2 é rígido.

---

## Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Policy de RLS esquecida em uma tabela | **Vazamento entre igrejas** — fatal para o produto | Portão de CI + pgTAP por módulo, desde a Fase 0 |
| RLS lenta com volume | Sistema inutilizável acima de ~10k pessoas | AD-04; medir com seed de 50k linhas ainda na Fase 2 |
| Modelo de pessoa/usuário errado | Reescrita de 16 módulos | AD-06, decidido antes de qualquer código |
| Escopo de 21 módulos simultâneos | Nada pronto de verdade | Fases com critério de aceite; nenhuma começa sem a anterior aceita |
| Dado pastoral exposto | Dano a pessoas + incidente LGPD | AD-07: schema isolado, fora do PostgREST |
| Credencial de integração vazada | Comprometimento de contas externas | Supabase Vault, nunca `jsonb` |
| Importação de base legada suja | Duplicatas e perda de confiança | Importador com pré-visualização e fusão de duplicatas na Fase 2 |

---

## Decisões que preciso de você

| # | Decisão | Bloqueia | Minha recomendação |
|---|---|---|---|
| 1 | Aprovar AD-03, 04, 06, 07 (multi-tenancy, RLS, identidade, pastoral) | Fase 1 | aprovar como está |
| 2 | Projeto Supabase + credenciais de dev | Fase 0 | criar hoje |
| 3 | Inter para UI (logotipo mantém a fonte da marca) | Fase 0 | aprovar |
| 4 | Aceitar a regra de contraste do lime (§2 do doc 03) | Fase 0 | aprovar |
| 5 | Logos em SVG | Fase 0 | você envia |
| 6 | Domínio e estratégia de subdomínio por igreja | Fase 1 | `app.minisfy.com/[slug]` primeiro; subdomínio depois |
| 7 | Existe igreja piloto para validar na Fase 3? | marco da F3 | definir agora |
