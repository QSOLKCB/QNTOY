Quantum Amiga 1200 — QNTOY v2
Self-Modulating Audio-Visual Entropy Simulator

Author: Trent Slade (0009-0002-4515-9237)
Assistive Tools: ChatGPT-5 (code generation), Figma Make (interface prototyping)
License: MIT

Overview

QNTOY is a browser-based simulation where quantum information theory meets vintage Amiga aesthetics.
Every pixel represents a qutrit (three-state quantum unit).
Each update cycle evolves the field, generates corresponding sound via the Web Audio API, and visualizes entropy as color and light.
The result is a living feedback organism — a machine that literally plays its own mathematics.

Features

Qutrit Field Engine: 3-level probabilistic array evolving in real time.

Quantum SID-Chip: Procedural audio synthesis driven by qutrit flips.

Spectral Reverb: Lightweight feedback network mimicking a plate reverb.

Entropy Feedback: Reverb time, pitch modulation, and visual brightness scale with system entropy.

Low-RAM Mode: adjustable resolution & frame-rate for older hardware.

Quick Start

Clone or Download

git clone https://github.com/QSOLKCB/QNTOY.git
cd QNTOY


Run Locally

Open index.html in any modern Chromium browser.

Click anywhere to enable audio.

Online Demo
→ qntoyv2.figma.site

Controls
Action	Effect
Pulse	Forces an entropy spike (visual & auditory).
Reset	Collapses all qutrits to
🔊 Enable Audio	Required browser gesture to start Web Audio.
Reverb Mix Slider	Adjusts wet/dry signal ratio.
Architecture
/src
 ├── QAmigaCore.ts        # qutrit logic + entropy estimator
 ├── QAmigaAudio.ts       # SID-chip oscillator + LFO engine
 ├── QAmigaReverb.ts      # dual feedback delay network
 ├── QAmigaDisplay.tsx    # canvas renderer + audio-visual coupling
 ├── QAmigaControls.tsx   # UI buttons + sliders
 └── QAmigaStats.tsx      # live metrics (cycles, entropy, qutrit count)

Citation

If you use or reference QNTOY, cite it as:

Slade, T. (2025). Quantum Amiga 1200 — QNTOY v2: A Self-Modulating Audio-Visual Entropy Simulator.
Zenodo. https://doi.org/10.5281/zenodo.XXXXXXX

Acknowledgements

Built with code generation assistance from ChatGPT-5 and interface synthesis via Figma Make.
Dedicated to the experimental lineage of the Commodore Amiga and every scientist who ever thought sound could be data.

Usage for Zenodo Reviewers

The QNTOY simulation demonstrates entropy-driven feedback between information, sound, and light using entirely client-side computation.
It provides an accessible visualization of how probabilistic state evolution (in this case, a qutrit field) can be sonified and analyzed in real time.

Scientific/educational applications

Illustrates concepts of state superposition, entropy, and decoherence through interactive media.

Allows measurement of emergent order from stochastic dynamics using an on-screen entropy meter and optional CSV data logging.

Provides a compact platform for teaching information physics and complex-system feedback loops using minimal computational resources (pure JavaScript/Web Audio, no backend).

Verification and reproducibility

All algorithms are deterministic given the same random seed.

Entropy, audio level, and reverb parameters can be logged over time via the built-in data-logger script (logger.js).

Code executes fully offline; no external libraries or data calls.

System requirements

Chromium-based browser (Chrome, Edge, Brave, or Arc).

Modern CPU with SIMD; 8 GB RAM recommended for full resolution (Low-RAM mode available).

Audio enabled by user gesture per Web Audio API policy.

Expected output

Visual: 2D qutrit field pulsing with entropy.

Audio: evolving tonal field whose timbre, modulation, and reverb length correspond to entropy dynamics.

CSV (optional): timestamp,entropy,reverb_time,audio_level.

Reviewers may treat this repository as both an art-science demonstration and a replicable simulation environment illustrating real-time coupling between informational entropy and procedural signal synthesis.
Notes for Reviewers

The following code block represents the main entry point (Main.tsx) of QNTOY v2.
It initializes the qutrit simulation, sets default resolution to low-RAM mode (160×120), and exposes a 60-second data logger that produces a downloadable CSV.

Reviewers are encouraged to experiment with this module to test reproducibility, performance, and parameter sensitivity.

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
    // Initialize core and logger once
    const core = new QAmigaCore(160, 120); // Low-RAM mode
    const logger = new QNLogger(core);
    coreRef.current = core;
    loggerRef.current = logger;
  }, []);

  const startLogging = () => {
    const logger = loggerRef.current;
    if (logger) logger.start();
  };

  return (
    <div className="flex flex-col items-center justify-center bg-slate-900 text-white p-4 min-h-screen font-mono">
      <h1 className="text-xl text-cyan-400 mb-1 text-center">
        Quantum Amiga 1200 — QNTOY v2
      </h1>
      <p className="text-sm text-gray-400 mb-3">
        Self-Modulating Audio-Visual Entropy Simulator
      </p>

      {/* Display */}
      {coreRef.current && <QAmigaDisplay core={coreRef.current} />}

      {/* Controls */}
      {coreRef.current && <QAmigaControls core={coreRef.current} />}

      {/* Stats */}
      {coreRef.current && <QAmigaStats core={coreRef.current} />}

      {/* Data Logging */}
      <button
        onClick={startLogging}
        className="mt-3 bg-cyan-700 hover:bg-cyan-600 text-white py-1 px-3 rounded-lg"
      >
        Start 60s Log
      </button>

      {/* Footer */}
      <div className="text-xs text-gray-500 mt-4 text-center">
        © 2025 Trent Slade • Built with ChatGPT-5 + Figma Make
      </div>
    </div>
  );
}


Reviewer instructions:

Run this component in any modern Chromium browser (Chrome, Edge, or Brave).

Click the window to enable audio (browser security requirement).

Observe the display — color intensity reflects live entropy; audio pulses correspond to quantum state transitions.

Press Start 60s Log to generate qntoy_log.csv, containing entropy, reverb time, and audio level at one-second intervals.

Use the CSV to verify correlation between entropy growth and sound complexity.

For extended tests, modify:

const core = new QAmigaCore(320, 256); // full-res mode


or

const logger = new QNLogger(core, 120); // 2-minute log


Compare results across browsers and frame rates for performance consistency.
