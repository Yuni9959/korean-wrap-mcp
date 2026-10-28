// MIT — shared with https://github.com/Yuni9959/korean-wrap-mcp
const graphemes = new Intl.Segmenter("ko", { granularity: "grapheme" });

/** Approximate display columns: Hangul/CJK/emoji = 2, Latin = 1. */
export function displayWidth(text) {
  let width = 0;
  for (const { segment } of graphemes.segment(text)) {
    if (/^[\p{Mark}\p{Cf}]+$/u.test(segment)) continue;
    width += /[\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Extended_Pictographic}\p{Regional_Indicator}\uFF01-\uFF60]/u.test(segment) ? 2 : 1;
  }
  return width;
}

function boundaryCost(words, index) {
  const left = words[index - 1], right = words[index];
  const bare = left.replace(/["'”’」』)\]]+$/u, "");
  if (/^[,.;:!?、。)\]”’]/u.test(right) || /[(\[“‘]$/u.test(left)) return 120;
  if (/^(수|것|것을|것이|등|및|중|간|내|외|때|데|뿐|본|한|할|된|될)$/u.test(right)) return 90;
  if (/[,，:;!?。]$/u.test(bare)) return 0;
  if (bare.length >= 3 && /(?:해도|려도|어도|아도|더라도|하지만|하면|라면|다면|하며|면서|니까|는데|해서|지만)$/u.test(bare)) return 0;
  if (bare === "본" && /로$/u.test(words[index - 2] || "")) return 0;
  // A final product name can stand alone after a descriptive clause.
  if (index === words.length - 1 && /^[A-Z][A-Za-z0-9.-]{4,}$/u.test(right)) return 8;
  if (/^(수|및)$/u.test(bare) || /(?:는|은|을|를|의|형)$/u.test(bare) || /^(한|할|된|될|새|첫)$/u.test(bare)) return 60;
  if (/^[A-Z][A-Z0-9.-]{0,9}$/u.test(bare) && /[가-힣]/u.test(right)) return 55;
  return 20;
}

/** Break only at spaces. A custom measure can supply actual browser pixels. */
export function wrapKorean(text, { maxWidth = 30, maxLines = 3, measure = displayWidth } = {}) {
  if (typeof text !== "string" || text.length > 1000) throw new TypeError("text must be a string of at most 1000 characters");
  if (!Number.isFinite(maxWidth) || maxWidth <= 0) throw new RangeError("maxWidth must be positive and finite");
  if (![1, 2, 3].includes(maxLines)) throw new RangeError("maxLines must be 1, 2, or 3");
  const normalized = text.trim().replace(/\s+/gu, " ");
  const words = normalized ? normalized.split(" ") : [];
  if (words.length > 80) throw new RangeError("text must contain at most 80 words");
  if (!words.length) return { lines: [], text: "", widths: [], fits: true };
  const boundaries = words.map((_, index) => index ? boundaryCost(words, index) : 0);
  const segments = new Map();
  function segment(start, end) {
    const key = `${start}:${end}`;
    if (!segments.has(key)) {
      const value = words.slice(start, end).join(" "), width = measure(value);
      if (!Number.isFinite(width) || width < 0) throw new RangeError("measure must return a nonnegative finite width");
      segments.set(key, { value, width });
    }
    return segments.get(key);
  }
  let best;
  function consider(cuts) {
    const bounds = [0, ...cuts, words.length];
    const parts = bounds.slice(1).map((end, i) => segment(bounds[i], end));
    const widths = parts.map(part => part.width);
    const overflow = widths.reduce((sum, width) => sum + Math.max(0, width / maxWidth - 1), 0);
    const fits = overflow === 0;
    const balance = (Math.max(...widths) - Math.min(...widths)) / maxWidth;
    const missedClauses = boundaries.filter((cost, index) => index > 0 && cost === 0 && !cuts.includes(index)).length;
    const score = overflow * 10000 + cuts.reduce((sum, cut) => sum + boundaries[cut], 0) + missedClauses * 18 + Math.max(0, cuts.length - 1) * 8 + balance * 6;
    if (!best || (fits && !best.fits) || fits === best.fits && (score < best.score || score === best.score && widths[0] > best.widths[0])) best = { parts, widths, fits, score };
  }
  consider([]);
  if (!best.fits) {
    for (let first = 1; first < words.length && maxLines >= 2; first++) {
      consider([first]);
      for (let second = first + 1; second < words.length && maxLines >= 3; second++) consider([first, second]);
    }
  }
  const lines = best.parts.map(part => part.value);
  return { lines, text: lines.join("\n"), widths: best.widths, fits: best.fits };
}
