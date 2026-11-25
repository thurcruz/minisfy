/**
 * ╔════════════════════════════════════════════════════════════════╗
 * ║  DADOS DE DEMONSTRAÇÃO — IGREJA FICTÍCIA                       ║
 * ║                                                                ║
 * ║  "Comunidade Esperança" não existe. Toda pessoa, valor e        ║
 * ║  registro aqui é inventado para o protótipo.                   ║
 * ║                                                                ║
 * ║  Este arquivo é o ÚNICO ponto de dados falsos do sistema.      ║
 * ║  Nenhum componente inventa número: tudo que aparece na tela    ║
 * ║  é derivado daqui por src/mocks/queries.ts. Quando o Supabase  ║
 * ║  entrar, só queries.ts muda.                                   ║
 * ╚════════════════════════════════════════════════════════════════╝
 */

import type {
  ChurchEvent,
  Family,
  FinancialAccount,
  FinancialCategory,
  GroupMeeting,
  Ministry,
  Organization,
  Person,
  Position,
  Room,
  ScheduleAssignment,
  ScheduleSlot,
  SmallGroup,
  Transaction,
  Unit,
  VisitorJourney,
  VisitorStage,
} from "./types";

/** Data de referência fixa — mantém o protótipo determinístico. */
export const TODAY = new Date("2026-11-25T09:00:00-03:00");

const d = (iso: string) => iso;

/* ================================================================== */
/* Organização e unidades                                             */
/* ================================================================== */

export const organization: Organization = {
  id: "org-1",
  name: "Comunidade Esperança",
  slug: "comunidade-esperanca",
  legalName: "Associação Comunidade Esperança",
  taxId: "12.345.678/0001-90",
  timezone: "America/Sao_Paulo",
};

export const units: Unit[] = [
  {
    id: "u-sede",
    organizationId: "org-1",
    parentUnitId: null,
    name: "Sede — Centro",
    slug: "sede",
    kind: "headquarters",
    city: "Campinas",
    state: "SP",
    isActive: true,
  },
  {
    id: "u-jardim",
    organizationId: "org-1",
    parentUnitId: "u-sede",
    name: "Congregação Jardim América",
    slug: "jardim-america",
    kind: "congregation",
    city: "Campinas",
    state: "SP",
    isActive: true,
  },
];

/* ================================================================== */
/* Ministérios                                                         */
/* ================================================================== */

export const ministries: Ministry[] = [
  { id: "min-louvor", unitId: "u-sede", name: "Louvor", leaderId: "p-06", color: "brand" },
  { id: "min-midia", unitId: "u-sede", name: "Mídia", leaderId: "p-10", color: "accent" },
  { id: "min-recepcao", unitId: "u-sede", name: "Recepção", leaderId: "p-09", color: "neutral" },
  { id: "min-infantil", unitId: "u-sede", name: "Infantil", leaderId: "p-05", color: "brand" },
  { id: "min-jovens", unitId: "u-sede", name: "Jovens", leaderId: "p-12", color: "brand" },
  { id: "min-intercessao", unitId: "u-sede", name: "Intercessão", leaderId: "p-07", color: "neutral" },
  { id: "min-social", unitId: "u-jardim", name: "Ação Social", leaderId: "p-17", color: "accent" },
];

export const positions: Position[] = [
  { id: "pos-vocal", ministryId: "min-louvor", name: "Vocal" },
  { id: "pos-violao", ministryId: "min-louvor", name: "Violão" },
  { id: "pos-teclado", ministryId: "min-louvor", name: "Teclado" },
  { id: "pos-bateria", ministryId: "min-louvor", name: "Bateria" },
  { id: "pos-baixo", ministryId: "min-louvor", name: "Baixo" },
  { id: "pos-som", ministryId: "min-midia", name: "Mesa de som" },
  { id: "pos-projecao", ministryId: "min-midia", name: "Projeção" },
  { id: "pos-camera", ministryId: "min-midia", name: "Câmera" },
  { id: "pos-porta", ministryId: "min-recepcao", name: "Porta principal" },
  { id: "pos-acolhida", ministryId: "min-recepcao", name: "Acolhida de visitantes" },
  { id: "pos-bercario", ministryId: "min-infantil", name: "Berçário" },
  { id: "pos-kids", ministryId: "min-infantil", name: "Sala Kids" },
];

/* ================================================================== */
/* Famílias                                                            */
/* ================================================================== */

export const families: Family[] = [
  { id: "f-01", unitId: "u-sede", name: "Família Carvalho Rocha", neighborhood: "Cambuí" },
  { id: "f-02", unitId: "u-sede", name: "Família Souza Lima", neighborhood: "Taquaral" },
  { id: "f-03", unitId: "u-sede", name: "Família Martins Dias", neighborhood: "Centro" },
  { id: "f-04", unitId: "u-sede", name: "Família Oliveira Nunes", neighborhood: "Barão Geraldo" },
  { id: "f-05", unitId: "u-jardim", name: "Família Ribeiro Castro", neighborhood: "Jardim América" },
  { id: "f-06", unitId: "u-sede", name: "Família Mendes Barbosa", neighborhood: "Mansões" },
  { id: "f-07", unitId: "u-jardim", name: "Família Gomes Teixeira", neighborhood: "Jardim América" },
  { id: "f-08", unitId: "u-sede", name: "Família Azevedo Moreira", neighborhood: "Cambuí" },
];

/* ================================================================== */
/* Pessoas                                                             */
/* ================================================================== */

type P = [
  id: string,
  name: string,
  gender: "F" | "M",
  birth: string,
  status: Person["status"],
  unit: string,
  memberSince: string,
  createdAt: string,
  neighborhood: string,
  familyId: string | null,
  groupId: string | null,
  ministries: string[],
];

