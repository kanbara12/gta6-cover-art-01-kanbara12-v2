// main.ts — Crimson Palms Cover Press v2 entrypoint (Node 22)
// Writes dossier.json describing the app into MAKEFUN_OUTPUT_DIR or ./out.
import * as fs from 'node:fs';
import * as path from 'node:path';

const outDir = process.env.MAKEFUN_OUTPUT_DIR || path.join(process.cwd(), 'out');
fs.mkdirSync(outDir, { recursive: true });

const dossier = {
  title: 'Crimson Palms Cover Press v2',
  competition: 'gta6-cover-art-01',
  account: 'kanbara12',
  description:
    'Offline web app that turns a photo and a caption into GTA 6-style multi-panel poster cover art, with a Vice City sunset or neon colour grade, and exports it as a PNG.',
  layouts: ['Hero Left', 'Comic 5', 'Grid 3x3'],
  grades: ['Vice Sunset', 'Golden Hour', 'Neon Night', 'Palm Shade', 'Crimson Dusk', 'Mono Noir'],
  exportSizes: ['1080x1080', '1080x1350', '1920x1080'],
  features: [
    'Face-aware crops centred on the subject, with per-panel nudge sliders',
    'Editable title, subtitle and quote pill, plus a toggleable billing block and rating seal',
    'Two bundled sample photos; the user can upload their own photo, which stays local',
    'Fully offline: no external requests, no CDN, no external fonts or images',
    'Own lettering and art only; no Rockstar logo, artwork or font'
  ],
  files: [
    'app/index.html', 'app/style.css', 'app/src/cover.js', 'app/src/main.js', 'app/src/shots.js',
    'app/samples/boulevard.jpg', 'app/samples/pier.jpg',
    'screenshots/1-cover.jpg', 'screenshots/2-editor.jpg', 'screenshots/3-cover.jpg', 'screenshots/4-cover.jpg'
  ],
  generatedAt: new Date().toISOString()
};

const target = path.join(outDir, 'dossier.json');
fs.writeFileSync(target, JSON.stringify(dossier, null, 2) + '\n');
console.log('wrote ' + target);
