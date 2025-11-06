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
