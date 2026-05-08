/**
 * Parse a .txt file in the format:
 *   Word.
 *   Example sentence.
 * or
 *   Word, example sentence.
 */
export function parseTxtContent(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l)
  const result = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // "Word, sentence." format — single word or two-word phrase followed by comma
    const commaMatch = line.match(/^([A-Za-z][a-z]*(?:\s[A-Za-z][a-z]*)?),\s+(.+)/)
    if (commaMatch && commaMatch[1].split(' ').length <= 2) {
      result.push({
        word: commaMatch[1].trim(),
        zh: '',
        en: commaMatch[2].trim(),
      })
      i++
      continue
    }

    // "Word." format — single word (possibly hyphenated) on its own line
    const wordMatch = line.match(/^([A-Za-z][a-zA-Z-]*)\.?$/)
    if (wordMatch) {
      const word = wordMatch[1]
      const sentences = []
      i++
      // Collect following sentence lines until we hit the next word line
      while (i < lines.length) {
        const next = lines[i]
        const isNextWord = next.match(/^([A-Za-z][a-zA-Z-]*)\.?$/) ||
                           next.match(/^([A-Za-z][a-z]*(?:\s[A-Za-z][a-z]*)?),\s+/)
        if (isNextWord) break
        sentences.push(next)
        i++
      }
      if (sentences.length > 0) {
        result.push({ word, zh: '', en: sentences.join(' ') })
      }
      continue
    }

    i++
  }

  return result
}
