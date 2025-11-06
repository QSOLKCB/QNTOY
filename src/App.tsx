import { useState, useMemo } from "react";
import { QAmigaCore } from "./components/QAmigaCore";
import QAmigaDisplay from "./components/QAmigaDisplay";
import QAmigaControls from "./components/QAmigaControls";
import QAmigaStats from "./components/QAmigaStats";

export default function App() {
  // Optimized: Lower resolution (160×120) for 75% fewer pixel operations
  const core = useMemo(() => new QAmigaCore(160, 120), []);
  const [paused, setPaused] = useState(false);

  const handleTogglePause = () => {
    setPaused(!paused);
  };

  return (
    <div className="min-h-screen bg-[#061020] text-white p-8 flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-6 space-y-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-2xl">⚛️</span>
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-mono text-cyan-300">
              Quantum Commodore Amiga 1200
            </h1>
            <p className="text-sm text-cyan-500 font-mono">
              Qutrit-Based Quantum Toy • Interactive Field Simulator
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="px-2 py-1 bg-red-900/30 border border-red-700/50 rounded text-xs font-mono text-red-300">
            |0⟩ RED
          </div>
          <div className="px-2 py-1 bg-green-900/30 border border-green-700/50 rounded text-xs font-mono text-green-300">
            |1⟩ GREEN
          </div>
          <div className="px-2 py-1 bg-blue-900/30 border border-blue-700/50 rounded text-xs font-mono text-blue-300">
            |2⟩ BLUE
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-[640px_400px] gap-6 max-w-7xl">
        {/* Display */}
        <div className="space-y-4">
          <div className="bg-slate-900/50 border-2 border-cyan-700/50 rounded-lg p-4 shadow-2xl shadow-cyan-500/10">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-700/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-cyan-300 font-mono text-sm">QUANTUM FIELD DISPLAY</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-cyan-500 font-mono">160×120</div>
                <div className="text-[10px] text-cyan-500 font-mono">•</div>
                <div className="text-[10px] text-cyan-500 font-mono">30 FPS</div>
              </div>
            </div>
            <QAmigaDisplay core={core} paused={paused} />
            <div className="mt-3 pt-2 border-t border-cyan-700/30">
              <div className="text-[10px] text-cyan-600 font-mono text-center">
                Each pixel represents a qutrit in one of three quantum states
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-cyan-700/50 rounded-lg p-4">
            <div className="text-xs text-cyan-400 font-mono space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-cyan-500">ℹ️</span>
                <div>
                  <strong className="text-cyan-300">What you're seeing:</strong> A quantum field of 19,200 qutrits,
                  each existing in one of three quantum states (|0⟩, |1⟩, |2⟩). The system continuously
                  evolves, with qutrits randomly transitioning between states.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-500">🎮</span>
                <div>
                  <strong className="text-cyan-300">Try this:</strong> Use the Pulse button for rapid state changes,
                  apply quantum gates like H-Gate for superposition effects, or watch the natural evolution
                  of the quantum field over time.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls & Stats */}
        <div className="space-y-6">
          <QAmigaControls core={core} paused={paused} onTogglePause={handleTogglePause} />
          <QAmigaStats core={core} />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center space-y-3">
        <div className="inline-block bg-slate-900/50 border border-cyan-700/50 rounded-lg px-6 py-3">
          <div className="text-[10px] text-cyan-500 font-mono space-y-1">
            <div className="text-cyan-400">
              🎨 Built with React + TypeScript + Qutrit Engine
            </div>
            <div>
              Inspired by Commodore Amiga Workbench • Made with ❤️ in Figma Make
            </div>
          </div>
        </div>
        <div className="inline-block bg-green-900/20 border border-green-700/50 rounded-lg px-4 py-2">
          <div className="text-[10px] text-green-400 font-mono">
            ⚡ Optimized Mode: 75% fewer pixels • 30fps throttle • Low-RAM FFT • Reused ImageData
          </div>
        </div>
      </div>
    </div>
  );
}
