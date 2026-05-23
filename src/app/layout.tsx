import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOCK//IN AI — Focus that grows",
  description:
    "A futuristic AI study companion. Lock in, focus deeply, and grow your living digital plant with every session.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
