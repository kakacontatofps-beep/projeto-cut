import { startTransition, useEffect, useRef, useState, type RefObject } from 'react';
import type { PlayerRef } from '@remotion/player';
import type { TimelineItem, TrackId } from '../editor/types';
import { useT } from '../i18n/locale';
import { trackTitle, type TranscriptTrackOption } from '../transcript/trackOptions';
import { msToFrame } from '../transcript/types';
import { CaptionsControls } from './CaptionsControls';
import { newManualCaptions } from './manualCaptions';
import { buildTranslation } from './translate';
import type { CaptionsData } from './types';
import { parseSrt } from './srt';
import { createSecondarySrtTrack } from './secondarySrt';

interface Props {
  playerRef: RefObject<PlayerRef | null>;
  fps: number;
  items: TimelineItem[];
  captionTracks: Array<TranscriptTrackOption & { captions: CaptionsData | null }>;
  onSetCaptions: (captions: CaptionsData | null, track?: TrackId) => void;
  onUpdateCaptions: (patch: Partial<CaptionsData>, track?: TrackId) => void;
  onCreateCaptionTrack: (captions: CaptionsData, opts?: { name?: string; order?: number }) => TrackId;
}

export function CaptionsPanel(props: Props) {
  const t = useT();
  const { playerRef, fps, items, captionTracks, onSetCaptions, onUpdateCaptions, onCreateCaptionTrack } = props;
  const [captionTrack, setCaptionTrack] = useState<TrackId | null>(captionTracks[0]?.id ?? null);
  const [importingSecondary, setImportingSecondary] = useState(false);
  const secondaryInputRef = useRef<HTMLInputElement>(null);
  const captions = captionTracks.find((option) => option.id === captionTrack)?.captions ?? null;
  useEffect(() => {
    if (!captionTrack || !captionTracks.some((option) => option.id === captionTrack)) setCaptionTrack(captionTracks[0]?.id ?? null);
  }, [captionTrack, captionTracks]);
  const update = (patch: Partial<CaptionsData>) => onUpdateCaptions(patch, captionTrack ?? undefined);
  const set = (next: CaptionsData | null) => onSetCaptions(next, captionTrack ?? undefined);
  const translation = useCaptionTranslation(captions, items, fps, update);
  const importSecondarySrt = async (file: File) => {
    setImportingSecondary(true);
    try {
      const preset = createSecondarySrtTrack(file.name, parseSrt(await file.text()));
      startTransition(() => {
        const trackId = onCreateCaptionTrack(preset.captions, { name: preset.trackName });
        setCaptionTrack(trackId);
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      window.alert(`${t('SRT 导入失败')}：${detail}`);
    } finally {
      setImportingSecondary(false);
    }
  };
  return (
    <div className="cc-captions-workspace">
      <div className="cc-captions-context">
        <CaptionTrackBar
          options={captionTracks}
          track={captionTrack}
          importingSecondary={importingSecondary}
          onChange={setCaptionTrack}
          onImportSecondary={() => secondaryInputRef.current?.click()}
        />
        <input
          ref={secondaryInputRef}
          type="file"
          accept=".srt,application/x-subrip,text/plain"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void importSecondarySrt(file);
          }}
        />
      </div>
      <CaptionsControls captionTrackId={captionTrack ?? undefined} captions={captions} sourceVariants={(captions?.sourceItemId ? items.find((item) => item.id === captions.sourceItemId)?.variants : undefined) ?? []} items={items} fps={fps} onSeekMs={(ms) => playerRef.current?.seekTo(msToFrame(ms, fps))} onCreateManual={() => set(newManualCaptions())} getPlayheadMs={() => ((playerRef.current?.getCurrentFrame() ?? 0) / fps) * 1000} onUpdate={update} onRemove={() => set(null)} onTranslate={translation.run} translating={translation.running} translateError={translation.error} />
    </div>
  );
}

function CaptionTrackBar({ options, track, importingSecondary, onChange, onImportSecondary }: {
  options: Props['captionTracks'];
  track: TrackId | null;
  importingSecondary: boolean;
  onChange: (track: TrackId) => void;
  onImportSecondary: () => void;
}) {
  const t = useT();
  return (
    <div className="cc-captions-sourcebar">
      <label htmlFor="cc-caption-track">{t('字幕轨道')}</label>
      <select id="cc-caption-track" className="cc-cap-select" value={track ?? ''} disabled={!options.length} onChange={(event) => onChange(event.target.value)}>
        {!options.length && <option value="">{t('请先新建字幕轨道')}</option>}
        {options.map((option) => <option key={option.id} value={option.id}>{trackTitle(option)}</option>)}
      </select>
      <button
        type="button"
        className="cc-cap-btn sm primary"
        disabled={importingSecondary}
        title={t('导入独立的第二个 SRT，用于大字、关键词和重点提示')}
        onClick={onImportSecondary}
      >
        {importingSecondary ? t('导入中…') : t('重点 SRT')}
      </button>
    </div>
  );
}

function useCaptionTranslation(captions: CaptionsData | null, items: TimelineItem[], fps: number, onUpdate: (patch: Partial<CaptionsData>) => void) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (lang: string) => {
    if (!captions || running) return;
    setRunning(true);
    setError(null);
    try {
      const cues = await buildTranslation(captions, items, fps, lang);
      onUpdate({ bilingual: true, translationLang: lang, translation: cues });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setRunning(false);
    }
  };
  return { running, error, run };
}
