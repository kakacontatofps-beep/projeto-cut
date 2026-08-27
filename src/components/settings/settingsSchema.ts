// Set the information architecture of the panel (first-level classification → second-level capability group → third-level provider page → fields) and pure display logic.
// Three columns: Left tree = Category → Capability; Middle column = Vendor list under this capability; Right column = Configuration page of the selected vendor.
// Agent LLM saves independent API URLs, API Keys and models for each vendor; the capability to generate classes can be additionally provided
// Default provider route. Layout/interaction is in SettingsDialog.tsx, vendor icons are in vendorIcons.tsx.
// Security invariant: the secret field only has a Boolean status, and the value will never be backfilled; the model/routing field is a non-secret configuration,
// The current value is echoed through the models channel of GET /api/keys (server-side NON_SECRET_NAMES whitelist).
import { t } from '../../i18n/locale';
import { isLocalLlmProvider, llmProviderConfigNames } from '../../../shared/llm-providers';
import type { CodexAgentStatus } from '../../../shared/codex-agent';
import {
  directory,
  secret,
  text,
  type KeyStatusResponse,
  type SelectOption,
  type SettingsCategory,
  type SettingsField,
  type SettingsGroup,
  type SettingsVendorPage,
} from './settingsFields';
import {
  ROUTE_NEEDS,
  TRANSCRIPTION_SETTINGS_GROUP,
  localAsrPage,
} from './settingsMediaProviders';

export type {
  FieldKind,
  KeyState,
  KeyStatusResponse,
  SelectOption,
  SettingsCategory,
  SettingsField,
  SettingsGroup,
  SettingsVendorPage,
} from './settingsFields';

const CODEX_PAGE: SettingsVendorPage = {
  key: 'llm/codex',
  vendor: 'openai',
  title: 'OpenAI · Codex',
  connection: 'codex',
  note: '使用 ChatGPT 订阅登录，由官方 Codex CLI 管理凭据。也可通过 MCP 将 Codex、Gemini 或 Antigravity 连接到 Kaka Cut。',
  noteAction: { label: '外部 Agent 接入 (MCP)', action: 'open-mcp-guide' },
  fields: [
    {
      name: 'CODEX_MODEL',
      label: 'Codex 模型',
      kind: 'text',
      defaultLabel: 'Codex 默认模型',
      discoverableModel: true,
      note: '登录后可读取当前账号可用的模型，也可以手动填写模型 ID。',
    },
    {
      name: 'CODEX_REASONING_EFFORT',
      label: '推理强度',
      kind: 'select',
      options: [{ value: '', label: '模型默认' }],
      note: '读取模型后显示当前模型支持的档位；留空使用该模型的默认值。',
    },
  ],
};

