import type { Metadata } from "next";
import { ministriesWithStats, ministryProfile } from "@/mocks/queries";
import { View } from "./view";

export function generateStaticParams() {
  return ministriesWithStats().map((m) => ({ id: m.ministry.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = ministryProfile(id);
  return { title: profile?.ministry.name ?? "Ministério" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <View id={id} />;
}
