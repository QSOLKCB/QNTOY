# QNTOY Roadmap

## v3.0 — Native rebuild

Status: **implemented in the React-removal upgrade**

- [x] Remove React / JSX / Radix UI runtime
- [x] Plain HTML, CSS, and JavaScript modules
- [x] Seeded deterministic field core
- [x] Three.js GPU point-field renderer
- [x] Web Audio lazy-start synthesis graph
- [x] Entropy-coupled delay/reverb and analyser feedback
- [x] Live spectrum ribbon
- [x] CSV telemetry logging
- [x] JSON state snapshots
- [x] Responsive keyboard-accessible controls
- [x] Core unit tests and CI build gate
- [x] Explicit scientific boundary documentation

## v3.1 — Experiment presets

- [ ] Named deterministic presets with frozen seed + control values
- [ ] Import previously exported snapshots
- [ ] Compare two seeds / runs side by side
- [ ] Export a compact experiment manifest with app version and parameters
- [ ] Add reproducibility fixtures to CI

## v3.2 — Audio workbench

- [ ] Optional Web Audio `AudioWorklet` voice scheduler
- [ ] Root-frequency / tuning control
- [ ] Selectable state interval maps
- [ ] Web MIDI input for pulse and toy operations
- [ ] Offline audio render/export path where browser support permits

## v3.3 — Field analysis

- [ ] Transition-rate telemetry
- [ ] Spatial autocorrelation / cluster metrics
- [ ] Entropy history plot without a chart framework
- [ ] Deterministic neighbourhood-coupled evolution mode
- [ ] Export run summaries for external analysis

## v4 research branch

A future v4 may add an explicitly separate **complex-amplitude qutrit model**. If pursued, it should not silently replace the current stochastic toy. It should have its own mathematical specification, validation fixtures, and clear naming so the pedagogical discrete-state model and any actual amplitude simulation remain distinguishable.
