import { useEffect, useState } from "react";
import { QAmigaCore } from "./QAmigaCore";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

interface QAmigaStatsProps {
  core: QAmigaCore;
}

export default function QAmigaStats({ core }: QAmigaStatsProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const stateCounts = core.getStateCount();
  const total = core.qutrits.length;

  return (
    <Card className="bg-slate-900/50 border-cyan-700/50 p-4">
      <div className="space-y-4">
        <h3 className="text-cyan-300 font-mono">SYSTEM STATS</h3>

        <Separator className="bg-cyan-700/30" />

        <div className="space-y-3">
          <div className="bg-slate-950/50 rounded-lg p-3 border border-cyan-700/30">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-cyan-400 font-mono">CYCLES</span>
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-300 font-mono">
                {core.cycles}
              </Badge>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-cyan-400 font-mono">QUTRITS</span>
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-300 font-mono">
                {core.qutrits.length.toLocaleString()}
              </Badge>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-cyan-400 font-mono">STATES</span>
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-300 font-mono">
                3 (|0⟩,|1⟩,|2⟩)
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-cyan-400 font-mono">ENTROPY</span>
              <Badge variant="outline" className="border-purple-500/50 text-purple-300 font-mono">
                {(core.entropy() * 100).toFixed(1)}%
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-cyan-400 font-mono mb-2">STATE DISTRIBUTION</div>

            {/* State |0⟩ */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-red-300 font-mono">|0⟩ STATE</span>
                <span className="text-xs text-red-400 font-mono">
                  {stateCounts[0]} ({((stateCounts[0] / total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-slate-950/50 rounded-full h-2 overflow-hidden border border-red-900/30">
                <div
                  className="bg-gradient-to-r from-red-600 to-red-400 h-2 transition-all duration-300"
                  style={{ width: `${(stateCounts[0] / total) * 100}%` }}
                />
              </div>
            </div>

            {/* State |1⟩ */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-green-300 font-mono">|1⟩ STATE</span>
                <span className="text-xs text-green-400 font-mono">
                  {stateCounts[1]} ({((stateCounts[1] / total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-slate-950/50 rounded-full h-2 overflow-hidden border border-green-900/30">
                <div
                  className="bg-gradient-to-r from-green-600 to-green-400 h-2 transition-all duration-300"
                  style={{ width: `${(stateCounts[1] / total) * 100}%` }}
                />
              </div>
            </div>

            {/* State |2⟩ */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-300 font-mono">|2⟩ STATE</span>
                <span className="text-xs text-blue-400 font-mono">
                  {stateCounts[2]} ({((stateCounts[2] / total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-slate-950/50 rounded-full h-2 overflow-hidden border border-blue-900/30">
                <div
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 transition-all duration-300"
                  style={{ width: `${(stateCounts[2] / total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-cyan-700/30" />

        {/* Entropy-Driven Audio Modulation */}
        <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-700/30">
          <div className="space-y-3">
            {/* Reverb Tail */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-purple-300 font-mono">REVERB TAIL</span>
                <span className="text-xs text-purple-400 font-mono">
                  {(0.15 + core.entropy() * 0.55).toFixed(2)}s
                </span>
              </div>
              <div className="w-full bg-slate-950/50 rounded-full h-2 overflow-hidden border border-purple-900/30">
                <div
                  className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 transition-all duration-300"
                  style={{ width: `${core.entropy() * 100}%` }}
                />
              </div>
            </div>

            {/* LFO Rate */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-orange-300 font-mono">LFO RATE</span>
                <span className="text-xs text-orange-400 font-mono">
                  {(0.3 + core.entropy() * 1.2).toFixed(2)} Hz
                </span>
              </div>
              <div className="w-full bg-slate-950/50 rounded-full h-2 overflow-hidden border border-orange-900/30">
                <div
                  className="bg-gradient-to-r from-orange-600 to-orange-400 h-2 transition-all duration-300"
                  style={{ width: `${core.entropy() * 100}%` }}
                />
              </div>
            </div>

            {/* LFO Depth */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-yellow-300 font-mono">LFO DEPTH</span>
                <span className="text-xs text-yellow-400 font-mono">
                  ±{(10 + core.entropy() * 40).toFixed(0)} Hz
                </span>
              </div>
              <div className="w-full bg-slate-950/50 rounded-full h-2 overflow-hidden border border-yellow-900/30">
                <div
                  className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-2 transition-all duration-300"
                  style={{ width: `${core.entropy() * 100}%` }}
                />
              </div>
            </div>

            {/* Audio Level (real-time) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-cyan-300 font-mono">AUDIO LEVEL</span>
                <span className="text-xs text-cyan-400 font-mono">
                  {core.audio ? (core.audio.getLevel() * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-950/50 rounded-full h-2 overflow-hidden border border-cyan-900/30">
                <div
                  className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-2 transition-all duration-75"
                  style={{ width: `${core.audio ? core.audio.getLevel() * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="text-[10px] text-purple-400/80 font-mono text-center pt-1">
              {core.entropy() < 0.3 && "🎯 Ordered: tight, focused tones"}
              {core.entropy() >= 0.3 && core.entropy() < 0.7 && "🌊 Balanced: organic vibrato"}
              {core.entropy() >= 0.7 && "🌀 Chaotic: wild pitch shimmer"}
            </div>
          </div>
        </div>

        <Separator className="bg-cyan-700/30" />

        <div className="bg-slate-950/50 rounded-lg p-3 border border-orange-700/30">
          <div className="text-[10px] text-orange-400 font-mono text-center space-y-1">
            <div>⚛️ COMMODORE AMIGA 1200</div>
            <div className="text-cyan-400">QUANTUM EDITION v3.0</div>
            <div className="text-cyan-600">Qutrit Engine • {core.width}x{core.height}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
