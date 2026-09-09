import test from 'node:test';
import assert from 'node:assert/strict';

import { QutritField, SeededRandom, hashSeed } from '../src/core.js';

test('hashSeed and PRNG are stable for the same seed', () => {
  assert.equal(hashSeed('alpha'), hashSeed('alpha'));
  const a = new SeededRandom('alpha');
  const b = new SeededRandom('alpha');
  const seqA = Array.from({ length: 20 }, () => a.next());
  const seqB = Array.from({ length: 20 }, () => b.next());
  assert.deepEqual(seqA, seqB);
});

test('fresh fields with the same seed evolve identically', () => {
  const a = new QutritField({ width: 24, height: 16, seed: 'same-seed' });
  const b = new QutritField({ width: 24, height: 16, seed: 'same-seed' });

  assert.deepEqual(Array.from(a.states), Array.from(b.states));

  for (const rate of [0.02, 0.05, 0.17, 0, 0.4]) {
    const changesA = a.step(rate);
    const changesB = b.step(rate);
    assert.deepEqual(changesA, changesB);
    assert.deepEqual(Array.from(a.states), Array.from(b.states));
  }
});

test('reseed restores the deterministic initial field', () => {
  const field = new QutritField({ width: 18, height: 12, seed: 'restore-me' });
  const initial = Array.from(field.states);
  field.step(0.5);
  field.randomize();
  field.reseed('restore-me');
  assert.deepEqual(Array.from(field.states), initial);
  assert.equal(field.cycles, 0);
});

test('state counts always sum to field size', () => {
  const field = new QutritField({ width: 30, height: 20, seed: 'counts' });
  const assertCounts = () => {
    assert.equal(Array.from(field.counts).reduce((sum, value) => sum + value, 0), field.size);
  };

  assertCounts();
  field.step(0.2);
  assertCounts();
  field.applyOperation('hadamard');
  assertCounts();
  field.applyOperation('phase');
  assertCounts();
  field.applyOperation('measure');
  assertCounts();
  field.reset();
  assertCounts();
  field.randomize();
  assertCounts();
});

test('entropy is normalized from zero to one', () => {
  const field = new QutritField({ width: 6, height: 3, seed: 'entropy', randomize: false });
  assert.equal(field.entropy(), 0);

  const balanced = Uint8Array.from([
    0, 1, 2, 0, 1, 2,
    0, 1, 2, 0, 1, 2,
    0, 1, 2, 0, 1, 2,
  ]);
  field.replaceStates(balanced);
  assert.ok(Math.abs(field.entropy() - 1) < 1e-12);
});

test('operations never emit invalid qutrit states', () => {
  const field = new QutritField({ width: 20, height: 20, seed: 'ops' });
  for (const operation of ['hadamard', 'phase', 'measure']) {
    const changes = field.applyOperation(operation);
    for (const change of changes) {
      assert.ok(change.from >= 0 && change.from <= 2);
      assert.ok(change.to >= 0 && change.to <= 2);
    }
    for (const state of field.states) {
      assert.ok(state >= 0 && state <= 2);
    }
  }
});

test('snapshot contains deterministic state and metadata', () => {
  const field = new QutritField({ width: 8, height: 7, seed: 'snapshot' });
  field.step(0.1);
  const snapshot = field.snapshot();
  assert.equal(snapshot.format, 'QNTOY_SNAPSHOT_V1');
  assert.equal(snapshot.width, 8);
  assert.equal(snapshot.height, 7);
  assert.equal(snapshot.seed, 'snapshot');
  assert.equal(snapshot.states.length, 56);
  assert.equal(snapshot.counts.reduce((sum, value) => sum + value, 0), 56);
});
