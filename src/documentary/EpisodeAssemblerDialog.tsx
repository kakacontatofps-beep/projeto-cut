import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MediaAsset } from '../editor/types';
import { theme, themeAlpha } from '../theme';
import {
  previewEpisode,
  type EpisodeAssemblyRequest,
  type EpisodeAssemblyResult,
  type EpisodeMissingMediaPolicy,
  type EpisodeTransition,
} from './episodeAssembler';

interface SrtSource { name: string; content: string }

interface EpisodeAssemblerDialogProps {
  assets: MediaAsset[];
  fps: number;
  initialSrtFiles: readonly SrtSource[];
  hasTimelineContent: boolean;
  onApply: (request: EpisodeAssemblyRequest) => EpisodeAssemblyResult;
  onClose: () => void;
}

function formatTime(ms: number): string {
  const seconds = Math.max(0, ms) / 1000;
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${(seconds % 60).toFixed(1).padStart(4, '0')}`;
}

const fieldStyle = {
  width: '100%', minHeight: 32, border: `0.5px solid ${theme.border}`, borderRadius: 5,
  background: theme.inset, color: theme.text, padding: '6px 8px', fontSize: 12,
} as const;

export function EpisodeAssemblerDialog(props: EpisodeAssemblerDialogProps) {
  const { onClose } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sources, setSources] = useState<SrtSource[]>(() => [...props.initialSrtFiles]);
  const [selectedSrt, setSelectedSrt] = useState(0);
  const [policy, setPolicy] = useState<EpisodeMissingMediaPolicy>('repeat-last');
  const [assignments, setAssignments] = useState<Record<number, string | null>>({});
  const [narrationChoice, setNarrationChoice] = useState('auto');
  const [musicChoice, setMusicChoice] = useState('auto');
  const [replaceTimeline, setReplaceTimeline] = useState(true);
  const [transition, setTransition] = useState<EpisodeTransition>('cross-dissolve');
  const [slowZoom, setSlowZoom] = useState(true);
  const [musicVolume, setMusicVolume] = useState(15);
  const [operationError, setOperationError] = useState<string | null>(null);
  const source = sources[selectedSrt] ?? null;
  const analysis = useMemo(() => {
    if (!source) return { preview: null, error: null };
    try {
      return { preview: previewEpisode(props.assets, source.content, { missingMediaPolicy: policy, manualAssignments: assignments }), error: null };
    } catch (reason) {
      return { preview: null, error: reason instanceof Error ? reason.message : String(reason) };
    }
  }, [assignments, policy, props.assets, source]);
  const preview = analysis.preview;
  const error = operationError ?? analysis.error;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const addSrt = async (file: File | undefined) => {
    if (!file) return;
    try {
      const next = { name: file.name, content: await file.text() };
      setSources((current) => [...current, next]);
      setSelectedSrt(sources.length);
      setAssignments({});
      setOperationError(null);
    } catch (reason) {
      setOperationError(reason instanceof Error ? reason.message : String(reason));
    }
  };
  const apply = () => {
    if (!source || !preview) return;
    try {
      props.onApply({
        srtName: source.name,
        srtContent: source.content,
        missingMediaPolicy: policy,
        manualAssignments: assignments,
        narrationAssetId: narrationChoice === 'auto' ? undefined : narrationChoice === 'none' ? null : narrationChoice,
        musicAssetId: musicChoice === 'auto' ? undefined : musicChoice === 'none' ? null : musicChoice,
        replaceTimeline,
        transition,
        transitionDurationSeconds: 0.35,
        applySlowZoom: slowZoom,
        musicVolume: musicVolume / 100,
      });
      props.onClose();
    } catch (reason) {
      setOperationError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return createPortal(
    <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) props.onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1600, display: 'grid', placeItems: 'center', padding: 18, background: themeAlpha.shadow(0.72) }}>
      <section role="dialog" aria-modal="true" aria-label="Montar episódio com SRT"
        style={{ width: 'min(980px, calc(100vw - 36px))', height: 'min(760px, calc(100vh - 36px))', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `0.5px solid ${theme.borderLight}`, borderRadius: 8, background: theme.panelAlt, color: theme.text, boxShadow: `0 22px 70px ${themeAlpha.shadow(0.8)}` }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '15px 18px', borderBottom: `0.5px solid ${theme.border}` }}>
          <div>
            <strong style={{ display: 'block', fontSize: 17 }}>Montar episódio com SRT</strong>
            <span style={{ color: theme.textDim, fontSize: 11.5 }}>Regras locais: SRT → cenas → mídias numeradas → timeline editável</span>
          </div>
          <button onClick={props.onClose} aria-label="Fechar" style={{ ...fieldStyle, width: 34, padding: 0, cursor: 'pointer' }}>×</button>
        </header>

        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '270px minmax(0, 1fr)' }}>
          <aside style={{ padding: 14, overflowY: 'auto', borderRight: `0.5px solid ${theme.border}` }}>
            <label style={{ display: 'grid', gap: 5, marginBottom: 12, fontSize: 11, color: theme.textDim }}>Arquivo SRT
              {sources.length > 0 && <select style={fieldStyle} value={selectedSrt} onChange={(event) => { setSelectedSrt(Number(event.target.value)); setAssignments({}); }}>
                {sources.map((item, index) => <option key={`${item.name}-${index}`} value={index}>{item.name}</option>)}
              </select>}
              <input ref={fileInputRef} hidden type="file" accept=".srt,application/x-subrip,text/plain" onChange={(event) => { void addSrt(event.target.files?.[0]); event.currentTarget.value = ''; }} />
              <button style={{ ...fieldStyle, cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>{sources.length ? 'Escolher outro SRT…' : 'Escolher arquivo SRT…'}</button>
            </label>
            <label style={{ display: 'grid', gap: 5, marginBottom: 12, fontSize: 11, color: theme.textDim }}>Quando faltar mídia
              <select style={fieldStyle} value={policy} onChange={(event) => { setPolicy(event.target.value as EpisodeMissingMediaPolicy); setAssignments({}); }}>
                <option value="repeat-last">Repetir a última</option>
                <option value="cycle">Recomeçar a sequência</option>
                <option value="leave-empty">Deixar a cena vazia</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 5, marginBottom: 12, fontSize: 11, color: theme.textDim }}>Narração
              <select style={fieldStyle} value={narrationChoice} onChange={(event) => setNarrationChoice(event.target.value)}>
                <option value="auto">Detectar automaticamente</option><option value="none">Não adicionar</option>
                {preview?.audioAssets.map((asset) => <option key={asset.id} value={asset.id}>{assetFilename(asset)}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 5, marginBottom: 12, fontSize: 11, color: theme.textDim }}>Música
              <select style={fieldStyle} value={musicChoice} onChange={(event) => setMusicChoice(event.target.value)}>
                <option value="auto">Detectar automaticamente</option><option value="none">Não adicionar</option>
                {preview?.audioAssets.map((asset) => <option key={asset.id} value={asset.id}>{assetFilename(asset)}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 5, marginBottom: 12, fontSize: 11, color: theme.textDim }}>Volume da música: {musicVolume}%
              <input type="range" min={0} max={60} value={musicVolume} onChange={(event) => setMusicVolume(Number(event.target.value))} />
            </label>
            <label style={{ display: 'grid', gap: 5, marginBottom: 12, fontSize: 11, color: theme.textDim }}>Transição
              <select style={fieldStyle} value={transition} onChange={(event) => setTransition(event.target.value as EpisodeTransition)}>
                <option value="none">Corte seco</option><option value="cross-dissolve">Cross dissolve</option><option value="dip-to-black">Fade pelo preto</option>
              </select>
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, fontSize: 12 }}>
              <input type="checkbox" checked={slowZoom} onChange={(event) => setSlowZoom(event.target.checked)} /> Zoom lento nas imagens
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 7, fontSize: 12 }}>
              <input type="checkbox" checked={replaceTimeline} onChange={(event) => setReplaceTimeline(event.target.checked)} /> Substituir timeline atual
            </label>
            {props.hasTimelineContent && replaceTimeline && <div style={{ color: '#f4b45e', fontSize: 11, lineHeight: 1.4 }}>A timeline atual será substituída em uma única ação que pode ser desfeita.</div>}
          </aside>

          <main style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 11.5, color: theme.textDim }}>
              <span>{preview ? `${preview.scenes.length} cenas · ${preview.visualAssets.length} mídias · ${formatTime(preview.durationMs)}` : 'Aguardando SRT válido'}</span>
              <span>{preview?.narration ? `Narração: ${assetFilename(preview.narration)}` : 'Narração não detectada'}</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              {preview?.scenes.map((scene) => (
                <div key={scene.index} style={{ display: 'grid', gridTemplateColumns: '54px 94px minmax(160px, 1fr) minmax(170px, .8fr)', gap: 9, alignItems: 'center', padding: '8px 12px', borderBottom: `0.5px solid ${theme.border}` }}>
                  <strong style={{ fontSize: 12, color: theme.gold }}>{String(scene.index + 1).padStart(3, '0')}</strong>
                  <span style={{ fontSize: 10.5, color: theme.textDim }}>{formatTime(scene.startMs)}<br />{formatTime(scene.endMs)}</span>
                  <span title={scene.text} style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scene.text}</span>
                  <select aria-label={`Mídia da cena ${scene.index + 1}`} style={fieldStyle} value={scene.asset?.id ?? ''}
                    onChange={(event) => setAssignments((current) => ({ ...current, [scene.index]: event.target.value || null }))}>
                    <option value="">Sem mídia</option>
                    {preview.visualAssets.map((asset) => <option key={asset.id} value={asset.id}>{assetFilename(asset)}</option>)}
                  </select>
                </div>
              ))}
              {!preview && <div style={{ padding: 28, textAlign: 'center', color: theme.textDim }}>Selecione um SRT para visualizar a correspondência antes da montagem.</div>}
            </div>
            {(error || preview?.warnings.length) ? <div style={{ padding: '9px 14px', borderTop: `0.5px solid ${theme.border}`, color: error ? theme.danger : '#f4b45e', fontSize: 11 }}>
              {error ?? preview?.warnings.join(' • ')}
            </div> : null}
          </main>
        </div>

        <footer style={{ padding: '11px 16px', borderTop: `0.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: theme.textDim, fontSize: 11 }}>Nada é renderizado agora; todos os clipes continuam editáveis.</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={props.onClose} style={{ ...fieldStyle, width: 'auto', cursor: 'pointer' }}>Cancelar</button>
            <button disabled={!preview} onClick={apply} style={{ ...fieldStyle, width: 'auto', borderColor: theme.accent, background: theme.accent, color: theme.onAccent, fontWeight: 700, cursor: preview ? 'pointer' : 'default', opacity: preview ? 1 : 0.45 }}>Montar timeline</button>
          </div>
        </footer>
      </section>
    </div>, document.body,
  );
}

function assetFilename(asset: MediaAsset): string {
  return asset.sourceFilename ?? asset.name;
}