export const SETTINGS_CATEGORIES: readonly SettingsCategory[] = [
  {
    key: 'agent', title: 'Agent 模型', icon: 'sparkles',
    groups: [
      { key: 'llm', title: 'Agent 大脑',
        hint: 'Codex integrado para editar; conexões externas usam a ponte MCP.',
        vendors: [CODEX_PAGE] },
    ],
  },
  {
    key: 'assets', title: '素材 · 转写', icon: 'folder',
    groups: [
      { key: 'stock', title: '在线图库', hint: 'search_stock_media · 搜索可商用图片 / 视频素材。',
        vendors: [
          { key: 'stock/pexels', vendor: 'pexels', title: 'Pexels', fields: [secret('PEXELS_API_KEY', 'API Key')] },
          { key: 'stock/pixabay', vendor: 'pixabay', title: 'Pixabay', fields: [secret('PIXABAY_API_KEY', 'API Key')] },
          { key: 'stock/unsplash', vendor: 'unsplash', title: 'Unsplash', fields: [secret('UNSPLASH_ACCESS_KEY', 'Access Key')] },
          { key: 'stock/freesound', vendor: 'freesound', title: 'Freesound', fields: [secret('FREESOUND_API_KEY', 'API Key')] },
        ] },
      TRANSCRIPTION_SETTINGS_GROUP,
    ],
  },
  {
    key: 'cloud', title: '存储', icon: 'cloud',
    groups: [
      { key: 'storage', title: '媒体存储', hint: '工程与素材的本地保存目录，与可选的 R2 云备份。',
        vendors: [
          { key: 'storage/projects', vendor: 'localdisk', title: '工程存储目录',
            note: '工程、历史版本与素材的存放位置。默认放在应用数据目录里；'
              + '改到你自己的目录（外置硬盘、同步盘）后，卸载或重装应用都不会动到作品。'
              + '保存时会把现有数据复制到新目录（原目录保留不删），重启应用后生效。',
            fields: [
              directory('OPENCHATCUT_DATA_DIR', '工程存储目录', '应用默认数据目录',
                '桌面端点击“选择目录”；也可手动输入绝对路径（可用 ~/ 开头）。清除后回到默认目录。'),
            ] },
          { key: 'storage/local', vendor: 'localdisk', title: '本地磁盘',
            note: '桌面端默认把素材存入系统应用数据目录，浏览器开发版默认使用 public/media/uploads/。'
              + '可选择任意本机目录或外置硬盘；保存后旧目录中的素材会复制到新目录（原文件保留），'
              + '工程里的素材地址不变，预览与渲染导出都会跟随新目录。',
            fields: [
              directory('MEDIA_DIR', '素材保存目录', '系统默认素材目录',
                '桌面端点击“选择目录”；浏览器中也可手动输入绝对路径。清除后回到当前运行环境的默认目录。'),
            ] },
          { key: 'storage/r2', vendor: 'r2', title: 'Cloudflare R2',
            note: '未配置时素材只存本机（「本地磁盘」页的目录）。配置后：每次上传同步写入 R2（桶保持私有，'
              + '读取经本地服务回源，src 路径不变）；本机缺文件时自动从云端取回。改动即时生效。'
              + 'R2 控制台建桶 → R2 API Token（Object Read & Write）即可拿到下面四个值。',
            fields: [
              { name: 'R2_ENABLED', label: '云同步', kind: 'toggle',
                note: '停用后新上传只存本地（密钥保留、已上云文件不受影响）；重新启用即恢复写穿。' },
              secret('R2_ACCOUNT_ID', 'Account ID'),
              secret('R2_ACCESS_KEY_ID', 'Access Key ID'),
              secret('R2_SECRET_ACCESS_KEY', 'Secret Access Key'),
              secret('R2_BUCKET', 'Bucket 名'),
            ] },
        ] },
    ],
  },
  {
    key: 'tools', title: '增强工具', icon: 'sliders',
    groups: [
      { key: 'sandbox', title: '沙箱执行', hint: 'run_code · 云端沙箱运行 ffmpeg / node / python。',
        vendors: [
          { key: 'sandbox/e2b', vendor: 'e2b', title: 'E2B',
            note: '云端隔离 Linux 沙箱，不触碰本机文件。Agent 用它跑 run_code：ffprobe 探测素材时长 / '
              + '尺寸编码、ffmpeg 转码 / 抽帧 / 加工音视频、执行 node / python 技能脚本，结果回传后'
              + '由本地工具应用到时间线。未配置只影响这些工具，剪辑与预览不受影响。',
            fields: [
              secret('E2B_API_KEY', 'API Key'),
              text('E2B_TEMPLATE', '模板 ID（可选）', undefined,
                '默认模板不带 ffmpeg；转码 / 抽帧类任务需自建含 ffmpeg 的模板并填其 ID。'),
            ] },
        ] },
      { key: 'web', title: '网页抓取', hint: 'web_browser · 抓取网页内容供 Agent 参考。',
        vendors: [
          { key: 'web/firecrawl', vendor: 'firecrawl', title: 'Firecrawl',
            fields: [secret('FIRECRAWL_API_KEY', 'API Key')] },
        ] },
    ],
  },
  {
    key: 'interface', title: '界面', icon: 'layoutPanel',
    groups: [
      { key: 'display', title: '显示', hint: '界面缩放与显示相关设置。',
        vendors: [
          { key: 'display/scale', vendor: 'localasr', title: '界面缩放',
            note: '调整整个编辑器的缩放比例（80%–150%）。桌面版保存后立即生效，也可用 Ctrl/Cmd + +/- 快速调整、Ctrl/Cmd + 0 复位。浏览器版请使用浏览器自带缩放。',
            fields: [
              { name: 'UI_SCALE', label: '界面缩放', kind: 'select', defaultLabel: '100%',
                options: [
                  { value: '0.8', label: '80%' },
                  { value: '0.9', label: '90%' },
                  { value: '1', label: '100%' },
                  { value: '1.1', label: '110%' },
                  { value: '1.25', label: '125%' },
                  { value: '1.5', label: '150%' },
                ] },
            ] },
        ] },
    ],
  },
  {
    key: 'local', title: '本地模型', icon: 'database',
    groups: [
      { key: 'local', title: '本地模型', hint: '本地转写、节拍与音乐分析、画面语义搜索。模型按需安装，数据不出本机。',
        vendors: [
          { key: 'local/asr', vendor: 'localasr', title: '本地转写', icon: 'mic', kind: 'local-models', fields: localAsrPage.fields },
          { key: 'local/music/packs', vendor: 'localasr', title: '节拍与音乐分析', icon: 'music', kind: 'local-models', fields: [] },
          { key: 'local/semantic/setup', vendor: 'localasr', title: '画面语义搜索', icon: 'search', kind: 'local-models', fields: [] },
        ] },
    ],
  },
];

/** Temporary changes: field name in map = temporary storage; '' = clear explicitly (model fields will return to default).*/
export type StagedValues = Record<string, string>;

export function omitKey(obj: StagedValues, name: string): StagedValues {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => k !== name));
}

