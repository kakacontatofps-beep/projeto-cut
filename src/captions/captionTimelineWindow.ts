import type { TimelineFrameWindow } from '../components/timeline/timelineUtil.js';
import { intersectFrameRange } from '../components/timeline/timelineUtil.js';
import type { CaptionPage } from './types.js';

export interface IndexedCaptionPage {
  page: CaptionPage;
  index: number;
}

export interface CaptionTimeRange {
  start: number;
  end: number;
}

/** Keep only viewport cues plus explicitly pinned selections/interactions. */
export function visibleCaptionPages(
  pages: readonly CaptionPage[],
  fps: number,
  window: TimelineFrameWindow,
  pinnedRanges: readonly CaptionTimeRange[] = [],
): IndexedCaptionPage[] {
  return pages.flatMap((page, index) => {
    const startFrame = Math.max(0, Math.round(page.start * fps / 1000));
    const durationInFrames = Math.max(2, Math.round((page.end - page.start) * fps / 1000));
    const visible = !!intersectFrameRange(startFrame, durationInFrames, window);
    const pinned = pinnedRanges.some((range) => page.start < range.end && page.end > range.start);
    return visible || pinned ? [{ page, index }] : [];
  });
}
