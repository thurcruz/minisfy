# MINISFY — Documento de Progresso

> Fonte única de verdade sobre o estado real do produto.
> Última atualização: **2026-11-26**

## Estado atual

**Protótipo · 16 de 34 telas, com detalhe e formulários funcionando.**
Aplicação roda, compila, passa typecheck e lint. **Ainda não há banco,
autenticação nem permissões** — por decisão sua, o backend vem depois.

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
| 2026-11-25 | Telas: Famílias, Cultos, Eventos, Reservas, Voluntários |
| 2026-11-25 | Modelo estendido: composição familiar, contatos de emergência, ordem do culto, inscrições, reservas, perfis e bloqueios de voluntário |
| 2026-11-25 | Telas de detalhe: perfil de pessoa e de pequeno grupo |
| 2026-11-25 | Store do protótipo com persistência no navegador; cadastro e edição de pessoa salvam de verdade; busca, filtros e paginação funcionais |
| 2026-11-25 | Relatório de encontro, lançamento financeiro e resposta de convite de escala — os três salvam e recalculam os indicadores |
| 2026-11-26 | Telas de detalhe de ministério, evento e visitante, ligadas a partir das listagens |
| 2026-11-26 | Formulários de grupo, evento e reserva, com checagem de conflito de sala pela mesma regra do AD-10 |
| 2026-11-26 | Funil de visitante operante: mover etapa, registrar visita, agendar contato, vincular a grupo, registrar como congregado |
| 2026-11-26 | Aprovar e recusar pedidos de reserva |
| 2026-11-26 | Histórico de escalas no seed — "já serviu" deixou de ser zero para todo mundo |

### Decisões aprovadas por você

AD-03 (multi-tenancy), AD-04 (RLS), AD-06 (identidade), AD-07 (pastoral) —
aprovadas em 2026-11-25. Tipografia: Inter para UI + display geométrica.
Domínio: Vercel por enquanto, `app.minisfy.com.br` depois.

## Em desenvolvimento

Nada em andamento. Aguardando sua direção sobre o próximo passo.

## Pendente

| Prioridade | Item |
|---|---|
| Alta | Tela de detalhe de lançamento financeiro e formulário de ministério |
| Média | Edição de reserva (hoje o remarque é recusar e pedir de novo) e de grupo |
| Média | Telas restantes: Pastoral, Ensino, Comunicação, Pass, Portal do Membro, Patrimônio, Estoque, Relatórios, Intelligence, Flow, Configurações |
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

- **Consultas em fábrica sobre um `Dataset`.** `createQueries(data)` roda
  tanto sobre o seed (páginas do servidor) quanto sobre o store do navegador
  (telas interativas). Uma implementação só, dois conjuntos de dados — quando
  o Supabase entrar, some o store e sobra a consulta ao banco.
- **Store do protótipo em `src/store/`.** Persiste no localStorage o que os
  formulários salvam, com aviso visível e botão de restaurar. Lido por
  `useSyncExternalStore`, sem efeito de hidratação.
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
| 7 | `new Date("YYYY-MM-DD")` lido como UTC em mais pontos de consulta | ✅ corrigido — `toDate()` em todas as comparações |
| 8 | Gerador de inscrições repetia pessoas: lista de espera sempre zerada | ✅ corrigido — passo coprimo, sem repetição |
| 9 | Crianças de 6 anos inscritas na Escola Bíblica | ✅ corrigido — filtro por faixa etária |
| 10 | Conflito de reserva atribuído à reserva já aprovada, não ao pedido novo | ✅ corrigido |
| 11 | `onSaved?.(createPerson(...))` — com optional chaining o argumento não é avaliado, então o cadastro não salvava e falhava em silêncio | ✅ corrigido |
| 12 | `new Date()` durante o render quebra o prerender do Next 16 | ✅ corrigido — usa a data de referência do protótipo |
| 13 | Responsividade em telas pequenas não verificada visualmente | ⚠️ aberto — redimensionamento falhou no ambiente de teste |
| 14 | Tipografia da marca não fornecida | ⚠️ aberto — usando Sora como display |
| 15 | Registro criado no protótipo caía no 404 do próprio detalhe: no HTML do servidor o dataset é o seed, e `notFound()` disparava antes do store ser lido | ✅ corrigido — a tela espera a hidratação |
| 16 | Nenhuma escala no passado: "já serviu" era zero para toda a igreja | ✅ corrigido — histórico gerado a partir do pool de cada função |
| 17 | Erro de formulário continuava na tela depois do campo corrigido | ✅ corrigido — erros derivados no render, não guardados em estado |
| 18 | Botões sem ação em grupos, agenda, eventos, ministérios e reservas | ✅ corrigido — ligados ou trocados por link; sobra "Novo ministério", ainda sem formulário |

## Próximos passos

1. **O que falta de CRUD**: detalhe de lançamento financeiro, formulário de
   ministério e edição de reserva e de grupo.
2. **Subir para GitHub + Vercel** quando você quiser compartilhar o link.
3. **Fase 1** (Supabase, tenancy, RBAC, autenticação), trocando `mocks/` por
   dados reais.
