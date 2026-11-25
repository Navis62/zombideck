// No React here, so the tests can import it.

/** Lines `text` takes when `chars` fit on one; Infinity when a word is longer. */
export function wrappedLines(text: string, chars: number): number {
  let lines = 0;
  for (const paragraph of text.split('\n')) {
    let used = 0;
    lines += 1;
    for (const word of paragraph.split(/\s+/)) {
      if (word.length > chars) return Infinity;
      if (used > 0 && used + 1 + word.length > chars) {
        lines += 1;
        used = word.length;
      } else {
        used += (used > 0 ? 1 : 0) + word.length;
      }
    }
  }
  return lines;
}

/** Design px box; `line` is line height over size, `charEm` a letter's width in em. */
export type TextBox = { width: number; height: number; max: number; min: number; line: number; charEm: number; lines?: number };

/** Largest size at which `text` fits (web has no shrink-to-fit). */
export function modernTextSize(text: string, box: TextBox): number {
  for (let size = box.max; size > box.min; size -= 0.5) {
    const lines = wrappedLines(text, Math.floor(box.width / (box.charEm * size)));
    if (lines <= (box.lines ?? Infinity) && lines * size * box.line <= box.height) return size;
  }
  return box.min;
}
