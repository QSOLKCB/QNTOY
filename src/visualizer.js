import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const STATE_COLORS = [
  new THREE.Color('#ff4d5a'),
  new THREE.Color('#79ffb7'),
  new THREE.Color('#6f8cff'),
];

const vertexShader = `
  attribute vec3 aColor;
  attribute float aState;
  uniform float uAudio;
  uniform float uPointSize;
  uniform float uTime;
  varying vec3 vColor;
  varying float vPulse;

  void main() {
    vec3 transformed = position;
    transformed.z += sin((position.x * 0.8) + (position.y * 0.6) + uTime * 0.0015) * (0.05 + uAudio * 0.18);
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    float perspective = clamp(280.0 / max(1.0, -mvPosition.z), 0.65, 2.8);
    gl_PointSize = uPointSize * perspective * (1.0 + uAudio * 1.6 + aState * 0.06);
    gl_Position = projectionMatrix * mvPosition;
    vColor = aColor;
    vPulse = 0.72 + uAudio * 1.35;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vPulse;

  void main() {
    vec2 p = gl_PointCoord - vec2(0.5);
    float distanceToCenter = length(p);
    if (distanceToCenter > 0.5) discard;
    float core = smoothstep(0.5, 0.0, distanceToCenter);
    float halo = smoothstep(0.5, 0.16, distanceToCenter) * 0.45;
    vec3 color = vColor * (0.75 + core * vPulse + halo);
    gl_FragColor = vec4(color, clamp(core + halo, 0.0, 1.0));
  }
`;

export class QutritVisualizer {
  constructor(container, field, audio) {
    this.container = container;
    this.field = field;
    this.audio = audio;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.viewMode = 'orbit';
    this.spectrumBuffer = new Uint8Array(128);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x061014, 0.028);

    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    this.camera.position.set(0, -10.8, 11.8);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x061014, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute('aria-label', 'Three-dimensional qutrit field visualizer');
    this.container.append(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.enablePan = false;
    this.controls.minDistance = 6.5;
    this.controls.maxDistance = 22;
    this.controls.autoRotate = !this.reducedMotion;
    this.controls.autoRotateSpeed = 0.35;
    this.controls.target.set(0, 0, 0);

    this.buildField();
    this.buildReferenceGrid();
    this.buildSpectrumRibbon();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    this.resize();

    this.renderer.setAnimationLoop((time) => this.render(time));
  }

