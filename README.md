# Korean Wrap MCP

**Give Korean headlines room to finish a thought.**

[한국어](README.ko.md) · [Install](#install) · [Examples](#four-real-examples) · [Contribute a sentence](CONTRIBUTING.md)

[![Tests](https://github.com/Yuni9959/korean-wrap-mcp/actions/workflows/test.yml/badge.svg)](https://github.com/Yuni9959/korean-wrap-mcp/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

```text
Before                               Korean Wrap

AI 에이전트를 늘려도 개발이 빨라지    AI 에이전트를 늘려도
지 않는 이유                         개발이 빨라지지 않는 이유
```

A local MCP tool for phrase-aware Korean headline wrapping, plus a dependency-free JavaScript core. It uses punctuation, connective endings and phrase-boundary heuristics to choose up to three lines without splitting words. Built from a real headline-layout fix in **AI Trend**.

No API key, LLM call, model download, database or runtime network request. The MCP host may have its own data policy.

## Four real examples

These are actual outputs at the default `maxWidth: 30` (approximate display columns).

| Input | Output |
|---|---|
| AI 에이전트를 늘려도 개발이 빨라지지 않는 이유 | AI 에이전트를 늘려도<br>개발이 빨라지지 않는 이유 |
| GLM-5.3 요청 간 데이터 노출, KV 캐시 오류가 원인 | GLM-5.3 요청 간 데이터 노출,<br>KV 캐시 오류가 원인 |
| Anthropic 상장 보도로 본 업무형 AI 전략 | Anthropic 상장 보도로 본<br>업무형 AI 전략 |
| 웹 요소를 찍고 설명하면 코드 수정까지 연결하는 PulseDev | 웹 요소를 찍고 설명하면<br>코드 수정까지 연결하는<br>PulseDev |

Run `npm run demo` in a source checkout to reproduce them. [See the browser regression preview](docs/browser-preview.png) showing these four sample headings in AI Trend's card component.

## Install

Requires **Node.js 22+**. Releases are distributed on GitHub; this package is not published to the npm registry.

### MCP configuration

Add this entry to an MCP host that supports local stdio servers and `mcpServers` configuration. The first run downloads the tagged GitHub source and its dependencies; subsequent tool calls run locally. Git is required for this GitHub installation method.

```json
{
  "mcpServers": {
    "korean-wrap": {
      "command": "npx",
      "args": [
        "--yes",
        "--package=github:Yuni9959/korean-wrap-mcp#v0.1.0",
        "korean-wrap-mcp"
      ]
    }
  }
}
```

On Windows, if your host cannot launch `npx`, use the direct Node setup below. Configuration file locations differ by host.

### Direct Node setup (also works on Windows)

```sh
git clone --branch v0.1.0 --depth 1 https://github.com/Yuni9959/korean-wrap-mcp.git
cd korean-wrap-mcp
npm ci --omit=dev
```

Register an absolute path, replacing the example with your checkout location:

```json
{
  "mcpServers": {
    "korean-wrap": {
      "command": "node",
      "args": ["C:/tools/korean-wrap-mcp/bin/server.js"]
    }
  }
}
```

`node bin/server.js` waits for MCP requests on stdin; a quiet terminal is expected. Use `npm start --silent` if launching through npm, because stdout is reserved for protocol messages. No host configuration is changed automatically.

## Tool: `wrap_korean_text`

Example request:

```json
{
  "text": "AI 에이전트를 늘려도 개발이 빨라지지 않는 이유",
  "maxWidth": 30,
  "maxLines": 3
}
```

Returns both JSON text content and MCP `structuredContent`:

```json
{
  "lines": ["AI 에이전트를 늘려도", "개발이 빨라지지 않는 이유"],
  "text": "AI 에이전트를 늘려도\n개발이 빨라지지 않는 이유",
  "widths": [20, 25],
  "fits": true
}
```

| Parameter | Default | Meaning |
|---|---|---|
| `text` | Required | Nonempty headline, at most 1,000 UTF-16 code units and 80 space-separated words |
| `maxWidth` | `30` | Integer 4–200; approximate display columns, **not pixels** |
| `maxLines` | `3` | Integer 1–3; shorter text can use fewer lines |

The tool is read-only and deterministic. A useful host prompt is: “Use `wrap_korean_text` to lay out this Korean headline in up to three lines. Keep the wording, check `fits`, and show me the result.”

## Use without MCP

The core has no package dependencies. Copy the MIT-licensed [`src/korean-wrap.js`](src/korean-wrap.js), or import it from a source checkout:

```js
import { wrapKorean } from './src/korean-wrap.js';

const result = wrapKorean('웹 요소를 찍고 설명하면 코드 수정까지 연결하는 PulseDev');
console.log(result.lines);
```

For proportional fonts, pass a measurement function in the same units as `maxWidth`:

```js
const context = document.createElement('canvas').getContext('2d');
context.font = '600 24px sans-serif'; // Match the element's actual font.
const result = wrapKorean(headline, {
  maxWidth: 314,
  measure: text => context.measureText(text).width
});
heading.textContent = result.fits ? result.text : headline;
```

```css
.headline {
  white-space: pre-line;
  word-break: keep-all;
  overflow-wrap: anywhere;
}
```

Wait for fonts to load, account for letter spacing, and recalculate when the available width changes. The app integration measures its actual font and preserves the full title if accessibility text sizes require extra lines.

## How it works and where it stops

- Enumerates word-boundary layouts of one to three lines, preferring layouts that fit the width.
- Scores punctuation and Korean connective endings, discourages isolated bound words and modifier splits, then balances line lengths.
- Keeps every non-whitespace character. Trims and collapses whitespace, including existing line breaks; it does **not** rewrite, translate or summarize.
- Uses approximate columns by default: Hangul/CJK/emoji clusters generally count as 2, Latin as 1. This is not a complete terminal-width implementation or a pixel-layout promise.
- If no layout fits, returns `fits: false` and a best-effort layout within `maxLines`, with all text intact. Increase width, change typography, or allow extra lines in your UI; do not silently clip the result.
- This is a **rule-based heuristic**, not a Korean morphological parser or universal semantic understanding. Ambiguous syntax, unfamiliar compounds, spacing mistakes and long unbroken tokens need editorial review. Korean is the target language.

## Development

```sh
npm ci
npm test
npm run demo
```

Tests cover the four examples, narrow measures, preservation across widths, grapheme-aware measurement, invalid inputs, and a real stdio MCP handshake/tool call. CI runs on Linux and Windows with Node 22 and 24.

Uses the official [MCP TypeScript SDK](https://ts.sdk.modelcontextprotocol.io/v2/serving/stdio) for protocol handling. The core remains independent of the SDK.

If this saves you a typography fix, **star the repository**. If a sentence breaks awkwardly, [open a wrapping example](https://github.com/Yuni9959/korean-wrap-mcp/issues/new?template=wrapping.yml) with the desired lines; small, reproducible examples make the rules better.

[MIT license](LICENSE).
