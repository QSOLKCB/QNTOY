// QNTOY Data Logger — Trent Slade 2025
// Logs entropy, reverb time, and audio level to CSV.

export class QNLogger {
  constructor(core, duration = 60) {
    this.core = core;
    this.duration = duration; // seconds
    this.records = [];
    this.startTime = null;
    this.interval = null;
  }

  start() {
    this.startTime = performance.now();
    this.records = [];
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => this.sample(), 1000);
    console.log(`[QNTOY] Data logging started for ${this.duration}s`);
    setTimeout(() => this.stop(), this.duration * 1000);
  }

  sample() {
    const t = ((performance.now() - this.startTime) / 1000).toFixed(1);
    const e = this.core.entropy().toFixed(4);
    const r =
      this.core.audio?.reverb?.feedbackR?.delayTime?.value?.toFixed(4) || 0;
    const a = this.core.audio?.getLevel
      ? this.core.audio.getLevel().toFixed(4)
      : 0;
    this.records.push(`${t},${e},${r},${a}`);
  }

  stop() {
    clearInterval(this.interval);
    const header = "time_s,entropy,reverb_time_s,audio_level\n";
    const blob = new Blob([header + this.records.join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qntoy_log.csv";
    a.click();
    URL.revokeObjectURL(url);
    console.log(`[QNTOY] Data logging complete (${this.records.length} samples).`);
  }
}
