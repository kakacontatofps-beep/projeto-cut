import assert from 'node:assert/strict';
import { makeDraft } from '../../editor/store.ts';
import type { AgentContext } from '../context.ts';
import type { ProjectDoc, Timeline } from '../../editor/types.ts';
import { execEffectTool } from './effect-tools.ts';
import { CURRENT_PROJECT_VERSION } from '../../../shared/project-version';

const timeline: Timeline = {
  id: 'tl_effect_response',
  name: 'effect response',
  order: 0,
  fps: 30,
  width: 1920,
  height: 1080,
  items: [{
    id: 'item_visual',
    kind: 'image',
    name: 'Still',
    src: '/still.jpg',
    track: 'V1',
    startFrame: 0,
    durationInFrames: 90,
  }, {
    id: 'item_visual_2',
    kind: 'image',
    name: 'Still 2',
    src: '/still-2.jpg',
    track: 'V1',
    startFrame: 90,
    durationInFrames: 90,
  }],
  selectedId: null,
  trackOrder: ['V1'],
  tracks: { V1: { kind: 'video', name: 'Video' } },
};
const doc: ProjectDoc = {
  version: CURRENT_PROJECT_VERSION,
  assets: [],
  mediaFolders: [],
  timelines: [timeline],
  activeTimelineId: timeline.id,
};
const draft = makeDraft(doc);
const ctx: AgentContext = {
  commands: draft.commands,
  getState: draft.getState,
  getDoc: draft.getDoc,
  getCreativeMode: () => null,
  templates: [],
  audio: [],
};

const added = await execEffectTool('manage_effects', {
  action: 'add',
  targetItemId: 'item_visual',
  assetId: 'builtin:fx-rgb-split',
  propertyOverrides: { amount: 0.2 },
}, ctx) as { effect: { assetId: string; overrides: { amount: number } }; effects: unknown[] };
assert.equal(added.effect.assetId, 'builtin:fx-rgb-split');
assert.equal(added.effect.overrides.amount, 0.2);
assert.equal(added.effects.length, 1);

await execEffectTool('manage_effects', {
  action: 'add',
  targetItemId: 'item_visual',
  assetId: 'builtin:fx-invert',
}, ctx);
const inspectedEffects = await execEffectTool('manage_effects', {
  action: 'inspect',
  targetItemId: 'item_visual',
}, ctx) as { effects: Array<{ effectId: string }> };
assert.equal(inspectedEffects.effects.length, 2);
const moved = await execEffectTool('manage_effects', {
  action: 'move',
  targetItemId: 'item_visual',
  effectId: inspectedEffects.effects[1]!.effectId,
  index: 0,
}, ctx) as { to: number; effects: Array<{ assetId: string }> };
assert.equal(moved.to, 0);
assert.equal(moved.effects[0]!.assetId, 'builtin:fx-invert');

const transitionCatalog = await execEffectTool('manage_transitions', {
  action: 'list',
}, ctx) as { transitions: { builtIn: Array<{ assetId: string }> } };
assert.ok(transitionCatalog.transitions.builtIn.some((entry) => entry.assetId === 'builtin:tr-whip-pan'));

const transitionAdd = await execEffectTool('manage_transitions', {
  action: 'add',
  assetId: 'whip-pan',
  incomingItemId: 'item_visual_2',
  durationInFrames: 24,
  direction: 'right',
}, ctx) as { results: Array<{ transition: { id: string } }> };
assert.ok(transitionAdd.results?.[0]?.transition, JSON.stringify(transitionAdd));
const transitionId = transitionAdd.results[0]!.transition.id;
const inspectedTransition = await execEffectTool('manage_transitions', {
  action: 'inspect',
  transitionId,
}, ctx) as { transitions: Array<{ durationInFrames: number; direction: string; enabled: boolean }> };
assert.equal(inspectedTransition.transitions[0]!.durationInFrames, 24);
assert.equal(inspectedTransition.transitions[0]!.direction, 'right');

await execEffectTool('manage_transitions', {
  action: 'update',
  transitionId,
  durationInFrames: 18,
  enabled: false,
}, ctx);
const updatedTransition = await execEffectTool('manage_transitions', {
  action: 'inspect',
  transitionId,
}, ctx) as { transitions: Array<{ durationInFrames: number; enabled: boolean }> };
assert.equal(updatedTransition.transitions[0]!.durationInFrames, 18);
assert.equal(updatedTransition.transitions[0]!.enabled, false);

await execEffectTool('manage_transitions', { action: 'remove', transitionId }, ctx);
const removedTransition = await execEffectTool('manage_transitions', {
  action: 'inspect', transitionId,
}, ctx) as { transitions: unknown[] };
assert.equal(removedTransition.transitions.length, 0);

console.log('effect/transition MCP tool checks passed');
