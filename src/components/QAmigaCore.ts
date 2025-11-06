// QAmigaCore.ts — the quantum toy's brain
import { QAmigaAudio } from "./QAmigaAudio";

export class QAmigaCore {
  width: number;
  height: number;
  qutrits: Uint8Array; // 0|1|2
  cycles = 0;
  audio?: QAmigaAudio;

  constructor(w = 320, h = 256, enableAudio = true) {
    this.width = w;
    this.height = h;
    this.qutrits = new Uint8Array(w * h).map(() => Math.floor(Math.random() * 3));
    if (enableAudio) {
      this.audio = new QAmigaAudio();
      this.audio.stop(); // Start with audio stopped
    }
  }

  tick(rate = 0.05) {
    this.cycles++;
    
    // Cache entropy for this tick (used multiple times)
    const e = this.entropy();
    
    for (let i = 0; i < this.qutrits.length; i++) {
      if (Math.random() < rate) {
        const oldState = this.qutrits[i];
        this.qutrits[i] = (this.qutrits[i] + 1) % 3;
        
        // Emit audio on state change with stereo panning based on pixel position
        if (this.audio && Math.random() < 0.001) {
          const x = i % this.width;
          const xNorm = x / this.width; // 0.0 = left, 1.0 = right
          this.audio.beep(this.qutrits[i], 1, xNorm, e);
        }
      }
    }
    
    // Every 10th cycle, update reverb time and LFO from entropy
    if (this.audio && this.cycles % 10 === 0) {
      this.audio.reverb.setTime(e);
      this.audio.setLfoRate(0.3 + e * 1.2); // 0.3 Hz (slow) to 1.5 Hz (fast)
      this.audio.setLfoDepth(10 + e * 40);  // ±10 Hz (gentle) to ±50 Hz (wild)
    }
    
    // Dynamic volume modulation every 120 cycles
    if (this.audio && this.cycles % 120 === 0) {
      const counts = this.getStateCount();
      const total = this.qutrits.length;
      // Calculate quantum activity (how evenly distributed the states are)
      const variance = counts.map(c => Math.abs(c - total / 3)).reduce((a, b) => a + b, 0) / total;
      const utilization = 1 - variance; // Higher when states are balanced
      this.audio.modulateVolume(utilization);
    }
  }

  color(i: number) {
    return ["#ff2244", "#22ff44", "#2244ff"][this.qutrits[i]];
  }

  reset() {
    this.qutrits.fill(0);
    this.cycles = 0;
  }

  randomize() {
    this.qutrits = this.qutrits.map(() => Math.floor(Math.random() * 3));
  }

  applyQuantumGate(gate: 'hadamard' | 'phase' | 'measure') {
    switch (gate) {
      case 'hadamard':
        // Put all qutrits in superposition
        for (let i = 0; i < this.qutrits.length; i++) {
          if (Math.random() < 0.1) {
            this.qutrits[i] = Math.floor(Math.random() * 3);
          }
        }
        // Play a chord for superposition effect
        if (this.audio) {
          this.audio.chord([0, 1, 2], 0.8, undefined, this.entropy());
        }
        break;
      case 'phase':
        // Shift phases
        for (let i = 0; i < this.qutrits.length; i++) {
          if (Math.random() < 0.05) {
            this.qutrits[i] = (this.qutrits[i] + 1) % 3;
          }
        }
        // Ascending phase sound with stereo sweep (left to right)
        if (this.audio) {
          const e = this.entropy();
          setTimeout(() => this.audio!.beep(0, 0.6, 0.0, e), 0);
          setTimeout(() => this.audio!.beep(1, 0.6, 0.5, e), 50);
          setTimeout(() => this.audio!.beep(2, 0.6, 1.0, e), 100);
        }
        break;
      case 'measure':
        // Collapse to definite states
        const states: number[] = [];
        for (let i = 0; i < this.qutrits.length; i++) {
          if (Math.random() < 0.2) {
            this.qutrits[i] = Math.random() > 0.5 ? 0 : 2;
            states.push(this.qutrits[i]);
          }
        }
        // Play measurement collapse sound at center
        if (this.audio && states.length > 0) {
          this.audio.beep(states[0], 1.2, 0.5, this.entropy());
        }
        break;
    }
  }

  getStateCount() {
    const counts = [0, 0, 0];
    for (let i = 0; i < this.qutrits.length; i++) {
      counts[this.qutrits[i]]++;
    }
    return counts;
  }

  // Calculate Shannon entropy (normalized 0–1)
  entropy() {
    const counts = [0, 0, 0];
    for (let i = 0; i < this.qutrits.length; i++) {
      counts[this.qutrits[i]]++;
    }
    const total = this.qutrits.length;
    let H = 0;
    for (let c of counts) {
      if (c > 0) {
        const p = c / total;
        H -= p * Math.log2(p);
      }
    }
    return H / Math.log2(3); // normalize to 0–1
  }
}
