// Trusted editor guide for the authenticated Streamable HTTP endpoint.
import { useEffect, useState } from 'react';
import { editorBootstrapInfo } from '../../agent/editor-credential';
import { theme } from '../../theme';
import { useT } from '../../i18n/locale';
import { Icon } from '../icons';

interface Snippet {
  id: 'codex' | 'antigravity' | 'claude' | 'gemini' | 'cursor';
  label: string;
  description: string;
  code: string;
  fileName?: string;
}

function snippets(endpoint: string, token: string): Snippet[] {
  return [
    {
      id: 'codex',
      label: 'Codex',
      description: '使用 ChatGPT 订阅连接 Codex；凭据由官方 Codex 客户端管理，Kaka Cut 只保存本机 MCP 令牌。',
      code: `$env:OPENCHATCUT_MCP_TOKEN='${token}'\ncodex mcp add kaka-cut --url ${endpoint} --bearer-token-env-var OPENCHATCUT_MCP_TOKEN`,
    },
    {
      id: 'antigravity',
      label: 'Antigravity (.agents/mcp_config.json)',
      description: '下载或复制配置到工作区的 .agents/mcp_config.json，然后在 Antigravity 的 MCP 管理器中刷新。',
      code: JSON.stringify({
        mcpServers: {
          'kaka-cut': {
            serverUrl: endpoint,
            headers: { Authorization: `Bearer ${token}` },
          },
        },
      }, null, 2),
      fileName: 'mcp_config.json',
    },
    {
      id: 'claude',
      label: 'Claude Code',
      description: '通过 Streamable HTTP 连接 Claude Code。',
      code: `claude mcp add --transport http -H "Authorization: Bearer ${token}" kaka-cut ${endpoint}`,
    },
    {
      id: 'gemini',
      label: 'Gemini CLI',
      description: '通过 Streamable HTTP 连接 Gemini CLI。',
      code: `gemini mcp add --transport http --header "Authorization: Bearer ${token}" kaka-cut ${endpoint}`,
    },
    {
      id: 'cursor',
      label: 'Cursor (~/.cursor/mcp.json)',
      description: '复制配置到 Cursor 的 MCP 文件。',
      code: JSON.stringify({
        mcpServers: {
          'kaka-cut': {
            type: 'http',
            url: endpoint,
            headers: { Authorization: `Bearer ${token}` },
          },
        },
      }, null, 2),
    },
  ];
}

function DownloadButton({ text, fileName }: { text: string; fileName: string }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => {
        const url = URL.createObjectURL(new Blob([`${text}\n`], { type: 'application/json' }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(url);
      }}
      style={{
        flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', border: `0.5px solid ${theme.border}`, borderRadius: 4,
        background: theme.hover, color: theme.textMuted, fontSize: 11, cursor: 'pointer',
      }}
    >
      <Icon name="download" size={11} />
      {t('下载配置')}
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
      style={{
        flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', border: `0.5px solid ${theme.border}`, borderRadius: 4,
        background: theme.hover, color: copied ? theme.accent : theme.textMuted,
        fontSize: 11, cursor: 'pointer',
      }}
    >
      <Icon name={copied ? 'check' : 'copy'} size={11} />
      {copied ? t('已复制') : t('复制到剪贴板')}
    </button>
  );
}

