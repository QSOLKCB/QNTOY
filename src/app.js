import { QutritField, DEFAULT_SEED } from './core.js';
import { QNTOYAudio } from './audio.js';
import { QutritVisualizer } from './visualizer.js';
import { QNLogger, downloadSnapshot } from './logger.js';

const $ = (selector) => document.querySelector(selector);

const field = new QutritField({ seed: DEFAULT_SEED });
const audio = new QNTOYAudio();
const visualizer = new QutritVisualizer($('#scene'), field, audio);
const logger = new QNLogger(field, audio);

let paused = false;
let evolutionRate = 0.02;
let lastStepAt = performance.now();
let lastStatsAt = 0;
let toastTimer = null;

const elements = {
  runDot: $('#run-dot'),
  runStatus: $('#run-status'),
  audioStatus: $('#audio-status'),
  audioButton: $('#audio-button'),
  pauseButton: $('#pause-button'),
  pulseButton: $('#pulse-button'),
  viewButton: $('#view-button'),
  snapshotButton: $('#snapshot-button'),
  seedForm: $('#seed-form'),
  seedInput: $('#seed-input'),
  hudSeed: $('#hud-seed'),
  logButton: $('#log-button'),
  toast: $('#toast'),
  rateControl: $('#rate-control'),
  rateOutput: $('#rate-output'),
  volumeControl: $('#volume-control'),
  volumeOutput: $('#volume-output'),
  reverbControl: $('#reverb-control'),
  reverbOutput: $('#reverb-output'),
  spreadControl: $('#spread-control'),
  spreadOutput: $('#spread-output'),
  pointControl: $('#point-control'),
  pointOutput: $('#point-output'),
  statCycles: $('#stat-cycles'),
  statEntropy: $('#stat-entropy'),
  statAudio: $('#stat-audio'),
  statReverb: $('#stat-reverb'),
  meters: [$('#meter-zero'), $('#meter-one'), $('#meter-two')],
  counts: [$('#count-zero'), $('#count-one'), $('#count-two')],
};

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 2200);
}

function commitChanges(changes, { sonify = true, forceStats = false } = {}) {
  visualizer.applyChanges(changes);
  if (sonify) audio.sonifyChanges(changes, field);
  audio.setEntropy(field.entropy());
  updateStats(forceStats);
}

async function toggleAudio() {
  try {
    const enabled = await audio.toggle();
    elements.audioButton.textContent = enabled ? 'STOP AUDIO' : 'START AUDIO';
    elements.audioButton.classList.toggle('is-active', enabled);
    elements.audioStatus.textContent = enabled ? 'AUDIO ON' : 'AUDIO OFF';
    if (enabled) {
      audio.chord(field.entropy());
      showToast('Web Audio enabled');
    } else {
      showToast('Audio stopped');
    }
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Unable to start audio');
  }
}

function setPaused(nextPaused) {
  paused = Boolean(nextPaused);
  elements.pauseButton.textContent = paused ? 'RUN' : 'PAUSE';
  elements.runStatus.textContent = paused ? 'PAUSED' : 'RUNNING';
  elements.runDot.classList.toggle('is-paused', paused);
  showToast(paused ? 'Simulation paused' : 'Simulation running');
}

function pulse() {
  const changes = field.pulse(0.48);
  commitChanges(changes, { sonify: false, forceStats: true });
  if (audio.enabled) audio.pulse(field.entropy());
  elements.pulseButton.classList.add('is-flashing');
  window.setTimeout(() => elements.pulseButton.classList.remove('is-flashing'), 180);
  showToast(`Pulse: ${changes.length.toLocaleString()} transitions`);
}

function runOperation(operation) {
  let changes;
  if (operation === 'reset') {
    changes = field.reset();
  } else if (operation === 'randomize') {
    changes = field.randomize();
  } else {
    changes = field.applyOperation(operation);
  }

  commitChanges(changes, { sonify: false, forceStats: true });
  if (audio.enabled) {
    if (operation === 'reset') audio.trigger(0, { entropy: field.entropy(), intensity: 0.9, duration: 0.42 });
    else if (operation === 'phase') audio.pulse(field.entropy());
    else audio.chord(field.entropy());
  }

  showToast(`${operation.toUpperCase()}: ${changes.length.toLocaleString()} cells changed`);
}

function updateStats(force = false) {
  const now = performance.now();
  if (!force && now - lastStatsAt < 120) return;
  lastStatsAt = now;

  const entropy = field.entropy();
  const distribution = field.distribution();
  const level = audio.getLevel();

  elements.statCycles.textContent = field.cycles.toLocaleString();
  elements.statEntropy.textContent = entropy.toFixed(4);
  elements.statAudio.textContent = `${Math.round(level * 100)}%`;
  elements.statReverb.textContent = `${audio.getReverbTime().toFixed(2)} s`;

  for (let state = 0; state < 3; state += 1) {
    elements.meters[state].value = distribution[state];
    elements.counts[state].textContent = `${field.counts[state].toLocaleString()} · ${(distribution[state] * 100).toFixed(1)}%`;
  }

  if (!logger.isActive && elements.logButton.dataset.logging === 'true') {
    elements.logButton.dataset.logging = 'false';
    elements.logButton.textContent = 'LOG 60 S CSV';
  }
}

