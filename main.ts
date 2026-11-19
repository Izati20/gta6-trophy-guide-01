// Leonida Legend — the hand-in program for the gta6-trophy-guide-01 entry (Node 22, standard library only).
//
// The guide itself is the static app in app/ (open app/index.html in a browser; serve.ts serves it locally).
// This program hands it in the way program/v1 expects: it copies app/ and screenshots/ from beside this file
// into the output directory and writes dossier.json there with the kit's vendored library, vendor/
// makefun-frontend.ts, which must stay byte for byte the kit's copy because the scorer rebuilds the dossier
// with its own and compares.
//
// Run it the way the grader does, with MAKEFUN_OUTPUT_DIR standing in for /output outside the grader:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps, passed whole so this program refuses exactly what the scorer would refuse: the dossier
// text cap, at most 4 screenshots of at most 256 KiB, and app/ within 993 entries and 48 MiB.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function copyIntoOutput(name: string): void {
  const from = join(repoDir, name);
  if (!existsSync(from)) return;
  cpSync(from, join(outputDir, name), { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyIntoOutput('app');
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
copyIntoOutput('screenshots');

const dossier = buildDossier(outputDir, DOSSIER_CAPS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);

// A one-line receipt on stdout: what was handed in, so a local run is checkable at a glance.
const appFiles = readdirSync(join(outputDir, 'app'), { recursive: true }).filter((p) => statSync(join(outputDir, 'app', p)).isFile()).length;
const shots = readdirSync(join(outputDir, 'screenshots')).length;
console.log(`Leonida Legend handed in: ${appFiles} app files, ${shots} screenshots, dossier.json ${dossier.length} bytes -> ${outputDir}`);
