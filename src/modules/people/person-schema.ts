import { z } from "zod";

/**
 * Contrato único do cadastro de pessoa.
 *
 * O mesmo schema valida o formulário no navegador e validará a Server
 * Action quando o backend entrar — é o que impede que a regra exista
 * só no cliente. Ver AD-12 em docs/01-ARQUITETURA.md.
 */

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const MIN_BIRTH_YEAR = new Date().getFullYear() - 120;

export const personSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Informe o nome completo")
      .max(120, "Nome muito longo")
      .refine(
        (v) => v.split(/\s+/).filter(Boolean).length >= 2,
        "Informe nome e sobrenome",
      ),

    gender: z.enum(["F", "M"], { message: "Selecione" }),

    birthDate: z
      .string()
      .min(1, "Informe a data de nascimento")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida")
      .refine((v) => new Date(v) <= new Date(), "A data não pode ser futura")
      .refine(
        (v) => new Date(v).getFullYear() >= MIN_BIRTH_YEAR,
        "Verifique o ano de nascimento",
      ),

    phone: z
      .string()
      .min(1, "Informe o telefone")
      .refine(
        (v) => [10, 11].includes(onlyDigits(v).length),
        "Telefone deve ter DDD e 8 ou 9 dígitos",
      )
      .transform(onlyDigits),

    email: z
      .string()
      .trim()
      .max(160)
      .refine(
        (v) => v === "" || z.string().email().safeParse(v).success,
        "E-mail inválido",
      ),

    neighborhood: z.string().trim().min(2, "Informe o bairro"),

    unitId: z.string().min(1, "Selecione a unidade"),

    status: z.enum(["member", "regular", "visitor", "inactive", "transferred"]),

    memberSince: z
      .string()
      .min(1, "Informe a data de entrada")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida"),

    groupId: z.string(),

    ministryIds: z.array(z.string()),
  })
  .refine(
    (data) => new Date(data.memberSince) >= new Date(data.birthDate),
    {
      message: "A entrada na igreja não pode ser anterior ao nascimento",
      path: ["memberSince"],
    },
  )
  .refine(
    (data) => !(data.status === "visitor" && data.ministryIds.length > 0),
    {
      message: "Visitante não pode ser escalado em ministério",
      path: ["ministryIds"],
    },
  );

export type PersonFormValues = z.input<typeof personSchema>;
export type PersonFormOutput = z.output<typeof personSchema>;
