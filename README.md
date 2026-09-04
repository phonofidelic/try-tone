# Try Tone

Interactive browser-based modular synthesizer built to explore audio synthesis
and the Web Audio ecosystem through [Tone.js](https://tonejs.github.io/).

Try Tone presents a small Eurorack-inspired workspace where modules can be
added, moved, connected, and sequenced directly in the browser. It is primarily
an experimental playground for learning synthesis concepts and testing how
Tone.js maps onto a modular synth style interface.

## Features

- Modular patching with oscillators, LFOs, VCAs, envelopes, and filters.
- Tone.js-powered audio graph creation and live parameter updates.
- Draggable rack modules with snapped positions saved in local storage.
- Persistent module and sequencer state backed by IndexedDB through Dexie.
- An 8-step sequencer with selectable base note, octave, scale, BPM, pitch out,
  and gate out.
- Workspace panning and zooming with mouse, trackpad, and touch gestures.
- Browser-native UI built with React, TypeScript, Vite, and Tailwind CSS.

## Getting Started

This project uses pnpm.

```sh
pnpm install
pnpm dev
```

The dev server runs with Vite's host mode. Open the local URL printed by Vite in
your browser.

## Available Scripts

```sh
pnpm dev
```

Start the Vite development server.

```sh
pnpm build
```

Type-check the project with `tsc` and build the production bundle with Vite.

```sh
pnpm lint
```

Run ESLint with unused disable directive reporting and zero-warning enforcement.

```sh
pnpm preview
```

Preview a production build locally.

## Using The Synth

Add modules from the toolbar menu, or right-click the workspace on desktop to
open the add-module menu at the cursor position.

Each module exposes its own controls and a destination selector. Choose another
module to patch into it, or choose `out` to send audio to the browser output.
Oscillators and LFOs can be started and stopped from their module controls.

The sequencer lives along the bottom edge of the workspace. Add a sequencer,
select pitch and gate destinations, choose a base note, octave, and scale, then
toggle cells in the 8-step grid before pressing start.

## Project Structure

```text
src/
  App.tsx                 React provider wiring and Tone transport context
  AudioNodeContext.tsx    Tone.js node lifecycle and audio graph lookup
  ModulesContext.tsx      IndexedDB-backed module and sequencer state
  components/             Synth modules, workspace, toolbar, sequencer, controls
  constants.ts            Rack dimensions, note names, scales, and ranges
  utils.ts                Grid, scale, coordinate, and value helpers
public/
  knob.png
  rail-background.webp
```

## Tech Stack

- React 19
- TypeScript
- Vite
- Tone.js
- Dexie and dexie-react-hooks
- Tailwind CSS
- ESLint and Prettier

## Notes

Modern browsers require a user gesture before audio can start. If a patch is
silent, make sure at least one source module is started, the relevant modules are
connected, and the final signal path reaches `out`.