const PEOPLE: P[] = [
  ["p-01", "Ana Beatriz Carvalho", "F", "1985-03-14", "member", "u-sede", "2014-02-09", "2014-02-09", "Cambuí", "f-01", "g-cambui", ["min-intercessao"]],
  ["p-02", "Lucas Almeida Rocha", "M", "1983-07-22", "member", "u-sede", "2014-02-09", "2014-02-09", "Cambuí", "f-01", "g-cambui", ["min-louvor"]],
  ["p-03", "Mariana Souza Lima", "F", "1991-11-02", "member", "u-sede", "2017-05-21", "2017-05-21", "Taquaral", "f-02", "g-taquaral", ["min-infantil"]],
  ["p-04", "Pedro Henrique Martins", "M", "1978-01-30", "member", "u-sede", "2011-08-14", "2011-08-14", "Centro", "f-03", "g-centro", ["min-recepcao"]],
  ["p-05", "Juliana Ferreira Dias", "F", "1988-09-17", "member", "u-sede", "2013-03-10", "2013-03-10", "Centro", "f-03", "g-centro", ["min-infantil"]],
  ["p-06", "Rafael Oliveira Nunes", "M", "1990-04-05", "member", "u-sede", "2015-06-07", "2015-06-07", "Barão Geraldo", "f-04", "g-barao", ["min-louvor"]],
  ["p-07", "Camila Ribeiro Castro", "F", "1986-12-11", "member", "u-jardim", "2016-09-18", "2016-09-18", "Jardim América", "f-05", "g-jardim", ["min-intercessao"]],
  ["p-08", "Thiago Mendes Barbosa", "M", "1994-02-26", "member", "u-sede", "2019-01-20", "2019-01-20", "Mansões", "f-06", "g-mansoes", ["min-midia"]],
  ["p-09", "Patrícia Gomes Teixeira", "F", "1981-06-08", "member", "u-jardim", "2012-11-04", "2012-11-04", "Jardim América", "f-07", "g-jardim", ["min-recepcao"]],
  ["p-10", "Bruno Cardoso Pinto", "M", "1996-10-19", "member", "u-sede", "2020-02-16", "2020-02-16", "Taquaral", null, "g-taquaral", ["min-midia"]],
  ["p-11", "Fernanda Azevedo Moreira", "F", "1989-05-23", "member", "u-sede", "2015-10-11", "2015-10-11", "Cambuí", "f-08", "g-cambui", ["min-louvor"]],
  ["p-12", "Gustavo Ramos Vieira", "M", "1999-08-14", "member", "u-sede", "2021-07-04", "2021-07-04", "Barão Geraldo", null, "g-barao", ["min-jovens", "min-louvor"]],
  ["p-13", "Larissa Monteiro Freitas", "F", "2001-01-09", "member", "u-sede", "2022-03-13", "2022-03-13", "Centro", null, "g-centro", ["min-jovens"]],
  ["p-14", "Diego Correia Barros", "M", "1993-03-28", "member", "u-sede", "2018-05-06", "2018-05-06", "Mansões", null, "g-mansoes", ["min-midia"]],
  ["p-15", "Vanessa Lopes Araújo", "F", "1992-07-15", "member", "u-sede", "2017-09-24", "2017-09-24", "Taquaral", null, "g-taquaral", ["min-recepcao"]],
  ["p-16", "Rodrigo Pereira Campos", "M", "1984-11-21", "member", "u-jardim", "2013-07-14", "2013-07-14", "Jardim América", null, "g-jardim", []],
  ["p-17", "Aline Duarte Nogueira", "F", "1987-02-03", "member", "u-jardim", "2014-10-19", "2014-10-19", "Jardim América", null, "g-jardim", ["min-social"]],
  ["p-18", "Marcelo Tavares Siqueira", "M", "1976-09-30", "member", "u-sede", "2009-04-05", "2009-04-05", "Centro", null, "g-centro", ["min-intercessao"]],
  ["p-19", "Bianca Fonseca Macedo", "F", "1998-12-07", "member", "u-sede", "2021-02-07", "2021-02-07", "Cambuí", null, "g-cambui", ["min-jovens"]],
  ["p-20", "Felipe Andrade Vasconcelos", "M", "1995-06-18", "member", "u-sede", "2019-08-11", "2019-08-11", "Barão Geraldo", null, "g-barao", ["min-louvor"]],
  ["p-21", "Renata Cunha Figueiredo", "F", "1990-10-25", "member", "u-sede", "2016-01-17", "2016-01-17", "Taquaral", null, "g-taquaral", ["min-infantil"]],
  ["p-22", "André Luiz Batista", "M", "1982-04-12", "member", "u-sede", "2012-06-10", "2012-06-10", "Mansões", null, "g-mansoes", ["min-recepcao"]],
  ["p-23", "Tatiane Moura Rezende", "F", "1993-08-09", "member", "u-jardim", "2018-11-18", "2018-11-18", "Jardim América", null, "g-jardim", ["min-social"]],
  ["p-24", "Leonardo Pacheco Antunes", "M", "1997-01-27", "member", "u-sede", "2020-09-13", "2020-09-13", "Centro", null, "g-centro", ["min-midia"]],
  ["p-25", "Débora Cristina Salles", "F", "1979-05-16", "member", "u-sede", "2010-03-21", "2010-03-21", "Cambuí", null, "g-cambui", ["min-intercessao"]],
  ["p-26", "Vinícius Prado Guimarães", "M", "2000-11-04", "member", "u-sede", "2026-07-05", "2026-07-05", "Barão Geraldo", null, "g-barao", ["min-jovens"]],
  ["p-27", "Simone Bastos Cavalcanti", "F", "1985-07-31", "member", "u-jardim", "2015-04-12", "2015-04-12", "Jardim América", null, "g-jardim", ["min-infantil"]],
  ["p-28", "Eduardo Brandão Leite", "M", "1991-02-19", "member", "u-sede", "2017-02-19", "2017-02-19", "Taquaral", null, "g-taquaral", ["min-louvor"]],
  ["p-29", "Priscila Xavier Sampaio", "F", "1994-09-06", "member", "u-sede", "2019-05-19", "2019-05-19", "Mansões", null, "g-mansoes", ["min-recepcao"]],
  ["p-30", "Caio Medeiros Quintana", "M", "2002-03-23", "member", "u-sede", "2026-01-18", "2026-01-18", "Centro", null, "g-centro", ["min-jovens", "min-midia"]],
  ["p-31", "Letícia Peixoto Vargas", "F", "1996-12-29", "member", "u-sede", "2021-10-10", "2021-10-10", "Cambuí", null, "g-cambui", ["min-louvor"]],
  ["p-32", "Henrique Dantas Coelho", "M", "1988-08-02", "member", "u-sede", "2014-07-06", "2014-07-06", "Barão Geraldo", null, "g-barao", []],
  ["p-33", "Natália Soares Bezerra", "F", "1992-04-26", "regular", "u-jardim", "2026-02-15", "2026-02-15", "Jardim América", null, "g-jardim", []],
  ["p-34", "Alexandre Vilela Portela", "M", "1986-10-13", "member", "u-sede", "2013-12-08", "2013-12-08", "Taquaral", null, "g-taquaral", ["min-intercessao"]],
  ["p-35", "Carolina Esteves Mota", "F", "1999-05-08", "member", "u-sede", "2026-10-11", "2026-10-11", "Mansões", null, "g-mansoes", ["min-jovens"]],
  ["p-36", "Murilo Benevides Fontes", "M", "1990-01-15", "regular", "u-sede", "2026-04-12", "2026-04-12", "Centro", null, "g-centro", []],
  ["p-37", "Gabriela Rangel Amorim", "F", "1997-07-21", "member", "u-sede", "2020-11-08", "2020-11-08", "Cambuí", null, "g-cambui", ["min-infantil"]],
  ["p-38", "Fábio Carneiro Drumond", "M", "1983-11-09", "member", "u-sede", "2011-05-15", "2011-05-15", "Barão Geraldo", null, "g-barao", ["min-recepcao"]],
  ["p-39", "Isabela Queiroz Tavares", "F", "2003-02-17", "member", "u-sede", "2026-05-17", "2026-05-17", "Taquaral", null, "g-taquaral", ["min-jovens"]],
  ["p-40", "Ricardo Novaes Belmonte", "M", "1975-06-04", "member", "u-sede", "2008-02-17", "2008-02-17", "Centro", null, "g-centro", []],
  ["p-41", "Jéssica Paiva Cordeiro", "F", "1995-10-30", "regular", "u-sede", "2026-06-21", "2026-06-21", "Mansões", null, "g-mansoes", []],
  ["p-42", "Otávio Lacerda Rios", "M", "1989-03-07", "member", "u-jardim", "2016-04-24", "2016-04-24", "Jardim América", null, "g-jardim", ["min-social"]],
  ["p-43", "Sabrina Vilar Monteiro", "F", "1991-12-14", "member", "u-sede", "2018-01-14", "2018-01-14", "Cambuí", null, "g-cambui", ["min-louvor"]],
  ["p-44", "Everton Caldas Pimentel", "M", "1998-09-22", "regular", "u-sede", "2026-08-09", "2026-08-09", "Barão Geraldo", null, "g-barao", []],
  ["p-45", "Luana Serra Bittencourt", "F", "2004-05-11", "member", "u-sede", "2026-03-08", "2026-03-08", "Taquaral", null, "g-taquaral", ["min-jovens"]],
  ["p-46", "Márcio Valente Sobral", "M", "1980-07-28", "member", "u-sede", "2010-10-03", "2010-10-03", "Centro", null, "g-centro", ["min-intercessao"]],
  ["p-47", "Cristiane Aguiar Pontes", "F", "1987-01-19", "member", "u-jardim", "2015-08-16", "2015-08-16", "Jardim América", null, "g-jardim", ["min-recepcao"]],
  ["p-48", "Wesley Bonfim Trindade", "M", "2001-11-25", "regular", "u-sede", "2026-09-27", "2026-09-27", "Mansões", null, "g-mansoes", ["min-midia"]],
  ["p-49", "Elaine Vasques Marinho", "F", "1993-06-02", "member", "u-sede", "2019-03-17", "2019-03-17", "Cambuí", null, "g-cambui", ["min-infantil"]],
  ["p-50", "Danilo Furtado Negrão", "M", "1984-02-09", "inactive", "u-sede", "2012-09-09", "2012-09-09", "Barão Geraldo", null, null, []],
  ["p-51", "Rute Almeida Rocha", "F", "2015-04-18", "member", "u-sede", "2015-04-18", "2015-04-18", "Cambuí", "f-01", null, []],
  ["p-52", "Davi Almeida Rocha", "M", "2018-09-03", "member", "u-sede", "2018-09-03", "2018-09-03", "Cambuí", "f-01", null, []],
  ["p-53", "Laura Martins Dias", "F", "2016-07-12", "member", "u-sede", "2016-07-12", "2016-07-12", "Centro", "f-03", null, []],
  ["p-54", "Miguel Ribeiro Castro", "M", "2019-02-25", "member", "u-jardim", "2019-02-25", "2019-02-25", "Jardim América", "f-05", null, []],
  ["p-55", "Sofia Gomes Teixeira", "F", "2017-11-30", "member", "u-jardim", "2017-11-30", "2017-11-30", "Jardim América", "f-07", null, []],
  /* --- adolescentes --- */
  ["p-64", "Ester Carvalho Rocha", "F", "2011-06-14", "member", "u-sede", "2011-06-14", "2011-06-14", "Cambuí", "f-01", null, ["min-jovens"]],
  ["p-65", "Benjamim Souza Lima", "M", "2010-03-22", "member", "u-sede", "2010-03-22", "2010-03-22", "Taquaral", "f-02", null, []],
  ["p-66", "Melissa Teixeira Alencar", "F", "2012-09-05", "member", "u-jardim", "2019-03-10", "2019-03-10", "Jardim América", "f-07", null, ["min-jovens"]],
  ["p-67", "Arthur Mendes Barbosa", "M", "2009-11-19", "member", "u-sede", "2021-05-16", "2021-05-16", "Mansões", "f-06", null, ["min-midia"]],
  /* --- terceira idade --- */
  ["p-68", "Terezinha Alves Fontoura", "F", "1949-08-27", "member", "u-sede", "2005-03-06", "2005-03-06", "Centro", null, "g-centro", ["min-intercessao"]],
  ["p-69", "Sebastião Campos Vilela", "M", "1952-01-12", "member", "u-sede", "2006-07-23", "2006-07-23", "Taquaral", null, "g-taquaral", ["min-intercessao"]],
  ["p-70", "Maria das Graças Siqueira", "F", "1957-04-30", "member", "u-jardim", "2011-02-20", "2011-02-20", "Jardim América", null, "g-jardim", []],
  ["p-71", "Oswaldo Pinheiro Lacerda", "M", "1944-12-03", "member", "u-sede", "2003-09-14", "2003-09-14", "Cambuí", null, "g-cambui", []],
  ["p-72", "Neusa Bittencourt Prado", "F", "1961-10-16", "member", "u-sede", "2013-06-09", "2013-06-09", "Mansões", null, "g-mansoes", ["min-recepcao"]],
  /* --- visitantes em acompanhamento --- */
  ["p-56", "Amanda Rocha Vilaça", "F", "1994-08-21", "visitor", "u-sede", "2026-11-22", "2026-11-22", "Taquaral", null, null, []],
  ["p-57", "Igor Sampaio Veloso", "M", "1990-05-14", "visitor", "u-sede", "2026-11-15", "2026-11-15", "Centro", null, null, []],
  ["p-58", "Beatriz Toledo Caminha", "F", "1987-10-08", "visitor", "u-sede", "2026-11-08", "2026-11-08", "Cambuí", null, null, []],
  ["p-59", "Samuel Arruda Fagundes", "M", "2000-01-23", "visitor", "u-sede", "2026-11-01", "2026-11-01", "Barão Geraldo", null, null, []],
  ["p-60", "Núbia Lemos Bragança", "F", "1982-03-16", "visitor", "u-jardim", "2026-10-25", "2026-10-25", "Jardim América", null, null, []],
  ["p-61", "Hélio Brasil Monteiro", "M", "1971-12-05", "visitor", "u-sede", "2026-10-18", "2026-10-18", "Mansões", null, null, []],
  ["p-62", "Tainá Ferraz Bonifácio", "F", "1999-04-02", "visitor", "u-sede", "2026-11-22", "2026-11-22", "Centro", null, null, []],
  ["p-63", "Joel Siqueira Andrade", "M", "1993-09-27", "visitor", "u-jardim", "2026-11-15", "2026-11-15", "Jardim América", null, null, []],
];

