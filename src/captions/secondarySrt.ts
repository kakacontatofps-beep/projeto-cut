import type { TranscriptWord } from '../transcript/types.js';
import { identifyManualCues } from './manualCaptions.js';
import type { CaptionsData } from './types.js';

export interface SecondarySrtTrack {
  captions: CaptionsData;
  trackName: string;
}

function baseName(fileName: string): string {
  return fileName.replace(/\.srt$/i, '').trim() || 'SRT';
}

/** Build an independent highlight-caption track without modifying the main SRT. */
export function createSecondarySrtTrack(
  fileName: string,
  words: readonly TranscriptWord[],
  id: string = crypto.randomUUID(),
): SecondarySrtTrack {
  const name = baseName(fileName);
  const laneId = `srt_highlight_${id}`;
  return {
    trackName: `Destaques · ${name}`,
    captions: {
      enabled: true,
      template: 'bubble-pop',
      pacing: 'word',
      motionPreset: 'pop',
      sourceMode: 'item',
      layout: { anchor: 'middle-center', offsetYRatio: -0.06, scale: 0.86 },
      layoutPolicy: { mode: 'single-lane', maxVisibleSources: 1 },
      sourceEntries: [{
        id: laneId,
        itemId: `manual:${laneId}`,
        label: `Palavras em destaque · ${name}`,
        words: identifyManualCues(words),
      }],
    },
  };
}
