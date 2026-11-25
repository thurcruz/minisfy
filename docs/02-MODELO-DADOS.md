# 02 — Modelo Inicial de Banco de Dados

> Modelo relacional de referência. Nem toda tabela entra na Fase 1 — a ordem de criação está em `04-PLANO.md`. Colunas listadas são as estruturalmente relevantes; campos triviais foram omitidos.

## Convenções globais

Aplicam-se a **todas** as tabelas de domínio:

| Convenção | Regra |
|---|---|
| Chave primária | `id uuid primary key default gen_random_uuid()` |
| Tenant | `organization_id uuid not null references organizations(id) on delete restrict` |
| Timestamps | `created_at`, `updated_at` (`timestamptz not null default now()`), `updated_at` via trigger |
| Autoria | `created_by`, `updated_by` → `profiles(id)` |
| Exclusão lógica | `deleted_at timestamptz` nas entidades referenciadas por outras (pessoas, grupos, ministérios). **Nunca** em lançamento financeiro — ver AD-08 |
| Índice obrigatório | `(organization_id)` e, quando houver, `(organization_id, unit_id)` |
| RLS | ativa em todas, sem exceção |
| Enums | `create type` nomeado, não `text` com `CHECK` solto |

**Por que `on delete restrict` na organização:** apagar uma igreja em cascata é um acidente irreversível. Encerramento de conta é um processo de produto (exportar → anonimizar → arquivar), não um `DELETE`.

---

## 1. Núcleo e tenancy

```
organizations (id, name, slug UNIQUE, legal_name, tax_id, plan, status,
               settings jsonb, security_version int, timezone, locale)

units (id, organization_id, parent_unit_id → units, name, slug, kind,
       address jsonb, geo geography(point), timezone, is_active)
       UNIQUE (organization_id, slug)

profiles (id → auth.users ON DELETE CASCADE, full_name, email, phone,
          avatar_path, locale, last_seen_at)
          -- global: NÃO tem organization_id

memberships (id, organization_id, profile_id, status, invited_by,
             invited_at, joined_at)
             UNIQUE (organization_id, profile_id)
```

`units.kind` → `headquarters | congregation | preaching_point | campus`.
`memberships.status` → `invited | active | suspended | removed`.

---

## 2. Papéis e permissões

```
permissions (key TEXT PRIMARY KEY, module, resource, action, description)
             -- catálogo estático, populado por migration

roles (id, organization_id NULLABLE, key, name, description, is_system)
       -- organization_id NULL = papel de sistema, compartilhado e imutável

role_permissions (role_id, permission_key)        PK (role_id, permission_key)

membership_roles (id, membership_id, role_id, unit_id NULLABLE)
                  UNIQUE (membership_id, role_id, unit_id)
                  -- unit_id NULL = papel vale para a organização inteira
```

Papéis de sistema iniciais: `owner`, `admin`, `senior_pastor`, `associate_pastor`, `secretary`, `treasurer`, `ministry_leader`, `group_leader`, `volunteer_coordinator`, `teacher`, `volunteer`, `member`.

---

## 3. Pessoas, famílias e membresia

```
people (id, organization_id, first_name, last_name, social_name,
        birth_date, gender, marital_status, email, phone, whatsapp,
        photo_path, address jsonb, primary_unit_id → units,
        profile_id → profiles NULLABLE,     -- preenchido ao ativar o Portal
        kind, source, notes_public, deleted_at)
        -- busca: tsvector gerado + índice GIN; trigram em nome para "parecidos"

families (id, organization_id, name, address jsonb, primary_contact_id → people)

family_members (id, family_id, person_id, role, is_guardian bool)
                UNIQUE (family_id, person_id)

person_relationships (id, organization_id, person_a_id, person_b_id, kind)
                      -- parentesco fora do núcleo: avô, padrinho, cônjuge separado

church_memberships (id, organization_id, person_id, unit_id, status,
                    started_at date, ended_at date NULLABLE, reason,
                    transferred_from_unit_id, decided_by)
                    -- histórico; no máximo UM vínculo aberto por pessoa+unidade
                    EXCLUDE USING gist (person_id WITH =, unit_id WITH =,
                      daterange(started_at, ended_at, '[)') WITH &&)

person_notes (id, organization_id, person_id, body, visibility, author_id)
emergency_contacts (id, person_id, name, phone, relationship)
person_consents (id, person_id, purpose, granted bool, granted_at, source)
```

`people.kind` → `member | visitor | child | guest | external`.
`church_memberships.status` → `visitor | regular | member | transferred | inactive | deceased`.

**A constraint `EXCLUDE` é o coração do módulo:** torna impossível uma pessoa ter dois vínculos abertos simultâneos na mesma unidade — o bug clássico que corrompe todo relatório de crescimento.