function phoneFor(index: number): string {
  const base = 970000000 + index * 137911;
  return `19${String(base).slice(0, 9)}`;
}

function emailFor(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/\s+/)
    .slice(0, 2)
    .join(".");
  return `${slug}@exemplo.com.br`;
}

export const people: Person[] = PEOPLE.map(
  (
    [id, name, gender, birthDate, status, unitId, memberSince, createdAt, neighborhood, familyId, groupId, ministryIds],
    i,
  ) => {
    const isChild = new Date(birthDate).getFullYear() > 2010;
    return {
      id,
      name,
      gender,
      birthDate: d(birthDate),
      status,
      unitId,
      memberSince: d(memberSince),
      createdAt: d(createdAt),
      neighborhood,
      familyId,
      groupId,
      ministryIds,
      phone: phoneFor(i),
      email: isChild ? null : emailFor(name),
      isGuardian: !isChild && familyId !== null,
    };
  },
);

/* ================================================================== */
/* Visitantes — pipeline                                              */
/* ================================================================== */

export const visitorStages: VisitorStage[] = [
  { id: "vs-1", name: "Novo visitante", position: 1, kind: "new" },
  { id: "vs-2", name: "Primeiro contato", position: 2, kind: "working" },
  { id: "vs-3", name: "Aguardando retorno", position: 3, kind: "working" },
  { id: "vs-4", name: "Convidado p/ grupo", position: 4, kind: "working" },
  { id: "vs-5", name: "Integrado", position: 5, kind: "won" },
];

