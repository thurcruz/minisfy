# 03 — Design System

> Paleta extraída pixel a pixel de `MINISFY_CORES.png`. Os valores abaixo são os oficiais até você corrigir.

## 1. Cores da marca

### Extraídas do arquivo

| Hex | Papel observado | Área no arquivo |
|---|---|---|
| `#151233` | Indigo quase preto ("Purple Dark") | grande |
| `#352D7F` | Indigo profundo | grande |
| `#6852EC` | **Violeta primário** ("Purple Main") — cor do logotipo | grande |
| `#8881C9` | Violeta dessaturado | média |
| `#BDBAD8` | Lavanda clara | pequena |
| `#B3FF3B` | **Lime** ("Digital Green") — acento | grande |
| `#CFFFB3` | Lime claro | média |
| `#BAC6DB` | Cinza-azulado frio | média |
| `#403F4C` | Carvão | média |
| `#EAEBE5` | Osso / branco quente | grande |
| `#FFFFFF` | Branco | — |

### Escalas de token

```css
/* Brand — indigo */
--brand-50:  #F2F0FD;   /* derivado */
--brand-100: #E4E0FB;   /* derivado */
--brand-200: #BDBAD8;   /* paleta  */
--brand-300: #A79FDD;   /* derivado */
--brand-400: #8881C9;   /* paleta  */
--brand-500: #6852EC;   /* paleta — PRIMÁRIA */
--brand-600: #5B49D1;   /* paleta  */
--brand-700: #352D7F;   /* paleta  */
--brand-800: #2D266C;   /* paleta  */
--brand-900: #151233;   /* paleta  */

/* Accent — lime (uso restrito, ver §2) */
--accent-200: #E6FFCF;  /* derivado */
--accent-300: #CFFFB3;  /* paleta  */
--accent-500: #B3FF3B;  /* paleta  */
--accent-700: #7FA62E;  /* derivado — única variante legível como texto */

/* Neutros */
--neutral-0:   #FFFFFF;
--neutral-50:  #F7F7F5;  /* derivado */
--neutral-100: #EAEBE5;  /* paleta — osso */
--neutral-200: #DCDDD6;  /* derivado */
--neutral-300: #BAC6DB;  /* paleta — cinza-azulado */
--neutral-500: #7C7B88;  /* derivado */
--neutral-700: #403F4C;  /* paleta — carvão */
--neutral-900: #151233;  /* paleta */
```

### Semânticas

```css
--success: #2E9E5B;   --success-bg: #E7F6ED;
--warning: #B8730A;   --warning-bg: #FDF3E2;
--danger:  #C0392B;   --danger-bg:  #FCEDEB;
--info:    #6852EC;   --info-bg:    #EEEBFE;
```

Cores de status **não** saem da paleta de marca. Vermelho de erro precisa parecer erro, não variação de roxo. O lime é da marca, não de "sucesso" — misturar os dois torna todo o produto ilegível em estados de alerta.

---

## 2. ⚠️ Regra crítica de contraste do lime

`#B3FF3B` sobre branco tem **~1,2:1**. O mínimo WCAG AA para texto é 4,5:1. É reprovação por folga enorme — e esta é a cor que mais chama atenção na paleta, então a tentação de usá-la como texto ou ícone será constante.

**Medições:**

| Combinação | Contraste | Veredito |
|---|---|---|
| `#B3FF3B` sobre `#FFFFFF` | 1,2:1 | ❌ proibido para texto ou ícone |
| `#151233` sobre `#B3FF3B` | **13,9:1** | ✅ excelente — é assim que o lime se usa |
| `#FFFFFF` sobre `#6852EC` | 5,2:1 | ✅ AA — botão primário |
| `#6852EC` sobre `#FFFFFF` | 5,2:1 | ✅ AA — link e texto de marca |
| `#352D7F` sobre `#FFFFFF` | 11,5:1 | ✅ AAA |
| `#403F4C` sobre `#FFFFFF` | 10,3:1 | ✅ AAA — texto corrido |
| `#BAC6DB` sobre `#FFFFFF` | 1,8:1 | ❌ só bordas e divisores |

**Regras:**

1. Lime **só** como preenchimento, com texto `--brand-900` por cima.
2. Nunca como cor de texto, ícone de ação ou traço de gráfico sobre fundo claro.
3. Nunca como único indicador de estado — sempre acompanhado de rótulo ou ícone.
4. Uso parcimonioso: um acento por tela. Um destaque que aparece em todo lugar deixa de destacar.

**Onde o lime funciona:** badge de "novo", barra de progresso de meta atingida, destaque de dia com evento no calendário, highlight do Minisfy Pass, ilustrações de estado vazio, gráfico contra fundo escuro.

---

## 3. Tema escuro

Escuro **não** é inversão. Em fundo escuro o `--brand-500` vibra demais e o texto cansa.

