import type { Metadata } from "next";
import { SEED_DATASET, visitorProfile } from "@/mocks/queries";
import { View } from "./view";

export function generateStaticParams() {
  return SEED_DATASET.visitorJourneys.map((j) => ({ id: j.personId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = visitorProfile(id);
  return { title: profile?.person.name ?? "Visitante" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <View id={id} />;
}
