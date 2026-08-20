import { parseSrt } from '../captions/srt';
import type { CaptionsData } from '../captions/types';
import type { TranscriptWord } from '../transcript/types';
import type {
  MediaAsset,
  ProjectDoc,
  Timeline,
  TimelineItem,
  TrackFlags,
  TrackId,
  TrackKind,
  TransitionItem,
  TransitionType,
} from '../editor/types';
import { timelineTrackIds, trackAlias, trackKind } from '../editor/types';

export type EpisodeMissingMediaPolicy = 'repeat-last' | 'cycle' | 'leave-empty';
export type EpisodeTransition = 'none' | Extract<TransitionType, 'cross-dissolve' | 'dip-to-black'>;

export interface EpisodeAssemblyRequest {
  srtName: string;
  srtContent: string;
  missingMediaPolicy: EpisodeMissingMediaPolicy;
  manualAssignments?: Readonly<Record<number, string | null>>;
  narrationAssetId?: string | null;
  musicAssetId?: string | null;
  replaceTimeline: boolean;
  transition: EpisodeTransition;
  transitionDurationSeconds: number;
  applySlowZoom: boolean;
  musicVolume: number;
}

export interface EpisodePreviewScene {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
  asset: MediaAsset | null;
}

export interface EpisodePreview {
  scenes: EpisodePreviewScene[];
  visualAssets: MediaAsset[];
  audioAssets: MediaAsset[];
  narration: MediaAsset | null;
  music: MediaAsset | null;
  words: TranscriptWord[];
  warnings: string[];
  durationMs: number;
}

export interface EpisodeAssemblyResult {
  doc: ProjectDoc;
  sceneCount: number;
  placedVisualCount: number;
  narrationPlaced: boolean;
  musicPlaced: boolean;
  warnings: string[];
}

type IdFactory = (prefix: string) => string;

const visualKinds = new Set<MediaAsset['kind']>(['image', 'video', 'gif', 'svg']);
const narrationPattern = /(?:^|[\s._-])(narra(?:c|ç)[aã]o|narration|voiceover|voice|voz|locu(?:c|ç)[aã]o)(?:[\s._-]|$)/i;
const musicPattern = /(?:^|[\s._-])(m[uú]sica|music|trilha|bgm|soundtrack)(?:[\s._-]|$)/i;

function assetFilename(asset: MediaAsset): string {
  return asset.sourceFilename ?? asset.name;
}

/** First numeric token, with a prefix token winning over incidental later numbers. */
export function numericMediaOrder(name: string): number | null {
  const stem = name.replace(/\.[^.]+$/, '');
  const prefix = stem.match(/^\s*(\d{1,8})(?=\D|$)/);
  const anywhere = stem.match(/(?:^|\D)(\d{1,8})(?=\D|$)/);
  const value = Number(prefix?.[1] ?? anywhere?.[1]);
  return Number.isSafeInteger(value) ? value : null;
}

export function sortNumberedMedia(assets: readonly MediaAsset[]): MediaAsset[] {
  return assets
    .filter((asset) => visualKinds.has(asset.kind))
    .map((asset, inputIndex) => ({ asset, inputIndex, order: numericMediaOrder(assetFilename(asset)) }))
    .sort((left, right) => {
      if (left.order !== null && right.order !== null && left.order !== right.order) return left.order - right.order;
      if (left.order !== null && right.order === null) return -1;
      if (left.order === null && right.order !== null) return 1;
      const names = assetFilename(left.asset).localeCompare(assetFilename(right.asset), undefined, { numeric: true, sensitivity: 'base' });
      return names || left.inputIndex - right.inputIndex;
    })
    .map(({ asset }) => asset);
}

function detectAudioRoles(assets: readonly MediaAsset[]): { audio: MediaAsset[]; narration: MediaAsset | null; music: MediaAsset | null } {
  const audio = assets.filter((asset) => asset.kind === 'audio');
  const narration = audio.find((asset) => narrationPattern.test(assetFilename(asset)))
    ?? [...audio].sort((left, right) => right.durationInFrames - left.durationInFrames)[0]
    ?? null;
  const music = audio.find((asset) => asset.id !== narration?.id && musicPattern.test(assetFilename(asset)))
    ?? audio.find((asset) => asset.id !== narration?.id)
    ?? null;
  return { audio, narration, music };
}

