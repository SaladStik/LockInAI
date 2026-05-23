import { createFileRoute } from "@tanstack/react-router";
import { LockInPopup } from "@/components/lockin/LockInPopup";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
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
