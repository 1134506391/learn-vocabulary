import { reactive, computed } from 'vue'

const STORAGE_KEY = 'btWords_v1'
const OLD_STORAGE_KEY = 'btWords'

function loadFromStorage() {
  try {
    // First try to load from the new key
    const raw = localStorage.getItem(STORAGE_KEY)
    console.log(`[WordStore] Load from ${STORAGE_KEY}: ${raw ? 'found (' + raw.length + ' chars)' : 'not found'}`)
    
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        console.log(`[WordStore] Parsed successfully: ${Array.isArray(parsed) ? parsed.length + ' items' : 'not an array'}`)
        return parsed
      } catch (e) {
        console.error(`[WordStore] JSON parse error:`, e)
      }
    }
    
    // If not found, try to migrate from the old key
    const oldRaw = localStorage.getItem(OLD_STORAGE_KEY)
    console.log(`[WordStore] Load from ${OLD_STORAGE_KEY}: ${oldRaw ? 'found' : 'not found'}`)
    
    if (oldRaw) {
      const data = JSON.parse(oldRaw)
      // Migrate to new key
      localStorage.setItem(STORAGE_KEY, oldRaw)
      console.log(`[WordStore] Migrated from ${OLD_STORAGE_KEY} to ${STORAGE_KEY}`)
      return data
    }
    
    return null
  } catch (e) {
    console.error(`[WordStore] Load error:`, e)
    return null
  }
}

function persist(words) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words))
}

function makeWordRecord(w, id) {
  return {
    id: id ?? w.id,
    word: w.word,
    zh: w.zh ?? '',
    en: w.en,
    chapter: w.chapter ?? '',
    status: w.status ?? 'new',   // 'new' | 'learning' | 'done'
    userZh: w.userZh ?? '',
    userEn: w.userEn ?? '',
  }
}

// Module-level singleton so state is shared across all component instances
const state = reactive({
  words: [],
  initialized: false,
})

function ensureInit() {
  if (state.initialized) return
  const stored = loadFromStorage()
  state.words = stored && stored.length > 0 ? stored : []
  state.initialized = true
}

export function useWordStore() {
  ensureInit()

  function updateWord(id, updates) {
    const idx = state.words.findIndex((w) => w.id === id)
    if (idx !== -1) {
      state.words[idx] = { ...state.words[idx], ...updates }
      persist(state.words)
    }
  }

  function addWords(newWords) {
    const maxId = state.words.reduce((m, w) => Math.max(m, w.id), 0)
    const toAdd = newWords.map((w, i) => makeWordRecord(w, maxId + i + 1))
    state.words = [...state.words, ...toAdd]
    persist(state.words)
  }

  function deleteChapter(chapterName) {
    state.words = state.words.filter((w) => (w.chapter || '未分类') !== chapterName)
    persist(state.words)
  }

  function resetAll() {
    state.words = []
    persist(state.words)
  }

  const words = computed(() => state.words)
  const doneCount = computed(() => state.words.filter((w) => w.status === 'done').length)
  const learningCount = computed(() => state.words.filter((w) => w.status === 'learning').length)
  const totalCount = computed(() => state.words.length)

  return {
    words,
    doneCount,
    learningCount,
    totalCount,
    updateWord,
    addWords,
    deleteChapter,
    resetAll,
  }
}