export const visitorJourneys: VisitorJourney[] = [
  { id: "vj-1", personId: "p-56", stageId: "vs-1", ownerId: "p-09", source: "convite_membro", firstVisitAt: d("2026-11-22"), visitCount: 1, nextActionAt: d("2026-11-25"), nextActionLabel: "Ligar para dar boas-vindas" },
  { id: "vj-2", personId: "p-62", stageId: "vs-1", ownerId: "p-09", source: "redes_sociais", firstVisitAt: d("2026-11-22"), visitCount: 1, nextActionAt: d("2026-11-25"), nextActionLabel: "Enviar mensagem de boas-vindas" },
  { id: "vj-3", personId: "p-57", stageId: "vs-2", ownerId: "p-15", source: "espontaneo", firstVisitAt: d("2026-11-15"), visitCount: 2, nextActionAt: d("2026-11-26"), nextActionLabel: "Confirmar presença no domingo" },
  { id: "vj-4", personId: "p-63", stageId: "vs-2", ownerId: "p-47", source: "evento", firstVisitAt: d("2026-11-15"), visitCount: 1, nextActionAt: d("2026-11-24"), nextActionLabel: "Retornar ligação" },
  { id: "vj-5", personId: "p-58", stageId: "vs-3", ownerId: "p-15", source: "site", firstVisitAt: d("2026-11-08"), visitCount: 2, nextActionAt: d("2026-11-28"), nextActionLabel: "Segundo contato" },
  { id: "vj-6", personId: "p-61", stageId: "vs-3", ownerId: "p-22", source: "convite_membro", firstVisitAt: d("2026-10-18"), visitCount: 3, nextActionAt: d("2026-11-21"), nextActionLabel: "Agendar visita" },
  { id: "vj-7", personId: "p-59", stageId: "vs-4", ownerId: "p-12", source: "pequeno_grupo", firstVisitAt: d("2026-11-01"), visitCount: 4, nextActionAt: d("2026-11-27"), nextActionLabel: "Acompanhar no grupo de Barão" },
  { id: "vj-8", personId: "p-60", stageId: "vs-5", ownerId: "p-47", source: "convite_membro", firstVisitAt: d("2026-10-25"), visitCount: 5, nextActionAt: null, nextActionLabel: null },
];

