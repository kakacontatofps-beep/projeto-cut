import assert from 'node:assert/strict';
import type { CaptionPage } from './types';
import { visibleCaptionPages } from './captionTimelineWindow';

const pages: CaptionPage[] = Array.from({ length: 240 }, (_, index) => ({
  words: [{ text: `Cue ${index}`, start: index * 1_000, end: index * 1_000 + 700 }],
  start: index * 1_000,
  end: index * 1_000 + 700,
}));

const visible = visibleCaptionPages(pages, 30, { startFrame: 3_000, endFrame: 3_300 });
assert.deepEqual(visible.map(({ index }) => index), Array.from({ length: 10 }, (_, offset) => 100 + offset));
assert.ok(visible.length < pages.length / 10, 'mounted cue count stays bounded to the timeline window');

const pinned = visibleCaptionPages(pages, 30, { startFrame: 3_000, endFrame: 3_300 }, [
  { start: pages[5]!.start, end: pages[5]!.end },
]);
assert.equal(pinned[0]?.index, 5, 'selected offscreen cue remains mounted');
assert.equal(pinned.length, visible.length + 1);

console.log('captionTimelineWindow.verify: caption DOM virtualization OK');
