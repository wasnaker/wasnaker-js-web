import type { Metadata } from "next";
import { createRegionTranslator } from "@wasnaker/region-web/locales";
import Regions from "./page-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ language: string }>;
}): Promise<Metadata> {
  const { language } = await params;
  return { title: createRegionTranslator(language)("title") };
}
export default function Page() {
  return <Regions />;
}
