# Leonida Legend — a GTA VI trophy guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Izati20/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Izati20/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline trophy guide and tracker for Grand Theft Auto VI on PlayStation 5, built for make.fun's "Build the best GTA 6 trophy guide" bounty. It covers all 55 official trophies — the platinum, both golds, six silvers and 46 bronzes — each with its official name, description and grade exactly as PlayStation publishes them, and a how-to guide written for this entry that names its sources (the official list, PSNProfiles, Exophase, PowerPyx) beside every trophy.

What is inside:

- **The guide** (`app/data/trophies.json`): every trophy with a concrete walkthrough — what to do, where and how, and when it can be missed — plus kind, hidden and missable flags.
- **The roadmap** (`app/data/roadmap.json`, rendered at the top of the app): platinum difficulty 4/10, an estimated 85–110 hours, one playthrough plus cleanup, and seven ordered steps from the story to 100%.
- **The missables, flagged**: three of 55 — Actions Speak Louder (choice-locked), Catch Me If You Can (the VCIA departure) and In The Beginning… (the opening-hours cocktail) — each argued from its official description, with the save-and-replay routes that defuse them.
- **The tracker**: tick trophies off and the state persists in the browser (localStorage), with export to a file and import back; filters by kind (story, missable, collectibles, activities, misc — and an online filter that reports, correctly, that the official list has no online trophies), by grade, and by search; and a spoiler setting that hides unearned story trophies' names and descriptions until they are earned.

The app is plain static files with no build step and makes no network requests: serve `app/` from any static server and open `app/index.html`. The look is the guide's own — no game artwork or logos are used.

## Run it

```sh
node serve.ts            # serves app/ at http://localhost:8080
```

To produce the hand-in exactly as the grader does:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` there with the kit's vendored library (`vendor/makefun-frontend.ts`, kept byte for byte as the kit ships it, because the scorer rebuilds the dossier with its own copy and compares).

## Layout

- `app/index.html`, `app/app.js`, `app/tracker.js`, `app/style.css` — the guide app.
- `app/data/trophies.json` — the 55 trophies with their guides; `app/data/roadmap.json` — the roadmap.
- `screenshots/` — four captures of the running app (see `shots.json` for what each shows); the first by name is the cover.
- `main.ts`, `serve.ts` — the hand-in program and the local dev server.

---

<sub>Entered on [make.fun](https://make.fun/?ref=izaati-izati&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
