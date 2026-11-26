import type { Metadata } from "next";
import { SEED_DATASET, eventProfile } from "@/mocks/queries";
import { View } from "./view";

/**
 * Pré-renderiza os eventos do seed. Um evento criado no protótipo tem
 * id que não existe aqui e é renderizado sob demanda — quando o banco
 * entrar, a rota passa a ser dinâmica de todo jeito.
 */
export function generateStaticParams() {
  return SEED_DATASET.events.map((e) => ({ id: e.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = eventProfile(id);
  return { title: profile?.event.title ?? "Evento" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <View id={id} />;
}
