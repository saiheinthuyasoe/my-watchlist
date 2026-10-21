import type { Metadata } from "next";
import { TitleDetail } from "@/components/title/TitleDetail";

/**
 * The app shell depends on runtime pathname data, so this open-ended dynamic
 * route renders on demand instead of being forced into a static shell.
 */
export const instant = false;

export const metadata: Metadata = {
  title: "Title details",
  description: "Synopsis, episode progress and tracking controls for this title.",
};

export default async function TitlePage({ params }: PageProps<"/title/[id]">) {
  const { id } = await params;
  const mediaId = Number(id);
  return <TitleDetail mediaId={Number.isFinite(mediaId) ? mediaId : 0} />;
}
