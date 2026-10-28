import { test } from "node:test";
import assert from "node:assert/strict";
import { wrapKorean, displayWidth } from "../src/korean-wrap.js";

const examples = [
  ["AI 에이전트를 늘려도 개발이 빨라지지 않는 이유", ["AI 에이전트를 늘려도", "개발이 빨라지지 않는 이유"]],
  ["GLM-5.3 요청 간 데이터 노출, KV 캐시 오류가 원인", ["GLM-5.3 요청 간 데이터 노출,", "KV 캐시 오류가 원인"]],
  ["Anthropic 상장 보도로 본 업무형 AI 전략", ["Anthropic 상장 보도로 본", "업무형 AI 전략"]],
  ["웹 요소를 찍고 설명하면 코드 수정까지 연결하는 PulseDev", ["웹 요소를 찍고 설명하면", "코드 수정까지 연결하는", "PulseDev"]],
];
for (const [text, expected] of examples) test(text, () => {
  const result = wrapKorean(text);
  assert.deepEqual(result.lines, expected);
  assert.equal(result.fits, true);
  assert.equal(result.lines.join(" "), text);
});
test("preserves content and word boundaries across widths", () => {
  for (const [text] of examples) for (let width = 12; width <= 80; width++) {
    const result = wrapKorean(text, { maxWidth: width });
    assert.equal(result.lines.join(" "), text);
    assert.ok(result.lines.length <= 3);
    assert.equal(result.fits, result.widths.every(value => value <= width));
  }
});
test("a narrower measure keeps the clause boundary using a third line", () => {
  const result = wrapKorean(examples[1][0], { maxWidth: 24 });
  assert.equal(result.lines.length, 3);
  assert.equal(result.lines.at(-1), "KV 캐시 오류가 원인");
  assert.ok(result.lines.every(line => !line.startsWith("간 ")));
  assert.equal(result.fits, true);
});
test("short text, whitespace, emoji, custom measurement and impossible constraints", () => {
  assert.deepEqual(wrapKorean("짧은 제목").lines, ["짧은 제목"]);
  assert.equal(wrapKorean("  두\n 단어  ").text, "두 단어");
  assert.deepEqual(wrapKorean("").lines, []);
  assert.equal(displayWidth("한A👨‍👩‍👧‍👦e\u0301🇰🇷"), 8);
  assert.deepEqual(wrapKorean("abc def ghi", { maxWidth: 14, measure: text => text.length * 2 }).lines, ["abc def", "ghi"]);
  const result = wrapKorean("아주아주긴하나의단어", { maxWidth: 4 });
  assert.equal(result.fits, false);
  assert.equal(result.text, "아주아주긴하나의단어");
  assert.equal(wrapKorean(examples[0][0], { maxWidth: 10, maxLines: 2 }).lines.length, 2);
});
test("rejects invalid or unbounded input", () => {
  for (const text of [null, 1, "가".repeat(1001), "a ".repeat(81)]) assert.throws(() => wrapKorean(text));
  for (const maxWidth of [0, -1, NaN, Infinity]) assert.throws(() => wrapKorean("제목", { maxWidth }));
  assert.throws(() => wrapKorean("제목", { maxLines: 4 }));
  assert.throws(() => wrapKorean("제목", { measure: () => NaN }));
});
