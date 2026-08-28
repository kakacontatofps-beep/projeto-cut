import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  getPreviewSourceMode,
  getQualityMode,
  shouldAutoRequestPreviewProxy,
  shouldPreferMasterPreview,
  subscribeQualityMode,
} from './qualityPolicy';
import type { ProjectDoc, TimelineState } from '../editor/types';
import { resolveTimelineRenderPlan } from '../editor/sequenceGraph';
import { isPreviewable } from './clipPreview';

export interface PreviewProxySource {
  src: string;
  durationMs: number;
  width: number;
  height: number;
  codec: string;
  longGop: boolean;
}

export type PreviewProxyReadiness =
  | { status: 'not-needed'; reason: string }
  | { status: 'ready'; reason: string; previewSrc: string }
  | { status: 'failed'; reason: string; error: string };

export interface PreviewProxyResponse {
  source: PreviewProxySource;
  proxy: PreviewProxyReadiness;
}

export type PreviewProxyState = PreviewProxyReadiness
  | { status: 'loading'; reason: string }
  | { status: 'unavailable'; reason: string };

interface ProxyEntry {
  response: PreviewProxyResponse | null;
  promise: Promise<void> | null;
  controller: AbortController | null;
  listeners: Set<() => void>;
  force: boolean;
  fallbackToProxy: boolean;
}

const proxyEntries = new Map<string, ProxyEntry>();

function proxyEntry(src: string): ProxyEntry {
  let entry = proxyEntries.get(src);
  if (!entry) {
    entry = {
      response: null,
      promise: null,
      controller: null,
      listeners: new Set(),
      force: false,
      fallbackToProxy: false,
    };
    proxyEntries.set(src, entry);
  }
  return entry;
}

function notify(entry: ProxyEntry): void {
  for (const listener of entry.listeners) listener();
}

async function responseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null) as { error?: unknown } | null;
  return typeof body?.error === 'string' ? body.error : `preview proxy request failed (${response.status})`;
}

function failedResponse(src: string, error: unknown): PreviewProxyResponse {
  return {
    source: { src, durationMs: 0, width: 0, height: 0, codec: '', longGop: false },
    proxy: {
      status: 'failed',
      reason: 'proxy-request-failed',
      error: error instanceof Error ? error.message : String(error),
    },
  };
}

async function loadProxy(src: string, force: boolean, entry: ProxyEntry): Promise<void> {
  if (entry.promise) {
    await entry.promise;
    if (force && !entry.force && entry.response?.proxy.status !== 'ready') await loadProxy(src, true, entry);
    return;
  }
  if (entry.response && (!force || entry.response.proxy.status === 'ready')) return;
  entry.force = force;
  entry.response = null;
  notify(entry);
  const query = `src=${encodeURIComponent(src)}${force ? '&force=1' : ''}`;
  const controller = new AbortController();
  entry.controller = controller;
  entry.promise = fetch(`/api/preview-proxy?${query}`, { signal: controller.signal })
    .then(async (response) => {
      if (!response.ok) throw new Error(await responseError(response));
      entry.response = await response.json() as PreviewProxyResponse;
    })
    .catch((error) => {
      if (!controller.signal.aborted) entry.response = failedResponse(src, error);
    })
    .finally(() => {
      if (entry.controller === controller) entry.controller = null;
      entry.promise = null;
      notify(entry);
    });
  await entry.promise;
}

export function requestPreviewProxy(src: string, force = false): Promise<void> {
  if (!isPreviewable(src)) return Promise.resolve();
  return loadProxy(src, force, proxyEntry(src));
}

function sameMediaUrl(left: string, right: string): boolean {
  const base = typeof window !== 'undefined' ? window.location.href : 'http://localhost/';
  try {
    return new URL(left, base).href === new URL(right, base).href;
  } catch {
    return left === right;
  }
}

export function reportPreviewPlaybackFailure(
  src: string,
  error = 'preview media failed to play',
  failedSrc?: string,
): void {
  if (!isPreviewable(src)) return;
  const entry = proxyEntry(src);
  const readyProxy = entry.response?.proxy.status === 'ready' ? entry.response.proxy : null;
  if (readyProxy && failedSrc && sameMediaUrl(failedSrc, readyProxy.previewSrc)) {
    entry.fallbackToProxy = false;
    entry.response = {
      ...entry.response!,
      proxy: { status: 'failed', reason: 'proxy-playback-failed', error },
    };
    notify(entry);
    return;
  }
  // The master failed. Keep the intent even while FFmpeg is preparing the
  // replacement so a ready proxy actually becomes the selected source.
  entry.fallbackToProxy = true;
  notify(entry);
  if (!readyProxy) void requestPreviewProxy(src, true);
}

