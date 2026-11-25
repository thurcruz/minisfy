"use client";

import { useId, useState } from "react";
import { money, moneyCompact, num } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Gráficos em SVG puro — sem biblioteca.
 *
 * Paleta validada com scripts/validate_palette.js do skill dataviz:
 *   claro  #6852EC / #6B8F28 — ΔE deutan 31,7 · normal 35,3 · contraste ≥3:1
 *   escuro #8172F0 / #79A02C — ΔE deutan 29,5 · normal 32,6 · contraste ≥3:1
 * O par escuro fica na faixa 6–8 de ΔE tritan, o que exige codificação
 * secundária: por isso toda série traz legenda, rótulos diretos e
 * espaçamento de 2px entre barras — nunca só a cor.
 *
 * Eixo único sempre. Nunca dois eixos Y no mesmo gráfico.
 */

const SERIES = ["var(--chart-1)", "var(--chart-2)"] as const;

/**
 * Funções não atravessam a fronteira Server → Client Component, então
 * o formato vem como descritor e é resolvido aqui dentro.
 */
export type FormatKind = "money" | "moneyCompact" | "number";

function useFormatter(kind: FormatKind, unit?: string) {
  const base =
    kind === "money" ? money : kind === "moneyCompact" ? moneyCompact : num;
  return (value: number) => (unit ? `${base(value)} ${unit}` : base(value));
}

/* ================================================================== */
/* Legenda                                                            */
/* ================================================================== */

