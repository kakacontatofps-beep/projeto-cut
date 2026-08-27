import type { PropSpec, Tpl } from '../types';

/**
 * Community preset pack adapted to Kaka Cut's no-import Remotion sandbox.
 * Sources and license notices: ../../../THIRD_PARTY_PRESETS.md
 */
const makePreset = (
  id: string,
  name: string,
  category: 'rve-presets' | 'onda-presets',
  description: string,
  durationInFrames: number,
  props: Record<string, unknown>,
  propSchema: PropSpec[],
  code: string,
): Tpl => ({
  id: `community:${id}`,
  name,
  category,
  description,
  tags: ['comunidade', 'remotion', category === 'rve-presets' ? 'react-video-editor' : 'onda'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames,
  props,
  propSchema,
  thumb: null,
  code,
});

const text = (key: string, label: string, defaultValue: string): PropSpec => ({
  key, type: 'text', label, defaultValue,
});
const color = (key: string, label: string, defaultValue: string): PropSpec => ({
  key, type: 'color', label, defaultValue,
});
const number = (key: string, label: string, defaultValue: number, min: number, max: number, step = 1): PropSpec => ({
  key, type: 'number', label, defaultValue, min, max, step,
});

const cinematicTitle = String.raw`const RveCinematicTitle = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = item.props || {};
  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 80 } });
  const exit = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale = Math.min((item.width || 1920) / 1920, (item.height || 1080) / 1080);
  return <div style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, transform: 'scale(' + scale + ')', transformOrigin: 'top left', overflow: 'hidden', background: p.background || '#090512', color: p.textColor || '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }}>
    <div style={{ position: 'absolute', inset: -180, background: 'radial-gradient(circle at 65% 30%, ' + (p.accent || '#a855f7') + '66, transparent 38%)', transform: 'scale(' + (1 + frame * 0.0008) + ')' }} />
    <div style={{ position: 'absolute', left: 150, right: 150, top: 310, opacity: enter * exit, transform: 'translateY(' + ((1 - enter) * 55) + 'px)' }}>
      <div style={{ fontSize: 24, letterSpacing: 12, textTransform: 'uppercase', color: p.accent || '#a855f7', marginBottom: 24 }}>{p.eyebrow || 'DOCUMENTÁRIO ORIGINAL'}</div>
      <div style={{ fontSize: Number(p.fontSize) || 112, lineHeight: 0.94, maxWidth: 1450, fontWeight: 850, letterSpacing: -5 }}>{p.title || 'Além do horizonte'}</div>
      <div style={{ marginTop: 34, width: 260 * enter, height: 7, borderRadius: 9, background: p.accent || '#a855f7' }} />
    </div>
  </div>;
};`;

const chapterTitle = String.raw`const RveChapterTitle = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = item.props || {};
  const reveal = spring({ frame: frame - 5, fps, config: { damping: 18, stiffness: 105 } });
  const line = interpolate(frame, [0, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale = Math.min((item.width || 1920) / 1920, (item.height || 1080) / 1080);
  return <div style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, transform: 'scale(' + scale + ')', transformOrigin: 'top left', background: p.background || '#10071d', color: '#fff', overflow: 'hidden', fontFamily: 'Inter, Arial, sans-serif' }}>
    <div style={{ position: 'absolute', left: 170, top: 230, height: 620, width: 2, background: p.accent || '#d946ef', transform: 'scaleY(' + line + ')', transformOrigin: 'top' }} />
    <div style={{ position: 'absolute', left: 235, top: 315, opacity: reveal, transform: 'translateX(' + ((1 - reveal) * 70) + 'px)' }}>
      <div style={{ fontSize: 28, color: p.accent || '#d946ef', letterSpacing: 8, fontWeight: 700 }}>CAPÍTULO {p.chapter || '01'}</div>
      <div style={{ fontSize: Number(p.fontSize) || 98, maxWidth: 1320, marginTop: 32, lineHeight: 1.03, fontWeight: 820 }}>{p.title || 'O ponto de virada'}</div>
      <div style={{ fontSize: 30, maxWidth: 1100, marginTop: 28, color: '#d8cee5' }}>{p.subtitle || 'Uma nova perspectiva sobre a nossa história.'}</div>
    </div>
  </div>;
};`;

const textHighlight = String.raw`const RveTextHighlight = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = item.props || {};
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 130 } });
  const exit = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale = Math.min((item.width || 1920) / 1920, (item.height || 1080) / 1080);
  return <div style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, transform: 'scale(' + scale + ')', transformOrigin: 'top left', display: 'flex', justifyContent: 'center', alignItems: 'center', background: p.background || 'transparent', fontFamily: 'Inter, Arial, sans-serif' }}>
    <div style={{ position: 'relative', maxWidth: 1500, padding: '28px 48px', opacity: enter * exit, transform: 'scale(' + (0.9 + enter * 0.1) + ')' }}>
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 24, height: '42%', background: p.accent || '#9333ea', transform: 'scaleX(' + enter + ')', transformOrigin: 'left', borderRadius: 12, opacity: 0.9 }} />
      <div style={{ position: 'relative', color: p.textColor || '#ffffff', fontSize: Number(p.fontSize) || 88, fontWeight: 850, lineHeight: 1.08, textAlign: 'center', textShadow: '0 8px 30px rgba(0,0,0,.45)' }}>{p.text || 'Uma frase que merece destaque'}</div>
    </div>
  </div>;
};`;

const animatedList = String.raw`const RveAnimatedList = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = item.props || {};
  const rows = [p.item1 || 'Contexto histórico', p.item2 || 'Evidências principais', p.item3 || 'Consequências', p.item4 || 'O que aprendemos'];
  const scale = Math.min((item.width || 1920) / 1920, (item.height || 1080) / 1080);
  return <div style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, transform: 'scale(' + scale + ')', transformOrigin: 'top left', background: p.background || '#0c0615', color: '#fff', padding: '120px 170px', boxSizing: 'border-box', fontFamily: 'Inter, Arial, sans-serif' }}>
    <div style={{ fontSize: 66, fontWeight: 820, marginBottom: 62 }}>{p.title || 'Neste episódio'}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>{rows.map((row, index) => {
      const show = spring({ frame: frame - 8 - index * 8, fps, config: { damping: 20, stiffness: 110 } });
      return <div key={index} style={{ height: 128, display: 'flex', alignItems: 'center', gap: 34, padding: '0 38px', borderRadius: 22, border: '1px solid rgba(255,255,255,.12)', background: 'linear-gradient(90deg, ' + (p.accent || '#7c3aed') + '35, rgba(255,255,255,.035))', opacity: show, transform: 'translateX(' + ((1 - show) * 80) + 'px)' }}>
        <span style={{ color: p.accent || '#c084fc', fontSize: 30, fontWeight: 800 }}>0{index + 1}</span><span style={{ fontSize: 38, fontWeight: 650 }}>{row}</span>
      </div>;
    })}</div>
  </div>;
};`;

const statCounter = String.raw`const RveStatCounter = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = item.props || {};
  const progress = spring({ frame, fps, config: { damping: 24, stiffness: 70 } });
  const target = Number(p.value) || 87;
  const scale = Math.min((item.width || 1920) / 1920, (item.height || 1080) / 1080);
  return <div style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, transform: 'scale(' + scale + ')', transformOrigin: 'top left', display: 'flex', justifyContent: 'center', alignItems: 'center', background: p.background || '#0b0712', color: '#fff', fontFamily: 'Inter, Arial, sans-serif' }}>
    <div style={{ width: 980, padding: '80px 90px', border: '1px solid rgba(255,255,255,.13)', borderRadius: 44, textAlign: 'center', background: 'linear-gradient(145deg, ' + (p.accent || '#9333ea') + '28, rgba(255,255,255,.035))', boxShadow: '0 40px 100px rgba(0,0,0,.42)', opacity: progress, transform: 'translateY(' + ((1 - progress) * 50) + 'px)' }}>
      <div style={{ fontSize: 190, fontWeight: 900, lineHeight: 1, color: p.accent || '#c084fc', letterSpacing: -10 }}>{Math.round(target * progress)}{p.suffix || '%'}</div>
      <div style={{ fontSize: 39, marginTop: 34, color: '#e8deef' }}>{p.label || 'dos registros confirmam a descoberta'}</div>
    </div>
  </div>;
};`;

const soundWave = String.raw`const RveSoundWave = ({ item }) => {
  const frame = useCurrentFrame();
  const p = item.props || {};
  const bars = Array.from({ length: 48 }, (_, index) => index);
  const scale = Math.min((item.width || 1920) / 1920, (item.height || 1080) / 1080);
  return <div style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, transform: 'scale(' + scale + ')', transformOrigin: 'top left', display: 'flex', justifyContent: 'center', alignItems: 'center', background: p.background || 'transparent' }}>
    <div style={{ display: 'flex', gap: 10, height: 360, alignItems: 'center' }}>{bars.map((index) => {
      const wave = 0.25 + Math.abs(Math.sin(frame * 0.14 + index * 0.46)) * 0.75;
      return <div key={index} style={{ width: 16, height: 300 * wave, borderRadius: 20, background: index % 3 === 0 ? (p.accent || '#d946ef') : (p.secondary || '#8b5cf6'), boxShadow: '0 0 22px ' + (p.accent || '#a855f7') + '55' }} />;
    })}</div>
  </div>;
};`;

const titleCard = String.raw`const OndaTitleCard = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = item.props || {};
  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 92 } });
  const scale = Math.min((item.width || 1920) / 1920, (item.height || 1080) / 1080);
  return <div style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, transform: 'scale(' + scale + ')', transformOrigin: 'top left', background: p.background || '#f7f3fb', color: p.textColor || '#24142f', fontFamily: 'Inter, Arial, sans-serif', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', right: -220, top: -300, width: 900, height: 900, borderRadius: '50%', background: p.accent || '#a855f7', opacity: 0.14 }} />
    <div style={{ position: 'absolute', left: 160, top: 230, width: 1250, opacity: enter, transform: 'translateY(' + ((1 - enter) * 45) + 'px)' }}>
      <div style={{ display: 'inline-flex', padding: '12px 22px', borderRadius: 99, background: p.accent || '#9333ea', color: '#fff', fontSize: 22, fontWeight: 750, letterSpacing: 3 }}>{p.kicker || 'KAKA CUT APRESENTA'}</div>
      <div style={{ fontSize: Number(p.fontSize) || 104, fontWeight: 850, lineHeight: 1.02, marginTop: 34, letterSpacing: -4 }}>{p.title || 'Histórias que atravessam o tempo'}</div>
      <div style={{ fontSize: 32, marginTop: 30, color: '#695873', maxWidth: 920 }}>{p.subtitle || 'Uma abertura editorial limpa para documentários e ensaios.'}</div>
    </div>
  </div>;
};`;

const lowerThird = String.raw`const OndaLowerThird = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = item.props || {};
  const enter = spring({ frame, fps, config: { damping: 19, stiffness: 120 } });
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale = Math.min((item.width || 1920) / 1920, (item.height || 1080) / 1080);
  return <div style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, transform: 'scale(' + scale + ')', transformOrigin: 'top left', fontFamily: 'Inter, Arial, sans-serif' }}>
    <div style={{ position: 'absolute', left: 110, bottom: 105, display: 'flex', alignItems: 'stretch', opacity: enter * exit, transform: 'translateX(' + ((1 - enter) * -90) + 'px)' }}>
      <div style={{ width: 13, borderRadius: '10px 0 0 10px', background: p.accent || '#a855f7' }} />
      <div style={{ minWidth: 610, padding: '27px 38px 25px', borderRadius: '0 18px 18px 0', color: '#fff', background: p.background || 'rgba(15,8,25,.90)', boxShadow: '0 20px 55px rgba(0,0,0,.35)', backdropFilter: 'blur(12px)' }}>
        <div style={{ fontSize: 40, fontWeight: 820 }}>{p.name || 'Nome do entrevistado'}</div>
        <div style={{ fontSize: 23, marginTop: 7, color: p.accent || '#d8b4fe', letterSpacing: 1.2 }}>{p.role || 'Pesquisador e historiador'}</div>
      </div>
    </div>
  </div>;
};`;

const quoteCard = String.raw`const OndaQuoteCard = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = item.props || {};
  const enter = spring({ frame, fps, config: { damping: 23, stiffness: 78 } });
  const scale = Math.min((item.width || 1920) / 1920, (item.height || 1080) / 1080);
  return <div style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, transform: 'scale(' + scale + ')', transformOrigin: 'top left', background: p.background || '#100819', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Georgia, serif' }}>
    <div style={{ position: 'relative', width: 1320, padding: '95px 110px', boxSizing: 'border-box', border: '1px solid rgba(255,255,255,.12)', borderRadius: 38, background: 'linear-gradient(145deg, rgba(255,255,255,.06), ' + (p.accent || '#7e22ce') + '22)', opacity: enter, transform: 'scale(' + (0.94 + enter * 0.06) + ')' }}>
      <div style={{ position: 'absolute', left: 54, top: 15, fontSize: 180, lineHeight: 1, color: p.accent || '#c084fc', opacity: 0.55 }}>“</div>
      <div style={{ position: 'relative', fontSize: Number(p.fontSize) || 58, lineHeight: 1.25, textAlign: 'center' }}>{p.quote || 'O passado não desaparece; ele continua moldando tudo o que vemos.'}</div>
      <div style={{ marginTop: 45, textAlign: 'center', color: p.accent || '#d8b4fe', fontFamily: 'Inter, Arial, sans-serif', fontSize: 24, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' }}>{p.author || 'Fonte documental'}</div>
    </div>
  </div>;
};`;

const progressSteps = String.raw`const OndaProgressSteps = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = item.props || {};
  const labels = [p.step1 || 'Descoberta', p.step2 || 'Investigação', p.step3 || 'Evidências', p.step4 || 'Conclusão'];
  const active = Math.min(4, Math.max(1, Number(p.active) || 3));
  const scale = Math.min((item.width || 1920) / 1920, (item.height || 1080) / 1080);
  return <div style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, transform: 'scale(' + scale + ')', transformOrigin: 'top left', background: p.background || '#0d0716', color: '#fff', padding: '230px 150px', boxSizing: 'border-box', fontFamily: 'Inter, Arial, sans-serif' }}>
    <div style={{ fontSize: 64, fontWeight: 830, marginBottom: 110 }}>{p.title || 'Linha da investigação'}</div>
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>{labels.map((label, index) => {
      const show = spring({ frame: frame - index * 8, fps, config: { damping: 20, stiffness: 105 } });
      const done = index < active;
      return <div key={index} style={{ display: 'flex', flex: index === labels.length - 1 ? '0 0 auto' : 1, alignItems: 'flex-start', opacity: show }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 250 }}><div style={{ width: 78, height: 78, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 27, fontWeight: 850, color: done ? '#fff' : '#7c7185', background: done ? (p.accent || '#9333ea') : '#251b2d', boxShadow: done ? '0 0 38px ' + (p.accent || '#9333ea') + '66' : 'none' }}>{index + 1}</div><div style={{ marginTop: 24, fontSize: 25, textAlign: 'center', color: done ? '#fff' : '#8d8197' }}>{label}</div></div>
        {index < labels.length - 1 ? <div style={{ flex: 1, height: 5, marginTop: 37, background: done && index < active - 1 ? (p.accent || '#9333ea') : '#302439', transform: 'scaleX(' + show + ')', transformOrigin: 'left' }} /> : null}
      </div>;
    })}</div>
  </div>;
};`;

const terminal = String.raw`const OndaTerminal = ({ item }) => {
  const frame = useCurrentFrame();
  const p = item.props || {};
  const lines = [p.line1 || '$ analisando arquivos históricos...', p.line2 || '> 247 documentos encontrados', p.line3 || '> cruzando datas e testemunhos', p.line4 || '✓ hipótese confirmada'];
  const scale = Math.min((item.width || 1920) / 1920, (item.height || 1080) / 1080);
  return <div style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, transform: 'scale(' + scale + ')', transformOrigin: 'top left', background: p.background || '#09060e', color: '#f4eaff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'ui-monospace, Consolas, monospace' }}>
    <div style={{ width: 1260, height: 680, borderRadius: 26, overflow: 'hidden', border: '1px solid rgba(255,255,255,.13)', background: '#110a19', boxShadow: '0 45px 100px rgba(0,0,0,.5)' }}>
      <div style={{ height: 72, background: '#1d1326', display: 'flex', alignItems: 'center', gap: 14, padding: '0 28px' }}><i style={{ width: 18, height: 18, borderRadius: '50%', background: '#fb7185' }} /><i style={{ width: 18, height: 18, borderRadius: '50%', background: '#fbbf24' }} /><i style={{ width: 18, height: 18, borderRadius: '50%', background: '#4ade80' }} /><span style={{ marginLeft: 24, color: '#9c8da8', fontSize: 22 }}>kaka-cut / pesquisa</span></div>
      <div style={{ padding: '54px 62px', fontSize: 33, lineHeight: 1.9 }}>{lines.map((line, index) => {
        const visible = frame >= 8 + index * 18;
        return <div key={index} style={{ opacity: visible ? 1 : 0, color: index === lines.length - 1 ? (p.accent || '#c084fc') : '#e9ddf2' }}>{visible ? line : ''}</div>;
      })}<span style={{ opacity: Math.floor(frame / 12) % 2, color: p.accent || '#c084fc' }}>▋</span></div>
    </div>
  </div>;
};`;

const matrixDecode = String.raw`const OndaMatrixDecode = ({ item }) => {
  const frame = useCurrentFrame();
  const p = item.props || {};
  const finalText = String(p.text || 'ARQUIVO CONFIDENCIAL');
  const glyphs = '01<>[]{}#@$%';
  const progress = Math.min(1, frame / 42);
  const shown = finalText.split('').map((char, index) => {
    if (char === ' ') return ' ';
    if (index / finalText.length < progress) return char;
    return glyphs[(index * 7 + frame) % glyphs.length];
  }).join('');
  const scale = Math.min((item.width || 1920) / 1920, (item.height || 1080) / 1080);
  return <div style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, transform: 'scale(' + scale + ')', transformOrigin: 'top left', background: p.background || '#08040d', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', fontFamily: 'ui-monospace, Consolas, monospace' }}>
    {Array.from({ length: 20 }, (_, index) => <div key={index} style={{ position: 'absolute', left: 30 + index * 98, top: -150 + ((frame * (3 + index % 5) + index * 71) % 1400), color: p.accent || '#a855f7', opacity: 0.12, fontSize: 24, writingMode: 'vertical-rl' }}>0101011010010110</div>)}
    <div style={{ position: 'relative', color: '#fff', fontSize: Number(p.fontSize) || 86, fontWeight: 850, letterSpacing: 8, padding: '35px 52px', border: '1px solid ' + (p.accent || '#a855f7') + '88', background: '#12081dcc', boxShadow: '0 0 70px ' + (p.accent || '#a855f7') + '33' }}>{shown}</div>
  </div>;
};`;

const wordStagger = String.raw`const OndaWordStagger = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = item.props || {};
  const words = String(p.text || 'Cada pista muda a história').split(/\s+/);
  const exit = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale = Math.min((item.width || 1920) / 1920, (item.height || 1080) / 1080);
  return <div style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, transform: 'scale(' + scale + ')', transformOrigin: 'top left', background: p.background || 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 130, boxSizing: 'border-box', fontFamily: 'Inter, Arial, sans-serif' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '18px 28px', maxWidth: 1500 }}>{words.map((word, index) => {
      const show = spring({ frame: frame - index * 4, fps, config: { damping: 15, stiffness: 150 } });
      return <span key={index} style={{ display: 'inline-block', color: index === Number(p.highlightIndex || 2) ? (p.accent || '#d946ef') : (p.textColor || '#fff'), fontSize: Number(p.fontSize) || 92, lineHeight: 1.05, fontWeight: 900, opacity: show * exit, transform: 'translateY(' + ((1 - show) * 50) + 'px) scale(' + (0.82 + show * 0.18) + ')', textShadow: '0 10px 35px rgba(0,0,0,.45)' }}>{word}</span>;
    })}</div>
  </div>;
};`;

export const COMMUNITY_PRESETS: Tpl[] = [
  makePreset('rve-cinematic-title', 'RVE · Título Cinematográfico', 'rve-presets', 'Abertura cinematográfica adaptada do preset Cinematic Title Intro.', 120,
    { eyebrow: 'DOCUMENTÁRIO ORIGINAL', title: 'Além do horizonte', background: '#090512', accent: '#a855f7', textColor: '#ffffff', fontSize: 112 },
    [text('eyebrow', 'Selo', 'DOCUMENTÁRIO ORIGINAL'), text('title', 'Título', 'Além do horizonte'), color('background', 'Fundo', '#090512'), color('accent', 'Destaque', '#a855f7'), color('textColor', 'Texto', '#ffffff'), number('fontSize', 'Tamanho', 112, 48, 180)], cinematicTitle),
  makePreset('rve-chapter-title', 'RVE · Abertura de Capítulo', 'rve-presets', 'Cartela editorial adaptada do preset Chapter Title.', 105,
    { chapter: '01', title: 'O ponto de virada', subtitle: 'Uma nova perspectiva sobre a nossa história.', background: '#10071d', accent: '#d946ef', fontSize: 98 },
    [text('chapter', 'Capítulo', '01'), text('title', 'Título', 'O ponto de virada'), text('subtitle', 'Subtítulo', 'Uma nova perspectiva sobre a nossa história.'), color('background', 'Fundo', '#10071d'), color('accent', 'Destaque', '#d946ef'), number('fontSize', 'Tamanho', 98, 48, 160)], chapterTitle),
  makePreset('rve-text-highlight', 'RVE · Texto Destacado', 'rve-presets', 'Destaque de frase adaptado do preset Text Highlight.', 75,
    { text: 'Uma frase que merece destaque', background: 'transparent', accent: '#9333ea', textColor: '#ffffff', fontSize: 88 },
    [text('text', 'Texto', 'Uma frase que merece destaque'), color('accent', 'Destaque', '#9333ea'), color('textColor', 'Texto', '#ffffff'), number('fontSize', 'Tamanho', 88, 36, 150)], textHighlight),
  makePreset('rve-animated-list', 'RVE · Lista Animada', 'rve-presets', 'Lista em etapas adaptada do preset Animated List.', 120,
    { title: 'Neste episódio', item1: 'Contexto histórico', item2: 'Evidências principais', item3: 'Consequências', item4: 'O que aprendemos', background: '#0c0615', accent: '#7c3aed' },
    [text('title', 'Título', 'Neste episódio'), text('item1', 'Item 1', 'Contexto histórico'), text('item2', 'Item 2', 'Evidências principais'), text('item3', 'Item 3', 'Consequências'), text('item4', 'Item 4', 'O que aprendemos'), color('background', 'Fundo', '#0c0615'), color('accent', 'Destaque', '#7c3aed')], animatedList),
  makePreset('rve-stat-counter', 'RVE · Contador de Estatística', 'rve-presets', 'Número de impacto adaptado do preset Stat Counter.', 90,
    { value: 87, suffix: '%', label: 'dos registros confirmam a descoberta', background: '#0b0712', accent: '#c084fc' },
    [number('value', 'Valor', 87, 0, 100000), text('suffix', 'Sufixo', '%'), text('label', 'Legenda', 'dos registros confirmam a descoberta'), color('background', 'Fundo', '#0b0712'), color('accent', 'Destaque', '#c084fc')], statCounter),
  makePreset('rve-sound-wave', 'RVE · Onda Sonora', 'rve-presets', 'Visualizador abstrato adaptado do preset Sound Wave.', 150,
    { background: 'transparent', accent: '#d946ef', secondary: '#8b5cf6' },
    [color('accent', 'Cor principal', '#d946ef'), color('secondary', 'Cor secundária', '#8b5cf6')], soundWave),
  makePreset('onda-title-card', 'Onda · Cartela Editorial', 'onda-presets', 'Cartela adaptada do componente Title Card do Onda.', 120,
    { kicker: 'KAKA CUT APRESENTA', title: 'Histórias que atravessam o tempo', subtitle: 'Uma abertura editorial limpa para documentários e ensaios.', background: '#f7f3fb', textColor: '#24142f', accent: '#a855f7', fontSize: 104 },
    [text('kicker', 'Selo', 'KAKA CUT APRESENTA'), text('title', 'Título', 'Histórias que atravessam o tempo'), text('subtitle', 'Subtítulo', 'Uma abertura editorial limpa para documentários e ensaios.'), color('background', 'Fundo', '#f7f3fb'), color('textColor', 'Texto', '#24142f'), color('accent', 'Destaque', '#a855f7'), number('fontSize', 'Tamanho', 104, 48, 160)], titleCard),
  makePreset('onda-lower-third', 'Onda · Tarja de Entrevistado', 'onda-presets', 'Identificação adaptada do componente Lower Third do Onda.', 150,
    { name: 'Nome do entrevistado', role: 'Pesquisador e historiador', background: 'rgba(15,8,25,.90)', accent: '#a855f7' },
    [text('name', 'Nome', 'Nome do entrevistado'), text('role', 'Cargo', 'Pesquisador e historiador'), color('accent', 'Destaque', '#a855f7')], lowerThird),
  makePreset('onda-quote-card', 'Onda · Citação Documental', 'onda-presets', 'Cartela de citação adaptada do componente Quote Card do Onda.', 135,
    { quote: 'O passado não desaparece; ele continua moldando tudo o que vemos.', author: 'Fonte documental', background: '#100819', accent: '#c084fc', fontSize: 58 },
    [text('quote', 'Citação', 'O passado não desaparece; ele continua moldando tudo o que vemos.'), text('author', 'Fonte', 'Fonte documental'), color('background', 'Fundo', '#100819'), color('accent', 'Destaque', '#c084fc'), number('fontSize', 'Tamanho', 58, 30, 100)], quoteCard),
  makePreset('onda-progress-steps', 'Onda · Etapas da Investigação', 'onda-presets', 'Linha de progresso adaptada do componente Progress Steps do Onda.', 150,
    { title: 'Linha da investigação', step1: 'Descoberta', step2: 'Investigação', step3: 'Evidências', step4: 'Conclusão', active: 3, background: '#0d0716', accent: '#9333ea' },
    [text('title', 'Título', 'Linha da investigação'), text('step1', 'Etapa 1', 'Descoberta'), text('step2', 'Etapa 2', 'Investigação'), text('step3', 'Etapa 3', 'Evidências'), text('step4', 'Etapa 4', 'Conclusão'), number('active', 'Etapas ativas', 3, 1, 4), color('background', 'Fundo', '#0d0716'), color('accent', 'Destaque', '#9333ea')], progressSteps),
  makePreset('onda-terminal', 'Onda · Terminal de Pesquisa', 'onda-presets', 'Terminal animado adaptado do componente Terminal do Onda.', 150,
    { line1: '$ analisando arquivos históricos...', line2: '> 247 documentos encontrados', line3: '> cruzando datas e testemunhos', line4: '✓ hipótese confirmada', background: '#09060e', accent: '#c084fc' },
    [text('line1', 'Linha 1', '$ analisando arquivos históricos...'), text('line2', 'Linha 2', '> 247 documentos encontrados'), text('line3', 'Linha 3', '> cruzando datas e testemunhos'), text('line4', 'Linha 4', '✓ hipótese confirmada'), color('background', 'Fundo', '#09060e'), color('accent', 'Destaque', '#c084fc')], terminal),
  makePreset('onda-matrix-decode', 'Onda · Decodificação de Arquivo', 'onda-presets', 'Revelação codificada adaptada do componente Matrix Decode do Onda.', 105,
    { text: 'ARQUIVO CONFIDENCIAL', background: '#08040d', accent: '#a855f7', fontSize: 86 },
    [text('text', 'Texto', 'ARQUIVO CONFIDENCIAL'), color('background', 'Fundo', '#08040d'), color('accent', 'Destaque', '#a855f7'), number('fontSize', 'Tamanho', 86, 36, 140)], matrixDecode),
  makePreset('onda-word-stagger', 'Onda · Palavras em Sequência', 'onda-presets', 'Entrada palavra por palavra adaptada do componente Word Stagger do Onda.', 90,
    { text: 'Cada pista muda a história', highlightIndex: 2, background: 'transparent', textColor: '#ffffff', accent: '#d946ef', fontSize: 92 },
    [text('text', 'Texto', 'Cada pista muda a história'), number('highlightIndex', 'Palavra destacada', 2, 0, 20), color('textColor', 'Texto', '#ffffff'), color('accent', 'Destaque', '#d946ef'), number('fontSize', 'Tamanho', 92, 36, 150)], wordStagger),
];