export function mediaPosterUrl(src: string | undefined): string | undefined {
  return isPreviewable(src) ? `/api/media-poster?src=${encodeURIComponent(src)}` : undefined;
}

function stateFor(src: string | undefined, autoRequest: boolean): PreviewProxyState {
  if (!isPreviewable(src)) return { status: 'unavailable', reason: 'non-local-source' };
  const entry = proxyEntry(src);
  if (!entry.response) {
    if (entry.promise) return { status: 'loading', reason: 'preparing-playback-window' };
    return autoRequest
      ? { status: 'loading', reason: 'checking-source' }
      : { status: 'not-needed', reason: 'preview-source-original' };
  }
  return entry.response.proxy;
}

function subscribe(sources: readonly string[], listener: () => void): () => void {
  for (const src of sources) proxyEntry(src).listeners.add(listener);
  return () => {
    for (const src of sources) {
      const entry = proxyEntries.get(src);
      if (!entry) continue;
      entry.listeners.delete(listener);
      if (!entry.listeners.size && entry.promise) {
        entry.controller?.abort();
        if (proxyEntries.get(src) === entry) proxyEntries.delete(src);
      }
    }
  };
}

function useQualitySnapshot() {
  // Separate stable snapshots: getSnapshot must return a cached value, or
  // useSyncExternalStore re-renders forever on every new object literal.
  const mode = useSyncExternalStore(subscribeQualityMode, getQualityMode, getQualityMode);
  const preview = useSyncExternalStore(subscribeQualityMode, getPreviewSourceMode, getPreviewSourceMode);
  return { mode, preview };
}

function useProxySources(sources: readonly string[], eager = true): number {
  const [revision, setRevision] = useState(0);
  const quality = useQualitySnapshot();
  useEffect(() => {
    const bump = () => setRevision((value) => value + 1);
    const unsubscribe = subscribe(sources, bump);
    // Only fetch proxies when policy/source mode expects them.
    if (eager && shouldAutoRequestPreviewProxy(quality.mode, quality.preview)) {
      for (const src of sources) void requestPreviewProxy(src, quality.preview === 'proxy');
    }
    return unsubscribe;
  }, [sources, eager, quality.mode, quality.preview]);
  // Re-resolve preview src when quality/preview-source mode flips even if proxy cache is quiet.
  useEffect(() => {
    setRevision((value) => value + 1);
  }, [quality.mode, quality.preview]);
  return revision;
}

function resolvePreviewSrc(src: string | undefined, proxy: PreviewProxyState): string | undefined {
  if (!src || proxy.status !== 'ready') return src;
  const fallbackToProxy = isPreviewable(src) && proxyEntry(src).fallbackToProxy;
  return fallbackToProxy || !shouldPreferMasterPreview() ? proxy.previewSrc : src;
}

const PREVIEW_WINDOW_MAX_SOURCES = 2;

/** Sources that need to be ready now: the active clip and at most one successor. */
export function previewWindowSources(
  state: TimelineState,
  frame: number,
  lookAheadFrames = Math.max(1, Math.round(state.fps * 6)),
  maxSources = PREVIEW_WINDOW_MAX_SOURCES,
): string[] {
  const from = Math.max(0, Math.floor(frame));
  const to = from + Math.max(1, Math.floor(lookAheadFrames));
  const candidates = state.items
    .filter((item) => item.kind === 'video' && isPreviewable(item.src))
    .filter((item) => !state.tracks?.[item.track]?.hidden)
    .filter((item) => item.startFrame + item.durationInFrames > from && item.startFrame < to)
    .sort((left, right) => {
      const leftActive = left.startFrame <= from && left.startFrame + left.durationInFrames > from;
      const rightActive = right.startFrame <= from && right.startFrame + right.durationInFrames > from;
      return Number(rightActive) - Number(leftActive) || left.startFrame - right.startFrame;
    });
  const sources: string[] = [];
  for (const item of candidates) {
    const src = item.src!;
    if (sources.includes(src)) continue;
    sources.push(src);
    if (sources.length >= Math.max(1, maxSources)) break;
  }
  return sources;
}

