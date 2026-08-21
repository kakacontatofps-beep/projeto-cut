import type { AgentToolSchema } from '../../tool-schema';

export const EFFECT_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'manage_effects',
    description:
      'Shorthand for per-clip WebGL effects. Prefer browse_library followed by edit_item adds:[{type:"effect",targetItemId,assetId}]. action=list returns catalog; add/update/remove mutate the clip effect stack. Also covers LUT assetIds. For zoom/transitions use edit_item.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'inspect', 'add', 'update', 'move', 'remove'], description: 'What to do.' },
        targetItemId: { type: 'string', description: 'Clip id to affect (prefix ok). Required for add/update/remove. Must be a video or image clip.' },
        effectId: { type: 'string', description: 'update/remove: target effect instance id. Omit to target the first effect.' },
        assetId: { type: 'string', description: 'add: which effect, e.g. "builtin:fx-luma-key". Get ids from action="list" or browse_library.' },
        propertyOverrides: { type: 'object', description: 'add/update: sparse patch. Numeric properties use numbers; colors use RGB arrays in 0..1, e.g. {"color":[1,0,0]}. Omit for defaults.' },
        index: { type: 'number', description: 'move: zero-based destination index in the clip effect stack.' },
      },
      required: ['action'],
    },
  },
  {
    name: 'manage_transitions',
    description:
      'Dedicated transition MCP tool. list returns the built-in/custom GLSL catalog; inspect reports applied transitions; add/update/remove mutate transitions at adjacent clip cuts. Use incomingItemId for the later clip at the cut. Supports duration, direction and enabled state.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'inspect', 'add', 'update', 'remove'], description: 'What to do.' },
        transitionId: { type: 'string', description: 'Applied transition id or prefix. Required for update/remove; optional filter for inspect.' },
        incomingItemId: { type: 'string', description: 'add: later clip at an adjacent same-track cut. inspect: optional clip filter.' },
        outgoingItemId: { type: 'string', description: 'add: optional safety assertion for the earlier adjacent clip.' },
        assetId: { type: 'string', description: 'add/update transition asset. Accepts builtin:tr-cross-dissolve, a bare built-in type, or custom:tr-* from submit_shader.' },
        durationInFrames: { type: 'number', minimum: 2, description: 'Transition duration, clamped to both adjacent clip lengths.' },
        direction: { type: 'string', enum: ['left', 'right', 'up', 'down'], description: 'Direction for wipe/whip-style transitions.' },
        enabled: { type: 'boolean', description: 'Enable or temporarily bypass the transition.' },
      },
      required: ['action'],
    },
  },
];

export const EFFECT_TOOL_NAMES = new Set(EFFECT_TOOL_SCHEMAS.map((t) => t.name));
