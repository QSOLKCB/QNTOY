const STATE_FREQUENCY_RATIOS = [1, 2, 4];
const MAX_VOICES_PER_EVENT = 10;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class QNTOYAudio {
  constructor({ rootFrequency = 110, volume = 0.16, reverbMix = 0.32, spread = 0.9 } = {}) {
    this.rootFrequency = rootFrequency;
    this.volume = volume;
    this.reverbMix = reverbMix;
    this.spread = spread;
    this.context = null;
    this.enabled = false;
    this.voiceCounter = 0;
    this.levelData = null;
    this.spectrumData = null;
    this.stopping = null;

    this.input = null;
    this.dry = null;
    this.wet = null;
    this.delay = null;
    this.feedback = null;
    this.master = null;
    this.compressor = null;
    this.analyser = null;
  }

  clearGraphReferences(context = this.context) {
    if (this.context !== context) return;
    this.context = null;
    this.input = null;
    this.dry = null;
    this.wet = null;
    this.delay = null;
    this.feedback = null;
    this.master = null;
    this.compressor = null;
    this.analyser = null;
    this.levelData = null;
    this.spectrumData = null;
  }

  async ensureContext() {
    if (this.stopping) await this.stopping;
    if (this.context && this.context.state !== 'closed') return this.context;
    if (this.context?.state === 'closed') this.clearGraphReferences(this.context);

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported by this browser.');
    }

    const context = new AudioContextClass({ latencyHint: 'interactive' });
    this.context = context;

    this.input = context.createGain();
    this.dry = context.createGain();
    this.wet = context.createGain();
    this.delay = context.createDelay(1.25);
    this.feedback = context.createGain();
    this.master = context.createGain();
    this.compressor = context.createDynamicsCompressor();
    this.analyser = context.createAnalyser();

    // Establish safe graph values synchronously before anything is connected.
    // Smoothing is reserved for later user/entropy changes.
    const initialEntropy = 0.5;
    this.dry.gain.value = 1 - this.reverbMix * 0.5;
    this.wet.gain.value = this.reverbMix;
    this.delay.delayTime.value = 0.09 + initialEntropy * 0.5;
    this.feedback.gain.value = 0.16 + initialEntropy * 0.43;
    this.master.gain.value = this.volume;

    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.82;
    this.levelData = new Uint8Array(this.analyser.fftSize);
    this.spectrumData = new Uint8Array(this.analyser.frequencyBinCount);

    this.compressor.threshold.value = -14;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.004;
    this.compressor.release.value = 0.18;

    this.input.connect(this.dry).connect(this.master);
    this.input.connect(this.delay);
    this.delay.connect(this.feedback).connect(this.delay);
    this.delay.connect(this.wet).connect(this.master);
    this.master.connect(this.compressor).connect(this.analyser).connect(context.destination);

    return context;
  }

  async start() {
    const context = await this.ensureContext();
    if (context.state === 'suspended') await context.resume();
    this.enabled = true;
    return true;
  }

  async stop() {
    this.enabled = false;
    const context = this.context;
    if (!context) return false;

    // Hard-mute immediately so active voices and feedback tails cannot leak
    // while close() completes. Closing also clears the delay buffer so a later
    // START AUDIO cannot resurrect an old tail.
    if (this.master && context.state !== 'closed') {
      const now = context.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(0, now);
    }

    if (context.state !== 'closed') {
      this.stopping = context.close();
      try {
        await this.stopping;
      } finally {
        this.stopping = null;
      }
    }

    this.clearGraphReferences(context);
    return false;
  }

  async toggle() {
    if (this.enabled) return this.stop();
    return this.start();
  }

  setVolume(value) {
    this.volume = clamp(Number(value) || 0, 0, 1);
    if (this.context) {
      this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.015);
    }
  }

  setReverbMix(value) {
    this.reverbMix = clamp(Number(value) || 0, 0, 0.9);
    if (!this.context) return;
    const now = this.context.currentTime;
    this.dry.gain.setTargetAtTime(1 - this.reverbMix * 0.5, now, 0.02);
    this.wet.gain.setTargetAtTime(this.reverbMix, now, 0.02);
  }

  setSpread(value) {
    this.spread = clamp(Number(value) || 0, 0, 1);
  }

  setRootFrequency(value) {
    this.rootFrequency = clamp(Number(value) || 110, 40, 880);
  }

  setEntropy(entropy) {
    if (!this.context) return;
    const e = clamp(Number(entropy) || 0, 0, 1);
    const now = this.context.currentTime;
    this.delay.delayTime.setTargetAtTime(0.09 + e * 0.5, now, 0.04);
    this.feedback.gain.setTargetAtTime(0.16 + e * 0.43, now, 0.04);
  }

  frequencyForState(state) {
    return this.rootFrequency * STATE_FREQUENCY_RATIOS[state % STATE_FREQUENCY_RATIOS.length];
  }

  trigger(state, {
    intensity = 1,
    pan = 0,
    entropy = 0,
    duration = 0.24,
  } = {}) {
    if (!this.enabled || !this.context) return;

    const context = this.context;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const filter = context.createBiquadFilter();
    const panner = context.createStereoPanner();

    this.voiceCounter += 1;
    const microDetune = ((this.voiceCounter % 9) - 4) * 1.35;
    const e = clamp(entropy, 0, 1);
    const peak = clamp(0.06 + 0.13 * intensity + 0.08 * e, 0.02, 0.26);
    const baseFrequency = this.frequencyForState(state);

    oscillator.type = state === 1 ? 'sawtooth' : 'square';
    oscillator.frequency.setValueAtTime(baseFrequency, now);
    oscillator.detune.setValueAtTime(microDetune, now);
    oscillator.detune.linearRampToValueAtTime(microDetune + (e - 0.5) * 22, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900 + e * 6200, now);
    filter.Q.setValueAtTime(1.5 + e * 5, now);

    panner.pan.setValueAtTime(clamp(pan * this.spread, -1, 1), now);

    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(peak, now + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(filter).connect(envelope).connect(panner).connect(this.input);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  sonifyChanges(changes, field) {
    if (!this.enabled || !changes?.length) return;

    const entropy = field.entropy();
    this.setEntropy(entropy);
    const stride = Math.max(1, Math.floor(changes.length / MAX_VOICES_PER_EVENT));

    for (let i = 0, voices = 0; i < changes.length && voices < MAX_VOICES_PER_EVENT; i += stride, voices += 1) {
      const change = changes[i];
      const x = change.index % field.width;
      const pan = field.width <= 1 ? 0 : (x / (field.width - 1)) * 2 - 1;
      this.trigger(change.to, {
        pan,
        entropy,
        intensity: 0.48 + Math.min(0.5, changes.length / field.size),
        duration: 0.12 + entropy * 0.2,
      });
    }
  }

  pulse(entropy = 0.5) {
    [0, 1, 2].forEach((state, index) => {
      window.setTimeout(() => {
        this.trigger(state, {
          entropy,
          intensity: 1,
          pan: index - 1,
          duration: 0.32,
        });
      }, index * 42);
    });
  }

  chord(entropy = 0.5) {
    [0, 1, 2].forEach((state, index) => {
      this.trigger(state, {
        entropy,
        intensity: 0.72,
        pan: (index - 1) * 0.7,
        duration: 0.48,
      });
    });
  }

  getLevel() {
    if (!this.analyser || !this.enabled) return 0;
    this.analyser.getByteTimeDomainData(this.levelData);
    let sumSquares = 0;
    for (const sample of this.levelData) {
      const normalized = (sample - 128) / 128;
      sumSquares += normalized * normalized;
    }
    return Math.min(1, Math.sqrt(sumSquares / this.levelData.length) * 2.8);
  }

  getSpectrum(target = null) {
    if (!this.analyser) return target || new Uint8Array(0);
    const destination = target && target.length === this.spectrumData.length ? target : this.spectrumData;
    this.analyser.getByteFrequencyData(destination);
    return destination;
  }

  getReverbTime() {
    return this.delay?.delayTime?.value ?? 0;
  }
}
