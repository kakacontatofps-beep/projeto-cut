import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  type Prompt,
} from '@modelcontextprotocol/sdk/types.js';

const PROMPTS: Prompt[] = [
  {
    name: 'create-short-video',
    description: '把当前工程剪成节奏紧凑的竖屏短视频（钩子、推进、高潮、收尾）。',
    arguments: [{ name: 'topic', description: '主题/重点（可选）', required: false }],
  },
  {
    name: 'transcribe-and-caption',
    description: '转写时间线上的音频/视频片段并生成字幕（无音轨片段自动跳过）。',
    arguments: [{ name: 'track', description: '轨道别名，默认音频轨', required: false }],
  },
  {
    name: 'add-background-music',
    description: '为当前时间线匹配并放置合适的背景音乐，做响度标准化。',
    arguments: [{ name: 'mood', description: '情绪方向（可选）', required: false }],
  },
  {
    name: 'generate-script',
    description: '按当前素材写解说词/口播稿，并规划分镜。',
    arguments: [{ name: 'topic', description: '主题', required: true }],
  },
  {
    name: 'export-project',
    description: '导出当前工程为成片（MP4），并报告导出历史。',
    arguments: [{ name: 'format', description: 'mp4 / prores（默认 mp4）', required: false }],
  },
  {
    name: 'clean-up-draft',
    description: '检查时间线：删除填充词、静音停顿，收紧空隙。',
    arguments: [],
  },
  {
    name: 'secondary-srt-to-texts',
    description: '把次字幕轨（默认 C2）的 SRT 字幕逐条转换成时间完全同步的可编辑动态文字，不修改主字幕 C1。',
    arguments: [
      { name: 'captionTrack', description: '次字幕轨别名，默认 C2', required: false },
      { name: 'style', description: '文字风格，例如 documentary、bold、minimal', required: false },
    ],
  },
  {
    name: 'restyle-transitions',
    description: '检查指定视频轨的剪切点，统一替换或补齐转场，同时保持片段顺序和同步。',
    arguments: [
      { name: 'track', description: '视频轨别名，默认 V1', required: false },
      { name: 'style', description: '转场方向，例如 soft、dynamic、cinematic', required: false },
    ],
  },
];

const PROMPT_TEXT: Record<string, string> = {
  'create-short-video': '请把当前时间线剪成节奏紧凑的竖屏短视频：先梳理素材，确定钩子、推进、高潮和收尾，再执行剪辑、配乐、字幕与发布前检查。主题：{topic}。',
  'transcribe-and-caption': '请转写 {track} 轨道的音频/视频片段并生成字幕；没有音轨的片段跳过即可，完成后汇报哪些片段跳过了。',
  'add-background-music': '请为当前时间线选择并放置合适的背景音乐，标准化到约 -14 LUFS，并确保不与口播冲突。{topic}',
  'export-project': '请导出当前工程为成片（默认 MP4），导出前检查素材完整性，完成后报告导出历史与文件位置。',
  'clean-up-draft': '请检查当前时间线：删除口播中的填充词、删除静音停顿并收紧空隙，保持字幕与画面同步。',
  'secondary-srt-to-texts': '请把 {track} 次字幕轨的每条字幕转换为独立、可编辑的文字片段：先用 read_captions 确认字幕轨和每条字幕的准确起止时间，再用 edit_item 创建 type=text 的片段并保持完全同步。把文字放在字幕上方的安全区域，采用 {topic} 风格；不要修改、删除或覆盖主字幕 C1，也不要改变任何音视频片段。先验证完整批次，再提交修改并汇报创建数量。',
  'restyle-transitions': '请检查 {track} 视频轨所有相邻剪切点，并将转场统一调整为 {topic} 风格：先读取项目和 manage_transitions inspect/list，选择兼容的内置转场；移除同一剪切点上冲突的旧转场，再为有效的相邻片段添加或更新转场。保持片段顺序、时长、音频和字幕同步不变，先验证再提交，并汇报修改的剪切点数量。',
};

export function registerMcpPrompts(server: Server): void {
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: PROMPTS }));
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const name = request.params.name;
    const args = request.params.arguments ?? {};
    const topic = typeof args.topic === 'string' ? args.topic.trim() : '';
    const captionTrack = typeof args.captionTrack === 'string' ? args.captionTrack.trim() : '';
    const track = typeof args.track === 'string' ? args.track.trim() : '';
    const style = typeof args.style === 'string' ? args.style.trim() : '';
    const mood = typeof args.mood === 'string' ? args.mood.trim() : '';
    const template = name === 'generate-script'
      ? `请围绕「${topic}」写一段解说词/口播稿：先明确结构（开头钩子、主体要点、结尾行动引导），再规划与素材匹配的分镜。`
      : PROMPT_TEXT[name];
    if (!template) throw new Error(`Unknown prompt ${name}`);
    const text = template
      .replace(/\{topic\}/g, style || topic || (name === 'restyle-transitions' ? '柔和电影感' : 'documentary'))
      .replace(/\{track\}/g, captionTrack || track || (name === 'secondary-srt-to-texts' ? 'C2' : name === 'restyle-transitions' ? 'V1' : 'A1'));
    return {
      description: PROMPTS.find((prompt) => prompt.name === name)?.description,
      messages: [{
        role: 'user',
        content: { type: 'text', text: mood ? `${text}（氛围：${mood}）` : text },
      }],
    };
  });
}
