# Kaka Cut

Editor de vídeo para Windows, local, gratuito e totalmente modificável, pensado para o fluxo de documentários do Kaka Studio.

O Kaka Cut combina uma timeline multifaixa com montagem automática de episódios a partir de legendas SRT. O projeto continua editável depois da automação: cenas, cortes, textos, trilha, transições e legendas podem ser ajustados manualmente.

## Destaques

- interface em português com identidade visual roxa;
- importação de vídeos, imagens, áudio e legendas;
- montagem de episódio por blocos de um arquivo SRT;
- associação e revisão das mídias antes de montar a timeline;
- detecção de narração, música e trilha por nome de arquivo;
- legendas, marcadores, transições, zoom lento, fades e ducking;
- timeline multifaixa com altura e zoom ajustáveis;
- projetos e arquivos mantidos localmente;
- comandos de edição com Codex integrado ou agentes externos via MCP;
- 13 presets comunitários compatíveis, adaptados de React Video Editor e Onda;
- integração MCP com Codex, Gemini, Antigravity, Claude Code e Cursor.

## Abrir no Windows

1. Instale o [Node.js 24](https://nodejs.org/).
2. Clone ou baixe este repositório.
3. Dê dois cliques em `ABRIR_KAKA_CUT.vbs`.

O iniciador abre somente a janela do aplicativo e prepara automaticamente a
versão mais recente do código. Se houver algum problema, consulte
`KAKA_CUT_INICIO.log`. O arquivo `INICIAR_KAKA_CUT.bat` pode ser usado para
diagnóstico técnico.

No aplicativo, clique em **Novo projeto**, escolha a pasta do episódio e use **Montar episódio** para revisar o SRT antes de criar a timeline.

## Presets e comandos por IA

Na biblioteca de motion graphics, use as categorias **RVE · Presets** e **Onda · Presets**. Todos os textos, cores e valores principais podem ser alterados no inspetor. Os créditos e as licenças estão em [THIRD_PARTY_PRESETS.md](THIRD_PARTY_PRESETS.md).

Para controlar o editor com outro agente, mantenha o Kaka Cut aberto e acesse **Configurações → Agente externo (MCP)**. A tela oferece comandos prontos para Codex e Gemini CLI, além dos arquivos JSON para Antigravity e Cursor. O token é local e não deve ser publicado no Git.

Exemplos de ordens:

- “Crie textos dinâmicos usando o SRT secundário da faixa C2, sem alterar a C1.”
- “Troque todas as transições da faixa V1 por dissoluções suaves de 12 quadros.”
- “Use o preset Onda · Citação Documental nas três frases mais importantes.”

## Modo leve

Esta versão prioriza computadores com menos memória e processamento:

- abre um projeto novo vazio, sem cenas demonstrativas pesadas;
- carrega somente 37 presets selecionados, em vez da galeria legada completa;
- usa arquivos proxy na prévia por padrão, mantendo os originais intactos para a exportação;
- estabiliza a prévia ao passar o mouse pela timeline para evitar renderizações a cada movimento;
- não carrega conexões antigas nem módulos externos de geração de imagem, vídeo, voz, música ou som;
- mantém somente Codex e a ponte MCP para comandos de edição.

Projetos antigos e mídias já importadas ou geradas continuam abrindo normalmente. Nenhum arquivo existente é apagado.

## Desenvolvimento

```powershell
npm install
npm run desktop:dev:shared
```

Verificações principais:

```powershell
npm run lint
npm run verify:i18n
npm run verify:editor
npm run verify:documentary
npm run build
npm run desktop:smoke
```

## Privacidade e independência

- O Kaka Cut salva seus próprios dados em `.kaka-cut`.
- O Kaka Sync é um programa separado e não é acessado ou alterado.
- Mídias importadas, modelos locais, arquivos `.env` e resultados de exportação não são enviados ao Git.
- Nenhuma conta de IA é necessária para editar ou montar um episódio com SRT.

## Base e licença

Este projeto é um fork independente do [OpenChatCut](https://github.com/0xsline/OpenChatCut), preserva seus avisos e é distribuído sob a licença [AGPL-3.0-or-later](LICENSE).

O nome **Kaka Cut** identifica este fork e não implica afiliação oficial com os mantenedores do OpenChatCut. Componentes de terceiros continuam sujeitos às respectivas licenças.

## Estado atual

Esta é a primeira versão funcional para validação e pente-fino. Sugestões, correções e novos presets documentais podem ser incorporados diretamente neste repositório.