export function Legend({
  items,
}: {
  items: Array<{ label: string; color: string }>;
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-1.5 text-[11px] text-fg-muted"
        >
          <span
            className="size-2 shrink-0 rounded-[2px]"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/* ================================================================== */
/* Barras agrupadas — comparar magnitude entre períodos               */
/* ================================================================== */

export interface GroupedBarDatum {
  label: string;
  values: number[];
}

export function GroupedBarChart({
  data,
  seriesNames,
  format,
  unit,
  height = 180,
  className,
}: {
  data: GroupedBarDatum[];
  seriesNames: string[];
  format: FormatKind;
  unit?: string;
  height?: number;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId();
  const fmt = useFormatter(format, unit);

  const max = Math.max(...data.flatMap((d) => d.values), 1);
  const groupWidth = 100 / data.length;
  const seriesCount = seriesNames.length;
  /* 2px de respiro entre barras adjacentes vem do gap percentual abaixo */
  const barWidth = (groupWidth * 0.62) / seriesCount;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className={cn("relative", className)}>
      <div className="relative" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="size-full overflow-visible"
          role="img"
          aria-label={`Gráfico de barras comparando ${seriesNames.join(" e ")}`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width="100" height="100" />
            </clipPath>
          </defs>

          {gridLines.map((g) => (
            <line
              key={g}
              x1="0"
              x2="100"
              y1={100 - g * 100}
              y2={100 - g * 100}
              stroke="var(--chart-grid)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {data.map((group, gi) => (
            <g key={group.label}>
              {group.values.map((value, si) => {
                const h = (value / max) * 96;
                const x =
                  gi * groupWidth +
                  groupWidth * 0.19 +
                  si * barWidth +
                  si * 0.6;
                return (
                  <rect
                    key={si}
                    x={x}
                    y={100 - h}
                    width={barWidth - 0.6}
                    height={h}
                    fill={SERIES[si % SERIES.length]}
                    opacity={hover === null || hover === gi ? 1 : 0.38}
                    clipPath={`url(#${clipId})`}
                    style={{ transition: "opacity 120ms" }}
                  />
                );
              })}
            </g>
          ))}
        </svg>

        {/* Faixas de hover — alvo maior que a barra */}
        <div className="absolute inset-0 flex">
          {data.map((group, gi) => (
            <button
              key={group.label}
              type="button"
              className="h-full flex-1 cursor-default"
              onMouseEnter={() => setHover(gi)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(gi)}
              onBlur={() => setHover(null)}
              aria-label={`${group.label}: ${group.values
                .map((v, i) => `${seriesNames[i]} ${fmt(v)}`)
                .join(", ")}`}
            />
          ))}
        </div>

        {hover !== null && (
          <div
            className="pointer-events-none absolute -top-1 z-10 w-max -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-raised px-3 py-2 shadow-md"
            style={{ left: `${(hover + 0.5) * groupWidth}%` }}
          >
            <p className="mb-1 text-[11px] font-semibold text-fg">
              {data[hover]!.label}
            </p>
            {data[hover]!.values.map((value, si) => (
              <p
                key={si}
                className="flex items-center gap-1.5 text-[11px] text-fg-secondary"
              >
                <span
                  className="size-2 rounded-[2px]"
                  style={{ background: SERIES[si % SERIES.length] }}
                />
                {seriesNames[si]}
                <span className="tnum ml-auto pl-3 font-medium text-fg">
                  {fmt(value)}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex">
        {data.map((group) => (
          <span
            key={group.label}
            className="flex-1 text-center text-[10px] uppercase tracking-wide text-fg-muted"
          >
            {group.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Área de série única — evolução no tempo                            */
/* ================================================================== */

export function AreaChart({
  data,
  format,
  unit,
  height = 160,
  className,
}: {
  data: Array<{ label: string; value: number }>;
  format: FormatKind;
  unit?: string;
  height?: number;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = useId();
  const fmt = useFormatter(format, unit);

  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  /* Base com folga, mas nunca eixo truncado sem aviso: começa no zero
     quando a variação é grande o bastante para isso ser honesto. */
  const flat = max === min;
  const floor = flat
    ? Math.max(0, min - Math.max(min * 0.1, 1))
    : min > max * 0.45
      ? min - (max - min) * 0.6
      : 0;
  const span = Math.max(max - floor, 1);

  const px = (i: number) => (i / (data.length - 1)) * 100;
  const py = (v: number) => 96 - ((v - floor) / span) * 92;

  const line = data.map((d, i) => `${px(i)},${py(d.value)}`).join(" L ");
  const area = `M 0,100 L ${line} L 100,100 Z`;

  return (
    <div className={cn("relative", className)}>
      <div className="relative" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="size-full overflow-visible"
          role="img"
          aria-label="Gráfico de linha"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((g) => (
            <line
              key={g}
              x1="0"
              x2="100"
              y1={4 + g * 92}
              y2={4 + g * 92}
              stroke="var(--chart-grid)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={area} fill={`url(#${gradientId})`} />
          <path
            d={`M ${line}`}
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {hover !== null && (
            <line
              x1={px(hover)}
              x2={px(hover)}
              y1="0"
              y2="100"
              stroke="var(--chart-axis)"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Marcadores ≥8px, com anel da superfície */}
        {data.map((d, i) => (
          <span
            key={d.label}
            className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
            style={{
              left: `${px(i)}%`,
              top: `${py(d.value)}%`,
              background: "var(--chart-1)",
              // @ts-expect-error -- CSS custom property
              "--tw-ring-color": "var(--bg-surface)",
              opacity: hover === null ? (i === data.length - 1 ? 1 : 0) : hover === i ? 1 : 0,
              transition: "opacity 120ms",
            }}
          />
        ))}

        <div className="absolute inset-0 flex">
          {data.map((d, i) => (
            <button
              key={d.label}
              type="button"
              className="h-full flex-1 cursor-default"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${d.label}: ${fmt(d.value)}`}
            />
          ))}
        </div>

        {hover !== null && (
          <div
            className="pointer-events-none absolute -top-1 z-10 w-max -translate-y-full rounded-lg border border-line bg-raised px-2.5 py-1.5 shadow-md"
            style={{
              left: `${px(hover)}%`,
              transform: `translate(${hover === 0 ? "0" : hover === data.length - 1 ? "-100%" : "-50%"}, -100%)`,
            }}
          >
            <p className="text-[11px] text-fg-muted">{data[hover]!.label}</p>
            <p className="tnum text-[13px] font-semibold text-fg">
              {fmt(data[hover]!.value)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-fg-muted">
        <span>{data[0]!.label}</span>
        <span>{data.at(-1)!.label}</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Barras horizontais — ranking                                        */
/* ================================================================== */

export function HBarChart({
  data,
  format,
  unit,
  className,
}: {
  data: Array<{ label: string; value: number }>;
  format: FormatKind;
  unit?: string;
  className?: string;
}) {
  const fmt = useFormatter(format, unit);
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className={cn("space-y-2.5", className)}>
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-[12px] text-fg-secondary">
              {d.label}
            </span>
            <span className="tnum shrink-0 text-[12px] font-medium text-fg">
              {fmt(d.value)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((d.value / max) * 100, 2)}%`,
                background: "var(--chart-1)",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
