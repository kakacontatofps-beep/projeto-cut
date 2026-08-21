# Kaka Cut

Fork independente e personalizável do OpenChatCut, voltado ao fluxo de
documentários do Kaka Studio.

## Como abrir

Dê dois cliques em `ABRIR_KAKA_CUT.vbs`. O aplicativo abre sem deixar uma
janela de terminal visível. Na página inicial:

1. clique em **Novo projeto**;
2. escolha a pasta do episódio quando o Windows solicitar;
3. se houver um SRT, revise a tela **Montar episódio** e corrija qualquer associação;
4. clique em **Montar timeline**;
5. visualize, corte, mova, substitua mídias e exporte.

A pasta escolhida fica monitorada durante a sessão: novos arquivos compatíveis
que forem adicionados a ela também podem entrar na biblioteca do projeto.

A edição manual, a importação e a montagem por SRT funcionam sem configurar IA.
Serviços online e modelos de IA são opcionais.

## Montagem automática por SRT

O botão **Montar episódio**, acima da biblioteca de mídia:

- ordena nomes como `001.jpg`, `002.png` e `003.mp4` numericamente;
- cria uma cena para cada bloco do SRT;
- permite trocar manualmente a mídia de qualquer cena antes de aplicar;
- oferece repetir a última mídia, reiniciar a sequência ou deixar lacunas;
- detecta `narracao`, `voz`, `musica`, `trilha` e nomes semelhantes;
- adiciona narração integral, música com volume/fades e ducking;
- cria legendas, marcadores, zoom lento e transições;
- substitui ou acrescenta à timeline atual em uma única ação reversível.

## Independência

- os dados deste fork ficam em `.editor-documental`;
- o Kaka Sync não é acessado nem alterado;
- a atualização automática do OpenChatCut está desativada;
- o protótipo anterior permanece em outra pasta e não é apagado.

## Base e licença

Este programa é baseado no
[OpenChatCut](https://github.com/0xsline/OpenChatCut), preserva seus avisos e é
distribuído sob `AGPL-3.0-or-later`. O código-fonte completo deste fork acompanha
a aplicação, permitindo estudar e modificar qualquer parte.

Componentes e marcas adicionais deverão respeitar as licenças registradas no
repositório original. O nome “Kaka Cut” identifica este fork e não
implica afiliação oficial com os mantenedores do OpenChatCut.

## Desenvolvimento

A base requer Node.js 24. O iniciador usa a instalação disponível no Windows,
sem caminhos presos a um usuário específico.

```powershell
npm install
npm run build
npm run desktop:dev:shared
```

## Próximos ajustes

O pente-fino seguinte poderá incluir presets documentais adicionais, congelamento
automático do último quadro de vídeos curtos, repetição inteligente de músicas e
o adaptador opcional de exportação para o projeto CapCut.
