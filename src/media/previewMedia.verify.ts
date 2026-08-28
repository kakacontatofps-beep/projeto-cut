import assert from 'node:assert/strict';
import { previewWindowSources, requestPreviewProxy } from './previewMedia';

const source = '/media/uploads/preview-force-check.mp4';
let calls = 0;
globalThis.fetch = async () => {
  calls++;
  return Response.json({
    source: { src: source, durationMs: 1_000, width: 640, height: 360, codec: 'h264', longGop: false },
    proxy: calls === 1
      ? { status: 'not-needed', reason: 'source-compatible' }
      : { status: 'ready', reason: 'forced', previewSrc: '/api/preview-proxy-file?src=check' },
  });
};

await requestPreviewProxy(source);
await requestPreviewProxy(source, true);
await requestPreviewProxy(source, true);
assert.equal(calls, 2, 'forced proxy generation is retried once and cached after it is ready');

const state = {
  fps: 30,
  width: 1920,
  height: 1080,
  items: [
    { id: 'v1', kind: 'video', track: 'V1', startFrame: 0, durationInFrames: 90, src: '/media/uploads/a.mp4' },
    { id: 'v2', kind: 'video', track: 'V1', startFrame: 90, durationInFrames: 90, src: '/media/uploads/b.mp4' },
    { id: 'v3', kind: 'video', track: 'V1', startFrame: 180, durationInFrames: 90, src: '/media/uploads/c.mp4' },
  ],
  tracks: { V1: { kind: 'video' } },
} as never;
assert.deepEqual(previewWindowSources(state, 30), [
  '/media/uploads/a.mp4',
  '/media/uploads/b.mp4',
], 'preview warmup is capped to the active clip and one successor');
assert.deepEqual(previewWindowSources(state, 95), [
  '/media/uploads/b.mp4',
  '/media/uploads/c.mp4',
], 'the warmup window follows the playhead instead of processing the full timeline');

console.log('previewMedia.verify: ok');
