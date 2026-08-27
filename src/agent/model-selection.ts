import type { CodexAgentModel, CodexAgentStatus } from '../../shared/codex-agent';
import { loadAgentModelPref, saveAgentModelPref } from '../persist/sessionPrefs';
import {
  type LlmProvider,
  type OpenAiApiMode,
} from '../../shared/llm-providers';
import {
  MODEL_CAPABILITY_OVERRIDES_KEY,
  parseModelCapabilityOverrides,
  resolveModelCapabilities,
  type ModelCapabilities,
  type ModelCapabilityOverride,
  type ModelIdentity,
} from '../../shared/model-capabilities';

interface KeyStateLike {
  readonly configured: boolean;
}

export interface AgentModelChoice {
  readonly id: string;
  readonly backend: 'api' | 'codex';
  readonly provider: LlmProvider;
  readonly providerLabel: string;
  readonly model: string;
  readonly requestModel?: string;
  readonly openAiApiMode?: OpenAiApiMode;
  readonly reasoningEffort?: string;
  readonly capabilities: ModelCapabilities;
}

export interface AgentModelSnapshot {
  readonly choices: readonly AgentModelChoice[];
  readonly activeId: string;
  readonly loaded: boolean;
}

let snapshot: AgentModelSnapshot = { choices: [], activeId: '', loaded: false };
let apiModelChoices: readonly AgentModelChoice[] = [];
let codexModelChoices: readonly AgentModelChoice[] = [];
let capabilityOverrides: readonly ModelCapabilityOverride[] = [];
let codexStatus: CodexAgentStatus | null = null;
let codexSavedModel = '';
let codexSavedReasoningEffort = '';
let codexDiscoveredModels: readonly CodexAgentModel[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function commit(choices: readonly AgentModelChoice[], activeId: string, loaded = snapshot.loaded): void {
  snapshot = { choices, activeId, loaded };
  emit();
}

function commitChoices(
  choices: readonly AgentModelChoice[],
  activeId: string,
  loaded = snapshot.loaded,
): void {
  commit(choices, activeId, loaded);
}

function safeOverrides(raw: unknown): readonly ModelCapabilityOverride[] {
  try { return parseModelCapabilityOverrides(raw); } catch { return []; }
}

function modelCapabilities(identity: ModelIdentity): ModelCapabilities {
  return resolveModelCapabilities(identity, capabilityOverrides);
}

function apiChoices(
  _keys: Record<string, KeyStateLike>,
  _models: Record<string, string>,
): readonly AgentModelChoice[] {
  // Legacy API credentials stay stored for backwards compatibility, but this
  // lightweight Kaka Cut build only loads the newest Codex/MCP editing path.
  return [];
}

function allChoices(): readonly AgentModelChoice[] {
  return [...apiModelChoices, ...codexModelChoices];
}
function rebuildCodexChoices(): void {
  const requestedModel = codexSavedModel.trim();
  const discoveredModel = requestedModel
    ? codexDiscoveredModels.find((model) => model.id === requestedModel)
    : codexDiscoveredModels.find((model) => model.isDefault);
  const model = requestedModel || discoveredModel?.id || '';
  if (!codexStatus?.installed || codexStatus.account?.type !== 'chatgpt' || !model) {
    codexModelChoices = [];
    return;
  }
  const identity: ModelIdentity = { backend: 'codex', provider: 'openai', modelId: model };
  const capabilities = modelCapabilities(identity);
  codexModelChoices = [{
    id: `codex:${model}`,
    backend: 'codex',
    provider: 'openai',
    providerLabel: 'OpenAI Codex',
    model,
    ...(requestedModel ? { requestModel: requestedModel } : {}),
    reasoningEffort: selectedReasoningEffort(codexSavedReasoningEffort, capabilities),
    capabilities,
  }];
}



export function applyAgentModelStatus(
  keys: Record<string, KeyStateLike>,
  models: Record<string, string>,
): void {
  capabilityOverrides = safeOverrides(models[MODEL_CAPABILITY_OVERRIDES_KEY]);
  apiModelChoices = apiChoices(keys, models);
  codexSavedModel = models.CODEX_MODEL?.trim() ?? codexSavedModel;
  codexSavedReasoningEffort = models.CODEX_REASONING_EFFORT?.trim() ?? codexSavedReasoningEffort;
  rebuildCodexChoices();
  const choices = allChoices();
  const preferred = loadAgentModelPref();
  const preserved = choices.some((choice) => choice.id === snapshot.activeId) ? snapshot.activeId
    : choices.some((choice) => choice.id === preferred) ? preferred : '';
  commitChoices(choices, preserved || choices[0]?.id || '', true);
}

function selectedReasoningEffort(requested: string | undefined, capabilities: ModelCapabilities): string {
  const effort = requested?.trim() ?? '';
  if (!effort) return '';
  if (!capabilities.supportsReasoning.estimated && !capabilities.supportsReasoning.value) return '';
  const supported = capabilities.reasoningEfforts.value;
  return supported.length === 0 || supported.includes(effort)
    ? effort
    : capabilities.defaultReasoningEffort?.value ?? '';
}


export function applyCodexAgentStatus(
  status: CodexAgentStatus,
  savedModel?: string,
  savedReasoningEffort?: string,
  discoveredModels?: readonly CodexAgentModel[],
): void {
  codexStatus = status;
  codexSavedModel = savedModel?.trim() ?? codexSavedModel;
  codexSavedReasoningEffort = savedReasoningEffort?.trim() ?? codexSavedReasoningEffort;
  if (discoveredModels) codexDiscoveredModels = discoveredModels;
  rebuildCodexChoices();
  const choices = allChoices();
  const preffered = loadAgentModelPref();
  const preserved = choices.some((choice) => choice.id === snapshot.activeId) ? snapshot.activeId
    : choices.some((choice) => choice.id === preffered) ? preffered : '';
  commitChoices(choices, preserved || choices[0]?.id || '', true);
}

export function getAgentModelSnapshot(): AgentModelSnapshot {
  return snapshot;
}

export function subscribeAgentModels(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isAgentModelReady(state: AgentModelSnapshot = snapshot): boolean {
  return state.loaded
    && Boolean(state.activeId)
    && state.choices.some((choice) => choice.id === state.activeId);
}

export function getActiveAgentModelChoice(): AgentModelChoice | undefined {
  return snapshot.choices.find((choice) => choice.id === snapshot.activeId);
}

export function selectAgentModel(id: string): void {
  const choice = snapshot.choices.find((candidate) => candidate.id === id);
  if (!choice) return;
  commitChoices(snapshot.choices, choice.id);
  saveAgentModelPref(id);
}
