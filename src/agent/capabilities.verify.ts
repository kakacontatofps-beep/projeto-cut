// capabilities.verify.ts — mode-aware provider routing: on/off partition, fallback
// (no vite define) fallback of the configured-capabilities manifest.
//   npx tsx src/agent/capabilities.verify.ts
import assert from 'node:assert/strict';
import { applyLiveKeyStatus, applyLiveModels, capabilitiesPrompt, CONFIGURED_CAPS, type CapabilityKey } from './capabilities';

const ALL_OFF: Record<CapabilityKey, boolean> = {
  image: false, voice: false, video: false, music: false, sound: false,
  stock: false, transcription: false, sandbox: false, web: false,
};

// ── all-off: lean editing tools are listed, external generators stay absent ──
const off = capabilitiesPrompt(ALL_OFF);
assert.ok(off.includes('run_code') && off.includes('transcribe_track'), 'lists gated editing tools');
assert.ok(!off.includes('submit_image') && !off.includes('submit_voice'), 'external generation tools are omitted');
assert.ok(off.includes('intentionally disabled in this lightweight editor build'));
assert.ok(off.includes('(no key-gated capabilities)'), 'no capability marked available when all off');
assert.ok(off.includes('push_asset'), 'includes a fallback hint for an off capability');

// ── mixed: transcription on → it sits in the ✅ section ──
const mixed = capabilitiesPrompt({ ...ALL_OFF, transcription: true });
const onIdx = mixed.indexOf('✅');
const offIdx = mixed.indexOf('⬜');
assert.ok(onIdx >= 0 && offIdx > onIdx, 'both sections present, ✅ before ⬜');
const onLine = mixed.slice(onIdx, offIdx);
assert.ok(onLine.includes('transcribe_track'), 'configured caps in ✅ section');
assert.ok(!onLine.includes('run_code'), 'unconfigured cap NOT in ✅ section');
assert.ok(mixed.slice(offIdx).includes('run_code'), 'unconfigured cap in ⬜ section');

// ── vendor granularity + routing semantics ──
applyLiveKeyStatus({ ASSEMBLYAI_API_KEY: { configured: true } });
const vendored = capabilitiesPrompt({ ...ALL_OFF, transcription: true });
assert.ok(vendored.includes('AssemblyAI(provider=assemblyai) — use it without asking again'));

// several vendors + NO user default → agent must ask before first use
applyLiveKeyStatus({ DEEPGRAM_API_KEY: { configured: true }, GROQ_API_KEY: { configured: true } });
applyLiveModels({});
const askFirst = capabilitiesPrompt({ ...ALL_OFF, transcription: true });
assert.ok(askFirst.includes('ask_followup_questions'), 'no default + several vendors → ask the user first');
assert.ok(askFirst.includes('Deepgram(provider=deepgram)') && askFirst.includes('Groq(provider=groq)'), 'options listed');

// user default set → use it, never ask
applyLiveModels({ PREFERRED_TRANSCRIPTION_PROVIDER: 'deepgram' });
const preferred = capabilitiesPrompt({ ...ALL_OFF, transcription: true });
assert.ok(preferred.includes('user default: Deepgram(provider=deepgram) — use it without asking again'), 'user default honored');
assert.ok(!preferred.includes('ask_followup_questions'), 'no ask when default set');

// default points at an UNCONFIGURED vendor → falls back to ask (not blindly honored)
applyLiveModels({ PREFERRED_TRANSCRIPTION_PROVIDER: 'assemblyai' });
const stalePref = capabilitiesPrompt({ ...ALL_OFF, transcription: true });
assert.ok(stalePref.includes('ask_followup_questions'), 'default for unconfigured vendor → ask instead');

// several vendors + AUTO mode (user delegated) → agent picks freely, no forced ask
applyLiveKeyStatus({ DEEPGRAM_API_KEY: { configured: true }, GROQ_API_KEY: { configured: true } });
applyLiveModels({});
const autoMode = capabilitiesPrompt({ ...ALL_OFF, transcription: true }, 'auto');
assert.ok(!autoMode.includes('ask_followup_questions'), 'auto mode → no forced ask before first use');
assert.ok(autoMode.includes('pick the most suitable one yourself'), 'auto mode → agent picks and states the reason');

// several vendors + MANUAL mode → still asks (regression)
const manualMode = capabilitiesPrompt({ ...ALL_OFF, transcription: true }, 'manual');
assert.ok(manualMode.includes('ask_followup_questions'), 'manual mode → ask before first use');

// the provider-choice rule names the routing ladder and pins choice to the list
assert.ok(autoMode.includes('user default → single provider → ask once in manual mode → pick freely in auto mode'),
  'provider-choice rule documents the routing ladder');
assert.ok(autoMode.includes('Never use a provider that is not in the list above'), 'choice pinned to configured list');
assert.ok(autoMode.includes('guide them to Settings'), 'unconfigured capability points to Settings');

// ── tsx (no vite define): CONFIGURED_CAPS falls back to all-false without throwing ──
assert.equal(typeof CONFIGURED_CAPS.image, 'boolean', 'CONFIGURED_CAPS resolves under tsx (all-false fallback, no ReferenceError)');
assert.equal(CONFIGURED_CAPS.image, false, 'fallback is all-false outside Vite');

console.log('capabilities.verify: ok');
