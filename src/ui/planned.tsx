import * as React from "react";
import { Button, type ButtonProps } from "@/ui/button";

/**
 * Ação que a tela já pede, mas que o protótipo ainda não faz.
 *
 * Botão morto é mentira: a pessoa clica, não acontece nada, e a partir
 * dali ela duvida de tudo que a tela mostra. Aqui a ação aparece
 * desabilitada e diz o que falta para existir — a mesma regra dos
 * módulos previstos no menu lateral.
 *
 * Quando a ação for construída, troque por um <Button> comum: o
 * compilador não avisa, mas um grep por `PlannedButton` lista tudo que
 * ainda falta.
 */
export function PlannedButton({
  children,
  reason,
  className,
  ...props
}: Omit<ButtonProps, "disabled" | "onClick"> & {
  /** O que falta para a ação existir. Vira dica ao passar o mouse. */
  reason: string;
}) {
  return (
    /* O title fica no span: `disabled` corta eventos de ponteiro no
       próprio botão e a dica nunca apareceria. */
    <span title={reason} className="inline-flex cursor-not-allowed">
      <Button {...props} className={className} disabled>
        {children}
      </Button>
      <span className="sr-only">Indisponível no protótipo: {reason}</span>
    </span>
  );
}
