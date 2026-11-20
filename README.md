[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/kanbara12/gta6-cover-art-01-kanbara12-v2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/kanbara12/gta6-cover-art-01-kanbara12-v2/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Crimson Palms Cover Press v2

This is my entry for [make.fun gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01), a $250 prize shared by the top 50 entries. Entries close 21 Nov 2026 at 17:30 WIB.

The app turns a photo and a caption into cover art in the style of a GTA 6 poster. You load a photo, pick a layout and a colour grade, fix the framing, type a title and a quote, then export a PNG to share. It runs offline in a desktop browser, and your photos stay on your own machine.

## What it does

Three layouts are in the app: Hero Left, Comic 5, and Grid 3x3. Each one mixes photo panels with graphic panels for the title and the quote.

Six grades change the colour of the photos: Vice Sunset, Golden Hour, Neon Night, Palm Shade, Crimson Dusk, and Mono Noir. They work as canvas colour transforms, and none of them uses a posterize filter.

Each photo panel crops around the face in the photo. The two bundled samples have their face points recorded, a woman with sunglasses on the boulevard and a fisherman with a hat and beard at the pier. Every photo panel also has its own X and Y nudge sliders, so you can shift the framing when the automatic crop misses.

The title, subtitle, and quote pill are all editable. The quote starts as "ONLY IN VICE CITY". A billing block and rating seal at the bottom can be switched on or off. The lettering and art are my own. No Rockstar logo, artwork, or font is used anywhere.

Export sizes are 1080x1080, 1080x1350, and 1920x1080. The status line under the preview confirms the file it saved.

## Run it

Node 22 is needed. From the repo root:

```
node serve.ts
```

Then open http://127.0.0.1:8123/ in a desktop browser. The entry program is main.ts, and it writes dossier.json into the output directory:

```
node main.ts
```

## Files

The app lives in app/, with index.html, style.css, and the code in app/src/. The two sample photos are in app/samples/. Screenshots of the running app are in screenshots/. The kit file vendor/makefun-app.ts is copied unchanged from the competition kit.
