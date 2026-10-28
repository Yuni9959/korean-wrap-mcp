# Korean Wrap MCP

**한국어 제목이 의미가 끝나는 곳에서 줄을 바꾸도록.**

[English](README.md) · [기여 방법](CONTRIBUTING.md)

```text
기존
AI 에이전트를 늘려도 개발이 빨라지
지 않는 이유

개선
AI 에이전트를 늘려도
개발이 빨라지지 않는 이유
```

AI Trend 앱의 실제 줄바꿈 문제에서 출발한 한국어 제목 배치 도구입니다. 쉼표, 연결어미, 구절 경계를 고려해 **단어를 쪼개지 않고 최대 세 줄**로 나눕니다. 로컬 MCP 서버와 별도 의존성이 없는 JavaScript 엔진을 함께 제공합니다.

외부 AI API, 모델 다운로드, API 키가 필요하지 않습니다. 도구 자체는 실행 중 네트워크 요청을 하지 않으며, 사용하는 MCP 호스트의 데이터 정책은 별도입니다.

## 실제 출력 예시

기본값 `maxWidth: 30`의 결과입니다. `/`는 줄바꿈을 뜻합니다.

| 입력 | 출력 |
|---|---|
| AI 에이전트를 늘려도 개발이 빨라지지 않는 이유 | AI 에이전트를 늘려도 / 개발이 빨라지지 않는 이유 |
| GLM-5.3 요청 간 데이터 노출, KV 캐시 오류가 원인 | GLM-5.3 요청 간 데이터 노출, / KV 캐시 오류가 원인 |
| Anthropic 상장 보도로 본 업무형 AI 전략 | Anthropic 상장 보도로 본 / 업무형 AI 전략 |
| 웹 요소를 찍고 설명하면 코드 수정까지 연결하는 PulseDev | 웹 요소를 찍고 설명하면 / 코드 수정까지 연결하는 / PulseDev |

[AI Trend 카드 컴포넌트의 네 예시 브라우저 검증 화면](docs/browser-preview.png)

## 설치

**Node.js 22 이상**이 필요합니다. GitHub에서 배포하며 npm 레지스트리에는 아직 게시하지 않았습니다.

로컬 stdio 방식과 `mcpServers` 설정을 지원하는 호스트에 추가합니다. 첫 실행에는 GitHub 소스와 의존성을 내려받으며 Git도 필요합니다.

```json
{
  "mcpServers": {
    "korean-wrap": {
      "command": "npx",
      "args": ["--yes", "--package=github:Yuni9959/korean-wrap-mcp#v0.1.0", "korean-wrap-mcp"]
    }
  }
}
```

Windows에서 호스트가 `npx`를 실행하지 못하면 아래 방법으로 직접 연결합니다.

```sh
git clone --branch v0.1.0 --depth 1 https://github.com/Yuni9959/korean-wrap-mcp.git
cd korean-wrap-mcp
npm ci --omit=dev
```

실제로 내려받은 폴더의 **절대 경로**를 사용하세요.

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

설정 파일 위치는 호스트마다 다릅니다. 서버는 자동으로 호스트 설정을 바꾸지 않습니다. `node bin/server.js`를 직접 실행하면 MCP 요청을 기다리므로 터미널에 아무것도 출력되지 않는 것이 정상입니다.

## 사용

도구 이름은 `wrap_korean_text`입니다.

```json
{
  "text": "AI 에이전트를 늘려도 개발이 빨라지지 않는 이유",
  "maxWidth": 30,
  "maxLines": 3
}
```

- `text`: 공백만 있는 입력 불가. 최대 1,000 UTF-16 코드 단위, 공백 기준 80개 단어.
- `maxWidth`: 4~200 정수, 기본 30. **픽셀이 아닌 대략적인 표시 칸 수**입니다. 한글은 보통 2칸, 영문은 1칸으로 셉니다.
- `maxLines`: 1~3 정수, 기본 3. 짧은 제목은 한 줄로 둡니다.

결과의 `lines`는 줄 배열, `text`는 개행을 넣은 문자열, `widths`는 각 줄의 측정 폭, `fits`는 폭과 줄 수 조건의 충족 여부입니다. JSON 텍스트와 MCP `structuredContent`를 함께 반환합니다.

MCP 없이 사용할 때는 [핵심 모듈](src/korean-wrap.js)의 `wrapKorean`을 직접 불러오면 됩니다. 실제 글꼴의 픽셀 폭을 측정하는 함수도 전달할 수 있습니다. [브라우저 연동 예시](README.md#use-without-mcp)를 참고하세요.

## 동작과 한계

쉼표와 연결어미, 의존 명사와 수식어의 결합 등을 규칙으로 평가합니다. 조건에 맞는 배치를 먼저 찾고, 의미 경계와 줄 길이를 비교합니다. 문장을 번역·요약·교정하지 않습니다. 기존 공백과 개행은 하나의 공백으로 정규화하며 나머지 문자는 보존합니다.

형태소 분석기나 언어 모델을 사용하는 방식은 아닙니다. 모든 한국어 문장의 의미를 완벽하게 판단하지는 못하며, 낯선 복합 명사·애매한 문장·띄어쓰기 오류에는 편집 검토가 필요합니다.

폭이 너무 좁거나 공백 없는 긴 단어 때문에 조건을 지킬 수 없으면 `fits: false`를 반환합니다. 내용을 자르지 않으므로 폭을 늘리거나 UI에서 추가 줄을 허용하세요. 기본 폭 계산은 근사치이며 실제 화면에는 글꼴·글자 간격·화면 크기를 반영해야 합니다.

## 개발·기여

```sh
npm ci
npm test
npm run demo
```

예시 4건, 여러 폭에서의 원문 보존, 이모지, 잘못된 입력, 실제 stdio MCP 연결과 호출을 검증합니다. CI는 Linux·Windows와 Node 22·24에서 실행합니다.

도움이 됐다면 **GitHub Star**로 알려주세요. 어색한 결과가 있다면 [입력 문장·설정·원하는 줄바꿈](https://github.com/Yuni9959/korean-wrap-mcp/issues/new?template=wrapping.yml)을 공유해 주세요.

[MIT 라이선스](LICENSE).
