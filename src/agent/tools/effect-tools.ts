export { EFFECT_TOOL_SCHEMAS, EFFECT_TOOL_NAMES } from './schemas/effect-tools';
import type { AgentContext } from '../context';
import type { ClipEffect, ClipEffectValue, TimelineItem } from '../../editor/types';
import { TRANSITION_LABELS, TRANSITION_ORDER } from '../../editor/types';
import { ALL_FX, serializableDefsFor } from '../../gl/fx/effects';
import { listCustomTransitions } from '../../gl/customTransitions';
import { execEditItemTool } from './edit-item-tools';
import { transitionAssetId } from './library-catalog';
const FX_EFFECTS = ALL_FX;
const FX_IDS = Object.keys(ALL_FX);

// manage_effects — the per-clip WebGL effect operations of the
// `edit_item` transaction ({adds/updates/removes} with type:"effect", assetId,
// targetItemId, propertyOverrides). Modeled as one action tool to match this
// OpenChatCut's granular manage_* convention. propertyOverrides is a sparse PATCH
// (only changed keys); values clamp to each effect's range at render. `add`
// appends to effects[] and effectId targets one entry for update/remove.

type Args = Record<string, unknown>;

const catalog = () => FX_IDS.map((id) => {
  const d = FX_EFFECTS[id];
  return { assetId: d.id, name: d.name, description: d.desc, properties: d.props.map((p) => p.kind === 'color'
    ? { key: p.key, type: 'color', default: p.default }
    : { key: p.key, type: 'number', default: p.default, min: p.min, max: p.max }) };
});

function findItem(items: TimelineItem[], id: unknown): TimelineItem | null {
  const q = String(id ?? '');
  if (!q) return null;
  return items.find((it) => it.id === q || it.id.startsWith(q)) ?? null;
}

/** coerce untrusted overrides to finite scalar/vector uniform values */
function cleanOverrides(raw: unknown): Record<string, ClipEffectValue> {
  const out: Record<string, ClipEffectValue> = {};
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const n = typeof v === 'number' ? v : Number(v);
      if (Number.isFinite(n)) out[k] = n;
      else if (Array.isArray(v) && v.length >= 2 && v.length <= 4 && v.every((x) => typeof x === 'number' && Number.isFinite(x))) out[k] = v;
    }
  }
  return out;
}

const describe = (it: TimelineItem) => {
  const effects = (it.effects ?? []).filter((e) => e.assetId in FX_EFFECTS).map((fx) => ({ effectId: fx.id, assetId: fx.assetId, name: FX_EFFECTS[fx.assetId].name, overrides: fx.overrides ?? {} }));
  return { itemId: it.id, kind: it.kind, effect: effects[0] ?? null, effects };
};

export async function execEffectTool(name: string, args: Args, ctx: AgentContext): Promise<unknown> {
  if (name === 'manage_transitions') return execTransitionTool(args, ctx);
  if (name !== 'manage_effects') return { error: `unknown tool ${name}` };
  if (String(args.action) === 'list') return { effects: catalog() };

  const state = ctx.getState();
  const visual = state.items.filter((it) => it.kind === 'video' || it.kind === 'image');
  const it = findItem(visual, args.targetItemId);
  if (!it) {
    return { error: `no video/image clip ${args.targetItemId ?? '(missing targetItemId)'}`, available: visual.map((x) => ({ itemId: x.id, kind: x.kind, name: x.name })) };
  }

  switch (String(args.action)) {
    case 'inspect':
      return { ok: true, ...describe(it) };
    case 'add': {
      const assetId = String(args.assetId ?? '');
      if (!(assetId in FX_EFFECTS)) return { error: `unknown effect ${assetId}`, available: FX_IDS };
      const effect: ClipEffect = { id: `fx_${crypto.randomUUID()}`, assetId, overrides: cleanOverrides(args.propertyOverrides) };
      const nextEffects = [...(it.effects ?? []), effect];
      ctx.commands.setItemEffects(it.id, nextEffects, serializableDefsFor([effect]));
      return { ok: true, ...describe({ ...it, effects: nextEffects }) };
    }
    case 'update': {
      const effectId = String(args.effectId ?? '');
      const index = (it.effects ?? []).findIndex((e) => e.assetId in FX_EFFECTS && (!effectId || e.id === effectId || e.id.startsWith(effectId)));
      const cur = it.effects?.[index];
      if (!cur) return { error: `clip ${it.id} has no effect to update — use action="add" first` };
      const patch = cleanOverrides(args.propertyOverrides);
      const nextAsset = typeof args.assetId === 'string' && args.assetId in FX_EFFECTS ? args.assetId : cur.assetId;
      const next: ClipEffect = { ...cur, assetId: nextAsset, overrides: { ...cur.overrides, ...patch } };
      const nextEffects = (it.effects ?? []).map((fx, i) => i === index ? next : fx);
      ctx.commands.setItemEffects(it.id, nextEffects, serializableDefsFor([next]));
      return { ok: true, ...describe({ ...it, effects: nextEffects }) };
    }
    case 'remove': {
      const effectId = String(args.effectId ?? '');
      const assetId = String(args.assetId ?? '');
      const next = effectId
        ? (it.effects ?? []).filter((fx) => fx.id !== effectId && !fx.id.startsWith(effectId))
        : assetId ? (it.effects ?? []).filter((fx) => fx.assetId !== assetId) : [];
      ctx.commands.setItemEffects(it.id, next);
      return { ok: true, ...describe({ ...it, effects: next }) };
    }
    case 'move': {
      const effectId = String(args.effectId ?? '');
      const current = it.effects ?? [];
      const from = current.findIndex((effect) => effect.id === effectId || effect.id.startsWith(effectId));
      if (from < 0) return { error: `effect not found: ${effectId}`, ...describe(it) };
      const requested = Number(args.index);
      if (!Number.isFinite(requested)) return { error: 'move requires numeric index' };
      const to = Math.max(0, Math.min(current.length - 1, Math.trunc(requested)));
      const next = [...current];
      const [effect] = next.splice(from, 1);
      next.splice(to, 0, effect!);
      ctx.commands.setItemEffects(it.id, next, serializableDefsFor(next));
      return { ok: true, moved: effect!.id, from, to, ...describe({ ...it, effects: next }) };
    }
    default:
      return { error: `unknown action ${args.action}（可选 list/inspect/add/update/move/remove）` };
  }
}

