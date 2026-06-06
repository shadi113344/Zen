/** Local Noto Emoji Animation Lottie assets (from fonts.gstatic.com). */
export function notoEmojiLottieUrl(codepoint: string): string {
  return `/noto-emoji/${codepoint}.json`;
}

const lottieCache = new Map<string, object>();

export async function loadNotoEmojiLottie(codepoint: string): Promise<object> {
  const cached = lottieCache.get(codepoint);
  if (cached) return cached;
  const res = await fetch(notoEmojiLottieUrl(codepoint));
  if (!res.ok) throw new Error(`Noto emoji Lottie not found: ${codepoint}`);
  const data = (await res.json()) as object;
  lottieCache.set(codepoint, data);
  return data;
}
