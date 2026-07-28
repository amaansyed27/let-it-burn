# Let It Burn

A private digital release ritual. Write down what is bothering you or bring a file, choose how it ends, and watch the browser destroy its temporary visual copy.

## Experience

- **Incinerate** — the offering chars from the bottom up, with procedural embers and glow.
- **Shatter** — the artifact cracks into individually animated fragments.
- **Shred** — the source is split into falling strips.
- **Dissolve** — the artifact separates into drifting scanlines and disappears.
- **Procedural sound** — every ritual has generated Web Audio; no sound files or autoplay tricks.
- **Release receipt** — export a shareable PNG after the ritual.

## Privacy

There is no backend, account, analytics, database, or upload endpoint. Files are read into browser memory only when needed to render the temporary artifact. Image object URLs are revoked when the offering is replaced or the experience ends.

The original file on the device is never modified or deleted.

## Stack

- React 19
- TypeScript
- Vite
- Canvas 2D destruction engine
- Web Audio API
- CSS motion and responsive layout

No animation, UI, canvas, or audio libraries are used.

## Run locally

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run check
npm run build
npm run preview
```

## Browser support

Designed for current Chromium, Firefox, and Safari releases. Motion automatically shortens when the operating system requests reduced motion.
