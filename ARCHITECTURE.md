# QNTOY v3 Architecture

QNTOY v3 is intentionally small. The application has one model, two live views, and a thin DOM/controller layer.

## Data flow

```text
seed + controls
      │
      ▼
┌──────────────────┐
│  QutritField     │  src/core.js
│  deterministic   │
│  three-state     │
└───────┬──────────┘
        │ changes + entropy
        ├──────────────────────────────┐
        ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│ QNTOYAudio       │          │ QutritVisualizer│
│ Web Audio API    │          │ Three.js / WebGL│
└───────┬──────────┘          └─────────┬────────┘
        │ analyser data                 │ pixels
        └──────────────┬────────────────┘
                       ▼
                 browser output
```

`src/app.js` coordinates controls, scheduling, telemetry, and export. It does not own simulation state.

## `src/core.js`

The simulation model is browser-independent JavaScript.

Responsibilities:

- store the `Uint8Array` of three-state cells;
- maintain state counts incrementally;
- provide normalized Shannon entropy;
- own the seeded PRNG and cycle counter;
- apply evolution and qutrit-inspired toy transforms;
- emit compact `{ index, from, to }` change records;
- produce JSON-compatible snapshots.

The core deliberately does **not** import Three.js, touch the DOM, create timers, or invoke Web Audio.

### Determinism contract

For identical:

- field dimensions;
- initial seed;
- evolution rates;
- ordered operation sequence;

…the field state sequence must be identical.

Changing renderer frame rate or browser audio timing must not affect the core RNG stream.

## `src/audio.js`

The audio layer is created lazily after a user gesture.

Signal path:

```text
state oscillators
      │
      ▼
low-pass filter → envelope → stereo pan
      │
      ▼
   input bus ───────────────► dry ───────┐
      │                                  │
      └─► feedback delay ─► wet ─────────┤
                                         ▼
                                  master gain
                                         │
                                         ▼
                                    compressor
                                         │
                                         ▼
                                      analyser
                                         │
                                         ▼
                                    destination
```

The audio layer consumes field transitions. It never mutates the field.

A bounded number of transitions is sonified per simulation update to avoid oscillator storms during pulses and randomization.

## `src/visualizer.js`

The visualizer owns one Three.js scene and one `BufferGeometry` representing all qutrits.

Each point encodes:

- X/Y: lattice position;
- Z: three-state level;
- colour: state identity;
- point glow: analyser RMS level.

The geometry is not rebuilt each frame. Only changed state entries are updated after a simulation step.

A separate line geometry visualizes the Web Audio FFT spectrum. OrbitControls provide orbit/top/side inspection modes.

## `src/app.js`

The controller layer:

- maps semantic DOM controls to model/audio/view actions;
- advances the field at roughly 30 Hz;
- updates telemetry at a lower cadence;
- keeps audio creation behind a user gesture;
- handles keyboard shortcuts;
- starts/stops CSV logging;
- triggers JSON snapshot downloads.

There is no virtual DOM and no component runtime.

## `src/logger.js`

The logger samples once per second by default and exports:

- elapsed time;
- cycles;
- normalized entropy;
- counts for all three states;
- delay/reverb time;
- analyser RMS level;
- seed.

Full field state is exported separately as JSON so telemetry CSV remains compact.

## Scientific boundary

The three-state field is a stochastic information model. Terms such as “qutrit,” “phase,” and “measure” describe the educational/creative mapping used by QNTOY; the implementation does not solve the Schrödinger equation, evolve complex amplitudes, or implement physical qutrit gates.

That boundary is architectural as well as documentary: the core exposes discrete states and probabilities, not quantum amplitudes.
