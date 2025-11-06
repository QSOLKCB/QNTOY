// QAmigaAudio.ts — Web Audio API sound engine with stereo field panning & reverb & LFO
import { QAmigaReverb } from "./QAmigaReverb";

export class QAmigaAudio {
  ctx: AudioContext;
  gain: GainNode;
  reverb: QAmigaReverb;
  lfo: OscillatorNode;
  lfoGain: GainNode;
  analyser: AnalyserNode;
  dataArray: Uint8Array;
  lfoRate = 0.5; // Hz
  masterVol = 0.15;
  lastUpdate = 0;
  freqs = [110, 220, 440]; // |0⟩, |1⟩, |2⟩
  enabled = true;
  playing = false; // playback state

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gain = this.ctx.createGain();
    this.reverb = new QAmigaReverb(this.ctx, 0.4, 0.3);

    // --- Analyser section: captures audio level for visual feedback ---
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64; // Optimized: smaller FFT for lower memory usage
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    // --- LFO section: creates organic vibrato/tremolo ---
    this.lfo = this.ctx.createOscillator();
    this.lfoGain = this.ctx.createGain();
    this.lfoGain.gain.value = 20; // ±20 Hz vibrato range (will be modulated by entropy)
    this.lfo.frequency.value = this.lfoRate;
    this.lfo.type = "sine"; // smooth modulation
    this.lfo.connect(this.lfoGain);
    this.lfo.start();

    // --- routing: gain → reverb → analyser → destination ---
    this.gain.gain.value = this.masterVol;
    this.gain.connect(this.reverb.input);
    this.reverb.output.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  // Get current audio level (0-1) for visual feedback
  getLevel() {
    this.analyser.getByteFrequencyData(this.dataArray);
    let sum = 0;
    for (let v of this.dataArray) sum += v;
    return sum / this.dataArray.length / 255; // normalize to 0–1
  }

  setLfoDepth(v: number) {
    this.lfoGain.gain.setValueAtTime(v, this.ctx.currentTime);
  }

  setLfoRate(v: number) {
    this.lfo.frequency.setValueAtTime(v, this.ctx.currentTime);
  }

  // xNorm = 0.0–1.0 across the display width (for stereo panning)
  // entropy = 0.0–1.0 for brightness and LFO intensity
  beep(state: number, intensity: number = 1, xNorm: number = Math.random(), entropy: number = 0) {
    if (!this.enabled) return;
    
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    const pan = this.ctx.createStereoPanner();
    const f = this.freqs[state] * (1 + (Math.random() - 0.5) * 0.05); // wider detune for analog warmth
    
    // Entropy affects brightness: higher entropy = brighter/louder
    const brightness = 0.4 * intensity * (0.5 + entropy / 2);
    
    // Envelope - slightly longer for atmosphere
    env.gain.setValueAtTime(0, this.ctx.currentTime);
    env.gain.linearRampToValueAtTime(brightness, this.ctx.currentTime + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    
    // Stereo motion: -1 = left, +1 = right
    pan.pan.setValueAtTime((xNorm * 2 - 1), this.ctx.currentTime);
    
    // Square wave for SID-like texture (classic Commodore sound)
    osc.type = "square";
    osc.frequency.setValueAtTime(f, this.ctx.currentTime);
    
    // Connect LFO to frequency for vibrato/tremolo effect
    this.lfoGain.connect(osc.frequency);
    
    osc.connect(env).connect(pan).connect(this.gain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  chord(states: number[], intensity: number = 1, xNorm?: number, entropy: number = 0) {
    states.forEach((state, i) => {
      const pan = xNorm !== undefined ? xNorm : 0.33 * (i + 1);
      this.beep(state, intensity * 0.7, pan, entropy);
    });
  }

  pulse(intensity: number = 1, entropy: number = 0) {
    // Play all three states rapidly for pulse effect with stereo sweep
    [0, 1, 2].forEach((state, i) => {
      setTimeout(() => this.beep(state, intensity, i / 2, entropy), i * 30);
    });
  }

  // Dynamic volume modulation based on field activity
  modulateVolume(utilization: number = Math.random()) {
    this.masterVol = 0.05 + 0.25 * utilization;
    this.gain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);
  }

  setVolume(vol: number) {
    this.masterVol = Math.max(0, Math.min(1, vol));
    this.gain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);
  }

  resume() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play() {
    this.enabled = true;
    this.playing = true;
    this.resume();
  }

  stop() {
    this.enabled = false;
    this.playing = false;
  }

  toggle() {
    if (this.playing) {
      this.stop();
    } else {
      this.play();
    }
    return this.playing;
  }
}
