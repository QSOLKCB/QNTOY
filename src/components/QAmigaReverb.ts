// QAmigaReverb.ts — Procedural delay-reverb network
export class QAmigaReverb {
  ctx: AudioContext;
  input: GainNode;
  output: GainNode;
  feedbackL: DelayNode;
  feedbackR: DelayNode;
  gainL: GainNode;
  gainR: GainNode;
  diffusion: GainNode;
  wet: GainNode;
  dry: GainNode;

  constructor(ctx: AudioContext, mix = 0.35, time = 0.25) {
    this.ctx = ctx;

    // Create nodes
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.feedbackL = ctx.createDelay(1.0);
    this.feedbackR = ctx.createDelay(1.0);
    this.gainL = ctx.createGain();
    this.gainR = ctx.createGain();
    this.diffusion = ctx.createGain();
    this.wet = ctx.createGain();
    this.dry = ctx.createGain();

    // Initial settings with randomized micro-detune to prevent metallic ringing
    this.feedbackL.delayTime.value = time * 0.8 + Math.random() * 0.05;
    this.feedbackR.delayTime.value = time + Math.random() * 0.05;
    this.gainL.gain.value = 0.35;
    this.gainR.gain.value = 0.35;
    this.diffusion.gain.value = 0.5;
    this.wet.gain.value = mix;
    this.dry.gain.value = 1 - mix;

    // Wiring: two feedback delay lines with cross-coupling and diffusion
    this.input.connect(this.feedbackL);
    this.input.connect(this.feedbackR);
    this.feedbackL.connect(this.gainL).connect(this.feedbackR);
    this.feedbackR.connect(this.gainR).connect(this.feedbackL);
    this.feedbackL.connect(this.diffusion);
    this.feedbackR.connect(this.diffusion);
    this.diffusion.connect(this.wet);
    this.input.connect(this.dry);
    this.wet.connect(this.output);
    this.dry.connect(this.output);
  }

  // Map entropy (0–1) to reverb delay time
  setTime(entropy: number) {
    // Map 0–1 entropy to delay 0.15–0.7 sec
    const t = 0.15 + entropy * 0.55;
    this.feedbackL.delayTime.linearRampToValueAtTime(
      t * 0.8,
      this.ctx.currentTime + 0.1
    );
    this.feedbackR.delayTime.linearRampToValueAtTime(
      t,
      this.ctx.currentTime + 0.1
    );
  }

  // Adjust wet/dry mix
  setMix(mix: number) {
    const clampedMix = Math.max(0, Math.min(1, mix));
    this.wet.gain.linearRampToValueAtTime(
      clampedMix,
      this.ctx.currentTime + 0.05
    );
    this.dry.gain.linearRampToValueAtTime(
      1 - clampedMix,
      this.ctx.currentTime + 0.05
    );
  }

  // Adjust feedback amount (reverb tail length)
  setFeedback(amount: number) {
    const clampedAmount = Math.max(0, Math.min(0.7, amount));
    this.gainL.gain.linearRampToValueAtTime(
      clampedAmount,
      this.ctx.currentTime + 0.05
    );
    this.gainR.gain.linearRampToValueAtTime(
      clampedAmount,
      this.ctx.currentTime + 0.05
    );
  }
}
