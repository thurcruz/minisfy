# 00 — Auditoria do Projeto

> Data: 2026-11-25 · Etapa 1 da metodologia (Seção 13 do Master Prompt)

## 1. Diagnóstico técnico

**O projeto não possui código.** O diretório `minisfy/` contém exclusivamente 16 arquivos PNG de identidade visual. Não há:

| Item | Status |
|---|---|
| `package.json` / gerenciador de pacotes | ❌ ausente |
| Framework (Next.js, Vite, etc.) | ❌ ausente |
| Repositório Git | ❌ não inicializado |
| Banco de dados / migrations | ❌ ausente |
| Autenticação | ❌ ausente |
| Design system / tokens | ❌ ausente (só a paleta em PNG) |
| Testes / CI | ❌ ausente |
| Variáveis de ambiente | ❌ ausente |

**Conclusão:** não há nada a preservar em código, e nada a corrigir. A regra "não destrua funcionalidades existentes" não se aplica — mas a regra "não instale dependências desnecessárias" passa a ser o critério dominante, já que toda escolha agora é fundacional e cara de reverter.

## 2. Tecnologias identificadas

Nenhuma no projeto. No ambiente da máquina:

- Node.js `v24.15.0`
- npm `11.12.1`
- Supabase CLI `2.75.0` ✅ (já instalada — viabiliza migrations versionadas e tipos gerados desde o dia 1)
- Git `2.46.0`
- pnpm ❌ não instalado
- SO: Windows 11 · PowerShell

## 3. Estrutura atual

```
minisfy/
├── MINISFY_CORES.png              # paleta oficial
├── Minisfy-Logo {Main,Black,White,Digital Green}.png
├── Minisfy-Logotipo {4 variações}.png
├── Minisfy-Icon {4 variações}.png
└── Minisfy-Favicon {3 variações}.png
```

## 4. Funcionalidades existentes

Nenhuma.

## 5. Problemas encontrados

1. **Ativos de marca em formato raster.** Logos e ícones só existem em PNG. Para uso em UI (sidebar, favicon, e-mails, carteirinha digital, PDFs) precisamos de SVG. Sem isso, o logo ficará borrado em telas de alta densidade e pesado em e-mails.
2. **Paleta não documentada.** As cores só existem como pixels. Extraí os valores (ver `03-DESIGN-SYSTEM.md`), mas falta confirmação de qual é oficialmente primária vs. acento.
3. **Contraste do verde de marca.** `#B3FF3B` tem contraste de ~1,2:1 sobre branco — reprovado em qualquer critério de acessibilidade. Isso impõe uma regra rígida de uso (detalhada no design system) que precisa ser aceita antes de construir componentes.
4. **Tipografia da marca não fornecida.** O logotipo usa uma sans geométrica pesada (família Poppins/Sora). Não há arquivo de fonte nem especificação.
5. **Sem versionamento.** Nenhum histórico. Primeira ação da Fase 0 é `git init`.
6. **Sem decisão de hospedagem/domínio/projeto Supabase.** Bloqueia a configuração de ambientes (dev/staging/prod).

## 6. Ativos aproveitáveis

- Paleta de cores completa e coerente (indigo + lime), com boa profundidade de escala.
- Símbolo da marca: uma cruz formada por nós conectados — metáfora direta de "pessoas conectadas". É um ativo conceitual forte e deve guiar ilustrações, estados vazios e o visual do Minisfy Pass.
- Variações já prontas para fundo claro, escuro e monocromático.

## 7. Pendências que dependem de você

| # | Pendência | Bloqueia |
|---|---|---|
| 1 | Logos em SVG | Sidebar, favicon, PDFs, carteirinha |
| 2 | Confirmar primária = `#6852EC` (indigo) e acento = `#B3FF3B` (lime) | Design system |
| 3 | Fonte oficial da marca (ou aprovar Inter para UI) | Design system |
| 4 | Criar projeto Supabase (dev) e fornecer credenciais | Fase 0 |
| 5 | Domínio e estratégia de subdomínio por igreja | Fase 1 (multi-tenant) |

Nada disso impede o início da Fase 0.