```css
--bg-base:     #0E0C1F;   /* mais escuro que brand-900 — dá profundidade às superfícies */
--bg-surface:  #151233;
--bg-raised:   #1E1A42;
--border:      #2D266C;
--text-primary:   #EAEBE5;
--text-secondary: #A79FDD;
--brand-interactive: #8881C9;   /* brand-400: brand-500 vibra em fundo escuro */
--accent-dark: #B3FF3B;         /* aqui o lime brilha — 13:1 sobre bg-base */
```

No escuro o lime finalmente pode ser cor de texto e de traço de gráfico. É onde a marca fica mais forte.

---

## 4. Tipografia

**Recomendação: Inter Variable para toda a UI.**

O logotipo usa uma sans geométrica pesada (família Poppins/Sora). Essa família é ótima para o wordmark e péssima para a interface: em 13–14px numa tabela com 200 linhas de valores financeiros, a geometria circular reduz a legibilidade e o `x-height` alto consome densidade.

Inter resolve o que este produto exige:

- **numerais tabulares** (`font-feature-settings: 'tnum'`) — indispensável para o Módulo 10; sem isso os valores não alinham na coluna;
- ótima legibilidade em 12–14px, que é onde a maior parte do sistema vive;
- `0` com corte diagonal, distinguindo de `O` em códigos de patrimônio e matrícula.

**Opcional:** uma display geométrica (Sora) apenas em títulos de página e números grandes de dashboard, trazendo o sabor da marca sem comprometer a densidade. Decisão sua.

```css
--font-sans: 'Inter Variable', system-ui, sans-serif;
--font-display: 'Sora', var(--font-sans);   /* opcional */
--font-mono: 'JetBrains Mono', monospace;   /* códigos, QR, logs */
```

| Token | Tamanho / altura | Peso | Uso |
|---|---|---|---|
| `display` | 36 / 40 | 600 | número-herói do dashboard |
| `h1` | 24 / 32 | 600 | título de página |
| `h2` | 20 / 28 | 600 | seção |
| `h3` | 16 / 24 | 600 | card |
| `body` | 14 / 20 | 400 | padrão do sistema |
| `body-sm` | 13 / 18 | 400 | tabela densa |
| `caption` | 12 / 16 | 500 | rótulo, badge, ajuda |
| `numeric` | 14 / 20 | 500 `tnum` | toda coluna de valor |

---

## 5. Espaçamento, raio e elevação

Escala base 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`.

```css
--radius-sm:   6px;    /* badge, tag */
--radius-md:  10px;    /* input, select */
--radius-lg:  14px;    /* card, modal */
--radius-xl:  20px;    /* painel, drawer */
--radius-full: 9999px; /* BOTÕES — requisito do brief */
```

Botões totalmente arredondados conforme o brief. **Cards e tabelas ficam em 14px** — se tudo virar pílula, um sistema de gestão financeira passa a parecer app de jogo. O contraste entre botão-pílula e card de canto suave é justamente o que dá personalidade sem perder seriedade.

```css
--shadow-xs: 0 1px 2px rgb(21 18 51 / .05);
--shadow-sm: 0 1px 3px rgb(21 18 51 / .08), 0 1px 2px rgb(21 18 51 / .04);
--shadow-md: 0 4px 12px rgb(21 18 51 / .08);
--shadow-lg: 0 12px 32px rgb(21 18 51 / .12);
```

Sombra sempre tingida de `brand-900`, nunca preto puro — é o que faz a interface parecer desenhada e não montada.

---

## 6. Componentes da Fase 0

Primitivos: `Button` (primary/secondary/ghost/danger · sm/md/lg · loading · icon) · `Input` · `Textarea` · `Select` · `Combobox` · `DatePicker` · `Checkbox` · `Radio` · `Switch` · `Badge` · `Avatar` · `Tooltip` · `Separator`.

Composições: `DataTable` (ordenação, filtro, paginação no servidor, seleção, colunas visíveis, exportação) · `Card` · `Modal` · `Drawer` · `Dropdown` · `Tabs` · `Toast` · `EmptyState` · `Skeleton` · `PageHeader` · `FilterBar` · `StatCard` · `Pagination` · `Breadcrumb`.

Aplicação: `AppShell` (sidebar + topbar + seletor de organização/unidade) · `PersonCard` · `PermissionGate` · `AuditTrail`.

**Base técnica:** Radix UI (headless, acessível) + Tailwind + CVA para variantes. Não usar um kit visual pronto — o brief pede explicitamente algo que não pareça template genérico, e kits prontos sempre parecem.

**Regra dos três estados:** nenhum componente de dados entra em `main` sem *loading* (skeleton, nunca spinner centralizado), *vazio* (com ação de saída, nunca só "nenhum resultado") e *erro* (com causa e retry).
