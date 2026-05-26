# LOCK//IN AI
***
### 🏆 Award-Winning Hackathon Project 🏆

[![Community Choice](https://img.shields.io/badge/🥇_Community_Choice-Winner-gold?style=for-the-badge)](https://take-home.skillsproject.ai/hackathons/6920c68ad7d8abe4550222ee)

> **Focus that grows.**
> A desktop focus companion that helps you lock into the work you actually planned to do — and rewards every session with a living digital garden.

**Aesthetic:** cozy-cyberpunk dark theme · bio-luminescent leaf green + plasma cyan · aurora glow · glass panels · the floating **Lockie** companion.

LOCK//IN AI is a small Electron desktop app in a focused 400×680 window. It's meant to feel less like a strict productivity tool and more like a calm focus world you step into when you're ready to work. Instead of relying on timers or blocklists alone, it combines focus sessions, allowed apps and websites, browser protection, the Lockie companion, voice cues, achievements, and a growing garden into one experience.

The goal is simple: help you lock into the task you actually planned to do.

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Core Concept](#core-concept)
- [Main Features](#main-features)
- [Setup Ritual](#setup-ritual)
- [Focus Sessions](#focus-sessions)
- [App Enforcement](#app-enforcement)
- [Browser Enforcement](#browser-enforcement)
- [The Garden System](#the-garden-system)
- [Custom Presets](#custom-presets)
- [Achievements and XP](#achievements-and-xp)
- [Lockie](#lockie)
- [Voice Cues](#voice-cues)
- [Settings](#settings)
- [Interface Details](#interface-details)
- [Platform Support](#platform-support)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Who This App Is For](#who-this-app-is-for)
- [Project Purpose](#project-purpose)
- [Future Ideas](#future-ideas)
- [Repository Layout](#repository-layout)

---

## Overview

LOCK//IN AI is made for people who sit down with good intentions but quickly get pulled into distractions.

You open your laptop to write an essay, study for an exam, or ship a project. Then you open Chrome to check "one small thing" — and that turns into a chain of tabs, unrelated videos, and social media. By the time you notice, half your session is gone.

LOCK//IN AI prevents that by asking you to define your session before it starts: what you're working on, how long you want to focus, which apps are allowed, which websites are allowed, and what kind of session you're entering. Once the session begins, it protects your attention by monitoring your active app or browser tab and reacting when you leave the allowed focus environment.

---

## The Problem

The core problem LOCK//IN AI solves is distraction during computer-based work.

Most people don't struggle because they lack goals — they struggle because their work environment is full of easy exits. A student starts an assignment and ends up on YouTube. A developer opens Stack Overflow and ends up with ten unrelated tabs. The problem isn't motivation; it's that **intention without structure disappears quickly.**

Common issues LOCK//IN AI is designed to solve:

- Getting distracted by websites during study sessions
- Opening apps unrelated to the current task
- Starting work without clearly defining the goal
- Losing track of time while browsing and falling into tab spirals
- Harsh blockers that feel annoying or punishing
- Having no visible record of completed focus sessions
- Struggling to build consistent focus habits over time

Many productivity tools answer this by being strict, cold, or frustrating. LOCK//IN AI takes a warmer approach. It still enforces boundaries — but it does so with a friendly interface, the Lockie companion, and a garden that grows as you succeed.

---

## The Solution

LOCK//IN AI builds a structured focus environment *before* the session begins.

Instead of vaguely deciding "I'm going to work," you make specific commitments: the subject or task you're locking into, how long the session lasts, which apps and websites are allowed, and whether to load a saved preset. This setup creates a small commitment before the timer starts.

Once the session is running, LOCK//IN AI acts as a gentle guardrail. If you leave your allowed apps or sites, it notices and guides you back. Break focus too many times and the session fails. The result is a balance between freedom and accountability — the app isn't here to shame you, it's here to make the right path easier than the wrong one.

---

## Core Concept

LOCK//IN AI is built around the idea that **focus should feel like something you grow.**

Instead of treating each session as just a timer, the app turns every completed session into a plant in a digital garden. A successful session adds life to the garden; a failed session adds a dead plant. Over time, the garden becomes a visual record of your focus history — proof that you've shown up before and can do it again.

This makes focus less invisible. You can actually *see* your progress.

---

## Main Features

LOCK//IN AI is a set of connected systems, all serving the same goal — staying focused without making productivity feel miserable:

- Focus setup flow and timed focus sessions
- Allowed app and allowed website selection
- Desktop active-window monitoring
- Browser tab enforcement via a companion extension
- Custom blocked page and search result filtering
- A digital garden with procedurally generated plants
- Failed-session tracking (dead plants)
- Custom focus presets
- XP and an achievement system
- The Lockie companion character (with cosmetic rewards)
- Voice cues for key moments
- Customizable settings
- Cross-platform desktop support (Windows, macOS, Linux)

---

## Setup Ritual

Before a session starts, LOCK//IN AI walks you through a five-step setup ritual that makes you define what focus means for *this* session.

### Step 1 — Choose what you're locking into

Pick a subject or focus type (Math, Coding, Reading, Writing, Exam Prep) or load a saved preset (Thesis, Movie Night, Language Lab, Film Studies, Essay Writing, Programming Sprint). Each preset carries its own default apps and websites. You can also name the plant you're growing — leave it blank and the app generates one for you.

### Step 2 — Choose the session length

Set how long you want to focus, from **5 to 120 minutes**, with the slider snapping to five-minute increments. The plant preview reacts to the length: longer sessions preview a more developed plant, visually connecting time with growth.

### Step 3 — Choose allowed apps

Select which desktop apps are allowed (Chrome, VS Code, Notion, YouTube, Netflix, PDF viewers, Figma, Spotify, and more). For anything not listed, custom app detection makes it easy:

1. Click **Add**
2. Switch to the app you want to allow
3. Return to LOCK//IN AI
4. Let it detect the app
5. Save it as a custom allowed app

No manually typing process names or digging through settings.

### Step 4 — Choose allowed websites

Select which websites are allowed (ChatGPT, Claude, GitHub, Stack Overflow, MDN, YouTube). You can add a site manually or detect it from your current browser tab. Google, Wikipedia, and new-tab pages stay available so you're never blocked from basic navigation — the browser stays useful without becoming a distraction trap.

### Step 5 — Confirm the session

A summary screen shows your subject, plant name, duration, allowed apps, and allowed websites. Press **Lock in** and the focus environment goes active.

---

## Focus Sessions

During a session, LOCK//IN AI becomes a calm command center. The focus screen shows:

- A circular countdown timer with a glowing progress ring
- Current subject and plant name
- Streak and XP
- Lockie in focused mode
- Allowed apps displayed as chips

The app doesn't just run a timer — it actively checks whether you're staying inside your allowed focus environment. Stay focused until the timer ends and the session completes successfully, adding a plant to your garden. Break focus too many times and it ends as an emergency exit, adding a dead plant instead.

---

## App Enforcement

LOCK//IN AI monitors the active desktop window during a session, checking roughly every 800 milliseconds on Windows, macOS, and Linux.

If you switch to an app outside your allowed list, the app reacts — it can:

- Snap you back to the last allowed app
- Show a breach overlay
- Change Lockie's expression
- Dim the plant
- Play a voice cue
- Count the breach against you

You get **three breaches** before the session fails — enough to allow small mistakes but not repeated drifting. Whatever app or tab you were already in when you locked in won't immediately count as a violation, which keeps the experience fair rather than frustrating.

---

## Browser Enforcement

The browser is the biggest source of distraction, so LOCK//IN AI includes deeper browser protection through a companion extension that connects to the desktop app over a local WebSocket. While a session is active, the extension helps enforce your allowed website list.

### Blocked website redirects

If you open a site that isn't allowed, the extension redirects the tab to a local blocked page. It isn't a plain warning screen — it's styled like a small sanctuary that matches the app, with a clock, a greeting, a search bar, shortcuts to allowed sites, and the LOCK//IN AI aesthetic. The goal is to guide you back, not to feel hostile.

### Search result filtering

On search pages like Google or Bing, links to blocked websites can be hidden or replaced with a LOCK//IN AI badge — so you don't accidentally click into a distraction while searching for something useful.

### Google search styling

Google search pages can be re-skinned to match the dark aurora aesthetic, keeping the browser visually connected to the focus session. The app can also optionally hide Gemini AI Overviews so search pages stay cleaner.

### Windows browser fallbacks

On Windows, even without the extension, fallback mechanisms can steer tabs back through UI automation — an extra layer of protection when browser-level enforcement isn't available.

---

## The Garden System

The garden is one of the most important parts of LOCK//IN AI. Every completed session adds a plant, generated from the session itself and visually varied by length or quality:

- A shorter session might grow a common plant.
- A longer session might grow a rarer one.
- A very long session could grow something legendary or celestial, with glow and sparkles.

This makes each completed session feel like it leaves a lasting result.

### Dead plants

Fail a session by breaching too many times and a dead plant is added. It isn't there to shame you — it's an honest record that the session didn't hold. Failure is part of the focus journey, and the garden shows both success and struggle: where you stayed consistent, where you struggled, how many sessions you completed or lost, and how your habits changed over time.

### Garden view

The garden is a horizontal scrolling forest. Lockie walks along a winding path through the plants, and his mood shifts with his surroundings — happier near living plants, more somber near dead ones. Garden stats show alive plants, lost plants, and total plants. Over time the garden becomes a visual autobiography of your attention — proof that you showed up.

---

## Custom Presets

Not every focus session needs the same tools, so LOCK//IN AI supports custom presets. For example:

- **Coding** — VS Code, Chrome, GitHub, Stack Overflow, MDN, ChatGPT
- **Essay** — Chrome, Notion, Google Docs, Wikipedia, library databases
- **Film studies** — YouTube, Netflix, Notes app, course website
- **Language learning** — Duolingo, YouTube, Google Translate, dictionary sites

Each preset stores a name, default allowed apps, and default allowed websites — so you don't rebuild your environment every time you start.

---

## Achievements and XP

LOCK//IN AI uses achievements and XP to make focus progress visible. Tracked achievements can include First Bloom, Deep Diver, Gardener, Power Surge, long-streak milestones, and the 100 Day Sanctuary.

Focus work is usually invisible — nobody applauds you for *not* opening TikTok. Achievements and XP give that invisible discipline a visible form, and a reason to keep returning.

---

## Lockie

**Lockie** is the companion character at the heart of LOCK//IN AI, and the face of the brand. Lockie makes the app feel human rather than punishing. During a session, Lockie can:

- Watch over you
- React when you stay focused
- Look worried when you drift
- Become disappointed when a session fails
- Celebrate completed sessions
- Walk through the garden

### Lockie cosmetics

Lockie earns cosmetic rewards as you progress — a **glow aura** after a 7-day streak, a **bloom crown** after 14 days, a **sanctuary halo** after 30 days. They're not the point of the app, but they make progress feel rewarding and give you another reason to keep your streak alive.

---

## Voice Cues

LOCK//IN AI includes voice cues for key moments — when you lock in, break focus, complete a session, or fail one. Break focus, for example, and the app can say:

> Focus interrupted.

Cues are calm and helpful, not aggressive. Toggle them on or off from the header, and preview and choose from available system voices in settings.

---

## Settings

LOCK//IN AI lets you customize your experience:

- Toggle voice cues and choose the system voice
- Hide Google AI Overviews during sessions
- Clear the garden
- Remove custom apps, websites, or presets
- Reset progress

**Clear Garden** wipes plants, custom presets, custom apps, and custom sites. It uses an in-app confirmation modal styled like the rest of the app rather than a jarring system dialog.

---

## Interface Details

LOCK//IN AI is designed to feel polished and focused:

- Frameless app window with a draggable title bar
- Hidden scrollbars that still allow scrolling
- Pinned Continue buttons on setup screens
- Calm visual style in the dark aurora aesthetic
- Compact 400×680, single-window layout

The footer can show the current app and URL, giving you transparency about what the app sees — important, since it monitors focus activity.

---

## Platform Support

LOCK//IN AI is a cross-platform Electron desktop app.

| Platform | Notes |
| --- | --- |
| **Windows** | Uses native window handles and UI automation to detect and redirect focus. |
| **macOS** | May request Accessibility and Screen Recording permissions to detect the active window and guide you back. |
| **Linux** | Support depends on desktop-environment compatibility and active-window detection options. |

---

## Tech Stack

LOCK//IN AI is built with modern desktop and web technologies:

- **Electron** — desktop shell
- **Next.js** + **TypeScript** + **React** — UI
- **Tailwind CSS** — styling
- **Browser extension APIs** — browser-level enforcement
- **Local WebSocket** — app ↔ extension communication
- **SVG plant generation** — the garden
- **Desktop active-window monitoring** + UI automation — enforcement
- **Local storage** — persistence

The app pairs desktop monitoring with browser-level protection so it can enforce focus in both the operating system and the web browser.

---

## How It Works

LOCK//IN AI works in layers:

1. **You define the session** — subject, time, allowed apps, allowed websites.
2. **The app starts a timer** — displaying the timer, subject, plant, XP, streak, and allowed tools.
3. **The app monitors focus** — checking the active app or website against your allowed environment.
4. **The app reacts to distractions** — snapping you back, showing feedback, and counting a breach.
5. **The session succeeds or fails** — finish the timer to grow a plant; breach too often and a dead plant is added.
6. **Progress is saved** — garden, XP, achievements, streaks, presets, and custom apps/sites persist locally.

---

## Who This App Is For

LOCK//IN AI is for anyone who wants to focus but struggles with digital distractions — especially:

- Students, developers, writers, designers, and creatives
- Online learners
- People under deadline pressure
- People who get pulled into random browsing
- People who dislike harsh productivity blockers

It's made for users who don't need another lecture about discipline. They need a system that makes focus easier.

---

## Project Purpose

The purpose of LOCK//IN AI is a focus tool that feels structured, useful, and warm. It's not just a timer, a website blocker, or a gamified productivity app — it combines all of these into one experience:

- A **timer** for structure
- **Enforcement** for accountability
- A **garden** for visual progress
- **Lockie** for companionship
- **Presets** for convenience
- **Browser protection** for real-world distractions
- **Achievements** for motivation

The app treats attention like something that can be cultivated — one session, one plant, one locked-in moment at a time.

---

## Future Ideas

- More plant types, Lockie cosmetics, and focus presets
- Detailed focus analytics and weekly reports
- A focus streak calendar
- Broader browser support and improved Linux support
- Cloud backup and optional account sync
- More blocked-page themes and achievement categories
- Soundscape or ambient music options
- Pomodoro-style break sessions
- Friend gardens or shared focus rooms
- Exportable focus history
- A mobile companion app

---

## Repository Layout

```
.
├── electron/      Electron main process (windowing, monitoring, extension bridge)
├── src/           Next.js + React app UI
├── extension/     Companion browser extension  — see extension/README.md
├── website/       Marketing / download landing site — see website/README.md
├── build/         App icons and build assets
└── package.json   Scripts and electron-builder config
```

### Run it locally

```bash
npm install
npm run electron:dev   # Next.js dev server + Electron, hot-reloaded
```

Build a distributable:

```bash
npm run electron:build   # next build && electron-builder → ./release
```

---

## Summary

LOCK//IN AI is a warm but firm focus companion. It helps you define what to work on, protects you from distractions, and rewards successful sessions with a growing garden.

It exists because modern computers are full of distractions, and willpower alone often isn't enough. LOCK//IN AI gives you structure, enforcement, warmth, and proof of progress.

**Your focus becomes visible. Your effort becomes a garden.**
