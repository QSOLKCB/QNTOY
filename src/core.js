export const STATE_COUNT = 3;
export const DEFAULT_WIDTH = 160;
export const DEFAULT_HEIGHT = 120;
export const DEFAULT_SEED = 'QNTOY-v3';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function hashSeed(value) {
  const text = String(value ?? DEFAULT_SEED);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export class SeededRandom {
  constructor(seed = DEFAULT_SEED) {
    this.setSeed(seed);
  }

  setSeed(seed) {
    this.seed = String(seed ?? DEFAULT_SEED);
    this.state = hashSeed(this.seed) || 0x6d2b79f5;
  }

  next() {
    // Mulberry32: compact, deterministic, and adequate for this toy simulation.
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(maxExclusive) {
    return Math.floor(this.next() * maxExclusive);
  }
}

export class QutritField {
  constructor({
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    seed = DEFAULT_SEED,
    randomize = true,
  } = {}) {
    if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
      throw new RangeError('width and height must be positive integers');
    }

    this.width = width;
    this.height = height;
    this.size = width * height;
    this.states = new Uint8Array(this.size);
    this.counts = new Uint32Array([this.size, 0, 0]);
    this.cycles = 0;
    this.seed = String(seed);
    this.rng = new SeededRandom(this.seed);

    if (randomize) {
      this.randomize({ resetCycle: true });
    }
  }

  reseed(seed, { randomize = true } = {}) {
    this.seed = String(seed || DEFAULT_SEED);
    this.rng.setSeed(this.seed);
    this.cycles = 0;
    if (randomize) {
      return this.randomize({ resetCycle: true });
    }
    return [];
  }

  setState(index, nextState, changes = null) {
    if (index < 0 || index >= this.size) return false;
    const state = Number(nextState);
    if (!Number.isInteger(state) || state < 0 || state >= STATE_COUNT) {
      throw new RangeError(`state must be an integer from 0 to ${STATE_COUNT - 1}`);
    }

    const previous = this.states[index];
    if (previous === state) return false;

    this.states[index] = state;
    this.counts[previous] -= 1;
    this.counts[state] += 1;
    changes?.push({ index, from: previous, to: state });
    return true;
  }

  replaceStates(values, { cycles = this.cycles } = {}) {
    const incoming = values instanceof Uint8Array ? values : Uint8Array.from(values);
    if (incoming.length !== this.size) {
      throw new RangeError(`expected ${this.size} states, received ${incoming.length}`);
    }

    const counts = new Uint32Array(STATE_COUNT);
    for (const state of incoming) {
      if (state >= STATE_COUNT) {
        throw new RangeError('snapshot contains an invalid qutrit state');
      }
      counts[state] += 1;
    }

    this.states.set(incoming);
    this.counts.set(counts);
    this.cycles = Math.max(0, Number(cycles) || 0);
  }

  step(rate = 0.02) {
    const probability = clamp(Number(rate) || 0, 0, 1);
    const changes = [];
    this.cycles += 1;

    for (let index = 0; index < this.size; index += 1) {
      if (this.rng.next() >= probability) continue;

      const current = this.states[index];
      // Mostly preserve the original cyclic 0→1→2→0 evolution, with a small
      // reverse-path probability so the field does not acquire directional bias.
      const direction = this.rng.next() < 0.88 ? 1 : 2;
      this.setState(index, (current + direction) % STATE_COUNT, changes);
    }

    return changes;
  }

  pulse(strength = 0.5) {
    return this.step(clamp(strength, 0, 1));
  }

  reset() {
    const changes = [];
    for (let index = 0; index < this.size; index += 1) {
      this.setState(index, 0, changes);
    }
    this.cycles = 0;
    return changes;
  }

  randomize({ resetCycle = false } = {}) {
    const changes = [];
    for (let index = 0; index < this.size; index += 1) {
      this.setState(index, this.rng.int(STATE_COUNT), changes);
    }
    if (resetCycle) this.cycles = 0;
    return changes;
  }

  applyOperation(operation) {
    switch (operation) {
      case 'hadamard':
      case 'mix':
        return this.mixOperation();
      case 'phase':
        return this.phaseOperation();
      case 'measure':
        return this.measureOperation();
      default:
        throw new Error(`unknown operation: ${operation}`);
    }
  }

  mixOperation() {
    const changes = [];
    for (let index = 0; index < this.size; index += 1) {
      if (this.rng.next() < 0.12) {
        this.setState(index, this.rng.int(STATE_COUNT), changes);
      }
    }
    return changes;
  }

  phaseOperation() {
    const changes = [];
    for (let index = 0; index < this.size; index += 1) {
      if (this.rng.next() < 0.06) {
        this.setState(index, (this.states[index] + 1) % STATE_COUNT, changes);
      }
    }
    return changes;
  }

  measureOperation() {
    const changes = [];
    for (let index = 0; index < this.size; index += 1) {
      if (this.rng.next() < 0.2) {
        this.setState(index, this.rng.next() < 0.5 ? 0 : 2, changes);
      }
    }
    return changes;
  }

  entropy() {
    let entropy = 0;
    for (const count of this.counts) {
      if (count === 0) continue;
      const probability = count / this.size;
      entropy -= probability * Math.log2(probability);
    }
    return entropy / Math.log2(STATE_COUNT);
  }

  distribution() {
    return Array.from(this.counts, (count) => count / this.size);
  }

  snapshot({ includeStates = true } = {}) {
    const payload = {
      format: 'QNTOY_SNAPSHOT_V1',
      seed: this.seed,
      width: this.width,
      height: this.height,
      cycles: this.cycles,
      entropy: this.entropy(),
      counts: Array.from(this.counts),
    };

    if (includeStates) {
      payload.states = Array.from(this.states);
    }

    return payload;
  }
}
