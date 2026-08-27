import socialShortsJson from '../../assets/templates/social-shorts-templates.json';
import kouboScenesJson from '../../assets/templates/koubo-scenes-templates.json';
import type { Tpl } from '../types';
import { COMMUNITY_PRESETS } from './community-presets';
import type { TimelineState } from './types';

// Lean Kaka Cut catalog. The 1.8 MB legacy OpenChatCut gallery is intentionally
// not loaded: existing timeline clips keep their embedded code, while new work
// uses the smaller documentary/social/community packs below.
export const TEMPLATES = [
  ...COMMUNITY_PRESETS,
  ...(socialShortsJson as Tpl[]),
  ...(kouboScenesJson as Tpl[]),
];

export const INITIAL: TimelineState = {
  fps: 30,
  width: 1920,
  height: 1080,
  // A clean project avoids compiling two demo motion graphics on first open.
  items: [],
  selectedId: null,
};
