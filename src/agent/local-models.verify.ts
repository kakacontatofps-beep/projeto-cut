import assert from 'node:assert/strict';
import {
  isLocalLlmProvider,
  llmProviderPreset,
  normalizeLlmProvider,
} from '../../shared/llm-providers.ts';
import { KEY_NAMES } from '../../server/keystore.ts';
import {
  SETTINGS_CATEGORIES,
  vendorConfigured,
} from '../components/settings/settingsSchema.ts';
import {
  applyAgentModelStatus,
  applyCodexAgentStatus,
  getAgentModelSnapshot,
} from './model-selection.ts';
import { MODEL_CAPABILITY_OVERRIDES_KEY } from '../../shared/model-capabilities.ts';

assert.equal(normalizeLlmProvider('ollama'), 'ollama');
assert.equal(normalizeLlmProvider('lmstudio'), 'lmstudio');
assert.equal(isLocalLlmProvider('ollama'), true);
assert.equal(isLocalLlmProvider('anthropic'), false);
assert.equal(llmProviderPreset('ollama').baseUrl, 'http://localhost:11434/v1');
assert.equal(llmProviderPreset('lmstudio').baseUrl, 'http://localhost:1234/v1');

for (const name of [
  'LLM_OLLAMA_API_KEY',
  'LLM_OLLAMA_BASE_URL',
  'LLM_OLLAMA_MODEL',
  'LLM_LMSTUDIO_API_KEY',
  'LLM_LMSTUDIO_BASE_URL',
  'LLM_LMSTUDIO_MODEL',
] as const) {
  assert.ok(KEY_NAMES.includes(name), `${name} must be whitelisted`);
}

const llmGroup = SETTINGS_CATEGORIES.flatMap((category) => category.groups)
  .find((group) => group.key === 'llm');
assert.ok(llmGroup);
assert.deepEqual(llmGroup.vendors.map((page) => page.connection), ['codex'],
  'the lightweight settings surface exposes only integrated Codex');

applyAgentModelStatus({}, {});
assert.deepEqual(getAgentModelSnapshot(), { activeId: '', choices: [], loaded: true });
applyAgentModelStatus({
  LLM_OPENAI_API_KEY: { configured: true },
  LLM_GEMINI_API_KEY: { configured: true },
}, { LLM_PROVIDER: 'openai', LLM_GEMINI_MODEL: 'gemini-2.5-pro' });
assert.deepEqual(getAgentModelSnapshot().choices, [],
  'saved legacy API connections are retained but never loaded as editing models');

const signedInCodex = {
  installed: true,
  version: '0.146.0',
  account: { type: 'chatgpt' as const, email: 'editor@example.com', planType: 'pro' },
  loginPending: false,
};
applyCodexAgentStatus(signedInCodex, 'gpt-5.4', 'high');
const codex = getAgentModelSnapshot().choices.find((choice) => choice.backend === 'codex');
assert.ok(codex);
assert.equal(codex.reasoningEffort, 'high');
assert.equal(getAgentModelSnapshot().activeId, codex.id, 'Codex becomes the only integrated editing model');
applyAgentModelStatus({
  LLM_OPENAI_API_KEY: { configured: true },
  LLM_GEMINI_API_KEY: { configured: true },
}, { LLM_PROVIDER: 'openai' });
assert.equal(getAgentModelSnapshot().activeId, codex.id, 'key refresh must preserve an active Codex model');
applyAgentModelStatus({
  LLM_OPENAI_API_KEY: { configured: true },
}, {
  LLM_PROVIDER: 'openai',
  CODEX_MODEL: 'gpt-5.4',
  [MODEL_CAPABILITY_OVERRIDES_KEY]: JSON.stringify([{
    backend: 'codex',
    provider: 'openai',
    modelId: 'gpt-5.4',
    supportsTools: false,
  }]),
});
const overriddenCodex = getAgentModelSnapshot().choices.find((choice) => choice.backend === 'codex');
assert.equal(overriddenCodex?.capabilities.supportsTools.value, false,
  'saving a Codex override rebuilds the live Codex choice');
applyCodexAgentStatus(signedInCodex, '', '', [{
  id: 'gpt-5.6-sol',
  label: 'GPT-5.6 Sol',
  isDefault: true,
  defaultReasoningEffort: 'medium',
  supportedReasoningEfforts: [],
}]);
const defaultCodex = getAgentModelSnapshot().choices.find((choice) => choice.backend === 'codex');
assert.equal(defaultCodex?.model, 'gpt-5.6-sol');
assert.equal(defaultCodex?.requestModel, undefined, 'unset CODEX_MODEL keeps the request model omitted');

const codexPage = llmGroup.vendors.find((page) => page.connection === 'codex');
assert.ok(codexPage);
assert.equal(vendorConfigured(null, codexPage, signedInCodex), true);
applyCodexAgentStatus({
  installed: true,
  version: '0.146.0',
  account: { type: 'apiKey', email: null, planType: null },
  loginPending: false,
}, 'gpt-5.4');
assert.equal(getAgentModelSnapshot().choices.some((choice) => choice.backend === 'codex'), false);
assert.equal(vendorConfigured(null, codexPage, {
  ...signedInCodex,
  account: { type: 'apiKey', email: null, planType: null },
}), false);
console.log('local model verification passed');
