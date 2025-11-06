# 🎛️ Quantum Amiga 1200 — QNTOY v2  
### *Self-Modulating Audio-Visual Entropy Simulator*

**Author:** Trent Slade (0009-0002-4515-9237)  
**Assistive Tools:** ChatGPT-5 (code generation), Figma Make (interface prototyping)  
**License:** MIT  

---

## 🧠 Overview
**QNTOY** is a browser-based simulation where quantum information theory meets vintage Amiga aesthetics.  
Every pixel represents a **qutrit** (three-state quantum unit).  
Each update cycle evolves the field, generates corresponding sound via the Web Audio API, and visualizes entropy as color and light.  
The result is a living feedback organism — a machine that literally *plays its own mathematics*.

---

## ⚙️ Features
- **Qutrit Field Engine** – 3-level probabilistic array evolving in real time.  
- **Quantum SID-Chip** – Procedural audio synthesis driven by qutrit flips.  
- **Spectral Reverb** – Lightweight feedback network mimicking a plate reverb.  
- **Entropy Feedback** – Reverb time, pitch modulation, and visual brightness scale with system entropy.  
- **Low-RAM Mode** – Adjustable resolution and frame rate for older hardware.  

---

## 🚀 Quick Start

### Clone or Download
```bash
git clone https://github.com/QSOLKCB/QNTOY.git
cd QNTOY
Run Locally

Open index.html in any modern Chromium browser.

Click anywhere to enable audio (Web Audio policy).

Online Demo: https://qntoyv2.figma.site

🎮 Controls
Action	Effect
Pulse	Forces an entropy spike (visual + auditory).
Reset	Collapses all qutrits to |0⟩ state.
🔊 Enable Audio	Required user gesture to start Web Audio.
Reverb Mix Slider	Adjusts wet/dry signal ratio.

/src
 ├── QAmigaCore.ts      # qutrit logic + entropy estimator
 ├── QAmigaAudio.ts     # SID-chip oscillator + LFO engine
 ├── QAmigaReverb.ts    # dual feedback delay network
 ├── QAmigaDisplay.tsx  # canvas renderer + audio-visual coupling
 ├── QAmigaControls.tsx # UI buttons + sliders
 ├── QAmigaStats.tsx    # live metrics (cycles, entropy, qutrit count)
 └── logger.js          # CSV data-logger

📚 Citation

Slade, T. (2025). Quantum Amiga 1200 — QNTOY v2: A Self-Modulating Audio-Visual Entropy Simulator.
Zenodo. https://doi.org/10.5281/zenodo.XXXXXXX

🙌 Acknowledgements

Built with code generation assistance from ChatGPT-5 and interface synthesis via Figma Make.
Dedicated to the experimental lineage of the Commodore Amiga and every scientist who ever thought sound could be data.

🧪 Usage for Zenodo Reviewers

The simulation demonstrates entropy-driven feedback between information, sound, and light using entirely client-side computation.
It visualizes how probabilistic state evolution can be sonified and measured in real time.

Scientific / Educational Applications

Illustrates superposition, entropy, and decoherence through interactive media.

Enables measurement of emergent order from stochastic dynamics via on-screen entropy and optional CSV logging.

Serves as a teaching platform for information physics and feedback loops using only JavaScript + Web Audio.

Verification & Reproducibility

Deterministic given the same random seed.

Entropy, audio level, and reverb logged via logger.js.

Fully offline; no external libraries or data calls.

System Requirements

Chromium browser (Chrome, Edge, Brave, Arc).

Modern CPU with SIMD; 8 GB RAM recommended (≤ 2 GB with Low-RAM mode).

Manual click required to enable audio (per Web Audio policy).

Expected Output

Visual: 2D qutrit field pulsing with entropy.

Audio: Evolving tonal field whose timbre and reverb reflect entropy dynamics.

CSV: timestamp, entropy, reverb_time, audio_level.

Reviewers may treat this as both an art-science demonstration and a replicable entropy-sonification environment.

🧭 Notes for Reviewers

The following code block shows the main entry point (Main.tsx).
It initializes the simulation (160×120 Low-RAM mode) and provides a 60-second CSV logger.

// Quantum Amiga 1200 — QNTOY v2 Main Entry
// Trent Slade 2025

import { useEffect, useRef } from "react";
import { QAmigaCore } from "./QAmigaCore";
import QAmigaDisplay from "./QAmigaDisplay";
import QAmigaControls from "./QAmigaControls";
import QAmigaStats from "./QAmigaStats";
import { QNLogger } from "./logger";

export default function App() {
  const coreRef = useRef<QAmigaCore | null>(null);
  const loggerRef = useRef<QNLogger | null>(null);

  useEffect(() => {
    const core = new QAmigaCore(160, 120); // Low-RAM mode
    const logger = new QNLogger(core);
    coreRef.current = core;
    loggerRef.current = logger;
  }, []);

  const startLogging = () => loggerRef.current?.start();

  return (
    <div className="flex flex-col items-center justify-center bg-slate-900 text-white p-4 min-h-screen font-mono">
      <h1 className="text-xl text-cyan-400 mb-1 text-center">
        Quantum Amiga 1200 — QNTOY v2
      </h1>
      <p className="text-sm text-gray-400 mb-3">
        Self-Modulating Audio-Visual Entropy Simulator
      </p>
      {coreRef.current && <QAmigaDisplay core={coreRef.current} />}
      {coreRef.current && <QAmigaControls core={coreRef.current} />}
      {coreRef.current && <QAmigaStats core={coreRef.current} />}
      <button
        onClick={startLogging}
        className="mt-3 bg-cyan-700 hover:bg-cyan-600 text-white py-1 px-3 rounded-lg"
      >
        Start 60 s Log
      </button>
      <div className="text-xs text-gray-500 mt-4 text-center">
        © 2025 Trent Slade • Built with ChatGPT-5 + Figma Make
      </div>
    </div>
  );
}

Reviewer Instructions

Run in any Chromium browser.

Click window to enable audio.

Observe brightness ↔ entropy and tone ↔ state transitions.

Press Start 60 s Log → downloads qntoy_log.csv.

Compare entropy vs. sound complexity in the CSV.

For longer runs or higher res:

const core = new QAmigaCore(320, 256); // full-res
const logger = new QNLogger(core, 120); // 2-minute log


Test across browsers and frame rates for consistency.

🎧 Expected Observations

Low entropy: dim image + steady tone.

High entropy: bright CRT flare, chaotic panning, long reverb.

CSV data: entropy and reverb rise together → confirms feedback loop.
