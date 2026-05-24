import { Lockie } from "@/components/Lockie";

/* ============================================================
   Download links — point at the GitHub releases.
   Edit REPO / VERSION / asset filenames when you cut a release.
   ============================================================ */
const REPO = "SaladStik/LockInAI"; // <-- GitHub owner/repo
const VERSION = "v0.1.0"; // tag the download assets live under
const BASE = `https://github.com/${REPO}`;
const RELEASES = `${BASE}/releases/latest`;

// Direct one-click downloads. Until a release is published, these point at the
// latest-release page (where all assets are listed). Once you cut a release,
// flip each entry to `dl("<exact-asset-name>")` for true one-click downloads.
const dl = (asset: string) => `${BASE}/releases/download/${VERSION}/${asset}`;
void dl; // keep helper available for when assets are published

const DOWNLOADS = {
  mac: RELEASES,
  win: RELEASES,
};

const YEAR = new Date().getFullYear();

const Brand = () => (
  <div className="brand">
    LOCK<span className="slash">//</span>IN<span className="ai">AI</span>
  </div>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11 11 0 0 1 6 0C17.3 4.6 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.4 1.4c0 1.1-.4 2.2-1.2 3-.8.9-2 1.5-3.1 1.4-.1-1.1.4-2.2 1.1-3 .8-.9 2.1-1.5 3.2-1.4zM20.6 17c-.4 1-.6 1.4-1.1 2.3-.8 1.2-1.9 2.7-3.2 2.7-1.2 0-1.5-.8-3.1-.8s-2 .8-3.1.8c-1.3 0-2.4-1.3-3.2-2.5-2.2-3.4-2.5-7.4-1.1-9.5 1-1.5 2.6-2.4 4.1-2.4 1.5 0 2.4.8 3.6.8 1.2 0 1.9-.8 3.6-.8 1.3 0 2.7.7 3.7 2-3.2 1.8-2.7 6.4.1 5.4z" />
  </svg>
);

const WindowsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 5.5 10.5 4.4v7.1H3V5.5zm0 13L10.5 19.6v-7H3v6zM11.5 4.2 21 3v8.5h-9.5V4.2zm0 8.3H21V21l-9.5-1.3v-7.2z" />
  </svg>
);

type Feature = { icon: React.ReactNode; title: string; body: string };

const FEATURES: Feature[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
    title: "Deep-focus sessions",
    body: "Pick a subject and a time, hit start, and lock in. A calm circular timer keeps you anchored to the work in front of you.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: "Gently guided, not blocked",
    body: "No harsh walls. When your attention drifts, LOCK//IN nudges you back — softly steering the browser away from what derails you.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 18v3" />
      </svg>
    ),
    title: "Browser + desktop, as one",
    body: "A companion app and a browser extension that integrate smoothly and cleanly — your whole machine quietly working with you.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V8M12 8c0-3 2-5 5-5 0 3-2 5-5 5zM12 11C12 8 10 6 7 6c0 3 2 5 5 5z" />
      </svg>
    ),
    title: "Grow with Lockie",
    body: "Every focused minute feeds a living digital plant and your companion Lockie. Build streaks, earn XP, and unlock new skins.",
  },
];

export default function Page() {
  return (
    <>
      <header className="topbar">
        <Brand />
        <nav>
          <a href="#features">Features</a>
          <a href="#download">Download</a>
          <a className="ghbtn" href={BASE} target="_blank" rel="noopener noreferrer">
            <GitHubIcon />
            GitHub
          </a>
        </nav>
      </header>

      <main>
        <section className="hero" id="download">
          <Lockie />

          <div className="eyebrow">Your AI focus companion</div>
          <h1 className="title">
            Lock in. Focus deeply.
            <br />
            <span className="grow">Watch it grow.</span>
          </h1>
          <p className="lede">
            LOCK//IN AI gently guides you away from distractions and{" "}
            <span className="hl">integrates smoothly into your browser and desktop</span>. Start a
            session and <span className="hl">Lockie</span> keeps you on track — steering you back when
            you wander, and growing a living digital plant with every minute you stay focused.
          </p>

          <div className="downloads">
            <a className="btn btn-primary" href={DOWNLOADS.mac} target="_blank" rel="noopener noreferrer">
              <AppleIcon />
              <span className="label">
                Download for macOS
                <span className="os-sub">Apple Silicon · .dmg</span>
              </span>
            </a>
            <a className="btn btn-ghost" href={DOWNLOADS.win} target="_blank" rel="noopener noreferrer">
              <WindowsIcon />
              <span className="label">
                Windows
                <span className="os-sub">.exe installer</span>
              </span>
            </a>
          </div>
          <p className="platform-note">
            All builds &amp; release notes on{" "}
            <a href={RELEASES} target="_blank" rel="noopener noreferrer">
              GitHub Releases →
            </a>
          </p>
        </section>

        <section className="features" id="features">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>Focus that grows with you</h2>
            <p>A companion that works with your attention instead of fighting it.</p>
          </div>
          <div className="grid">
            {FEATURES.map((f) => (
              <div className="card" key={f.title}>
                <div className="ico">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cta">
          <h2>Ready to lock in?</h2>
          <p>Free to download. Your focus, your plant, your streak — all on your own machine.</p>
          <div className="downloads">
            <a className="btn btn-primary" href={DOWNLOADS.mac} target="_blank" rel="noopener noreferrer">
              <AppleIcon />
              <span className="label">Download for macOS</span>
            </a>
            <a className="btn btn-ghost" href={RELEASES} target="_blank" rel="noopener noreferrer">
              All platforms
            </a>
          </div>
        </section>
      </main>

      <footer>
        <Brand />
        <div>Focus that grows. © {YEAR} LOCK//IN AI.</div>
      </footer>
    </>
  );
}