export function McpGuideDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const endpoint = `${window.location.origin}/api/external-mcp/mcp`;
  const [mcpToken, setMcpToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);
  useEffect(() => {
    let active = true;
    void editorBootstrapInfo().then(
      (info) => { if (active) setMcpToken(info.mcpToken); },
      () => { if (active) setTokenError(true); },
    );
    return () => { active = false; };
  }, []);
  const codeStyle: React.CSSProperties = {
    margin: 0, padding: '7px 9px', border: `0.5px solid ${theme.borderLight}`, borderRadius: 4,
    background: theme.inset, color: theme.text, fontSize: 11.5, lineHeight: 1.5,
    fontFamily: 'Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
    whiteSpace: 'pre-wrap', wordBreak: 'break-all', userSelect: 'text',
  };
  const allSnippets = mcpToken ? snippets(endpoint, mcpToken) : [];
  const primarySnippets = allSnippets.filter((snippet) => snippet.id === 'codex' || snippet.id === 'antigravity');
  const otherSnippets = allSnippets.filter((snippet) => snippet.id !== 'codex' && snippet.id !== 'antigravity');
  return (
    <div className="cc-modal-backdrop" onPointerDown={onClose}>
      <div
        className="cc-modal"
        style={{ width: 660, gap: 10, maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
          <Icon name="plug" size={15} />
          <strong style={{ fontSize: 14 }}>{t('外部 Agent 接入 (MCP)')}</strong>
          <button type="button" onClick={onClose} style={{ marginLeft: 'auto', padding: '3px 9px' }}>{t('关闭')}</button>
        </div>
        <div style={{ color: theme.textMuted, fontSize: 12, lineHeight: 1.55 }}>
          {t('Kaka Cut 暴露一个 Streamable HTTP MCP 端点。Codex、Gemini、Antigravity、Claude Code 和 Cursor 接入后,与内置 Agent 共用同一套编辑工具,可直接读写当前工程。')}
        </div>

        <div style={{ color: theme.textMuted, fontSize: 12, lineHeight: 1.55, padding: '8px 10px', borderRadius: 6, background: theme.hover }}>
          {t('连接后可直接下达自然语言命令，例如：“根据 C2 次字幕轨创建动态文字”或“把 V1 所有剪切点改成柔和叠化”。Kaka Cut 必须保持打开；执行修改前仍会遵守 Agent 的审核模式。')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Icon name="sparkles" size={13} />
          <span style={{ fontSize: 12, fontWeight: 650 }}>{t('主要连接器')}</span>
          <span style={{ marginLeft: 'auto', color: theme.textDim, fontSize: 11 }}>{t('本机安全连接')}</span>
        </div>

        {mcpToken ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {primarySnippets.map((snippet) => (
              <div key={snippet.id} style={{
                minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7, padding: 10,
                borderRadius: 8, border: `0.5px solid ${theme.borderLight}`, background: theme.inset,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Icon name={snippet.id === 'codex' ? 'plug' : 'sparkles'} size={14} />
                  <strong style={{ fontSize: 12.5 }}>{snippet.label}</strong>
                  <span style={{ marginLeft: 'auto', color: theme.accent, fontSize: 10.5 }}>{t('准备连接')}</span>
                </div>
                <div style={{ color: theme.textMuted, fontSize: 11.5, lineHeight: 1.45, minHeight: 50 }}>
                  {t(snippet.description)}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <CopyButton text={snippet.code} />
                  {snippet.fileName && <DownloadButton text={snippet.code} fileName={snippet.fileName} />}
                </div>
                <pre style={{ ...codeStyle, maxHeight: 126, overflow: 'auto', fontSize: 10.5 }}>{snippet.code}</pre>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: tokenError ? theme.danger : theme.textMuted, fontSize: 12 }}>
            {tokenError ? t('无法读取 MCP 连接令牌，请从受信任的编辑器窗口重试。') : t('正在读取 MCP 连接令牌…')}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{t('内置 Agent 与外部 MCP')}</span>
          <div style={{ color: theme.textMuted, fontSize: 12, lineHeight: 1.55 }}>
            {t('内置 Agent 会先生成可预览的修改提案，由你应用或拒绝；外部 MCP 使用独立编辑会话，manual 模式等待审核，auto 模式在 review 时直接应用。两者都只通过 EditorCore 命令修改工程。')}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{t('连接本地模型')}</span>
          <div style={{ color: theme.textMuted, fontSize: 12, lineHeight: 1.55 }}>
            {t('打开 设置 → Agent 模型 → Agent 大脑 → OpenAI，填写本地或兼容服务的 API URL 和模型；按服务选择 Responses API 或 Chat Completions API，再点“测试并读取模型”。仅在服务要求时填写 API Key。')}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{t('端点地址')}</span>
            <CopyButton text={endpoint} />
          </div>
          <pre style={codeStyle}>{endpoint}</pre>
        </div>

        {otherSnippets.length > 0 && (
          <span style={{ fontSize: 12, fontWeight: 600 }}>{t('其他兼容连接器')}</span>
        )}

        {otherSnippets.map((snippet) => (
          <div key={snippet.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{snippet.label}</span>
              <CopyButton text={snippet.code} />
            </div>
            <pre style={codeStyle}>{snippet.code}</pre>
          </div>
        ))}

        <div style={{ color: theme.textDim, fontSize: 11.5, lineHeight: 1.55, borderTop: `0.5px solid ${theme.borderLight}`, paddingTop: 8 }}>
          {t('MCP 端点始终要求 Bearer 令牌。令牌在首次启动时生成并保存在本机，重启后保持不变，配置一次即可持续使用；OPENCHATCUT_MCP_TOKEN 环境变量可覆盖。令牌只在当前受信任编辑器会话中显示，不写入工程、聊天或浏览器存储。')}
        </div>
      </div>
    </div>
  );
}
