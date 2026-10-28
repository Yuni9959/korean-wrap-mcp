import { wrapKorean } from "../src/korean-wrap.js";

for (const text of [
  "AI 에이전트를 늘려도 개발이 빨라지지 않는 이유",
  "GLM-5.3 요청 간 데이터 노출, KV 캐시 오류가 원인",
  "Anthropic 상장 보도로 본 업무형 AI 전략",
  "웹 요소를 찍고 설명하면 코드 수정까지 연결하는 PulseDev",
]) {
  console.log(`${text}\n\n${wrapKorean(text).text}\n`);
}