function transitionCatalog() {
  return {
    builtIn: TRANSITION_ORDER.map((type) => ({
      assetId: transitionAssetId(type),
      type,
      name: TRANSITION_LABELS[type],
    })),
    custom: listCustomTransitions().map((definition) => ({
      assetId: definition.id,
      type: 'custom-shader',
      name: definition.label,
      properties: definition.props,
    })),
  };
}

function appliedTransitions(ctx: AgentContext, args: Args) {
  const transitionId = String(args.transitionId ?? '');
  const incomingItemId = String(args.incomingItemId ?? '');
  return (ctx.getState().transitions ?? [])
    .filter((transition) => !transitionId
      || transition.id === transitionId
      || transition.id.startsWith(transitionId))
    .filter((transition) => !incomingItemId
      || transition.incomingItemId === incomingItemId
      || transition.incomingItemId.startsWith(incomingItemId))
    .map((transition) => ({
      transitionId: transition.id,
      assetId: transition.type === 'custom-shader' ? 'custom-shader' : transitionAssetId(transition.type),
      type: transition.type,
      name: transition.customLabel ?? TRANSITION_LABELS[transition.type],
      durationInFrames: transition.durationInFrames,
      direction: transition.direction ?? 'left',
      enabled: transition.enabled !== false,
      outgoingItemId: transition.outgoingItemId,
      incomingItemId: transition.incomingItemId,
      trackId: transition.trackId,
      customUniforms: transition.customUniforms ?? null,
    }));
}

function normalizedTransitionAssetId(value: unknown): string {
  const raw = String(value ?? '').trim();
  return (TRANSITION_ORDER as readonly string[]).includes(raw)
    ? transitionAssetId(raw as (typeof TRANSITION_ORDER)[number])
    : raw;
}

async function execTransitionTool(args: Args, ctx: AgentContext): Promise<unknown> {
  const action = String(args.action ?? '');
  if (action === 'list') return { transitions: transitionCatalog() };
  if (action === 'inspect') return { transitions: appliedTransitions(ctx, args) };

  if (action === 'add') {
    const assetId = normalizedTransitionAssetId(args.assetId);
    if (!assetId) return { error: 'add requires assetId; use action="list" for available transitions' };
    const result = await execEditItemTool('edit_item', {
      adds: [{
        type: 'transition',
        assetId,
        incomingItemId: args.incomingItemId,
        ...(args.outgoingItemId !== undefined ? { outgoingItemId: args.outgoingItemId } : {}),
        ...(args.durationInFrames !== undefined ? { durationInFrames: args.durationInFrames } : {}),
        ...(args.direction !== undefined ? { direction: args.direction } : {}),
        ...(args.enabled !== undefined ? { enabled: args.enabled } : {}),
      }],
    }, ctx) as Record<string, unknown>;
    return result;
  }

  const transitionId = String(args.transitionId ?? '');
  if (!transitionId) return { error: `${action} requires transitionId` };
  if (action === 'update') {
    return execEditItemTool('edit_item', {
      updates: [{
        type: 'transition',
        id: transitionId,
        ...(args.assetId !== undefined ? { assetId: normalizedTransitionAssetId(args.assetId) } : {}),
        ...(args.durationInFrames !== undefined ? { durationInFrames: args.durationInFrames } : {}),
        ...(args.direction !== undefined ? { direction: args.direction } : {}),
        ...(args.enabled !== undefined ? { enabled: args.enabled } : {}),
      }],
    }, ctx);
  }
  if (action === 'remove') {
    return execEditItemTool('edit_item', {
      deletes: [{ type: 'transition', id: transitionId }],
    }, ctx);
  }
  return { error: `unknown action ${args.action}（可选 list/inspect/add/update/remove）` };
}
