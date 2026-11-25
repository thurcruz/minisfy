"use client";

import { useMemo } from "react";
import { createQueries } from "@/mocks/queries";
import { useStore } from "./data-store";

/**
 * As mesmas consultas de `@/mocks/queries`, só que rodando sobre o
 * dataset do store — então tudo que um formulário salva aparece
 * imediatamente em toda a aplicação.
 *
 * As páginas do servidor continuam importando as funções direto de
 * `@/mocks/queries`, que são a mesma fábrica ligada ao seed. Uma
 * implementação só, dois datasets.
 */
export function useQueries() {
  const { data } = useStore();
  return useMemo(() => createQueries(data), [data]);
}
