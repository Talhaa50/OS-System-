# Personal OS

> Your entire life, one tab — a private, local-first productivity dashboard.

Personal OS is a single-user productivity app that tracks everything in one place: tasks, habits, finance, goals, projects, university grades, deep work sessions, notes, books, and long-term analytics. All data lives in **your browser's localStorage** — nothing is ever sent to a server. It even has a built-in Pac-Man arcade for breaks.

![Tech](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tech](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss&logoColor=white)
![Tech](https://img.shields.io/badge/Vanilla_JS-ES_Modules-F7DF1E?logo=javascript&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-installable_·_offline-22c55e)

## Features

| Module | What it does |
|---|---|
| **Dashboard** | Daily hero, today's tasks & habits, live countdown (day/month/year), focus chart, spending donut, hydration, journal, year heatmap |
| **To-Do** | Weekly board with per-day columns, recurring tasks, not-to-forget reminders |
| **Habits** | Streaks, monthly completion %, GitHub-style consistency heatmap |
| **Deep Work** | Drift-proof Pomodoro timer (background-tab safe), session log, project time linking, monk mode |
| **Finance** | Income/expenses in PKR, budgets, monthly spending chart, category breakdown |
| **Goals & Projects** | Progress tracking, kanban board, contract/payment tracking per project |
| **University** | Per-semester courses, grade calculator, GPA/CGPA tracking, timetable |
| **Notes & Books** | Auto-saving notes with tags & search, reading tracker with quotes |
| **Analytics** | Pirsch-style stat deltas (week vs week), 30-day productivity trend, domain scores |
| **Pac-Man** | Procedurally generated mazes that grow each level, classic ghost AI, persistent high score |

## Design

- **Dark theme** — Pirsch-inspired neutral near-black with neon green/cyan glow accents
- **Light theme** — warm sage "day mode", toggle in the topbar (persisted)
- Outlined gradient bar charts, glowing stat cards with live progress rings, ambient background glows

## Tech stack

- **Vite 8** + **Tailwind CSS v4** (utility classes) + custom CSS design system (CSS variables for theming)
- **Vanilla JavaScript ES modules** — no framework, ~35 modules under `src/`
- **localStorage** persistence (`pos4_*` keys) with debounced saves, beforeunload flush, and failure detection
- **PWA** — installable, works fully offline via a network-first service worker

## Getting started

```bash
npm install
npm run dev      # development server
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Project structure

```
src/
├── main.js            # boot, global wiring, keyboard shortcuts, theme
├── core/              # db (state + defaults), save, router, utils, helpers, daily reset
├── pages/             # one module per page (dashboard, todo, habits, …, pacman)
├── widgets/           # reusable: calendar, heatmap, donut, statcard, countdown, …
├── modals/            # add/edit modal definitions
└── search/            # global search (Ctrl+K)
```

## Data & privacy

- **All data stays in your browser.** The host (if you deploy this) only serves static files; each visitor gets their own empty copy.
- **Backups:** Settings → *Export All Data* downloads a JSON snapshot; *Import Backup* restores it. The app reminds you weekly if you haven't backed up.
- Data is keyed to the exact origin (domain + port) — moving between local/hosted instances requires an export → import.
- Daily history snapshots accumulate automatically for long-term productivity analytics.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Ctrl+K` or `/` | Global search |
| `1`–`9`, `0` | Jump between pages |
| `Space` | Start/pause deep work timer (or pause Pac-Man) |
| `B` | Toggle sidebar |
| `Esc` | Close modals/search |

## Deploying

Any static host works — no server or environment variables needed:

- **Netlify:** drag `dist/` onto [netlify.com/drop](https://app.netlify.com/drop)
- **Vercel:** import this repo, framework preset *Vite*, build `npm run build`, output `dist`

After deploying, open the URL once and install it as a PWA for an app-like experience that works offline.
