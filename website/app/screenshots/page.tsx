import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScreenshotGallery, type Shot } from "@/components/ScreenshotGallery";

export const metadata: Metadata = {
  title: "Screenshots — LOCK//IN AI",
  description:
    "See LOCK//IN AI in action: the focus companion living on your desktop, from first launch to a fully grown forest.",
};

// Captions follow the natural flow of the app, file order shot-01 … shot-21.
const CAPTIONS = [
  "First launch — something's stirring inside the egg",
  "Tap to wake your companion",
  "Meet Lockie, your focus companion",
  "A gentle welcome",
  "Ready when you are",
  "Lockie settles in beside your work",
  "Choose how long you'll focus — 25 minutes",
  "Or go long — a 105-minute deep session",
  "Pick which apps stay allowed",
  "Pick which sites stay allowed",
  "Review the session before you lock in",
  "Locked in — the focus timer counts down",
  "Staying in flow",
  "A nudge back when your attention drifts",
  "Session complete — you locked in",
  "Your focus grew a brand-new plant",
  "Your forest, one session at a time",
  "A skinned, distraction-free new tab",
  "The whole desktop, gently guided",
  "Steered back from a blocked page",
  "Focus that lives across your browser and desktop",
];

const SHOTS: Shot[] = CAPTIONS.map((caption, i) => ({
  src: `/screenshots/shot-${String(i + 1).padStart(2, "0")}.png`,
  caption,
}));

export default function ScreenshotsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-head">
          <span className="eyebrow">Screenshots</span>
          <h1 className="page-title">See LOCK//IN AI in action</h1>
          <p className="page-sub">
            From the moment Lockie hatches to a fully grown forest — here&apos;s the companion that
            keeps you focused, living quietly alongside your browser and desktop.
          </p>
        </section>

        <ScreenshotGallery shots={SHOTS} />
      </main>
      <SiteFooter />
    </>
  );
}
