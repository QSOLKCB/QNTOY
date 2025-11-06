import { useRef, useEffect } from "react";
import { QAmigaCore } from "./QAmigaCore";

interface QAmigaDisplayProps {
  core: QAmigaCore;
  paused?: boolean;
}

export default function QAmigaDisplay({ core, paused = false }: QAmigaDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Optimized: Reuse ImageData outside draw loop to reduce GC pressure
    const img = ctx.createImageData(core.width, core.height);
    let timeoutId: number;

    function draw() {
      if (!paused) {
        core.tick(0.02);
      }

      // Audio-reactive visuals: brightness pulses with sound amplitude
      // Acts as a living oscilloscope - field blooms when audio is active
      const level = core.audio ? core.audio.getLevel() : 0;
      const gamma = 0.7 + level * 1.3; // 0.7–2.0 brightness multiplier

      for (let i = 0; i < core.qutrits.length; i++) {
        const c = core.color(i);
        const r = parseInt(c.slice(1, 3), 16);
        const g = parseInt(c.slice(3, 5), 16);
        const b = parseInt(c.slice(5, 7), 16);
        const o = i * 4;
        // Apply audio-reactive gamma correction
        img.data[o] = Math.min(255, r * gamma);
        img.data[o + 1] = Math.min(255, g * gamma);
        img.data[o + 2] = Math.min(255, b * gamma);
        img.data[o + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);

      // Draw pulse line overlay (audio-reactive amplitude bar)
      if (level > 0.01) {
        ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + level * 0.7})`;
        ctx.fillRect(0, core.height - 5, core.width, 5);
      }

      // Optimized: 30fps instead of 60fps (~33ms per frame)
      timeoutId = window.setTimeout(draw, 33);
    }

    draw();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [core, paused]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={core.width}
        height={core.height}
        className="rounded-lg border-2 border-cyan-700 shadow-2xl"
        style={{
          imageRendering: 'pixelated',
          width: '640px',
          height: '512px'
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent rounded-lg" />
    </div>
  );
}
