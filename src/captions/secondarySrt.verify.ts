import assert from 'node:assert/strict';
import { parseSrt } from './srt';
import { createSecondarySrtTrack } from './secondarySrt';

const parsed = parseSrt(`1
00:00:01,000 --> 00:00:02,000
POMPEIA

2
00:00:03,000 --> 00:00:04,250
ANO 79
`);
const result = createSecondarySrtTrack('destaques.srt', parsed, 'fixture');

assert.equal(result.trackName, 'Destaques · destaques');
assert.equal(result.captions.template, 'bubble-pop');
assert.equal(result.captions.pacing, 'word');
assert.equal(result.captions.motionPreset, 'pop');
assert.equal(result.captions.layout?.anchor, 'middle-center');
assert.deepEqual(result.captions.sourceEntries?.[0]?.words?.map((word) => word.text), ['POMPEIA', 'ANO 79']);
assert.ok(result.captions.sourceEntries?.[0]?.words?.every((word) => word.id), 'secondary cues receive stable identities');

console.log('secondarySrt.verify: independent highlight track preset OK');
