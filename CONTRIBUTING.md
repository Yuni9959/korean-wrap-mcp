# Contributing / 기여하기

The most useful contribution is a small sentence with a better line break.
가장 도움이 되는 기여는 자연스러운 줄바꿈의 구체적인 예시입니다.

Please include the input, `maxWidth`, `maxLines`, actual output and desired output. For browser integrations, include the font, font size and available pixel width. Use public or invented example text, not private documents.

입력 문장, 폭·줄 수 설정, 현재 결과와 원하는 결과를 적어 주세요. 화면 문제라면 글꼴과 글자 크기, 사용 가능한 픽셀 폭도 도움이 됩니다.

For code changes:

1. Run `npm ci` and `npm test` with Node 22+.
2. Add a regression test for the example and a neighboring phrase that should still work.
3. Keep the core dependency-free, deterministic, and safe for browser imports.
4. Preserve every non-whitespace character. Never hide overflow or silently cut words.
5. Prefer a general linguistic rule over an exact-headline exception. Explain its limits.

The repository uses the MIT license. Contributions are accepted under the same license.
