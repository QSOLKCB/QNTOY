function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export class QNLogger {
  constructor(field, audio, { sampleIntervalMs = 1000 } = {}) {
    this.field = field;
    this.audio = audio;
    this.sampleIntervalMs = sampleIntervalMs;
    this.records = [];
    this.intervalId = null;
    this.timeoutId = null;
    this.startedAt = 0;
    this.isActive = false;
    this.onStop = null;
  }

  start(durationSeconds = 60, { onStop = null } = {}) {
    if (this.isActive) this.stop({ download: false });
    this.records = [];
    this.startedAt = performance.now();
    this.isActive = true;
    this.onStop = onStop;
    this.sample();
    this.intervalId = window.setInterval(() => this.sample(), this.sampleIntervalMs);
    this.timeoutId = window.setTimeout(() => this.stop(), Math.max(1, durationSeconds) * 1000);
  }

  sample() {
    if (!this.isActive) return;
    const elapsed = (performance.now() - this.startedAt) / 1000;
    const counts = Array.from(this.field.counts);
    this.records.push({
      time_s: elapsed,
      cycles: this.field.cycles,
      entropy: this.field.entropy(),
      state_0: counts[0],
      state_1: counts[1],
      state_2: counts[2],
      reverb_time_s: this.audio.getReverbTime(),
      audio_level: this.audio.getLevel(),
      seed: this.field.seed,
    });
  }

  stop({ download = true } = {}) {
    if (!this.isActive) return null;
    this.isActive = false;
    window.clearInterval(this.intervalId);
    window.clearTimeout(this.timeoutId);
    this.intervalId = null;
    this.timeoutId = null;

    const csv = this.toCSV();
    if (download) {
      downloadText('qntoy-log.csv', csv, 'text/csv;charset=utf-8');
    }
    this.onStop?.(this.records);
    this.onStop = null;
    return csv;
  }

  toCSV() {
    const header = [
      'time_s',
      'cycles',
      'entropy',
      'state_0',
      'state_1',
      'state_2',
      'reverb_time_s',
      'audio_level',
      'seed',
    ];
    const lines = this.records.map((record) => [
      record.time_s.toFixed(3),
      record.cycles,
      record.entropy.toFixed(6),
      record.state_0,
      record.state_1,
      record.state_2,
      record.reverb_time_s.toFixed(6),
      record.audio_level.toFixed(6),
      JSON.stringify(record.seed),
    ].join(','));
    return `${header.join(',')}\n${lines.join('\n')}\n`;
  }
}

export function downloadSnapshot(field) {
  const payload = {
    ...field.snapshot({ includeStates: true }),
    exported_at: new Date().toISOString(),
  };
  downloadText(
    `qntoy-snapshot-${field.seed.replace(/[^a-z0-9_-]+/gi, '_')}.json`,
    `${JSON.stringify(payload, null, 2)}\n`,
    'application/json;charset=utf-8',
  );
}
