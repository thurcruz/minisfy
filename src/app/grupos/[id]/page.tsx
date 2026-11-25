import type { Metadata } from "next";
import { groupProfile, groupsWithStats } from "@/mocks/queries";
import { View } from "./view";
export function generateStaticParams() {
  return groupsWithStats().map((g) => ({ id: g.group.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: groupProfile(id)?.group.name ?? "Pequeno grupo" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <View id={id} />;
}