  buildField() {
    const { width, height, size, states } = this.field;
    const positions = new Float32Array(size * 3);
    const colors = new Float32Array(size * 3);
    const stateAttribute = new Float32Array(size);
    const spacing = 0.075;
    const halfWidth = (width - 1) * spacing * 0.5;
    const halfHeight = (height - 1) * spacing * 0.5;

    for (let index = 0; index < size; index += 1) {
      const x = index % width;
      const y = Math.floor(index / width);
      const state = states[index];
      const offset = index * 3;
      const color = STATE_COLORS[state];

      positions[offset] = x * spacing - halfWidth;
      positions[offset + 1] = halfHeight - y * spacing;
      positions[offset + 2] = (state - 1) * 0.52;
      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
      stateAttribute[index] = state;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('aState', new THREE.BufferAttribute(stateAttribute, 1));
    this.geometry.computeBoundingSphere();

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uAudio: { value: 0 },
        uPointSize: { value: 4.2 },
        uTime: { value: 0 },
      },
      vertexShader,
      fragmentShader,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  buildReferenceGrid() {
    this.grid = new THREE.GridHelper(16, 32, 0x2e7778, 0x183a3d);
    this.grid.rotation.x = Math.PI / 2;
    this.grid.position.z = -1.12;
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.26;
    this.scene.add(this.grid);

    const frameGeometry = new THREE.BoxGeometry(12.6, 9.6, 2.2);
    const frameEdges = new THREE.EdgesGeometry(frameGeometry);
    const frameMaterial = new THREE.LineBasicMaterial({ color: 0x8ddbd2, transparent: true, opacity: 0.22 });
    this.frame = new THREE.LineSegments(frameEdges, frameMaterial);
    this.scene.add(this.frame);
  }

  buildSpectrumRibbon() {
    const length = 128;
    const positions = new Float32Array(length * 3);
    for (let index = 0; index < length; index += 1) {
      const offset = index * 3;
      positions[offset] = (index / (length - 1) - 0.5) * 10.8;
      positions[offset + 1] = -5.35;
      positions[offset + 2] = 1.5;
    }

    this.ribbonGeometry = new THREE.BufferGeometry();
    this.ribbonGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.ribbonMaterial = new THREE.LineBasicMaterial({ color: 0x9ef2dd, transparent: true, opacity: 0.72 });
    this.ribbon = new THREE.Line(this.ribbonGeometry, this.ribbonMaterial);
    this.scene.add(this.ribbon);
  }

  syncAll() {
    const positions = this.geometry.getAttribute('position');
    const colors = this.geometry.getAttribute('aColor');
    const states = this.geometry.getAttribute('aState');

    for (let index = 0; index < this.field.size; index += 1) {
      this.updateIndex(index, this.field.states[index], positions, colors, states);
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    states.needsUpdate = true;
  }

  applyChanges(changes) {
    if (!changes?.length) return;
    const positions = this.geometry.getAttribute('position');
    const colors = this.geometry.getAttribute('aColor');
    const states = this.geometry.getAttribute('aState');

    for (const { index, to } of changes) {
      this.updateIndex(index, to, positions, colors, states);
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    states.needsUpdate = true;
  }

  updateIndex(index, state, positions, colors, states) {
    const offset = index * 3;
    const color = STATE_COLORS[state];
    positions.array[offset + 2] = (state - 1) * 0.52;
    colors.array[offset] = color.r;
    colors.array[offset + 1] = color.g;
    colors.array[offset + 2] = color.b;
    states.array[index] = state;
  }

  setPointSize(value) {
    this.material.uniforms.uPointSize.value = Number(value);
  }

  setView(mode) {
    this.viewMode = mode;
    if (mode === 'top') {
      this.controls.autoRotate = false;
      this.camera.position.set(0, 0, 15.2);
      this.camera.up.set(0, 1, 0);
      this.controls.target.set(0, 0, 0);
    } else if (mode === 'side') {
      this.controls.autoRotate = false;
      this.camera.position.set(0, -14.5, 2.6);
      this.camera.up.set(0, 0, 1);
      this.controls.target.set(0, 0, 0);
    } else {
      this.camera.up.set(0, 1, 0);
      this.camera.position.set(0, -10.8, 11.8);
      this.controls.target.set(0, 0, 0);
      this.controls.autoRotate = !this.reducedMotion;
    }
    this.controls.update();
  }

  cycleView() {
    const modes = ['orbit', 'top', 'side'];
    const index = (modes.indexOf(this.viewMode) + 1) % modes.length;
    this.setView(modes[index]);
    return this.viewMode;
  }

  resize() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  updateSpectrum(level) {
    const spectrum = this.audio.getSpectrum(this.spectrumBuffer);
    const position = this.ribbonGeometry.getAttribute('position');
    for (let index = 0; index < position.count; index += 1) {
      const sample = spectrum[index] ?? 0;
      position.array[index * 3 + 1] = -5.35 + (sample / 255) * (0.55 + level * 0.8);
    }
    position.needsUpdate = true;
  }

  render(time) {
    const level = this.audio.getLevel();
    this.material.uniforms.uAudio.value = level;
    this.material.uniforms.uTime.value = time;
    this.ribbonMaterial.opacity = 0.38 + level * 0.62;
    this.updateSpectrum(level);

    if (this.viewMode === 'orbit' && !this.reducedMotion) {
      this.points.rotation.z = Math.sin(time * 0.00008) * 0.03;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.resizeObserver.disconnect();
    this.renderer.setAnimationLoop(null);
    this.controls.dispose();
    this.geometry.dispose();
    this.material.dispose();
    this.ribbonGeometry.dispose();
    this.ribbonMaterial.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
