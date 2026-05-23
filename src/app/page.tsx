"use client";

import dynamic from "next/dynamic";

const LockInPopup = dynamic(
  () => import("@/components/lockin/LockInPopup").then((m) => m.LockInPopup),
  { ssr: false },
);

export default function Page() {
  return (
    <main
      className="flex h-screen w-screen items-center justify-center bg-transparent"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <LockInPopup />
      </div>
    </main>
  );
}
