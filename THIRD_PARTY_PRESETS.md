# Third-party preset notices

Kaka Cut includes a compatibility pack adapted for its sandboxed Remotion template runtime. The adaptations are maintained in `src/editor/community-presets.ts`; they do not import the upstream packages at runtime.

## React Video Editor — Remotion Templates

- Source: https://github.com/reactvideoeditor/remotion-templates
- Reference revision: `6209b724798e48ff395f8df1a6fa2d26082372b5`
- Adapted concepts: Cinematic Title Intro, Chapter Title, Text Highlight, Animated List, Stat Counter, and Sound Wave.
- The upstream README states that all templates in that repository are available under the MIT License and that attribution is appreciated. The repository did not include a standalone `LICENSE` file at the referenced revision, so this project records the README statement and source revision explicitly.

The Kaka Cut versions are clean-room compatibility adaptations: no upstream React module is loaded or executed by the editor.

## Onda

- Source: https://github.com/degueba/onda
- Reference revision: `3c814051269597b31fee1603bef7ccfb93d091b6`
- Adapted concepts: Title Card, Lower Third, Quote Card, Progress Steps, Terminal, Matrix Decode, and Word Stagger.

MIT License

Copyright (c) 2026 Rodrigo Botelho

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Onda's trademarks and branding are not licensed under its MIT code license. “Onda” is used here only to identify the source of the adapted presets; Kaka Cut remains the product identity.