function animationLoop(now) {
  if (!paused && now - lastStepAt >= 33) {
    const changes = field.step(evolutionRate);
    commitChanges(changes);
    lastStepAt = now;
  }
  updateStats();
  requestAnimationFrame(animationLoop);
}

function applySeed(seed) {
  const normalized = seed.trim() || DEFAULT_SEED;
  const changes = field.reseed(normalized, { randomize: true });
  visualizer.syncAll();
  audio.setEntropy(field.entropy());
  elements.seedInput.value = field.seed;
  elements.hudSeed.textContent = `SEED ${field.seed}`;
  updateStats(true);
  showToast(`Seed applied: ${field.seed} (${changes.length.toLocaleString()} initial changes)`);
}

function toggleLogger() {
  if (logger.isActive) {
    logger.stop();
    elements.logButton.dataset.logging = 'false';
    elements.logButton.textContent = 'LOG 60 S CSV';
    showToast('CSV log exported');
    return;
  }

  elements.logButton.dataset.logging = 'true';
  elements.logButton.textContent = 'STOP + EXPORT LOG';
  logger.start(60, {
    onStop: () => {
      elements.logButton.dataset.logging = 'false';
      elements.logButton.textContent = 'LOG 60 S CSV';
      showToast('60-second CSV log exported');
    },
  });
  showToast('Recording 60-second telemetry log');
}

function updateRange(control, output, formatter, callback) {
  const update = () => {
    const value = Number(control.value);
    output.value = formatter(value);
    output.textContent = formatter(value);
    callback(value);
  };
  control.addEventListener('input', update);
  update();
}

function isInteractiveShortcutTarget(target) {
  return Boolean(target?.closest?.([
    'button',
    'a[href]',
    'input',
    'textarea',
    'select',
    'summary',
    '[contenteditable]:not([contenteditable="false"])',
    '[role="button"]',
    '[role="link"]',
    '[role="slider"]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')));
}

elements.audioButton.addEventListener('click', toggleAudio);
elements.pauseButton.addEventListener('click', () => setPaused(!paused));
elements.pulseButton.addEventListener('click', pulse);
elements.snapshotButton.addEventListener('click', () => {
  downloadSnapshot(field);
  showToast('Snapshot exported');
});
elements.viewButton.addEventListener('click', () => {
  const mode = visualizer.cycleView();
  elements.viewButton.textContent = `VIEW: ${mode.toUpperCase()}`;
  showToast(`Camera: ${mode}`);
});

document.querySelectorAll('[data-operation]').forEach((button) => {
  button.addEventListener('click', () => runOperation(button.dataset.operation));
});

elements.seedForm.addEventListener('submit', (event) => {
  event.preventDefault();
  applySeed(elements.seedInput.value);
});

elements.logButton.addEventListener('click', toggleLogger);

updateRange(elements.rateControl, elements.rateOutput, (value) => `${value.toFixed(2)}%`, (value) => {
  evolutionRate = value / 100;
});
updateRange(elements.volumeControl, elements.volumeOutput, (value) => `${Math.round(value)}%`, (value) => {
  audio.setVolume(value / 100);
});
updateRange(elements.reverbControl, elements.reverbOutput, (value) => `${Math.round(value)}%`, (value) => {
  audio.setReverbMix(value / 100);
});
updateRange(elements.spreadControl, elements.spreadOutput, (value) => `${Math.round(value)}%`, (value) => {
  audio.setSpread(value / 100);
});
updateRange(elements.pointControl, elements.pointOutput, (value) => value.toFixed(1), (value) => {
  visualizer.setPointSize(value);
});

window.addEventListener('keydown', (event) => {
  const target = event.target;
  if (isInteractiveShortcutTarget(target) || event.ctrlKey || event.metaKey || event.altKey) return;

  if (event.code === 'Space') {
    event.preventDefault();
    setPaused(!paused);
    return;
  }

  switch (event.key.toLowerCase()) {
    case 'a':
      toggleAudio();
      break;
    case 'p':
      pulse();
      break;
    case 'r':
      runOperation('reset');
      break;
    case '1':
      runOperation('hadamard');
      break;
    case '2':
      runOperation('phase');
      break;
    case '3':
      runOperation('measure');
      break;
    case 'v': {
      const mode = visualizer.cycleView();
      elements.viewButton.textContent = `VIEW: ${mode.toUpperCase()}`;
      break;
    }
    case 'l':
      toggleLogger();
      break;
    default:
      break;
  }
});

window.addEventListener('beforeunload', () => {
  void audio.stop();
  visualizer.dispose();
}, { once: true });

visualizer.syncAll();
updateStats(true);
requestAnimationFrame(animationLoop);