/** '' is explicitly cleared and sent as is; non-null values ​​are sent after trimming; pure blank input is regarded as unchanged (to prevent misclearing).*/
export function buildPatch(values: StagedValues): Record<string, string> {
  const patch: Record<string, string> = {};
  for (const [name, raw] of Object.entries(values)) {
    if (raw === '') patch[name] = '';
    else if (raw.trim() !== '') patch[name] = raw.trim();
  }
  return patch;
}

export function savedMessage(): string {
  return t('已保存 · 工具即时生效，Agent 下一条消息即可感知');
}

/** Whether the field goes through the non-confidential models value channel (current value echo; temporary baseline = current value on the server; clear = return to default).*/
export function isModelField(field: SettingsField): boolean {
  return field.kind === 'select' || field.kind === 'toggle' || field.defaultLabel !== undefined;
}

/** Current model/routing value on the server ('' = not set = use default).*/
export function modelValue(status: KeyStatusResponse | null, name: string): string {
  return status?.models?.[name] ?? '';
}

/** provider page "Configured": All secrets in the page are configured (doubao = double keys);
 * Pages without secret (local disk) to see if any field has been set.*/
export function vendorConfigured(
  status: KeyStatusResponse | null,
  page: SettingsVendorPage,
  codexStatus?: CodexAgentStatus | null,
): boolean {
  if (page.connection === 'codex') {
    return Boolean(codexStatus?.installed && codexStatus.account?.type === 'chatgpt');
  }
  if (!status) return false;
  if (isLocalLlmProvider(page.vendor)) {
    const names = llmProviderConfigNames(page.vendor);
    return Boolean(status.models[names.model]?.trim());
  }
  const secrets = page.fields.filter((f) => f.kind === 'secret');
  if (secrets.length === 0) return page.fields.some((f) => Boolean(status.keys[f.name]?.configured));
  return secrets.every((f) => Boolean(status.keys[f.name]?.configured));
}
/** Determination of configured capability group: LLM and proxy are page-backed; others use server capability flags. */
export function groupConfigured(
  status: KeyStatusResponse | null,
  group: SettingsGroup,
  codexStatus?: CodexAgentStatus | null,
): boolean {
  if (group.key === 'llm' || group.key === 'proxy') {
    return group.vendors.some((page) => vendorConfigured(status, page, codexStatus));
  }
  return status ? Boolean(status.caps[group.key]) : false;
}

/** Classification logo: Number of configured capabilities/Total number of capabilities (capability level count).*/
export function categoryGroupStats(
  status: KeyStatusResponse | null,
  category: SettingsCategory,
  codexStatus?: CodexAgentStatus | null,
): { done: number; total: number } {
  return {
    done: category.groups.filter((group) => groupConfigured(status, group, codexStatus)).length,
    total: category.groups.length,
  };
}

/** Select key → ability group in the left tree (the group key is globally unique); if not found, fall back to the first group.*/
export function findGroup(key: string): SettingsGroup {
  return SETTINGS_CATEGORIES.flatMap((c) => c.groups).find((g) => g.key === key)
    ?? SETTINGS_CATEGORIES[0].groups[0];
}

/** Complete options for select rendering: insert "default (xxx)" before model select; routing select comes with "ask every time".*/
export function selectOptions(field: SettingsField): readonly SelectOption[] {
  const base = field.options ?? [];
  if (field.defaultLabel === undefined) return base;
  return [{ value: '', label: t('默认（{name}）', { name: t(field.defaultLabel) }) }, ...base];
}

// Routing requirements live beside the provider groups so settings and capability
// expansion share one focused provider-data surface.

/** Routing drop-down option copy: Add the "(not configured)" suffix when the provider has not configured it, and it is still optional (there is a fallback inquiry guardrail on the Agent side).
 * Non-routing select (model drop-down) returns unchanged.*/
export function selectOptionLabel(
  status: KeyStatusResponse | null, field: SettingsField, opt: SelectOption,
): string {
  if (!field.name.startsWith('PREFERRED_') || opt.value === '') return t(opt.label);
  const needs = ROUTE_NEEDS[opt.value];
  const has = (n: string): boolean => Boolean(status?.keys[n]?.configured);
  const ok = Boolean(needs?.some((group) => group.every(has)));
  return ok ? t(opt.label) : t('{name}（未配置）', { name: t(opt.label) });
}

/** Input box placeholder: secret / Ordinary text never backfills, only describes the status; model text describes the default value.*/
export function fieldPlaceholder(field: SettingsField, configured: boolean, stagedClear: boolean): string {
  if (isModelField(field)) {
    if (stagedClear) return t('恢复默认 · 保存后生效');
    return field.defaultLabel ? t('默认 {name}', { name: t(field.defaultLabel) }) : t('默认');
  }
  if (stagedClear) return t('将清除 · 保存后生效');
  if (configured) return field.placeholder ? t('已自定义 · 留空保持不变') : t('已配置 · 留空保持不变');
  return field.placeholder ? t(field.placeholder) : t('未配置 · 粘贴以启用');
}
