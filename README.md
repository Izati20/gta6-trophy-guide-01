# Izati20/gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Izati20/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Izati20/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Legend** — an offline GTA VI trophy guide and tracker for PlayStation 5. It covers all 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden; zero online) with their official PlayStation name, description and grade — the list as listed by Exophase and PSNProfiles — and a method written for this entry for each one, naming its sources (the official list; GTABase's launch-day trophy guide; PowerPyx ratings via KeenGamer/GTA-Zone). A four-stage platinum plan (story → duo & side lines → the 100% checklist → clean-up) flags the one possibly missable trophy, Positive Mental Attitude, with its Chapter 1 warning; difficulty (4/10) and time (~200 hours) are labelled ESTIMATE wherever they appear, and the joke trophies whose triggers no source had confirmed at launch are marked UNCONFIRMED instead of filled with invention. The tracker keeps progress in localStorage, exports/imports it as JSON, filters by kind (story, missable, collectibles, activities, online), grade and roadmap stage, searches, and offers a spoiler setting that masks unearned story trophies. The app is static files under `app/` with no build step and makes no network requests.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 — or open app/index.html through any static file server
```

To hand the guide in the way the scorer does: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` — it copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json`.

Screenshots are real renders of the app in a browser at 1280×800: the cover (with the stage-1 story trophies previewed as earned via `?demo=1`), the missable filter (`?kind=missable`), the stage-3 roadmap filter (`?stage=3`) and the silver filter (`?grade=silver`); `shots.json` lists them.

---

<sub>Entered on [make.fun](https://make.fun/?ref=izaati-izati&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
