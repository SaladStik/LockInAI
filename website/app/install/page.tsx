import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DOWNLOADS } from "@/lib/links";

export const metadata: Metadata = {
  title: "Opening on macOS — LOCK//IN AI",
  description:
    "macOS says it “cannot verify LOCK//IN AI is free of malware”? That’s just Gatekeeper blocking an unsigned app. Here’s how to open it in a few clicks.",
};

export default function InstallPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-head">
          <span className="eyebrow">Installing on macOS</span>
          <h1 className="page-title">&ldquo;Apple could not verify&rdquo;? You&apos;re fine.</h1>
          <p className="page-sub">
            macOS Gatekeeper shows that warning for any app that isn&apos;t notarized through a paid
            Apple Developer account &mdash; it is <strong>not</strong> a sign of malware. LOCK//IN AI
            is a fresh indie build, so macOS asks you to confirm before the first launch. Here&apos;s
            how to open it.
          </p>
        </section>

        <div className="guide">
          <div className="callout">
            <span className="callout-tag">What you&apos;re seeing</span>
            <p>
              &ldquo;Apple could not verify &lsquo;LOCKIN AI&rsquo; is free of malware that may harm
              your Mac&hellip;&rdquo; This appears once, on first open, because the app is
              unsigned/un-notarized. You only need to do the steps below a single time.
            </p>
          </div>

          <div className="guide-card">
            <div className="guide-method">Method 1 · recommended (no Terminal)</div>
            <h2>Open it from System Settings</h2>
            <ol className="steps">
              <li>
                Move <strong>LOCKIN AI</strong> into your <strong>Applications</strong> folder, then
                double-click it. When the warning appears, click <strong>Done</strong> (not
                &ldquo;Move to Trash&rdquo;).
              </li>
              <li>
                Open the <strong>Apple menu </strong> &rarr; <strong>System Settings</strong> &rarr;{" "}
                <strong>Privacy &amp; Security</strong>.
              </li>
              <li>
                Scroll down to the <strong>Security</strong> section. You&apos;ll see a line like
                &ldquo;LOCKIN AI was blocked&rdquo; with an <strong>Open Anyway</strong> button. Click
                it.
              </li>
              <li>Authenticate with Touch ID or your password, then click <strong>Open</strong>.</li>
            </ol>
            <p className="guide-note">
              That&apos;s it &mdash; macOS remembers your choice and launches it normally from then
              on.
            </p>
          </div>

          <div className="guide-card">
            <div className="guide-method">Method 2 · one Terminal command</div>
            <h2>Clear the quarantine flag</h2>
            <p>
              Downloads get a <code>com.apple.quarantine</code> tag that triggers the warning. After
              dragging the app to <strong>Applications</strong>, paste this into{" "}
              <strong>Terminal</strong> and press Return:
            </p>
            <pre>
              <code>xattr -dr com.apple.quarantine &quot;/Applications/LOCKIN AI.app&quot;</code>
            </pre>
            <p className="guide-note">The app then opens with a normal double-click.</p>
          </div>

          <div className="callout callout-muted">
            <span className="callout-tag">Why not just sign it?</span>
            <p>
              Removing the warning for everyone requires an Apple Developer ID certificate ($99/yr)
              and notarization. It&apos;s on the roadmap &mdash; until then, these steps are completely
              safe and only needed once.
            </p>
          </div>

          <div className="guide-cta">
            <a className="btn btn-primary" href={DOWNLOADS.mac} target="_blank" rel="noopener noreferrer">
              Download for macOS
            </a>
            <a className="btn btn-ghost" href="/#download">
              Back to downloads
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
