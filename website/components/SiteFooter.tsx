import { Brand } from "./Brand";

const YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer>
      <Brand />
      <div>Focus that grows. © {YEAR} LOCK//IN AI.</div>
    </footer>
  );
}
