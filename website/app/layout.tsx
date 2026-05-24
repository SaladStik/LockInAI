import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOCK//IN AI — Focus that grows",
  description:
    "An AI focus companion that gently guides you away from distractions, integrating smoothly into your browser and desktop. Lock in, focus deeply, and grow a living digital plant with every session.",
};

export const viewport: Viewport = {
  themeColor: "#0c1322",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // suppressHydrationWarning: browser extensions (e.g. Scribe) inject attributes
  // onto <html>/<body> before React hydrates; this stops the false warning.
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
