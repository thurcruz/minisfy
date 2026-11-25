# MINISFY — Documento de Progresso

> Fonte única de verdade sobre o estado real do produto.
> Última atualização: **2026-11-25**

## Estado atual

**Fase 0 — Fundação técnica · concluída (trilha protótipo).**
Aplicação roda, compila, passa typecheck e lint. Oito telas funcionais com dados
de uma igreja fictícia. **Ainda não há banco, autenticação nem permissões** —
por decisão sua, o backend vem depois do protótipo.

## Concluído

| Data | Entrega |
|---|---|
| 2026-11-25 | Auditoria do projeto (`docs/00-AUDITORIA.md`) |
| 2026-11-25 | Arquitetura, 14 decisões (`docs/01-ARQUITETURA.md`) |
| 2026-11-25 | Modelo de banco de dados (`docs/02-MODELO-DADOS.md`) |
| 2026-11-25 | Design system e paleta (`docs/03-DESIGN-SYSTEM.md`) |
| 2026-11-25 | Plano em 12 fases (`docs/04-PLANO.md`) |
| 2026-11-25 | Scaffold Next 16 + React 19 + TS strict + Tailwind v4 |
| 2026-11-25 | Design tokens claro/escuro + 15 primitivos + 3 gráficos |
| 2026-11-25 | App shell: sidebar de 9 grupos, 33 itens, topbar, tema |
| 2026-11-25 | Igreja fictícia "Comunidade Esperança": 72 pessoas, 2 unidades |
| 2026-11-25 | Telas: Dashboard, Membros, Visitantes, Grupos, Ministérios, Escalas, Agenda, Financeiro |

### Decisões aprovadas por você

AD-03 (multi-tenancy), AD-04 (RLS), AD-06 (identidade), AD-07 (pastoral) —
aprovadas em 2026-11-25. Tipografia: Inter para UI + display geométrica.
Domínio: Vercel por enquanto, `app.minisfy.com.br` depois.

## Em desenvolvimento

Nada em andamento. Aguardando sua direção sobre o próximo passo.

## Pendente

| Prioridade | Item |
|---|---|
| Alta | Telas restantes do protótipo (Famílias, Cultos, Eventos, Reservas, Pastoral, Ensino, Comunicação, Pass, Portal) |
| Alta | Fase 1 — Supabase: tenancy, RBAC, RLS, autenticação |
| Média | Validação responsiva em telas pequenas (ver *Problemas*) |
| Média | Repositório no GitHub + deploy na Vercel |

## Bloqueios

| # | Bloqueio | Responsável |
|---|---|---|
| 1 | Criar repositório no GitHub e autorizar o push | Arthur |
| 2 | Projeto Supabase + credenciais (quando iniciar a Fase 1) | Arthur |
| 3 | Confirmar a fonte display: Sora (atual) ou Creato Display | Arthur |
| 4 | Definir a igreja piloto | Arthur |

## Decisões técnicas registradas

Todas em `docs/01-ARQUITETURA.md` (AD-01 a AD-14). Adicionais tomadas no protótipo:

- **Dados fictícios isolados em `src/mocks/`.** Nenhum componente escreve número
  à mão; tudo é derivado por `queries.ts`. Trocar para Supabase altera só essa
  camada. Banner "Protótipo · dados fictícios" visível em toda tela.
- **Paleta de gráficos validada por script**, não por gosto: claro
  `#6852EC`/`#6B8F28` (ΔE deutan 31,7), escuro `#8172F0`/`#79A02C` (ΔE 29,5),
  contraste ≥3:1 nos dois temas. Não trocar sem revalidar.
- **Módulos planejados têm página de status**, não botão morto: o item do menu
  informa a fase e o escopo previsto.
- **Sidebar escura nos dois temas** — ancora a marca e separa navegação de conteúdo.

## Problemas encontrados

| # | Problema | Status |
|---|---|---|
| 1 | Logos só em PNG | ✅ resolvido — SVGs em `brand/svg/` |
| 2 | `#B3FF3B` reprova em contraste sobre branco (1,2:1) | ✅ resolvido — regra de uso só como preenchimento |
| 3 | `new Date("2026-11-27")` lia como UTC e mostrava o dia anterior | ✅ corrigido em `lib/format.ts` |
| 4 | `dark:` do Tailwind v4 seguia o SO, ignorando o botão de tema | ✅ corrigido com `@custom-variant dark` |
| 5 | Hydration mismatch no botão de tema | ✅ corrigido — ícones por CSS, sem efeito |
| 6 | Vaga de escala contada duas vezes (convite pendente + vaga aberta) | ✅ corrigido — `open` vs. `missing` |
| 7 | Responsividade em telas pequenas não verificada visualmente | ⚠️ aberto — redimensionamento falhou no ambiente de teste |
| 8 | Tipografia da marca não fornecida | ⚠️ aberto — usando Sora como display |

## Próximos passos

Três caminhos, na ordem que eu recomendaria:

1. **Completar o protótipo** com as telas restantes, para validar o produto
   inteiro antes de investir em backend.
2. **Subir para GitHub + Vercel**, para você compartilhar o link com pastores e
   colher feedback.
3. **Iniciar a Fase 1** (Supabase, tenancy, RBAC, autenticação) e trocar a
   camada `mocks/` por dados reais.