function assignedAsset(
  index: number,
  visuals: readonly MediaAsset[],
  policy: EpisodeMissingMediaPolicy,
  manual: Readonly<Record<number, string | null>> | undefined,
): MediaAsset | null {
  if (manual && Object.prototype.hasOwnProperty.call(manual, index)) {
    const id = manual[index];
    return id ? visuals.find((asset) => asset.id === id) ?? null : null;
  }
  if (index < visuals.length) return visuals[index] ?? null;
  if (!visuals.length || policy === 'leave-empty') return null;
  if (policy === 'cycle') return visuals[index % visuals.length] ?? null;
  return visuals[visuals.length - 1] ?? null;
}

export function previewEpisode(
  assets: readonly MediaAsset[],
  srtContent: string,
  options: Pick<EpisodeAssemblyRequest, 'missingMediaPolicy' | 'manualAssignments'>,
): EpisodePreview {
  const words = parseSrt(srtContent);
  const visualAssets = sortNumberedMedia(assets);
  const roles = detectAudioRoles(assets);
  const durationMs = words.reduce((value, word) => Math.max(value, word.end), 0);
  const scenes = words.map((word, index): EpisodePreviewScene => ({
    index,
    startMs: index === 0 ? 0 : word.start,
    endMs: words[index + 1]?.start ?? word.end,
    text: word.text,
    asset: assignedAsset(index, visualAssets, options.missingMediaPolicy, options.manualAssignments),
  }));
  const warnings: string[] = [];
  if (!visualAssets.length) warnings.push('Nenhuma imagem ou vídeo foi encontrado na biblioteca.');
  else if (visualAssets.length < scenes.length) warnings.push(`${scenes.length - visualAssets.length} cena(s) não têm mídia numerada exclusiva.`);
  else if (visualAssets.length > scenes.length) warnings.push(`${visualAssets.length - scenes.length} mídia(s) numerada(s) ficarão fora desta montagem.`);
  if (!roles.narration) warnings.push('Narração não identificada; a montagem usará somente o tempo do SRT.');
  if (!roles.music) warnings.push('Música de fundo não identificada; ela poderá ser adicionada depois.');
  return {
    scenes,
    visualAssets,
    audioAssets: roles.audio,
    narration: roles.narration,
    music: roles.music,
    words,
    warnings,
    durationMs,
  };
}

