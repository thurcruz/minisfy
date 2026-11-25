import type { Metadata } from "next";
import { listPeople, personProfile } from "@/mocks/queries";
import { View } from "./view";
export function generateStaticParams() {
  return listPeople().map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = personProfile(id);
  return { title: profile?.person.name ?? "Pessoa" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <View id={id} />;
}
