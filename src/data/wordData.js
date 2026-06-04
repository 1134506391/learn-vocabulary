/**
 * Parse a .txt file. Supports two formats:
 *
 * Format A – 4-line cycle (word and sentence each on their own line,
 *             separated by blank lines):
 *   Word or Phrase
 *
 *   Example sentence.
 *
 * Format B – word and sentence on the same line separated by a comma:
 *   Word, Example sentence.
 */
export function parseTxtContent(text) {
  const result = []

  // Normalise line endings, then split into non-empty chunks separated by
  // one or more blank lines.  Each chunk is either a word/phrase OR a sentence.
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const chunks = normalized.trim().split(/\n[ \t]*\n+/).map(c => c.trim()).filter(c => c)

  // Handle Format B: a single "Word, sentence." line (no blank-line pairs needed)
  const multiLineChunks = []
  for (const chunk of chunks) {
    const commaMatch = chunk.match(/^([A-Za-z][^\n,]+?),\s+(.+)/s)
    if (commaMatch && !chunk.includes('\n')) {
      result.push({ word: commaMatch[1].trim(), zh: '', en: commaMatch[2].trim() })
    } else {
      multiLineChunks.push(chunk)
    }
  }

  // Format A: chunks alternate as word, sentence, word, sentence …
  for (let i = 0; i + 1 < multiLineChunks.length; i += 2) {
    const word = multiLineChunks[i].replace(/\.$/, '').trim()
    const en   = multiLineChunks[i + 1].trim()
    if (word && en) {
      result.push({ word, zh: '', en })
    }
  }

  return result
}