/* ================================================================== */
/* Pequenos grupos                                                     */
/* ================================================================== */

export const smallGroups: SmallGroup[] = [
  { id: "g-cambui", unitId: "u-sede", name: "GC Cambuí", category: "Famílias", weekday: 3, startTime: "20:00", neighborhood: "Cambuí", capacity: 16, leaderId: "p-01", hostId: "p-25", status: "active", startedAt: d("2021-03-10") },
  { id: "g-taquaral", unitId: "u-sede", name: "GC Taquaral", category: "Casais", weekday: 4, startTime: "20:00", neighborhood: "Taquaral", capacity: 14, leaderId: "p-03", hostId: "p-21", status: "active", startedAt: d("2022-02-17") },
  { id: "g-centro", unitId: "u-sede", name: "GC Centro", category: "Misto", weekday: 2, startTime: "19:30", neighborhood: "Centro", capacity: 18, leaderId: "p-04", hostId: "p-18", status: "active", startedAt: d("2019-08-13") },
  { id: "g-barao", unitId: "u-sede", name: "GC Barão Geraldo", category: "Jovens", weekday: 5, startTime: "20:30", neighborhood: "Barão Geraldo", capacity: 20, leaderId: "p-12", hostId: "p-32", status: "active", startedAt: d("2023-04-07") },
  { id: "g-mansoes", unitId: "u-sede", name: "GC Mansões", category: "Misto", weekday: 3, startTime: "19:30", neighborhood: "Mansões Santo Antônio", capacity: 12, leaderId: "p-22", hostId: "p-29", status: "active", startedAt: d("2024-09-11") },
  { id: "g-jardim", unitId: "u-jardim", name: "GC Jardim América", category: "Famílias", weekday: 4, startTime: "19:30", neighborhood: "Jardim América", capacity: 20, leaderId: "p-07", hostId: "p-09", status: "active", startedAt: d("2020-10-15") },
];

/** Últimos 8 encontros de cada grupo. Presença varia de forma realista. */
function buildMeetings(): GroupMeeting[] {
  const out: GroupMeeting[] = [];
  const profile: Record<string, number[]> = {
    "g-cambui": [11, 12, 10, 13, 12, 14, 13, 14],
    "g-taquaral": [9, 8, 10, 9, 11, 10, 11, 12],
    "g-centro": [15, 14, 16, 13, 15, 14, 13, 12],
    "g-barao": [12, 14, 15, 16, 15, 17, 18, 19],
    "g-mansoes": [7, 8, 6, 8, 7, 9, 8, 9],
    "g-jardim": [14, 15, 13, 14, 16, 15, 16, 17],
  };
  for (const g of smallGroups) {
    const series = profile[g.id]!;
    series.forEach((present, i) => {
      const weeksAgo = series.length - i;
      const date = new Date(TODAY);
      date.setDate(date.getDate() - weeksAgo * 7);
      const held = weeksAgo > 0;
      out.push({
        id: `m-${g.id}-${i}`,
        groupId: g.id,
        scheduledFor: date.toISOString(),
        heldAt: held ? date.toISOString() : null,
        presentCount: present,
        visitorCount: i % 3 === 0 ? 1 : 0,
        offeringCents: present * 1500 + (i % 4) * 2300,
        reported: weeksAgo > 1,
      });
    });
  }
  return out;
}

export const groupMeetings: GroupMeeting[] = buildMeetings();

/* ================================================================== */
/* Salas e agenda                                                      */
/* ================================================================== */

export const rooms: Room[] = [
  { id: "r-templo", unitId: "u-sede", name: "Templo principal", capacity: 400 },
  { id: "r-anexo", unitId: "u-sede", name: "Salão anexo", capacity: 80 },
  { id: "r-kids1", unitId: "u-sede", name: "Sala Kids 1", capacity: 25 },
  { id: "r-kids2", unitId: "u-sede", name: "Sala Kids 2", capacity: 25 },
  { id: "r-reuniao", unitId: "u-sede", name: "Sala de reuniões", capacity: 12 },
  { id: "r-jardim", unitId: "u-jardim", name: "Templo Jardim América", capacity: 150 },
];

