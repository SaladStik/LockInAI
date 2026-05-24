"use client";

import { useCallback, useEffect, useState } from "react";
import { Lockie } from "./Lockie";
import { DOWNLOADS, RELEASES } from "@/lib/links";

/**
 * SlideDeck — a self-contained hackathon presentation deck for LOCK//IN AI.
 * Keyboard-driven (← → / Space / Home / End / F for fullscreen), with on-screen
 * controls and dot navigation. Styled with the site's cozy-cyberpunk language.
 */

type Slide = { id: string; render: () => React.ReactNode };

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <span className="slide-kicker">{children}</span>
);

const SLIDES: Slide[] = [
  {
    id: "title",
    render: () => (
      <div className="slide-title-stage">
        <Lockie />
        <div className="brand slide-brand">
          LOCK<span className="slash">//</span>IN<span className="ai">AI</span>
        </div>
        <h1 className="slide-h1">
          Focus that <span className="grow">grows</span>.
        </h1>
        <p className="slide-lede">
          A cozy-cyberpunk desktop companion that helps you lock into the work you actually planned
          to do — and rewards every session with a living digital garden.
        </p>
        <p className="chud-line">Lock in or be a chud.</p>
      </div>
    ),
  },
  {
    id: "problem",
    render: () => (
      <>
        <Kicker>The problem</Kicker>
        <h2 className="slide-h2">
          Good intentions, <span className="grow">one tab away</span> from gone.
        </h2>
        <p className="slide-lede">
          You sit down to write the essay, study, or ship the project. Then it&apos;s &ldquo;one
          small thing&rdquo; in the browser — and half the session is gone.
        </p>
        <ul className="slide-list">
          <li>Distraction spirals: one tab becomes twenty</li>
          <li>Work starts without a clear, committed goal</li>
          <li>No visible record that you ever showed up</li>
          <li>Harsh blockers feel like punishment, so people quit them</li>
        </ul>
      </>
    ),
  },
  {
    id: "solution",
    render: () => (
      <>
        <Kicker>The solution</Kicker>
        <h2 className="slide-h2">
          Gently guided, <span className="grow">not blocked</span>.
        </h2>
        <p className="slide-lede">
          LOCK//IN AI builds a focus environment <em>before</em> the session starts, then acts as a
          warm guardrail while you work — steering you back instead of shaming you.
        </p>
        <div className="slide-cards">
          <div className="slide-card">
            <h3>Commit first</h3>
            <p>Define the subject, time, allowed apps &amp; sites. A small promise before the timer.</p>
          </div>
          <div className="slide-card">
            <h3>Guardrails, not walls</h3>
            <p>Drift away and Lockie nudges you back. Three breaches before a session fails.</p>
          </div>
          <div className="slide-card">
            <h3>Proof of progress</h3>
            <p>Every finished session grows a plant. Focus becomes something you can see.</p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "concept",
    render: () => (
      <div className="slide-split">
        <div>
          <Kicker>Core concept</Kicker>
          <h2 className="slide-h2">
            Focus you can <span className="grow">grow</span>.
          </h2>
          <p className="slide-lede">
            Each session isn&apos;t just a timer — it becomes a plant in a digital garden. A win adds
            life; a failed session adds a dead plant. Over time your garden becomes a visual
            autobiography of your attention — proof you&apos;ve shown up before and can again.
          </p>
        </div>
        <div className="slide-stat-row">
          <div className="slide-stat"><span className="num">5–120</span><span className="lbl">min sessions</span></div>
          <div className="slide-stat"><span className="num">~800ms</span><span className="lbl">focus checks</span></div>
          <div className="slide-stat"><span className="num">3</span><span className="lbl">breaches allowed</span></div>
          <div className="slide-stat"><span className="num">∞</span><span className="lbl">plants to grow</span></div>
        </div>
      </div>
    ),
  },
  {
    id: "how",
    render: () => (
      <>
        <Kicker>How it works</Kicker>
        <h2 className="slide-h2">Five layers, one locked-in flow.</h2>
        <ol className="slide-steps">
          <li><strong>Define</strong> — subject, length, allowed apps &amp; websites (or load a preset).</li>
          <li><strong>Start</strong> — a calm circular timer with subject, plant, XP, and streak.</li>
          <li><strong>Monitor</strong> — the active window &amp; browser tab are checked against your list.</li>
          <li><strong>React</strong> — snap back, breach overlay, Lockie&apos;s mood shifts, a voice cue.</li>
          <li><strong>Resolve</strong> — finish to grow a plant; breach too often and a dead plant is added.</li>
        </ol>
      </>
    ),
  },
  {
    id: "enforcement",
    render: () => (
      <>
        <Kicker>Live enforcement</Kicker>
        <h2 className="slide-h2">
          Your whole machine, <span className="grow">quietly with you</span>.
        </h2>
        <div className="slide-cards">
          <div className="slide-card">
            <h3>Desktop</h3>
            <p>
              Active-window monitoring on Windows, macOS &amp; Linux. Leave your allowed apps and
              LOCK//IN AI snaps you back — fairly, never counting where you started.
            </p>
          </div>
          <div className="slide-card">
            <h3>Browser extension</h3>
            <p>
              Connects to the app over a local WebSocket. Blocked sites redirect to a styled
              sanctuary page; search results to distractions get filtered or badged.
            </p>
          </div>
          <div className="slide-card">
            <h3>Stays useful</h3>
            <p>
              Google, Wikipedia &amp; new-tab pages stay open, re-skinned to match — the browser
              works without becoming a distraction trap.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "garden",
    render: () => (
      <div className="slide-split">
        <div>
          <Kicker>The garden &amp; Lockie</Kicker>
          <h2 className="slide-h2">
            Every minute <span className="grow">feeds something alive</span>.
          </h2>
          <p className="slide-lede">
            Longer, cleaner sessions grow rarer plants — common, legendary, even celestial. Lockie
            walks a winding path through your forest, happier near living plants. XP, achievements,
            and cosmetic rewards (glow aura, bloom crown, sanctuary halo) make invisible discipline
            visible.
          </p>
        </div>
        <div className="slide-lockie-stage">
          <Lockie />
          <p className="slide-cap">Lockie — your focus companion</p>
        </div>
      </div>
    ),
  },
  {
    id: "tech",
    render: () => (
      <>
        <Kicker>Tech stack</Kicker>
        <h2 className="slide-h2">Built to enforce focus in the OS and the browser.</h2>
        <div className="slide-chips">
          {[
            "Electron",
            "Next.js",
            "React + TypeScript",
            "Tailwind CSS",
            "Browser Extension APIs",
            "Local WebSocket bridge",
            "SVG plant generation",
            "Active-window monitoring",
            "UI automation",
            "Local-first storage",
          ].map((t) => (
            <span className="slide-chip" key={t}>{t}</span>
          ))}
        </div>
        <p className="slide-lede" style={{ marginTop: 28 }}>
          A 400×680 frameless Electron app pairs desktop monitoring with browser-level protection —
          everything persists locally, no account required.
        </p>
      </>
    ),
  },
  {
    id: "demo",
    render: () => (
      <div className="slide-title-stage">
        <Kicker>Live demo</Kicker>
        <h2 className="slide-h2">
          Let&apos;s <span className="grow">lock in</span>.
        </h2>
        <p className="slide-lede">
          From hatching Lockie out of the egg → the five-step setup ritual → a locked-in session →
          a drift &amp; nudge → a brand-new plant in the garden.
        </p>
        <a className="btn btn-ghost" href="/screenshots">
          See the full walkthrough →
        </a>
      </div>
    ),
  },
  {
    id: "cta",
    render: () => (
      <div className="slide-title-stage">
        <Lockie />
        <h2 className="slide-h2">
          Your effort becomes a <span className="grow">garden</span>.
        </h2>
        <p className="slide-lede">
          Free to download. Your focus, your plant, your streak — all on your own machine.
        </p>
        <div className="downloads">
          <a className="btn btn-primary" href={DOWNLOADS.mac} target="_blank" rel="noopener noreferrer">
            Download for macOS
          </a>
          <a className="btn btn-ghost" href={RELEASES} target="_blank" rel="noopener noreferrer">
            All platforms
          </a>
        </div>
        <p className="chud-line">Lock in or be a chud.</p>
      </div>
    ),
  },
];

export function SlideDeck() {
  const [i, setI] = useState(0);
  const total = SLIDES.length;

  const go = useCallback(
    (next: number) => setI((cur) => Math.max(0, Math.min(total - 1, next ?? cur))),
    [total],
  );

  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
          e.preventDefault();
          go(i + 1);
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          go(i - 1);
          break;
        case "Home":
          go(0);
          break;
        case "End":
          go(total - 1);
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "Escape":
          if (!document.fullscreenElement) window.location.href = "/";
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go, total, toggleFullscreen]);

  return (
    <div className="deck">
      <div className="deck-progress" style={{ width: `${((i + 1) / total) * 100}%` }} />

      <div className="deck-stage" key={SLIDES[i].id}>
        <article className="slide">{SLIDES[i].render()}</article>
      </div>

      <div className="deck-dots" role="tablist" aria-label="Slides">
        {SLIDES.map((s, idx) => (
          <button
            key={s.id}
            className={`deck-dot${idx === i ? " active" : ""}`}
            aria-label={`Go to slide ${idx + 1}`}
            aria-selected={idx === i}
            onClick={() => go(idx)}
          />
        ))}
      </div>

      <div className="deck-controls">
        <button className="deck-btn" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous slide">
          ‹
        </button>
        <span className="deck-count">
          {String(i + 1).padStart(2, "0")} <span className="sep">/</span> {String(total).padStart(2, "0")}
        </span>
        <button className="deck-btn" onClick={() => go(i + 1)} disabled={i === total - 1} aria-label="Next slide">
          ›
        </button>
        <button className="deck-btn deck-fs" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          ⛶
        </button>
      </div>

      <a className="deck-exit" href="/" aria-label="Back to site">esc to site</a>
    </div>
  );
}
