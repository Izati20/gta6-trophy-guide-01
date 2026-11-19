// Leonida Legend — hand-in program for gta6-trophy-guide-01.
//
// The entry lives beside this file: app/ is the offline trophy guide
// (index.html plus its modules, stylesheet and data/trophies.json with
// all 55 methods) and screenshots/ holds the renders of it the judge
// sees first. This program hands it in the way the scorer expects:
// copy app/ and screenshots/ into the output directory, then ask the
// vendored make.fun library to write dossier.json over exactly those
// bytes. The library under vendor/ is the kit's own and stays untouched
// — the scorer rebuilds the dossier with its copy and compares the two
// byte for byte.
//
//   node main.ts                        (writes /output)
//   MAKEFUN_OUTPUT_DIR=out node main.ts (writes out/)

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The guide is only complete with the whole official list inside it.
const TROPHY_COUNT = 55;

// The scorer's published caps for this competition. They are passed to
// buildDossier so an over-limit entry fails here, loudly, instead of
// being refused later by the gate.
const LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function gatherRoot(): string {
  return fileURLToPath(new URL('.', import.meta.url));
}

function outputDir(): string {
  const env = process.env.MAKEFUN_OUTPUT_DIR;
  return env === undefined || env === '' ? '/output' : env;
}

function copyTree(from: string, to: string): void {
  cpSync(from, to, { recursive: true });
}

// Fail loudly rather than hand in a guide whose data file lost trophies
// on the way: parse the copied trophies.json back and count its entries.
function assertGuide(copiedApp: string): void {
  const raw = readFileSync(join(copiedApp, 'data', 'trophies.json'), 'utf8');
  const parsed = JSON.parse(raw) as { trophies?: unknown };
  const list = Array.isArray(parsed) ? parsed : parsed.trophies;
  const count = Array.isArray(list) ? list.length : 0;
  if (count !== TROPHY_COUNT) {
    throw new Error(`trophies.json should hold ${TROPHY_COUNT} trophies, found ${count}`);
  }
  for (const item of list as Array<{ name?: unknown; guide?: unknown }>) {
    if (typeof item.name !== 'string' || typeof item.guide !== 'string' || item.guide.trim() === '') {
      throw new Error('every trophy needs a name and a non-blank method');
    }
  }
  console.log(`checked trophies.json: ${count} trophies, each with a method`);
}

// The judge reads the screenshots first, so check them the same way:
// 3 or 4 images, each a whole JPEG/PNG under the scorer's byte cap.
function copyImages(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  if (!existsSync(from)) {
    console.log('no screenshots/ beside main.ts — handing in the guide alone');
    return;
  }
  const shots = readdirSync(from)
    .filter((name) => /\.(png|jpe?g)$/i.test(name))
    .sort();
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`screenshots/ should hold 3 or 4 images, found ${shots.length}`);
  }
  for (const name of shots) {
    const bytes = statSync(join(from, name)).size;
    if (bytes > LIMITS.screenshots.max_bytes) {
      throw new Error(`screenshot ${name} is ${bytes} bytes, over the ${LIMITS.screenshots.max_bytes} cap`);
    }
  }
  copyTree(from, to);
  console.log(`copied screenshots/ (${shots.length} images, cover ${shots[0]})`);
}

function handIn(): void {
  const root = gatherRoot();
  const out = outputDir();
  mkdirSync(out, { recursive: true });

  copyTree(join(root, 'app'), join(out, 'app'));
  console.log('copied app/ (index.html, modules, style.css, data/trophies.json)');
  assertGuide(join(out, 'app'));

  copyImages(join(root, 'screenshots'), join(out, 'screenshots'));

  const dossier = buildDossier(out, LIMITS);
  writeFileSync(join(out, 'dossier.json'), dossier);
  console.log(`wrote dossier.json (${dossier.byteLength} bytes)`);
}

handIn();
