import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/visualizer.js', import.meta.url), 'utf8');

test('visualizer tracks live reduced-motion preference changes', () => {
  assert.match(source, /motionPreference\s*=\s*window\.matchMedia/);
  assert.match(source, /addEventListener\('change',\s*this\.handleMotionPreferenceChange\)/);
  assert.match(source, /setReducedMotion\(value\)/);
  assert.match(source, /this\.controls\.autoRotate\s*=\s*this\.viewMode\s*===\s*'orbit'\s*&&\s*!this\.reducedMotion/);
});

test('visualizer unregisters the reduced-motion listener on dispose', () => {
  assert.match(source, /removeEventListener\('change',\s*this\.handleMotionPreferenceChange\)/);
  assert.match(source, /removeListener\?\.\(this\.handleMotionPreferenceChange\)/);
});