**Duplicidade:** índice trigram em `lower(first_name || ' ' || last_name)` + comparação de telefone/e-mail normalizados alimentam a tela de possíveis duplicatas. A fusão é operação explícita, auditada, que reaponta FKs e mantém o registro absorvido como `merged_into_id`.

---

## 4. Visitantes (CRM) — Módulo 03

```
visitor_pipelines (id, organization_id, unit_id, name, is_default)
visitor_stages (id, pipeline_id, name, position int, kind, color)
                -- etapas personalizáveis; kind ∈ new | working | won | lost

visitor_journeys (id, organization_id, person_id, pipeline_id, stage_id,
                  owner_id → people, source, first_visit_at,
                  next_action_at, closed_at, outcome)

visitor_visits (id, journey_id, visited_at, service_id, invited_by_person_id)

followups (id, organization_id, journey_id, kind, assigned_to → people,
           due_at, done_at, outcome, notes)
           -- kind ∈ call | whatsapp | message | home_visit | invite
```

A conversão em membro **não** move o registro: insere uma linha em `church_memberships` e fecha a jornada com `outcome = 'converted'`. Nada de histórico se perde.

---

## 5. Pequenos grupos — Módulo 05

```
small_groups (id, organization_id, unit_id, name, category, description,
              weekday int, start_time time, address jsonb,
              geo geography(point),              -- mapa de distribuição
              capacity int, status,
              leader_person_id, cohost_person_id, host_person_id,
              parent_group_id → small_groups,    -- multiplicação
              multiplied_at)

small_group_members (id, group_id, person_id, role, joined_at, left_at)
                     -- role ∈ leader | cohost | host | member | visitor

small_group_meetings (id, organization_id, group_id, scheduled_for,
                      held_at, offering_cents bigint, topic, notes,
                      report_status, reported_by, reported_at)

small_group_attendance (id, meeting_id, person_id, status, is_visitor)
                        UNIQUE (meeting_id, person_id)
```

**Sobre presença — decisão de modelagem.** Uma tabela `attendance` polimórfica (`subject_type` + `subject_id`) impede chaves estrangeiras reais e cedo ou tarde acumula linhas órfãs. A recomendação é **uma tabela de presença por domínio** (`small_group_attendance`, `event_attendance`, `class_attendance`), cada uma com FK íntegra, mais uma **view** `v_attendance` unificada para o Módulo 18. Integridade onde importa, conveniência onde é só leitura.

---

## 6. Ministérios e voluntários — Módulos 06 e 07

```
ministries (id, organization_id, unit_id, parent_ministry_id → ministries,
            name, description, leader_person_id, is_active)

ministry_members (id, ministry_id, person_id, role, started_at, ended_at)

positions (id, ministry_id, name, description, required_skills text[])

volunteer_profiles (id, person_id, ministry_id, skills text[],
                    max_assignments_per_month int, notes)

volunteer_availability (id, person_id, weekday int, start_time, end_time)
volunteer_blackouts  (id, person_id, during tstzrange, reason)
                      -- férias, viagem, impedimento pontual
```

```
schedules (id, organization_id, unit_id, name, period_start, period_end,
           status, published_at, published_by)
           -- status ∈ draft | published | closed

schedule_slots (id, schedule_id, event_id → events, position_id,
                required_count int, starts_at, ends_at)

schedule_assignments (id, slot_id, person_id, status, invited_at,
                      responded_at, replaced_by_assignment_id, is_waitlist)
                      UNIQUE (slot_id, person_id)
                      -- status ∈ invited | confirmed | declined | swapped | no_show
```

A sugestão automática **nunca** grava `confirmed`. Cria `invited` e respeita, nesta ordem: blackout → disponibilidade → teto mensal → conflito de horário → rodízio por último serviço. A confirmação é sempre ação do voluntário ou do coordenador, conforme a política da igreja.

Conflito de horário do voluntário usa o mesmo padrão `EXCLUDE ... USING gist` do AD-10.

---

## 7. Agenda, eventos e espaços — Módulos 08, 09 e 12

```
event_types (id, organization_id, name, color, default_duration_minutes)

events (id, organization_id, unit_id, event_type_id, title, description,
        starts_at, ends_at, all_day bool,
        recurrence_rule text,              -- RRULE (RFC 5545)
        parent_event_id → events,          -- ocorrência materializada
        capacity int, visibility, status, owner_person_id)
        -- visibility ∈ public | members | internal

event_registrations (id, event_id, person_id, status, registered_at,
                     amount_cents, transaction_id → financial_transactions)
                     UNIQUE (event_id, person_id)

event_attendance (id, event_id, person_id, checked_in_at, checked_in_by)

rooms (id, organization_id, unit_id, name, capacity int, resources text[], is_active)

room_reservations (id, organization_id, room_id, event_id, starts_at, ends_at,
                   during tstzrange GENERATED, status, requested_by, approved_by)
                   EXCLUDE USING gist (room_id WITH =, during WITH &&)
                     WHERE (status <> 'cancelled')
```

