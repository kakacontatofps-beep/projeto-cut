import type { TimelineItem, TrackId } from './types';

const CUT_TOLERANCE_FRAMES = 2;

function isBrollVisual(item: TimelineItem): boolean {
  return item.kind === 'video' || item.kind === 'image';
}

function isAdjacent(outgoing: TimelineItem, incoming: TimelineItem): boolean {
  return Math.abs(outgoing.startFrame + outgoing.durationInFrames - incoming.startFrame)
    <= CUT_TOLERANCE_FRAMES;
}

function visualClipsOnTrack(items: readonly TimelineItem[], track: TrackId): TimelineItem[] {
  return items
    .filter((item) => item.track === track && isBrollVisual(item))
    .sort((a, b) => a.startFrame - b.startFrame || a.id.localeCompare(b.id));
}

/**
 * Resolve the cut nearest to the selected B-roll. Selecting either side of a
 * cut works: prefer the selected clip's entrance, otherwise use its exit.
 */
export function transitionIncomingForSelectedBroll(
  items: readonly TimelineItem[],
  selectedId: string,
): string | null {
  const selected = items.find((item) => item.id === selectedId);
  if (!selected || !isBrollVisual(selected)) return null;
  const clips = visualClipsOnTrack(items, selected.track);
  const index = clips.findIndex((item) => item.id === selected.id);
  if (index < 0) return null;
  if (index > 0 && isAdjacent(clips[index - 1]!, selected)) return selected.id;
  const next = clips[index + 1];
  return next && isAdjacent(selected, next) ? next.id : null;
}

/** Every adjacent video/image cut on a B-roll track, represented by incoming id. */
export function brollTransitionTargets(
  items: readonly TimelineItem[],
  track: TrackId,
): string[] {
  const clips = visualClipsOnTrack(items, track);
  const targets: string[] = [];
  for (let index = 1; index < clips.length; index += 1) {
    if (isAdjacent(clips[index - 1]!, clips[index]!)) targets.push(clips[index]!.id);
  }
  return targets;
}
