import type { Metadata } from "next";
import { SlideDeck } from "@/components/SlideDeck";

export const metadata: Metadata = {
  title: "Pitch — LOCK//IN AI",
  description:
    "The LOCK//IN AI hackathon pitch deck: a cozy-cyberpunk focus companion that gently guides you away from distractions and grows a living digital garden.",
};

export default function SlidesPage() {
  return <SlideDeck />;
}
