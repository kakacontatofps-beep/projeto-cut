import assert from 'node:assert/strict';
import { docFromTimeline } from '../persist/projectStore';
import type { MediaAsset } from '../editor/types';
import { assembleEpisodeDocument, numericMediaOrder, previewEpisode, sortNumberedMedia } from './episodeAssembler';

const asset = (id: string, name: string, kind: MediaAsset['kind'], durationInFrames = 300): MediaAsset => ({
  id, name, sourceFilename: name, kind, src: `/media/uploads/${name}`, durationInFrames,
});
const assets = [
  asset('img10', '010.jpg', 'image'),
  asset('music', 'musica.mp3', 'audio', 900),
  asset('img2', '002.png', 'image'),
  asset('voice', 'narracao.wav', 'audio', 750),
  asset('img1', '001 - abertura.jpg', 'image'),
];
const srt = `1\n00:00:00,500 --> 00:00:02,000\nPrimeira cena\n\n2\n00:00:02,000 --> 00:00:05,000\nSegunda cena\n\n3\n00:00:05,000 --> 00:00:07,000\nTerceira cena`;

assert.equal(numericMediaOrder('cena_004_final.png'), 4);
assert.deepEqual(sortNumberedMedia(assets).map((item) => item.id), ['img1', 'img2', 'img10']);
const preview = previewEpisode(assets, srt, { missingMediaPolicy: 'repeat-last' });
assert.equal(preview.scenes.length, 3);
assert.equal(preview.scenes[0]?.startMs, 0, 'the first visual covers the lead-in before the first subtitle');
assert.deepEqual(preview.scenes.map((scene) => scene.asset?.id), ['img1', 'img2', 'img10']);
assert.equal(preview.narration?.id, 'voice');
assert.equal(preview.music?.id, 'music');

const base = docFromTimeline({ fps: 30, width: 1920, height: 1080, items: [], selectedId: null });
base.assets = assets;
let serial = 0;
const result = assembleEpisodeDocument(base, {
  srtName: 'roteiro.srt', srtContent: srt, missingMediaPolicy: 'repeat-last', replaceTimeline: true,
  transition: 'cross-dissolve', transitionDurationSeconds: 0.35, applySlowZoom: true, musicVolume: 0.15,
}, (prefix) => `${prefix}_${++serial}`);
const timeline = result.doc.timelines[0]!;
const visuals = timeline.items.filter((item) => item.track === timeline.items.find((candidate) => candidate.sourceAssetId === 'img1')?.track);
assert.equal(result.sceneCount, 3);
assert.equal(result.placedVisualCount, 3);
assert.deepEqual(visuals.map((item) => [item.sourceAssetId, item.startFrame, item.durationInFrames]), [
  ['img1', 0, 60], ['img2', 60, 90], ['img10', 150, 600],
]);
assert.equal(timeline.transitions?.length, 2);
assert.equal(timeline.markers?.length, 3);
assert.equal(timeline.items.find((item) => item.sourceAssetId === 'voice')?.durationInFrames, 750, 'narration is never cut');
assert.equal(Object.values(timeline.tracks ?? {}).find((track) => track?.kind === 'caption')?.captions?.words?.length, 3);

const shortage = previewEpisode(assets.slice(2), srt, { missingMediaPolicy: 'repeat-last' });
assert.deepEqual(shortage.scenes.map((scene) => scene.asset?.id), ['img1', 'img2', 'img2']);
const onlyOne = previewEpisode([asset('one', '001.jpg', 'image')], srt, { missingMediaPolicy: 'cycle' });
assert.deepEqual(onlyOne.scenes.map((scene) => scene.asset?.id), ['one', 'one', 'one']);
console.log('episodeAssembler.verify: numeric matching, SRT timing, audio roles and atomic document assembly passed');