/** Probe/build only the tiny playback window, with a hard client-side in-flight cap. */
export function requestPreviewWindow(state: TimelineState, frame: number): string[] {
  const sources = previewWindowSources(state, frame);
  // Auto/original preview takes the native Chromium path first. Starting a
  // proxy probe here changes the Player input tree when the probe completes,
  // which can remount long-running audio/video tags mid-playback. Explicit
  // proxy mode still warms only this bounded window; automatic mode falls
  // back through reportPreviewPlaybackFailure() if native playback fails.
  if (!shouldAutoRequestPreviewProxy()) return sources;
  let available = Math.max(0, PREVIEW_WINDOW_MAX_SOURCES
    - [...proxyEntries.values()].filter((entry) => entry.promise).length);
  for (const src of sources) {
    if (available <= 0) break;
    const entry = proxyEntry(src);
    if (entry.promise || entry.response) continue;
    available -= 1;
    void requestPreviewProxy(src);
  }
  return sources;
}

export function usePreviewMediaSource(src: string | undefined, enabled = true) {
  const source = enabled && isPreviewable(src) ? src : '';
  const sources = useMemo(() => source ? [source] : [], [source]);
  const revision = useProxySources(sources);
  const proxy = stateFor(source || undefined, shouldAutoRequestPreviewProxy());
  const previewSrc = resolvePreviewSrc(src, proxy);
  return {
    sourceSrc: src,
    previewSrc,
    posterSrc: mediaPosterUrl(source || undefined),
    proxy,
    requestFallback: useCallback(() => {
      if (source) reportPreviewPlaybackFailure(source, undefined, previewSrc);
    }, [source, previewSrc]),
    revision,
  };
}

export function usePreviewTimelineState(state: TimelineState) {
  const sources = useMemo(() => [...new Set(state.items
    .filter((item) => item.kind === 'video' && isPreviewable(item.src))
    .map((item) => item.src!))].sort(), [state.items]);
  // Timeline/project hooks only consume already-cached proxies. Building every
  // proxy while an SRT episode is being assembled can launch hundreds of
  // FFmpeg jobs before the user presses Play.
  const revision = useProxySources(sources, false);
  const previewState = useMemo<TimelineState>(() => {
    void revision; // recompute when the proxy cache bumps (proxies live in module state)
    return {
      ...state,
      items: state.items.map((item) => {
        if (item.kind !== 'video' || !item.src) return item;
        const proxy = stateFor(item.src, false);
        const previewSrc = resolvePreviewSrc(item.src, proxy);
        return previewSrc && previewSrc !== item.src ? { ...item, src: previewSrc } : item;
      }),
    };
  }, [state, revision]);
  const proxies = sources.map((src) => ({ src, proxy: stateFor(src, false) }));
  return {
    state: previewState,
    proxies,
    requestFallback: (src: string, failedSrc?: string) => {
      reportPreviewPlaybackFailure(src, undefined, failedSrc);
    },
  };
}

/** Resolve preview proxies across the complete reachable nested-sequence graph. */
export function usePreviewProjectDoc(project: ProjectDoc, timelineId: string) {
  const plan = useMemo(() => resolveTimelineRenderPlan(project, timelineId), [project, timelineId]);
  const reachable = useMemo(() => new Set(plan.timelineIds), [plan.timelineIds]);
  const sources = useMemo(() => [...new Set(project.timelines
    .filter((timeline) => reachable.has(timeline.id))
    .flatMap((timeline) => timeline.items)
    .filter((item) => item.kind === 'video' && isPreviewable(item.src))
    .map((item) => item.src!))].sort(), [project.timelines, reachable]);
  const revision = useProxySources(sources, false);
  const previewProject = useMemo<ProjectDoc>(() => {
    void revision; // recompute when the proxy cache bumps (proxies live in module state)
    return {
      ...project,
      timelines: project.timelines.map((timeline) => ({
        ...timeline,
        items: timeline.items.map((item) => {
          if (item.kind !== 'video' || !item.src) return item;
          const proxy = stateFor(item.src, false);
          const previewSrc = resolvePreviewSrc(item.src, proxy);
          return previewSrc && previewSrc !== item.src ? { ...item, src: previewSrc } : item;
        }),
      })),
    };
  }, [project, revision]);
  const state = previewProject.timelines.find((timeline) => timeline.id === timelineId)!;
  return {
    project: previewProject,
    state,
    plan,
    proxies: sources.map((src) => ({ src, proxy: stateFor(src, false) })),
    requestFallback: (src: string, failedSrc?: string) => {
      reportPreviewPlaybackFailure(src, undefined, failedSrc);
    },
  };
}
