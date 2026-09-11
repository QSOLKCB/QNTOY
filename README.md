# QNTOY v3 — Quantum Amiga Audio-Visual Toy

[![CI](https://github.com/QSOLKCB/QNTOY/actions/workflows/ci.yml/badge.svg)](https://github.com/QSOLKCB/QNTOY/actions/workflows/ci.yml)

> **Scientific boundary:** QNTOY is an educational and creative information-physics toy. It is **not** a quantum computer emulator, does not implement physical qutrit unitary dynamics, and should not be used as evidence of quantum behaviour.

## What changed in v3

QNTOY v3 removes the React/Figma-generated application stack and rebuilds the runtime around the browser platform itself.

- **No React, JSX, Radix UI, Tailwind utility layer, or component framework.**
- **Plain semantic HTML + CSS + JavaScript modules.**
- **Three.js GPU renderer** for the 19,200-point qutrit field.
- **Web Audio API synth** with state-mapped oscillators, stereo panning, analyser feedback, compression, and entropy-coupled delay/reverb.
- **Seeded PRNG** so a seed actually reproduces the same field evolution.
- **Live Three.js spectrum ribbon** driven by the Web Audio analyser.
- **CSV telemetry logging** with cycles, entropy, state counts, reverb time, audio level, and seed.
- **JSON field snapshots** for reproducibility and later analysis.
- **Responsive, keyboard-accessible control rack** with no UI framework dependency.
- **Node unit tests** for deterministic field behaviour and entropy invariants.
- **GitHub Actions CI** for syntax checks, tests, and production build verification.

The dependency surface drops from a large React/Radix ecosystem to just **Three.js** at runtime and **Vite** as the build tool.

## Quick start

### Requirements

- Node.js 20+
- npm
- A modern desktop browser with WebGL2/WebGL and Web Audio support

### Run locally

```bash
git clone https://github.com/QSOLKCB/QNTOY.git
cd QNTOY
npm install
npm run dev
```

Open the local URL printed by Vite. Audio must be started with the **START AUDIO** button because browsers require a user gesture before Web Audio playback.

### Production build

```bash
npm run build
npm run preview
```

The generated `dist/` directory is static and can be deployed to GitHub Pages or any ordinary static host. Three.js is bundled into the build, so the deployed app does not depend on a runtime CDN.

### Verify

```bash
npm run check
npm test
npm run build
```

## Controls

| Control | Action |
|---|---|
| Start Audio | Lazily creates/resumes the Web Audio graph |
| Pause / Run | Stops or resumes automatic field evolution |
| Pulse | Forces a high-probability transition burst and three-state audio sweep |
| Reset | Sets every cell to `|0⟩` and resets cycle count |
| Random | Re-randomizes the field using the current seeded PRNG stream |
| Mix / H | Qutrit-inspired mixing transform; **not** a physical Hadamard gate |
| Phase | Cyclic state rotation on a seeded subset of cells |
| Measure | Measurement-like collapse transform used for the toy interaction model |
| Evolution | Per-cycle cell transition probability |
| Master | Web Audio master gain |
| Reverb | Wet/dry delay-network mix |
| Stereo Field | Horizontal state-transition panning width |
| Point Size | Three.js qutrit point size |
| Seed | Reinitializes the PRNG and field deterministically |
| Log 60 s CSV | Records telemetry once per second and downloads CSV |
| Export JSON | Downloads a full deterministic field snapshot |
| View | Cycles orbit, top, and side cameras |

Keyboard shortcuts: `A` audio, `Space` pause/run, `P` pulse, `R` reset, `1` mix, `2` phase, `3` measure, `V` view, `L` telemetry log.

## Architecture

```text
QNTOY/
├── index.html                  # semantic application shell
├── src/
│   ├── app.js                  # DOM events + simulation scheduler
│   ├── core.js                 # deterministic three-state field
│   ├── audio.js                # Web Audio synth / reverb / analyser
│   ├── visualizer.js           # Three.js point field + spectrum ribbon
│   ├── logger.js               # CSV + JSON export utilities
│   └── styles.css              # responsive Amiga/oscilloscope visual system
├── tests/
│   └── core.test.mjs           # deterministic core tests
├── .github/workflows/
│   └── ci.yml                  # check + test + build
├── ARCHITECTURE.md
├── ROADMAP.md
├── THIRD_PARTY_NOTICES.md
└── vite.config.js
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for data flow and subsystem boundaries.

## Reproducibility

The v3 core uses an explicit seeded PRNG rather than `Math.random()`. Two fresh fields using the same dimensions, seed, operation order, and control values will produce the same state sequence.

Reproducibility applies to the **field state evolution**. Audio timing and rendered frame timing are browser/runtime outputs and are not guaranteed to be sample-identical across machines.

A snapshot export contains:

- seed
- field dimensions
- cycle count
- normalized Shannon entropy
- state counts
- all qutrit state values

## Entropy model

QNTOY measures normalized Shannon entropy over the three state populations:

```text
H = -Σ pᵢ log₂(pᵢ) / log₂(3)
```

This yields `0` when the field occupies one state and approaches `1` when all three states are evenly populated.

Entropy is used as a control signal for the audio engine. Higher entropy increases delay time, feedback, spectral brightness, and event duration. This is an intentionally designed sonification mapping, not a claim that physical quantum entropy produces those acoustic effects.

## Audio mapping

The three states retain the original QNTOY octave mapping:

- `|0⟩` → 110 Hz
- `|1⟩` → 220 Hz
- `|2⟩` → 440 Hz

Transition position controls stereo pan. Entropy controls filter brightness and feedback-delay behaviour. Voice count is deliberately capped per field update to prevent large transition bursts from spawning thousands of oscillators.

## Performance

The default field remains `160 × 120 = 19,200` qutrits. The Three.js renderer stores them in one `BufferGeometry` and updates only changed state attributes after each simulation step. Rendering and simulation scheduling are decoupled: Three.js renders smoothly while the stochastic field advances at a roughly 30 Hz cadence.

The application respects `prefers-reduced-motion` by disabling automatic camera rotation.

## Development principles

1. Keep the **field model deterministic and browser-independent**.
2. Treat audio and rendering as views of the field, not as hidden state owners.
3. Prefer browser standards over framework abstractions when the platform already provides the capability.
4. Keep scientific language explicit about what is simulated and what is merely inspired by quantum information concepts.
5. Keep exports inspectable: CSV for telemetry, JSON for full state snapshots.

## License

MIT. See [LICENSE](LICENSE).

Three.js is distributed under the MIT License. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
