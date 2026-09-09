// Regression coverage for automated review findings that previously reached PR #1.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { QNTOYAudio } from '../src/audio.js';
import { QutritField } from '../src/core.js';
import { QNLogger, encodeCSVField } from '../src/logger.js';

class FakeParam {
  constructor(value = 1) {
    this.value = value;
    this.targetCalls = [];
  }
  setTargetAtTime(value, time, constant) {
    this.value = value;
    this.targetCalls.push([value, time, constant]);
  }
  setValueAtTime(value) { this.value = value; }
  linearRampToValueAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
  cancelScheduledValues() {}
}

class FakeNode {
  constructor() { this.connections = []; }
  connect(target) { this.connections.push(target); return target; }
}

class FakeGain extends FakeNode {
  constructor() { super(); this.gain = new FakeParam(1); }
}

class FakeDelay extends FakeNode {
  constructor() { super(); this.delayTime = new FakeParam(0); }
}

class FakeCompressor extends FakeNode {
  constructor() {
    super();
    this.threshold = new FakeParam();
    this.knee = new FakeParam();
    this.ratio = new FakeParam();
    this.attack = new FakeParam();
    this.release = new FakeParam();
  }
}

class FakeAnalyser extends FakeNode {
  constructor() {
    super();
    this._fftSize = 32;
    this.frequencyBinCount = 16;
    this.smoothingTimeConstant = 0;
  }
  set fftSize(value) { this._fftSize = value; this.frequencyBinCount = value / 2; }
  get fftSize() { return this._fftSize; }
  getByteTimeDomainData(target) { target.fill(128); }
  getByteFrequencyData(target) { target.fill(192); }
}

class FakeAudioContext {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 0;
    this.destination = new FakeNode();
    this.closed = false;
  }
  createGain() { return new FakeGain(); }
  createDelay() { return new FakeDelay(); }
  createDynamicsCompressor() { return new FakeCompressor(); }
  createAnalyser() { return new FakeAnalyser(); }
  async resume() { this.state = 'running'; }
  async close() { this.state = 'closed'; this.closed = true; }
}

test('audio graph initializes safe direct feedback and wet/dry parameters', async () => {
  globalThis.window = { AudioContext: FakeAudioContext };
  const audio = new QNTOYAudio({ volume: 0.2, reverbMix: 0.32 });

  await audio.start();

  assert.equal(audio.context.state, 'running');
  assert.equal(audio.master.gain.value, 0.2);
  assert.equal(audio.dry.gain.value, 0.84);
  assert.equal(audio.wet.gain.value, 0.32);
  assert.ok(Math.abs(audio.delay.delayTime.value - 0.34) < 1e-12);
  assert.equal(audio.feedback.gain.value, 0.375);
  assert.equal(audio.dry.gain.targetCalls.length, 0);
  assert.equal(audio.wet.gain.targetCalls.length, 0);
  assert.equal(audio.delay.delayTime.targetCalls.length, 0);
  assert.equal(audio.feedback.gain.targetCalls.length, 0);

  await audio.stop();
  delete globalThis.window;
});

test('audio graph initializes from entropy supplied before context creation', async () => {
  globalThis.window = { AudioContext: FakeAudioContext };
  const audio = new QNTOYAudio();
  audio.setEntropy(0);

  await audio.start();

  assert.equal(audio.entropy, 0);
  assert.ok(Math.abs(audio.delay.delayTime.value - 0.09) < 1e-12);
  assert.ok(Math.abs(audio.feedback.gain.value - 0.16) < 1e-12);

  await audio.stop();
  delete globalThis.window;
});