```
services (id, organization_id, unit_id, event_id, service_type,
          theme, preacher_person_id, host_person_id, notes)

service_items (id, service_id, position int, title, kind,
               duration_minutes int, responsible_person_id, notes)
               -- kind ∈ worship | word | notice | offering | prayer | ordinance
```

**Recorrência:** guardamos a `RRULE` no evento-mestre e materializamos ocorrências sob demanda, com `parent_event_id`. Materializar tudo antecipadamente infla a tabela e torna "editar só esta ocorrência" um pesadelo.

---

## 8. Financeiro — Módulo 10

```
financial_accounts (id, organization_id, unit_id, name, kind,
                    bank_code, agency, account_number,
                    opening_balance_cents bigint, currency, is_active)
                    -- kind ∈ bank | cash | digital_wallet

financial_categories (id, organization_id, parent_id → financial_categories,
                      name, kind, is_active)
                      -- kind ∈ income | expense

cost_centers (id, organization_id, unit_id, ministry_id, name, is_active)
suppliers (id, organization_id, name, tax_id, contact jsonb)

financial_transactions (
  id, organization_id, unit_id,
  account_id, category_id, cost_center_id, supplier_id,
  person_id → people,                -- dízimo/doação nominal
  kind,                              -- income | expense
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  competence_date date NOT NULL,     -- regime de competência
  cash_date date,                    -- regime de caixa
  due_date date,                     -- contas a pagar/receber
  status,                            -- pending | approved | paid | reconciled | reversed
  payment_method, description, document_number,
  receipt_path,                      -- Storage privado
  transfer_group_id uuid,            -- par de transferência
  reversal_of_id → financial_transactions,
  recurrence_id → financial_recurrences,
  locked_by_closing_id → period_closings,
  requested_by, approved_by, approved_at
)

financial_recurrences (id, organization_id, template jsonb, rrule, next_run_at)
budgets (id, organization_id, unit_id, ministry_id, category_id,
         period_start, period_end, planned_cents bigint)
period_closings (id, organization_id, unit_id, period_start, period_end,
                 closed_by, closed_at, reopened_by, reopened_at)
bank_reconciliations (id, account_id, statement_date, external_ref,
                      amount_cents, transaction_id, matched_by)
```

**Invariantes garantidas por trigger, não por boa intenção do código:**

1. `UPDATE`/`DELETE` em transação com `locked_by_closing_id` preenchido → exceção.
2. `DELETE` em transação com status `paid` ou `reconciled` → exceção. Só estorno.
3. Transferência exige exatamente duas linhas com o mesmo `transfer_group_id`, somando zero.
4. Toda escrita grava `audit_logs` com `before`/`after`.

Saldo de conta é **derivado** (`sum` sobre a razão), com view materializada por conta/mês se o volume exigir. Saldo guardado em coluna diverge — é questão de tempo.

---

## 9. Patrimônio, estoque e infraestrutura — Módulos 11 e 12

```
assets (id, organization_id, unit_id, code UNIQUE, name, category,
        acquired_at, acquisition_cents bigint, supplier_id,
        location_room_id → rooms, responsible_person_id, status, photo_path)
asset_maintenances (id, asset_id, kind, scheduled_for, done_at, cost_cents, notes)
asset_loans (id, asset_id, person_id, taken_at, due_at, returned_at, condition_note)

inventory_items (id, organization_id, unit_id, name, sku, unit_of_measure,
                 min_quantity numeric, category)
inventory_movements (id, item_id, kind, quantity numeric, unit_cost_cents,
                     reason, event_id, moved_by, moved_at)
                     -- kind ∈ in | out | adjustment

maintenance_requests (id, organization_id, unit_id, room_id, asset_id,
                      title, description, priority, status,
                      requested_by, assigned_to, resolved_at)
```

Saldo de estoque também é derivado dos movimentos. Alerta de mínimo é uma view comparando saldo com `min_quantity`.

---

## 10. Pastoral — Módulo 13 · **schema `pastoral`**

```sql
create schema pastoral;
revoke all on schema pastoral from anon, authenticated;
-- acesso exclusivamente por funções SECURITY DEFINER com checagem de papel
```

```
pastoral.requests (id, organization_id, unit_id, person_id, subject,
                   description, urgency, status, assigned_to, requested_at)
pastoral.appointments (id, request_id, pastor_person_id, scheduled_for,
                       location, modality, status)
pastoral.case_notes (id, request_id, author_id, body, is_restricted)
pastoral.referrals (id, request_id, referred_to, kind, notes)
pastoral.access_log (id, actor_profile_id, entity, entity_id, action, at)
                     -- registra LEITURA, não só escrita
prayer_requests (id, organization_id, unit_id, person_id, body,
                 visibility, is_anonymous, status, answered_at)
                 -- em public: pedidos abertos de oração são da comunidade
```

