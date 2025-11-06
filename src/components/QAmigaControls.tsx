import { useState } from "react";
import { QAmigaCore } from "./QAmigaCore";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { 
  Zap, 
  RotateCcw, 
  Shuffle, 
  Waves, 
  Target, 
  Play,
  Pause,
  Volume2,
  VolumeX
} from "lucide-react";

interface QAmigaControlsProps {
  core: QAmigaCore;
  paused: boolean;
  onTogglePause: () => void;
}

export default function QAmigaControls({ core, paused, onTogglePause }: QAmigaControlsProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const handlePulse = () => {
    setIsAnimating(true);
    core.tick(0.5);
    if (core.audio && audioPlaying) {
      core.audio.pulse(1, core.entropy());
    }
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleReset = () => {
    core.reset();
    if (core.audio && audioPlaying) {
      core.audio.beep(0, 0.8, 0.5, core.entropy());
    }
  };

  const handleRandomize = () => {
    core.randomize();
    if (core.audio && audioPlaying) {
      core.audio.chord([0, 1, 2], 0.7, undefined, core.entropy());
    }
  };

  const handleQuantumGate = (gate: 'hadamard' | 'phase' | 'measure') => {
    core.applyQuantumGate(gate);
  };

  const handleAudioToggle = () => {
    if (core.audio) {
      core.audio.resume(); // Resume context on first click
      const playing = core.audio.toggle();
      setAudioPlaying(playing);
      // Play test beep if enabling
      if (playing) {
        core.audio.beep(1, 0.8, 0.5, core.entropy());
      }
    }
  };

  return (
    <Card className="bg-slate-900/50 border-cyan-700/50 p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-cyan-300 font-mono">QUANTUM CONTROLS</h3>
          <div className="flex gap-2">
            <Button
              onClick={handleAudioToggle}
              size="sm"
              variant={audioPlaying ? "default" : "outline"}
              className={
                audioPlaying
                  ? "bg-cyan-600 hover:bg-cyan-700 border-cyan-500"
                  : "border-gray-500/50 text-gray-400 hover:bg-gray-500/10"
              }
              title={audioPlaying ? "Stop audio" : "Play audio"}
            >
              {audioPlaying ? <Volume2 className="w-4 h-4 mr-1" /> : <VolumeX className="w-4 h-4 mr-1" />}
              {audioPlaying ? "AUDIO ON" : "AUDIO OFF"}
            </Button>
            <Button
              onClick={onTogglePause}
              size="sm"
              variant={paused ? "default" : "outline"}
              className={
                paused
                  ? "bg-green-600 hover:bg-green-700 border-green-500"
                  : "border-red-500/50 text-red-400 hover:bg-red-500/10"
              }
            >
              {paused ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
              {paused ? "RUN" : "PAUSE"}
            </Button>
          </div>
        </div>

        <Separator className="bg-cyan-700/30" />

        <div className="space-y-2">
          <div className="text-xs text-cyan-400 font-mono mb-2">BASIC OPS</div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={handlePulse}
              variant="outline"
              size="sm"
              className={`border-cyan-600/50 hover:bg-cyan-600/20 text-cyan-300 ${
                isAnimating ? 'bg-cyan-600/30' : ''
              }`}
            >
              <Zap className="w-4 h-4 mr-1" />
              Pulse
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="border-orange-600/50 hover:bg-orange-600/20 text-orange-300"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button
              onClick={handleRandomize}
              variant="outline"
              size="sm"
              className="border-purple-600/50 hover:bg-purple-600/20 text-purple-300"
            >
              <Shuffle className="w-4 h-4 mr-1" />
              Random
            </Button>
          </div>
        </div>

        <Separator className="bg-cyan-700/30" />

        <div className="space-y-2">
          <div className="text-xs text-cyan-400 font-mono mb-2">QUANTUM GATES</div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => handleQuantumGate('hadamard')}
              variant="outline"
              size="sm"
              className="border-yellow-600/50 hover:bg-yellow-600/20 text-yellow-300"
            >
              <Waves className="w-4 h-4 mr-1" />
              H-Gate
            </Button>
            <Button
              onClick={() => handleQuantumGate('phase')}
              variant="outline"
              size="sm"
              className="border-pink-600/50 hover:bg-pink-600/20 text-pink-300"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Phase
            </Button>
            <Button
              onClick={() => handleQuantumGate('measure')}
              variant="outline"
              size="sm"
              className="border-green-600/50 hover:bg-green-600/20 text-green-300"
            >
              <Target className="w-4 h-4 mr-1" />
              Measure
            </Button>
          </div>
        </div>

        <div className="bg-slate-950/50 rounded-lg p-3 border border-cyan-700/30">
          <div className="text-[10px] text-cyan-400 font-mono space-y-1">
            <div>⚡ PULSE — trigger random state changes</div>
            <div>🔄 RESET — set all qutrits to |0⟩</div>
            <div>🎲 RANDOM — randomize all states</div>
            <div>🌊 H-GATE — apply superposition</div>
            <div>⚛️ PHASE — shift quantum phases</div>
            <div>🎯 MEASURE — collapse wave function</div>
          </div>
        </div>

        <div className="bg-orange-900/20 rounded-lg p-3 border border-orange-700/30">
          <div className="text-[10px] text-orange-400 font-mono text-center space-y-1">
            <div>🔊 AUDIO-REACTIVE SYNTHESIS</div>
            <div className="text-cyan-400">110Hz • 220Hz • 440Hz</div>
            <div className="text-cyan-600">Stereo L→R • Square Wave • SID Mode</div>
            <div className="text-purple-400 mt-1">🌀 Entropy-Driven Reverb + LFO</div>
            <div className="text-green-400 mt-1">✨ Visual Bloom • Audio Oscilloscope</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
