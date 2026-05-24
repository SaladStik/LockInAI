# LockInAI

LockInAI is a desktop focus companion designed to help users stay focused, avoid digital distractions, and build better work habits through structure, enforcement, and a calm visual reward system.

It is built as a small Electron desktop app with a focused 400×680 window. The app is meant to feel less like a strict productivity tool and more like a small focus world that users enter when they are ready to work. Instead of only using timers or blocklists, LockInAI combines focus sessions, allowed apps, allowed websites, browser protection, a companion character, voice feedback, achievements, and a growing digital garden.

The goal of LockInAI is simple: help users lock into the task they actually planned to do.

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
- [Platform Support](#platform-support)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Who This App Is For](#who-this-app-is-for)
- [Project Purpose](#project-purpose)
- [Future Ideas](#future-ideas)

---

## Overview

LockInAI is made for people who sit down with good intentions but quickly get pulled into distractions.

A user might open their laptop to write an essay, study for an exam, code a project, or read course material. Then they open Chrome to check one small thing. That turns into a long chain of tabs, unrelated videos, social media, or random research. By the time they notice, a large part of their work session is gone.

LockInAI helps prevent that by asking the user to define their session before starting.

The user chooses:

- What they are working on
- How long they want to focus
- Which apps are allowed
- Which websites are allowed
- What kind of session they are entering

Once the session begins, LockInAI protects the user’s attention by monitoring their active app or browser tab and reacting when they leave the allowed focus environment.

---

## The Problem

The main problem LockInAI solves is distraction during computer-based work.

Most people do not struggle because they have no goals. They struggle because their work environment is full of easy exits. A student can start on an assignment and end up on YouTube. A developer can open Stack Overflow and end up with ten unrelated tabs. A writer can open a research article and end up reading about something completely unrelated.

The problem is not always motivation.

The problem is that intention without structure disappears quickly.

Common issues LockInAI is designed to solve include:

- Getting distracted by websites during study sessions
- Opening apps that are unrelated to the current task
- Starting work without clearly defining the goal
- Losing track of time while browsing
- Falling into tab spirals
- Using harsh blockers that feel annoying or punishing
- Having no visible record of completed focus sessions
- Struggling to build consistent focus habits over time

Many productivity tools solve this problem by being strict, cold, or frustrating. LockInAI tries to solve it in a warmer way. It still enforces boundaries, but it does so with a friendly interface, a companion character, and a garden that grows as the user succeeds.

---

## The Solution

LockInAI creates a structured focus environment before the session begins.

Instead of letting the user vaguely say, “I am going to work,” the app asks them to make specific decisions.

The user must decide:

- What subject or task they are locking into
- How long the session should last
- Which apps are allowed
- Which websites are allowed
- Whether they want to use a saved preset

This setup process creates a small commitment before the timer starts.

Once the session begins, LockInAI acts as a gentle guardrail. If the user leaves their allowed apps or sites, the app notices and reacts. The user is guided back to the correct app or tab. If they break focus too many times, the session fails.

This creates a balance between freedom and accountability.

The app is not meant to shame the user. It is meant to make the right path easier than the wrong one.

---

## Core Concept

LockInAI is built around the idea that focus should feel like something you grow.

Instead of treating every session as just a timer, the app turns each completed session into a plant in a digital garden.

A successful session adds life to the garden.

A failed session adds a dead plant.

Over time, the garden becomes a visual record of the user’s focus history. It shows that the user has shown up before and can do it again.

This makes focus feel less invisible. The user can actually see their progress.

---

## Main Features

LockInAI includes several connected systems:

- Focus setup flow
- Timed focus sessions
- Allowed app selection
- Allowed website selection
- Desktop app monitoring
- Browser tab enforcement
- Companion browser extension
- Custom blocked page
- Search result filtering
- Digital garden
- Procedurally generated plants
- Failed session tracking
- Custom focus presets
- XP and achievement system
- Lockie companion character
- Voice feedback
- Custom settings
- Cross-platform desktop support

Each feature supports the same goal: helping the user stay focused without making productivity feel miserable.

---

## Setup Ritual

Before the user starts a focus session, LockInAI walks them through a five-step setup ritual.

This setup is important because it makes the user define what focus means for that specific session.

### Step 1: Choose What You Are Locking Into

The user begins by choosing a subject or focus type.

Examples include:

- Math
- Coding
- Reading
- Writing
- Exam Prep

The user can also choose a custom preset they have saved before.

Example presets could include:

- Thesis
- Movie Night
- Language Lab
- Film Studies
- Essay Writing
- Programming Sprint

Each preset can have its own default apps and websites.

The user can also name the plant they are growing during the session. If they leave the name blank, the app can generate one automatically.

---

### Step 2: Choose the Session Length

The user chooses how long they want to focus.

The session length can range from:

- 5 minutes
- Up to 120 minutes

The slider snaps to five-minute increments.

The plant preview reacts to the length of the session. Longer sessions can show a more developed plant preview. This visually connects time with growth and gives the user a sense that a longer session can lead to a stronger reward.

---

### Step 3: Choose Allowed Apps

The user selects which desktop applications are allowed during the session.

Examples of allowed apps include:

- Chrome
- VS Code
- Notion
- YouTube
- Netflix
- PDF viewers
- Figma
- Spotify

The app also supports custom app detection.

If the user needs an app that is not already listed, they can:

1. Click Add
2. Switch to the app they want to allow
3. Return to LockInAI
4. Let LockInAI detect the app
5. Save it as a custom allowed app

This makes the app easier to use because the user does not need to manually type process names or search through complicated settings.

---

### Step 4: Choose Allowed Websites

The user selects which websites are allowed during the focus session.

Built-in website options can include:

- ChatGPT
- Claude
- GitHub
- Stack Overflow
- MDN
- YouTube

The user can also add a website manually or detect the website from their current browser tab.

Google and Wikipedia can remain always available, along with new-tab pages, so users are not completely blocked from basic navigation.

This makes the browser useful without letting it become a distraction trap.

---

### Step 5: Confirm the Session

Before the session starts, the user sees a summary screen.

The summary shows:

- Subject
- Plant name
- Session duration
- Allowed apps
- Allowed websites

Once the user confirms, they press **Lock in** and the session begins.

At this point, the focus environment becomes active.

---

## Focus Sessions

During a focus session, LockInAI becomes a calm command center.

The focus screen includes:

- A circular countdown timer
- A glowing progress ring
- Current subject
- Plant name
- Streak
- XP
- Lockie in focused mode
- Allowed apps displayed as chips

The session is designed to keep the user aware of the agreement they made at the start.

The app does not just run a timer. It actively checks whether the user is staying inside their allowed focus environment.

If the user stays focused until the timer ends, the session is completed successfully and a plant is added to the garden.

If the user breaks focus too many times, the session ends as an emergency exit and a dead plant is added instead.

---

## App Enforcement

LockInAI monitors the active desktop window during a session.

On desktop platforms such as Windows, macOS, and Linux, the app can check the active window roughly every 800 milliseconds.

If the user switches to an app outside their allowed list, LockInAI reacts.

Possible reactions include:

- Snapping the user back to the last allowed app
- Showing a breach overlay
- Changing Lockie’s expression
- Dimming the plant
- Playing a voice cue
- Counting the breach against the user

The user gets three breaches before the session fails.

This system is designed to allow small mistakes but prevent repeated drifting.

The app also includes grace for the user’s starting point. Whatever app or tab the user was already in when they locked in does not immediately count as a violation. This makes the app feel more fair and less frustrating.

---

## Browser Enforcement

The browser is one of the biggest sources of distraction, so LockInAI includes deeper browser protection.

The app can work with a companion browser extension that connects to the desktop app over a local WebSocket.

During an active focus session, the browser extension can help enforce the allowed website list.

### Blocked Website Redirects

If the user opens a website that is not allowed, the extension can redirect the tab to a local blocked page.

This page is not just a plain warning screen. It is styled like a small sanctuary that matches the app.

The blocked page can include:

- A clock
- A greeting
- A search bar
- Shortcuts to allowed sites
- LockInAI styling
- A calm focus-based design

The goal is to guide the user back instead of making the experience feel hostile.

---

### Search Result Filtering

LockInAI can also help reduce distraction from search engines.

On search pages such as Google or Bing, links to blocked websites can be hidden or replaced with a LockInAI badge.

This helps stop the user from accidentally clicking into distracting websites while searching for something useful.

---

### Google Search Styling

Google search pages can also be re-skinned to match LockInAI’s dark aurora aesthetic.

This keeps the browser environment visually connected to the focus session.

The app can also optionally hide Gemini AI Overviews so search pages remain cleaner and less distracting.

---

### Windows Browser Fallbacks

On Windows, even without the browser extension, fallback mechanisms can try to steer tabs back through UI automation.

This gives the app another layer of protection when browser-level enforcement is not available.

---

## The Garden System

The garden is one of the most important parts of LockInAI.

Every completed session adds a plant to the user’s garden.

Each plant is generated from the session and can be visually different based on the length or quality of the focus session.

A shorter session might grow a common plant.

A longer session might grow a rarer plant.

A very long session could grow something legendary or celestial, with glow effects and sparkles.

This makes each completed focus session feel like it has a lasting result.

---

### Dead Plants

If the user fails a session by breaching too many times, the app adds a dead plant.

The dead plant is not meant to shame the user. It is an honest record that the session did not hold.

This matters because failure is still part of the focus journey. The garden shows both success and struggle.

The user can look back and see:

- Where they stayed consistent
- Where they struggled
- How many sessions they completed
- How many sessions they lost
- How their focus habits changed over time

---

### Garden View

The garden is shown as a horizontal scrolling forest.

Lockie walks along a winding path through the plants.

Lockie’s mood changes based on the plants around him.

He may appear happier near living plants and more somber near dead ones.

Garden stats can show:

- Alive plants
- Lost plants
- Total plants

Over time, the garden becomes a visual autobiography of the user’s attention.

It becomes proof that they showed up.

---

## Custom Presets

LockInAI supports custom presets for different kinds of work.

This matters because not every focus session needs the same tools.

For example:

A coding session might allow:

- VS Code
- Chrome
- GitHub
- Stack Overflow
- MDN
- ChatGPT

An essay session might allow:

- Chrome
- Notion
- Google Docs
- Wikipedia
- Library databases

A film studies session might allow:

- YouTube
- Netflix
- Notes app
- Course website

A language learning session might allow:

- Duolingo
- YouTube
- Google Translate
- Dictionary websites

With presets, users do not need to rebuild their allowed apps and websites every time.

Each preset can include:

- Preset name
- Default allowed apps
- Default allowed websites

This makes it much faster to start a focus session.

---

## Achievements and XP

LockInAI includes achievements and XP to make focus progress visible.

The app can track achievements such as:

- First Bloom
- Deep Diver
- Gardener
- Power Surge
- Long streak milestones
- 100 Day Sanctuary

Achievements give users a reason to keep returning.

They also solve a subtle problem: focus work is usually invisible.

Nobody sees when a user avoids opening TikTok. Nobody applauds them for staying off distracting websites. Achievements and XP give that invisible discipline a visible form.

---

## Lockie

Lockie is the companion character inside LockInAI.

Lockie helps make the app feel more human.

During a focus session, Lockie can:

- Watch over the user
- React when the user stays focused
- Look worried when the user drifts
- Become disappointed when a session fails
- Celebrate completed sessions
- Walk through the garden

Lockie helps make the app feel less like a punishment system and more like a friendly accountability partner.

---

## Lockie Cosmetics

Lockie can also earn cosmetic rewards through user progress.

Examples include:

- Glow aura after a seven-day streak
- Bloom crown after a fourteen-day streak
- Sanctuary halo after a thirty-day streak

These cosmetics are not the main purpose of the app, but they help make progress feel rewarding.

They also give users another reason to return and keep their streak alive.

---

## Voice Cues

LockInAI includes voice cues for important moments.

Voice cues can play when:

- The user locks in
- The user breaks focus
- The user completes a session
- The user fails a session

For example, if the user breaks focus, the app can say:

> Focus interrupted.

Voice cues are meant to be calm and helpful, not aggressive.

The user can toggle voice cues on or off from the header.

In settings, the user can preview available system voices and choose the one they prefer.

---

## Settings

LockInAI includes settings that let the user customize their experience.

Possible settings include:

- Toggle voice cues
- Choose system voice
- Hide Google AI Overviews during sessions
- Clear the garden
- Remove custom apps
- Remove custom websites
- Remove custom presets
- Reset progress

The Clear Garden option can wipe:

- Plants
- Custom presets
- Custom apps
- Custom sites

This action uses an in-app confirmation modal styled like the rest of the app, instead of a jarring system dialog.

---

## Interface Details

LockInAI is designed to feel polished and focused.

Interface details include:

- Frameless app window
- Draggable title bar
- Hidden scrollbars that still allow scrolling
- Pinned Continue buttons on setup screens
- Calm visual style
- Dark aurora aesthetic
- Compact 400×680 layout
- Focused single-window experience

The footer can show the current app and URL, giving the user transparency about what the app sees.

This is important because the app monitors focus activity, so the user should understand what is being detected.

---

## Platform Support

LockInAI is designed as a cross-platform Electron desktop app.

Supported desktop platforms include:

- Windows
- macOS
- Linux

### Windows

On Windows, LockInAI can use native window handles and UI automation to detect and redirect focus.

### macOS

On macOS, LockInAI may request:

- Accessibility permissions
- Screen Recording permissions

These permissions are needed so the app can detect the active window and guide the user back to their focus environment.

### Linux

Linux support depends on desktop environment compatibility and active window detection options.

---

## Tech Stack

LockInAI is built using modern desktop and web technologies.

Possible technologies include:

- Electron
- Next.js
- TypeScript
- Browser extension APIs
- Local WebSocket communication
- SVG plant generation
- Desktop active-window monitoring
- UI automation tools
- Local storage

The app combines desktop monitoring with browser-level protection so it can enforce focus in both the operating system and the web browser.

---

## How It Works

LockInAI works in layers.

### 1. The user defines the session

Before starting, the user chooses the subject, time, allowed apps, and allowed websites.

### 2. The app starts a timer

The focus session begins, and the app displays the timer, subject, plant, XP, streak, and allowed tools.

### 3. The app monitors focus

LockInAI checks the active app or website to see whether the user is still inside the allowed environment.

### 4. The app reacts to distractions

If the user opens something disallowed, the app can snap them back, show feedback, and count a breach.

### 5. The session succeeds or fails

If the timer ends successfully, the user grows a plant.

If the user breaches too many times, the session ends and a dead plant is added.

### 6. Progress is saved

The garden, XP, achievements, streaks, presets, custom apps, and custom websites can be saved locally.

---

## Who This App Is For

LockInAI is for anyone who wants to focus but struggles with digital distractions.

It is especially useful for:

- Students
- Developers
- Writers
- Designers
- Creatives
- Online learners
- People with deadline pressure
- People who get pulled into random browsing
- People who dislike harsh productivity blockers

It is made for users who do not need another lecture about discipline.

They need a system that makes focus easier.

---

## Project Purpose

The purpose of LockInAI is to create a focus tool that feels structured, useful, and warm.

It is not just a timer.

It is not just a website blocker.

It is not just a gamified productivity app.

LockInAI combines all of these ideas into one experience:

- A timer for structure
- Enforcement for accountability
- A garden for visual progress
- Lockie for companionship
- Presets for convenience
- Browser protection for real-world distractions
- Achievements for motivation

The app treats attention like something that can be cultivated.

One session at a time.

One plant at a time.

One locked-in moment at a time.

---

## Future Ideas

Possible future improvements could include:

- More plant types
- More Lockie cosmetics
- More focus presets
- Detailed focus analytics
- Weekly focus reports
- More browser support
- Cloud backup
- Optional account sync
- More blocked page themes
- More achievement categories
- Soundscape or ambient music options
- Focus streak calendar
- Pomodoro-style break sessions
- Friend gardens or shared focus rooms
- Exportable focus history
- Improved Linux support
- Mobile companion app

---

## Summary

LockInAI is a warm but firm focus companion.

It helps users define what they want to work on, protects them from distractions, and rewards successful focus sessions with a growing garden.

The app exists because modern computers are full of distractions, and willpower alone is often not enough.

LockInAI gives users structure, enforcement, warmth, and proof of progress.

Your focus becomes visible.

Your effort becomes a garden.