function at(dayOffset: number, hhmm: string, durationMin: number) {
  const [h, m] = hhmm.split(":").map(Number);
  const start = new Date(TODAY);
  start.setDate(start.getDate() + dayOffset);
  start.setHours(h!, m!, 0, 0);
  const end = new Date(start.getTime() + durationMin * 60_000);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

export const events: ChurchEvent[] = [
  { id: "e-01", unitId: "u-sede", kind: "ensaio", title: "Ensaio do Louvor", ...at(1, "20:00", 120), roomId: "r-templo", capacity: null, registrations: 0, expectedAttendance: 12, actualAttendance: null },
  { id: "e-02", unitId: "u-sede", kind: "culto", title: "Culto de Celebração", ...at(2, "19:30", 105), roomId: "r-templo", capacity: 400, registrations: 0, expectedAttendance: 280, actualAttendance: null },
  { id: "e-03", unitId: "u-sede", kind: "culto", title: "Culto Dominical — Manhã", ...at(5, "10:00", 100), roomId: "r-templo", capacity: 400, registrations: 0, expectedAttendance: 310, actualAttendance: null },
  { id: "e-04", unitId: "u-sede", kind: "culto", title: "Culto Dominical — Noite", ...at(5, "19:00", 100), roomId: "r-templo", capacity: 400, registrations: 0, expectedAttendance: 240, actualAttendance: null },
  { id: "e-05", unitId: "u-jardim", kind: "culto", title: "Culto Jardim América", ...at(5, "19:00", 90), roomId: "r-jardim", capacity: 150, registrations: 0, expectedAttendance: 95, actualAttendance: null },
  { id: "e-06", unitId: "u-sede", kind: "evento", title: "Encontro de Jovens — Imersão", ...at(9, "19:00", 180), roomId: "r-anexo", capacity: 80, registrations: 54, expectedAttendance: null, actualAttendance: null },
  { id: "e-07", unitId: "u-sede", kind: "reuniao", title: "Reunião de Líderes de GC", ...at(7, "20:00", 90), roomId: "r-reuniao", capacity: 12, registrations: 0, expectedAttendance: 8, actualAttendance: null },
  { id: "e-08", unitId: "u-sede", kind: "evento", title: "Almoço das Famílias", ...at(12, "12:00", 180), roomId: "r-anexo", capacity: 120, registrations: 38, expectedAttendance: null, actualAttendance: null },
  { id: "e-09", unitId: "u-sede", kind: "curso", title: "Escola Bíblica — Turma Fundamentos", ...at(5, "09:00", 60), roomId: "r-anexo", capacity: 40, registrations: 27, expectedAttendance: null, actualAttendance: null },
  /* passado — alimenta o histórico de frequência */
  { id: "e-p1", unitId: "u-sede", kind: "culto", title: "Culto Dominical — Manhã", ...at(-2, "10:00", 100), roomId: "r-templo", capacity: 400, registrations: 0, expectedAttendance: 300, actualAttendance: 296 },
  { id: "e-p2", unitId: "u-sede", kind: "culto", title: "Culto Dominical — Noite", ...at(-2, "19:00", 100), roomId: "r-templo", capacity: 400, registrations: 0, expectedAttendance: 240, actualAttendance: 231 },
  { id: "e-p3", unitId: "u-sede", kind: "culto", title: "Culto de Celebração", ...at(-5, "19:30", 105), roomId: "r-templo", capacity: 400, registrations: 0, expectedAttendance: 280, actualAttendance: 268 },
];

/* ================================================================== */
/* Escalas                                                             */
/* ================================================================== */

export const scheduleSlots: ScheduleSlot[] = [
  { id: "s-01", eventId: "e-03", positionId: "pos-vocal", requiredCount: 3 },
  { id: "s-02", eventId: "e-03", positionId: "pos-violao", requiredCount: 1 },
  { id: "s-03", eventId: "e-03", positionId: "pos-teclado", requiredCount: 1 },
  { id: "s-04", eventId: "e-03", positionId: "pos-bateria", requiredCount: 1 },
  { id: "s-05", eventId: "e-03", positionId: "pos-som", requiredCount: 1 },
  { id: "s-06", eventId: "e-03", positionId: "pos-projecao", requiredCount: 1 },
  { id: "s-07", eventId: "e-03", positionId: "pos-porta", requiredCount: 2 },
  { id: "s-08", eventId: "e-03", positionId: "pos-kids", requiredCount: 2 },
  { id: "s-09", eventId: "e-02", positionId: "pos-vocal", requiredCount: 2 },
  { id: "s-10", eventId: "e-02", positionId: "pos-teclado", requiredCount: 1 },
  { id: "s-11", eventId: "e-02", positionId: "pos-som", requiredCount: 1 },
  { id: "s-12", eventId: "e-02", positionId: "pos-acolhida", requiredCount: 2 },
  { id: "s-13", eventId: "e-04", positionId: "pos-vocal", requiredCount: 2 },
  { id: "s-14", eventId: "e-04", positionId: "pos-som", requiredCount: 1 },
  { id: "s-15", eventId: "e-04", positionId: "pos-camera", requiredCount: 1 },
  { id: "s-16", eventId: "e-05", positionId: "pos-porta", requiredCount: 1 },
];

export const scheduleAssignments: ScheduleAssignment[] = [
  /* Domingo manhã — louvor completo e confirmado */
  { id: "a-01", slotId: "s-01", personId: "p-11", status: "confirmed", respondedAt: d("2026-11-20") },
  { id: "a-02", slotId: "s-01", personId: "p-31", status: "confirmed", respondedAt: d("2026-11-20") },
  { id: "a-03", slotId: "s-01", personId: "p-43", status: "invited", respondedAt: null },
  { id: "a-04", slotId: "s-02", personId: "p-02", status: "confirmed", respondedAt: d("2026-11-19") },
  { id: "a-05", slotId: "s-03", personId: "p-28", status: "confirmed", respondedAt: d("2026-11-21") },
  { id: "a-06", slotId: "s-04", personId: "p-20", status: "declined", respondedAt: d("2026-11-22") },
  { id: "a-07", slotId: "s-05", personId: "p-10", status: "confirmed", respondedAt: d("2026-11-19") },
  { id: "a-08", slotId: "s-06", personId: "p-24", status: "invited", respondedAt: null },
  { id: "a-09", slotId: "s-07", personId: "p-04", status: "confirmed", respondedAt: d("2026-11-18") },
  { id: "a-10", slotId: "s-07", personId: "p-38", status: "confirmed", respondedAt: d("2026-11-18") },
  { id: "a-11", slotId: "s-08", personId: "p-05", status: "confirmed", respondedAt: d("2026-11-20") },
  { id: "a-12", slotId: "s-08", personId: "p-37", status: "invited", respondedAt: null },
  /* Quarta — celebração */
  { id: "a-13", slotId: "s-09", personId: "p-06", status: "confirmed", respondedAt: d("2026-11-21") },
  { id: "a-14", slotId: "s-09", personId: "p-12", status: "confirmed", respondedAt: d("2026-11-21") },
  { id: "a-15", slotId: "s-10", personId: "p-28", status: "invited", respondedAt: null },
  { id: "a-16", slotId: "s-11", personId: "p-08", status: "confirmed", respondedAt: d("2026-11-20") },
  { id: "a-17", slotId: "s-12", personId: "p-15", status: "confirmed", respondedAt: d("2026-11-19") },
  { id: "a-18", slotId: "s-12", personId: "p-29", status: "invited", respondedAt: null },
  /* Domingo noite — incompleta de propósito */
  { id: "a-19", slotId: "s-13", personId: "p-11", status: "invited", respondedAt: null },
  { id: "a-20", slotId: "s-14", personId: "p-48", status: "confirmed", respondedAt: d("2026-11-22") },
  { id: "a-21", slotId: "s-16", personId: "p-47", status: "confirmed", respondedAt: d("2026-11-21") },
];

/* ================================================================== */
/* Financeiro                                                          */
/* ================================================================== */

export const financialAccounts: FinancialAccount[] = [
  { id: "fa-bb", unitId: "u-sede", name: "Banco do Brasil — CC 12345-6", kind: "bank", openingBalanceCents: 4_820_000 },
  { id: "fa-caixa", unitId: "u-sede", name: "Caixa da secretaria", kind: "cash", openingBalanceCents: 120_000 },
  { id: "fa-jardim", unitId: "u-jardim", name: "Sicoob — Jardim América", kind: "bank", openingBalanceCents: 960_000 },
];

export const financialCategories: FinancialCategory[] = [
  { id: "fc-dizimo", name: "Dízimos", kind: "income" },
  { id: "fc-oferta", name: "Ofertas", kind: "income" },
  { id: "fc-missoes", name: "Oferta missionária", kind: "income" },
  { id: "fc-evento", name: "Inscrições de eventos", kind: "income" },
  { id: "fc-aluguel", name: "Aluguel", kind: "expense" },
  { id: "fc-energia", name: "Energia elétrica", kind: "expense" },
  { id: "fc-agua", name: "Água", kind: "expense" },
  { id: "fc-internet", name: "Internet e telefonia", kind: "expense" },
  { id: "fc-pessoal", name: "Pessoal e encargos", kind: "expense" },
  { id: "fc-manutencao", name: "Manutenção", kind: "expense" },
  { id: "fc-social", name: "Ação social", kind: "expense" },
  { id: "fc-material", name: "Material de consumo", kind: "expense" },
];

/**
 * 6 meses de movimentação. Gerado por regra para manter coerência
 * entre entradas, saídas e saldo — não são números soltos.
 */
function buildTransactions(): Transaction[] {
  const out: Transaction[] = [];
  let seq = 0;
  const id = () => `t-${String(++seq).padStart(4, "0")}`;

  const monthly: Array<{
    month: number;
    year: number;
    dizimo: number;
    oferta: number;
    missoes: number;
  }> = [
    { month: 5, year: 2026, dizimo: 8_640_000, oferta: 2_310_000, missoes: 480_000 },
    { month: 6, year: 2026, dizimo: 8_920_000, oferta: 2_180_000, missoes: 510_000 },
    { month: 7, year: 2026, dizimo: 9_150_000, oferta: 2_470_000, missoes: 495_000 },
    { month: 8, year: 2026, dizimo: 8_780_000, oferta: 2_250_000, missoes: 530_000 },
    { month: 9, year: 2026, dizimo: 9_480_000, oferta: 2_620_000, missoes: 560_000 },
    { month: 10, year: 2026, dizimo: 9_720_000, oferta: 2_540_000, missoes: 575_000 },
  ];

  const fixedExpenses: Array<[string, number, number]> = [
    ["fc-aluguel", 1_850_000, 5],
    ["fc-energia", 412_000, 12],
    ["fc-agua", 138_000, 12],
    ["fc-internet", 29_900, 15],
    ["fc-pessoal", 4_260_000, 5],
    ["fc-manutencao", 320_000, 18],
    ["fc-social", 680_000, 10],
    ["fc-material", 215_000, 22],
  ];

  for (const m of monthly) {
    const mm = String(m.month).padStart(2, "0");
    // Receitas semanais de dízimo e oferta
    for (let w = 0; w < 4; w++) {
      const day = String(2 + w * 7).padStart(2, "0");
      out.push({
        id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-dizimo",
        kind: "income", amountCents: Math.round(m.dizimo / 4),
        competenceDate: `${m.year}-${mm}-${day}`, dueDate: null,
        status: "reconciled", description: `Dízimos — ${w + 1}ª semana`,
        personId: null, reversalOfId: null,
      });
      out.push({
        id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-oferta",
        kind: "income", amountCents: Math.round(m.oferta / 4),
        competenceDate: `${m.year}-${mm}-${day}`, dueDate: null,
        status: "reconciled", description: `Ofertas — ${w + 1}ª semana`,
        personId: null, reversalOfId: null,
      });
    }
    out.push({
      id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-missoes",
      kind: "income", amountCents: m.missoes,
      competenceDate: `${m.year}-${mm}-28`, dueDate: null,
      status: "reconciled", description: "Oferta missionária do mês",
      personId: null, reversalOfId: null,
    });
    for (const [categoryId, amount, day] of fixedExpenses) {
      out.push({
        id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId,
        kind: "expense", amountCents: amount,
        competenceDate: `${m.year}-${mm}-${String(day).padStart(2, "0")}`,
        dueDate: `${m.year}-${mm}-${String(day).padStart(2, "0")}`,
        status: "paid",
        description: financialCategories.find((c) => c.id === categoryId)!.name,
        personId: null, reversalOfId: null,
      });
    }
  }

  // Mês corrente (novembro/2026) — parcialmente lançado
  out.push(
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-dizimo", kind: "income", amountCents: 2_480_000, competenceDate: "2026-11-01", dueDate: null, status: "reconciled", description: "Dízimos — 1ª semana", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-dizimo", kind: "income", amountCents: 2_310_000, competenceDate: "2026-11-08", dueDate: null, status: "reconciled", description: "Dízimos — 2ª semana", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-dizimo", kind: "income", amountCents: 2_640_000, competenceDate: "2026-11-15", dueDate: null, status: "paid", description: "Dízimos — 3ª semana", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-dizimo", kind: "income", amountCents: 2_190_000, competenceDate: "2026-11-22", dueDate: null, status: "paid", description: "Dízimos — 4ª semana", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-oferta", kind: "income", amountCents: 638_000, competenceDate: "2026-11-01", dueDate: null, status: "reconciled", description: "Ofertas — 1ª semana", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-oferta", kind: "income", amountCents: 594_000, competenceDate: "2026-11-08", dueDate: null, status: "reconciled", description: "Ofertas — 2ª semana", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-oferta", kind: "income", amountCents: 712_000, competenceDate: "2026-11-15", dueDate: null, status: "paid", description: "Ofertas — 3ª semana", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-oferta", kind: "income", amountCents: 655_000, competenceDate: "2026-11-22", dueDate: null, status: "paid", description: "Ofertas — 4ª semana", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-evento", kind: "income", amountCents: 270_000, competenceDate: "2026-11-18", dueDate: null, status: "paid", description: "Inscrições — Encontro de Jovens", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-aluguel", kind: "expense", amountCents: 1_850_000, competenceDate: "2026-11-05", dueDate: "2026-11-05", status: "paid", description: "Aluguel", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-pessoal", kind: "expense", amountCents: 4_260_000, competenceDate: "2026-11-05", dueDate: "2026-11-05", status: "paid", description: "Pessoal e encargos", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-energia", kind: "expense", amountCents: 438_000, competenceDate: "2026-11-12", dueDate: "2026-11-12", status: "paid", description: "Energia elétrica", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-agua", kind: "expense", amountCents: 142_000, competenceDate: "2026-11-12", dueDate: "2026-11-12", status: "paid", description: "Água", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-social", kind: "expense", amountCents: 720_000, competenceDate: "2026-11-10", dueDate: "2026-11-10", status: "paid", description: "Cestas básicas — ação social", personId: null, reversalOfId: null },
    /* pendências reais que o dashboard precisa mostrar */
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-internet", kind: "expense", amountCents: 29_900, competenceDate: "2026-11-15", dueDate: "2026-11-27", status: "approved", description: "Internet e telefonia", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-manutencao", kind: "expense", amountCents: 486_000, competenceDate: "2026-11-20", dueDate: "2026-11-28", status: "pending", description: "Reparo do ar-condicionado do templo", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-sede", accountId: "fa-bb", categoryId: "fc-material", kind: "expense", amountCents: 198_000, competenceDate: "2026-11-21", dueDate: "2026-12-02", status: "pending", description: "Material de limpeza e copa", personId: null, reversalOfId: null },
    /* unidade Jardim América */
    { id: id(), unitId: "u-jardim", accountId: "fa-jardim", categoryId: "fc-dizimo", kind: "income", amountCents: 1_840_000, competenceDate: "2026-11-15", dueDate: null, status: "reconciled", description: "Dízimos — novembro", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-jardim", accountId: "fa-jardim", categoryId: "fc-oferta", kind: "income", amountCents: 426_000, competenceDate: "2026-11-15", dueDate: null, status: "reconciled", description: "Ofertas — novembro", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-jardim", accountId: "fa-jardim", categoryId: "fc-energia", kind: "expense", amountCents: 186_000, competenceDate: "2026-11-12", dueDate: "2026-11-12", status: "paid", description: "Energia elétrica", personId: null, reversalOfId: null },
    { id: id(), unitId: "u-jardim", accountId: "fa-jardim", categoryId: "fc-social", kind: "expense", amountCents: 310_000, competenceDate: "2026-11-10", dueDate: "2026-11-10", status: "paid", description: "Ação social do bairro", personId: null, reversalOfId: null },
  );

  return out;
}

export const transactions: Transaction[] = buildTransactions();