test('stop hard-mutes, closes, and rebuilds the audio graph on restart', async () => {
  globalThis.window = { AudioContext: FakeAudioContext };
  const audio = new QNTOYAudio();

  await audio.start();
  const firstContext = audio.context;
  const firstMaster = audio.master;

  assert.equal(await audio.stop(), false);
  assert.equal(audio.enabled, false);
  assert.equal(firstMaster.gain.value, 0);
  assert.equal(firstContext.closed, true);
  assert.equal(audio.context, null);
  assert.equal(audio.delay, null);

  assert.equal(await audio.start(), true);
  assert.equal(audio.enabled, true);
  assert.notEqual(audio.context, firstContext);
  assert.equal(audio.context.state, 'running');

  await audio.stop();
  delete globalThis.window;
});

test('overlapping audio toggles serialize into start then stop', async () => {
  globalThis.window = { AudioContext: FakeAudioContext };
  const audio = new QNTOYAudio();

  const first = audio.toggle();
  const second = audio.toggle();
  assert.deepEqual(await Promise.all([first, second]), [true, false]);
  assert.equal(audio.enabled, false);
  assert.equal(audio.context, null);

  delete globalThis.window;
});

test('getSpectrum clears a caller buffer as soon as audio is disabled', async () => {
  globalThis.window = { AudioContext: FakeAudioContext };
  const audio = new QNTOYAudio();
  await audio.start();

  const target = new Uint8Array(128);
  audio.getSpectrum(target);
  assert.ok(target.some((value) => value !== 0));

  audio.enabled = false;
  const returned = audio.getSpectrum(target);
  assert.equal(returned, target);
  assert.ok(target.every((value) => value === 0));

  await audio.stop();
  delete globalThis.window;
});

test('encodeCSVField doubles embedded quotes and quotes special fields', () => {
  assert.equal(encodeCSVField('plain-seed'), 'plain-seed');
  assert.equal(encodeCSVField('seed,part'), '"seed,part"');
  assert.equal(encodeCSVField('seed"part'), '"seed""part"');
  assert.equal(encodeCSVField('seed\npart'), '"seed\npart"');
});

test('telemetry CSV preserves quoted and comma-containing seed values', () => {
  const logger = new QNLogger(null, null);
  logger.records = [{
    time_s: 1.25,
    cycles: 7,
    entropy: 0.5,
    state_0: 1,
    state_1: 1,
    state_2: 1,
    reverb_time_s: 0.34,
    audio_level: 0.125,
    seed: 'alpha,"beta"',
  }];

  const csv = logger.toCSV();
  assert.match(csv, /1\.250,7,0\.500000,1,1,1,0\.340000,0\.125000,"alpha,""beta"""\n$/);
});

test('replaceStates rejects values before Uint8 coercion and preserves the field', () => {
  const field = new QutritField({ width: 3, height: 1, randomize: false });
  const initialStates = Array.from(field.states);
  const initialCounts = Array.from(field.counts);

  for (const invalid of [
    [0, 1, 256],
    [0, 1, 1.5],
    [0, 1, -1],
    [0, 1, '2'],
  ]) {
    assert.throws(() => field.replaceStates(invalid), /invalid qutrit state/);
    assert.deepEqual(Array.from(field.states), initialStates);
    assert.deepEqual(Array.from(field.counts), initialCounts);
  }
});

test('setState rejects fractional indexes without corrupting counts', () => {
  const field = new QutritField({ width: 3, height: 1, randomize: false });
  const changes = [];
  const initialCounts = Array.from(field.counts);

  assert.equal(field.setState(1.5, 2, changes), false);
  assert.deepEqual(Array.from(field.states), [0, 0, 0]);
  assert.deepEqual(Array.from(field.counts), initialCounts);
  assert.deepEqual(changes, []);
  assert.equal(Array.from(field.counts).reduce((sum, value) => sum + value, 0), field.size);
});

test('state distribution meters have explicit accessible labels', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const [state, word] of [['zero', 'zero'], ['one', 'one'], ['two', 'two']]) {
    assert.match(html, new RegExp(`id="state-${word}-label"`));
    assert.match(html, new RegExp(`id="meter-${state}"[^>]+aria-labelledby="state-${word}-label"`));
  }
});
