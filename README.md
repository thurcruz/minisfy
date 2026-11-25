# Minisfy

**Ministry, Simplified.** Plataforma de gestão para igrejas.

> ⚠️ **Protótipo.** Os dados são de uma igreja fictícia ("Comunidade Esperança")
> e vivem apenas em `src/mocks/`. Não há banco de dados nem autenticação ainda.

## Rodar

```bash
npm install
npm run dev     # http://localhost:3000
```

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind CSS v4 ·
Radix UI · lucide-react · next-themes.

## Estrutura

```
src/
├── app/            rotas (telas prontas + fallback dos módulos planejados)
├── components/     app shell e navegação
├── config/         configuração do menu lateral
├── lib/            formatação pt-BR e utilitários
├── mocks/          ⚠️ único ponto de dados fictícios
│   ├── types.ts      espelham docs/02-MODELO-DADOS.md
│   ├── seed.ts       a igreja fictícia
│   └── queries.ts    toda métrica é DERIVADA daqui
└── ui/             design system (primitivos e gráficos)

brand/              logos em PNG e SVG + paleta
docs/               auditoria, arquitetura, modelo de dados, design system, plano
```

## Regra do protótipo

**Nenhum número é escrito à mão numa tela.** Tudo que aparece na interface sai de
`src/mocks/queries.ts`, que calcula a partir de `seed.ts`. Mudou um registro no
seed, mudou o dashboard. Quando o Supabase entrar, só `queries.ts` muda — os
componentes continuam iguais.

## Telas prontas

Dashboard · Membros · Visitantes (CRM kanban) · Pequenos grupos · Ministérios ·
Escalas · Agenda · Financeiro.

Os demais itens do menu levam a uma página que informa em que fase do plano o
módulo entra. Nenhum item é botão morto.

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/00-AUDITORIA.md](docs/00-AUDITORIA.md) | Diagnóstico do ponto de partida |
| [docs/01-ARQUITETURA.md](docs/01-ARQUITETURA.md) | 14 decisões arquiteturais |
| [docs/02-MODELO-DADOS.md](docs/02-MODELO-DADOS.md) | Modelo relacional de referência |
| [docs/03-DESIGN-SYSTEM.md](docs/03-DESIGN-SYSTEM.md) | Paleta, tipografia, tokens |
| [docs/04-PLANO.md](docs/04-PLANO.md) | 12 fases com critérios de aceite |
| [PROGRESSO.md](PROGRESSO.md) | Estado atual |

## Qualidade

```bash
npx tsc --noEmit   # typecheck
npx eslint .       # lint
npm run build      # build de produção
```