function defaultIdFactory(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function ensureTrack(
  timeline: Timeline,
  kind: TrackKind,
  preferredAlias: string,
  name: string,
  idFactory: IdFactory,
): TrackId {
  const existing = timelineTrackIds(timeline).find((id) => trackKind(timeline, id) === kind && trackAlias(timeline, id) === preferredAlias)
    ?? timelineTrackIds(timeline).find((id) => trackKind(timeline, id) === kind && timeline.tracks?.[id]?.name === name);
  if (existing) return existing;
  const id = idFactory(`track_${kind}`);
  timeline.trackOrder = [...(timeline.trackOrder ?? timelineTrackIds(timeline)), id];
  timeline.tracks = { ...(timeline.tracks ?? {}), [id]: { kind, name } };
  return id;
}

function copyAssetClip(asset: MediaAsset, id: string, track: TrackId, startFrame: number, durationInFrames: number): TimelineItem {
  return {
    id,
    track,
    startFrame,
    durationInFrames: Math.max(1, durationInFrames),
    kind: asset.kind as Exclude<MediaAsset['kind'], 'motion-graphic'>,
    sourceAssetId: asset.id,
    name: asset.name,
    src: asset.src,
    sourceFilename: asset.sourceFilename,
    originalFilePath: asset.originalFilePath,
    sourceRevision: asset.sourceRevision,
    sourceContentHash: asset.sourceContentHash,
    width: asset.width,
    height: asset.height,
    volume: asset.kind === 'video' || asset.kind === 'audio' ? 1 : undefined,
  };
}

function shiftedWords(words: readonly TranscriptWord[], offsetFrames: number, fps: number): TranscriptWord[] {
  const offsetMs = offsetFrames * 1000 / fps;
  return words.map((word) => ({ ...word, start: word.start + offsetMs, end: word.end + offsetMs }));
}

export function assembleEpisodeDocument(
  doc: ProjectDoc,
  request: EpisodeAssemblyRequest,
  idFactory: IdFactory = defaultIdFactory,
): EpisodeAssemblyResult {
  const preview = previewEpisode(doc.assets, request.srtContent, request);
  const timelineIndex = Math.max(0, doc.timelines.findIndex((timeline) => timeline.id === doc.activeTimelineId));
  const source = doc.timelines[timelineIndex]!;
  const timeline: Timeline = {
    ...source,
    items: request.replaceTimeline ? [] : [...source.items],
    transitions: request.replaceTimeline ? [] : [...(source.transitions ?? [])],
    markers: request.replaceTimeline ? [] : [...(source.markers ?? [])],
    selectedId: null,
    selectedIds: [],
    tracks: Object.fromEntries(Object.entries(source.tracks ?? {}).map(([id, flags]) => [
      id,
      request.replaceTimeline ? { ...flags, captions: undefined } : { ...flags },
    ])) as Partial<Record<TrackId, TrackFlags>>,
    captions: request.replaceTimeline ? null : source.captions,
  };
  const existingEnd = request.replaceTimeline
    ? 0
    : timeline.items.reduce((end, item) => Math.max(end, item.startFrame + item.durationInFrames), 0);
  const videoTrack = ensureTrack(timeline, 'video', 'V1', 'Cenas documentais', idFactory);
  const narrationTrack = ensureTrack(timeline, 'audio', 'A1', 'Narração', idFactory);
  let musicTrack = timelineTrackIds(timeline).find((id) => trackKind(timeline, id) === 'audio' && id !== narrationTrack);
  if (!musicTrack) musicTrack = ensureTrack(timeline, 'audio', 'A2', 'Música', idFactory);
  const captionTrack = ensureTrack(timeline, 'caption', 'C1', `Legendas — ${request.srtName}`, idFactory);
  timeline.tracks = {
    ...(timeline.tracks ?? {}),
    [videoTrack]: { ...(timeline.tracks?.[videoTrack] ?? {}), kind: 'video', name: 'Cenas documentais' },
    [narrationTrack]: { ...(timeline.tracks?.[narrationTrack] ?? {}), kind: 'audio', name: 'Narração', role: 'anchor' },
    [musicTrack]: { ...(timeline.tracks?.[musicTrack] ?? {}), kind: 'audio', name: 'Música', role: 'follower', audioRouting: { duckDepthDb: -12 } },
  };

  const fps = timeline.fps;
  const requestedNarration = request.narrationAssetId === null
    ? null
    : request.narrationAssetId
    ? preview.audioAssets.find((asset) => asset.id === request.narrationAssetId) ?? null
    : preview.narration;
  const requestedMusic = request.musicAssetId === null
    ? null
    : request.musicAssetId
    ? preview.audioAssets.find((asset) => asset.id === request.musicAssetId) ?? null
    : preview.music;
  const srtEndFrame = Math.max(1, Math.ceil(preview.durationMs * fps / 1000));
  const totalFrames = Math.max(srtEndFrame, requestedNarration?.durationInFrames ?? 0);
  const visualIds: string[] = [];
  let previousVisual: TimelineItem | null = null;

  for (const scene of preview.scenes) {
    if (!scene.asset) continue;
    const startFrame = existingEnd + Math.max(0, Math.round(scene.startMs * fps / 1000));
    const nextStartFrame = preview.scenes[scene.index + 1]
      ? existingEnd + Math.max(startFrame - existingEnd + 1, Math.round(preview.scenes[scene.index + 1]!.startMs * fps / 1000))
      : existingEnd + totalFrames;
    const duration = Math.max(1, nextStartFrame - startFrame);
    const clip = copyAssetClip(scene.asset, idFactory('item_scene'), videoTrack, startFrame, duration);
    if (request.applySlowZoom && (clip.kind === 'image' || clip.kind === 'gif' || clip.kind === 'svg')) {
      clip.zoom = { shape: 'slow-push', magnification: 1.08, easeInFrames: Math.min(duration, Math.round(fps)) };
    }
    if (clip.kind === 'video') clip.volume = 0;
    timeline.items.push(clip);
    visualIds.push(clip.id);
    timeline.markers = [...(timeline.markers ?? []), {
      id: idFactory('mk_scene'),
      scope: 'project',
      fromFrame: startFrame,
      durationFrames: duration,
      note: `Cena ${String(scene.index + 1).padStart(3, '0')} — ${scene.text}`,
      color: 'blue',
    }];
    if (request.transition !== 'none' && previousVisual
      && previousVisual.startFrame + previousVisual.durationInFrames === clip.startFrame) {
      const durationInFrames = Math.max(1, Math.min(
        Math.round(request.transitionDurationSeconds * fps),
        Math.floor(previousVisual.durationInFrames / 2),
        Math.floor(clip.durationInFrames / 2),
      ));
      const transition: TransitionItem = {
        id: idFactory('tr_scene'),
        type: request.transition,
        durationInFrames,
        outgoingItemId: previousVisual.id,
        incomingItemId: clip.id,
        trackId: videoTrack,
        enabled: true,
      };
      timeline.transitions = [...(timeline.transitions ?? []), transition];
    }
    previousVisual = clip;
  }

  if (requestedNarration) {
    const clip = copyAssetClip(
      requestedNarration,
      idFactory('item_narration'),
      narrationTrack,
      existingEnd,
      requestedNarration.durationInFrames,
    );
    clip.fadeInFrames = Math.min(Math.round(fps * 0.15), clip.durationInFrames);
    clip.fadeOutFrames = Math.min(Math.round(fps * 0.25), clip.durationInFrames);
    timeline.items.push(clip);
  }
  if (requestedMusic) {
    const duration = Math.min(requestedMusic.durationInFrames, totalFrames);
    const clip = copyAssetClip(requestedMusic, idFactory('item_music'), musicTrack, existingEnd, duration);
    clip.volume = Math.max(0, Math.min(1, request.musicVolume));
    clip.fadeInFrames = Math.min(Math.round(fps * 1.5), duration);
    clip.fadeOutFrames = Math.min(Math.round(fps * 2), duration);
    timeline.items.push(clip);
  }

  const captions: CaptionsData = {
    enabled: true,
    template: 'netflix',
    pacing: 'phrase',
    motionPreset: 'fade-up',
    words: shiftedWords(preview.words, existingEnd, fps),
    bilingual: false,
  };
  timeline.tracks = {
    ...(timeline.tracks ?? {}),
    [captionTrack]: { ...(timeline.tracks?.[captionTrack] ?? {}), kind: 'caption', name: `Legendas — ${request.srtName}`, captions },
  };
  timeline.captionsHidden = false;
  timeline.selectedIds = visualIds;
  timeline.selectedId = visualIds[visualIds.length - 1] ?? null;
  timeline.items.sort((left, right) => left.startFrame - right.startFrame || left.track.localeCompare(right.track));

  const warnings = [...preview.warnings];
  if (requestedMusic && requestedMusic.durationInFrames < totalFrames) {
    warnings.push('A música é mais curta que o episódio e termina antes da última cena.');
  }
  return {
    doc: { ...doc, timelines: doc.timelines.map((item, index) => index === timelineIndex ? timeline : item) },
    sceneCount: preview.scenes.length,
    placedVisualCount: visualIds.length,
    narrationPlaced: !!requestedNarration,
    musicPlaced: !!requestedMusic,
    warnings,
  };
}