Pedido de oração comum fica em `public` (a comunidade intercede). Atendimento pastoral fica em `pastoral` (ninguém mais vê). São coisas diferentes e a separação é deliberada.

---

## 11. Ensino — Módulo 14

```
courses (id, organization_id, name, description, workload_hours, is_active)
course_classes (id, course_id, unit_id, name, starts_on, ends_on,
                weekday, start_time, room_id, teacher_person_id, capacity, status)
class_sessions (id, class_id, session_date, topic, material_path)
enrollments (id, class_id, person_id, status, enrolled_at, completed_at, final_grade)
             UNIQUE (class_id, person_id)
class_attendance (id, session_id, person_id, status)
                  UNIQUE (session_id, person_id)
learning_tracks (id, organization_id, name, description)
track_steps (id, track_id, position, course_id, is_required)
certificates (id, enrollment_id, code UNIQUE, issued_at, file_path)
```

---

## 12. Comunicação — Módulo 15

```
announcements (id, organization_id, unit_id, title, body, audience jsonb,
               publish_at, expires_at, status, author_id)
message_templates (id, organization_id, channel, name, subject, body, variables jsonb)
campaigns (id, organization_id, unit_id, name, channel, template_id,
           audience_filter jsonb, scheduled_for, status, sent_at)
campaign_recipients (id, campaign_id, person_id, resolved_address)
message_deliveries (id, campaign_id, recipient_id, provider,
                    provider_message_id, status, error, sent_at, delivered_at, read_at)
communication_preferences (id, person_id, channel, opted_in bool,
                           opted_out_at, source)
                           UNIQUE (person_id, channel)
```

`communication_preferences` é consultada **no momento do envio**, dentro da mesma transação que monta os destinatários. Checar só na criação da campanha deixa janela para enviar a quem já se descadastrou.

---

## 13. Pass e check-in — Módulo 16

```
person_credentials (id, organization_id, person_id,
                    token text UNIQUE NOT NULL,     -- aleatório opaco, nunca o id
                    issued_at, revoked_at, revoked_reason)

checkin_sessions (id, organization_id, unit_id, event_id,
                  opened_by, opened_at, closed_at)

checkins (id, session_id, person_id,
          guardian_person_id → people,              -- check-in infantil
          security_code text,                       -- código de retirada
          checked_in_at, checked_in_by,
          checked_out_at, checked_out_by, checkout_verified bool,
          notes)                                    -- alergias, restrições
          UNIQUE (session_id, person_id)
```

---

## 14. Plataforma

```
audit_logs (id, organization_id, actor_profile_id, action, entity_schema,
            entity_table, entity_id, before jsonb, after jsonb,
            ip inet, user_agent, request_id, at)
            -- particionada por mês; retenção configurável

notifications (id, organization_id, profile_id, kind, title, body,
               link, read_at, created_at)

integrations (id, organization_id, provider, status, config jsonb,
              secret_ref text,          -- ponteiro para o Vault, nunca o segredo
              connected_by, connected_at, last_error)

webhook_events (id, organization_id, provider, external_id UNIQUE,
                payload jsonb, processed_at, error)
                -- external_id UNIQUE garante idempotência

workflows (id, organization_id, name, trigger jsonb, steps jsonb,
           is_active, created_by)                   -- Minisfy Flow
workflow_runs (id, workflow_id, trigger_payload jsonb, status,
               started_at, finished_at, error)
workflow_step_runs (id, run_id, step_index, status, output jsonb, error)

ai_conversations (id, organization_id, profile_id, title, created_at)
ai_messages (id, conversation_id, role, content, created_at)
ai_tool_calls (id, message_id, tool_name, arguments jsonb,
               row_count int, duration_ms, error)
```

---

## Ordem de criação das migrations

| # | Migration | Conteúdo |
|---|---|---|
| 001 | `extensions` | `pgcrypto`, `btree_gist`, `pg_trgm`, `postgis` |
| 002 | `core_tenancy` | organizations, units, profiles, memberships |
| 003 | `rbac` | permissions (catálogo), roles, role_permissions, membership_roles |
| 004 | `rls_helpers` | schema `app`, `current_org_ids()`, `has_permission()`, `current_unit_ids()` |
| 005 | `audit` | audit_logs particionada + função de trigger genérica |
| 006 | `rls_core` | policies do núcleo |
| 007+ | um por domínio | tabelas → índices → policies → triggers → testes pgTAP |

Cada migration de domínio entrega, na mesma entrega, as policies e os testes de isolamento. **Tabela sem policy não chega ao `main`** — o CI barra.
