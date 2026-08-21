import assert from 'node:assert/strict';
import { brollTransitionTargets, transitionIncomingForSelectedBroll } from './brollTransitions';
import type { TimelineItem } from './types';

const clip = (id: string, startFrame: number, durationInFrames: number, track = 'V2'): TimelineItem => ({
  id,
  kind: 'video',
  name: id,
  track,
  startFrame,
  durationInFrames,
  src: `/media/${id}.mp4`,
  props: {},
});

const items = [
  clip('a', 0, 30),
  clip('b', 30, 30),
  clip('c', 60, 30),
  clip('gap', 120, 30),
  clip('other-track', 30, 30, 'V3'),
];

assert.equal(transitionIncomingForSelectedBroll(items, 'a'), 'b', 'first B-roll resolves its exit cut');
assert.equal(transitionIncomingForSelectedBroll(items, 'b'), 'b', 'incoming cut is preferred for a middle B-roll');
assert.equal(transitionIncomingForSelectedBroll(items, 'gap'), null, 'isolated B-roll has no transition target');
assert.deepEqual(brollTransitionTargets(items, 'V2'), ['b', 'c'], 'only adjacent same-track cuts are returned');

console.log('brollTransitions.verify: selection and whole-track cut targeting passed');
