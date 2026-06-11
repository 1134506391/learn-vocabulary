/**
 * Parse a .txt file.
 *
 * Format: word on one line, example sentence on the next line,
 * optionally followed by a blank line to separate groups.
 *
 *   Word or Phrase
 *   Example sentence.
 *
 *   Next Word
 *   Next sentence.
 *
 * Blank lines are treated as visual separators and are ignored.
 * Non-empty lines are collected and paired sequentially:
 * line[0] = word, line[1] = sentence, line[2] = word, line[3] = sentence, …
 */
export function parseTxtContent(text) {
  const result = []

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n').map(l => l.trim()).filter(l => l)

  for (let i = 0; i + 1 < lines.length; i += 2) {
    const word = lines[i].replace(/\.$/, '').trim()
    const en   = lines[i + 1].trim()
    if (word && en) {
      result.push({ word, zh: '', en })
    }
  }

  return result
}
