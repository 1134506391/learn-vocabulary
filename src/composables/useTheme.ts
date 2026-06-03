import { ref, watch, onMounted } from 'vue'

const THEME_KEY = 'btTheme'
type Theme = 'light' | 'dark'

const currentTheme = ref<Theme>('light')

export function useTheme() {
  function loadTheme(): Theme {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    if (saved) return saved
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  function saveTheme(theme: Theme) {
    localStorage.setItem(THEME_KEY, theme)
  }

  function toggleTheme() {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  }

  function setTheme(theme: Theme) {
    currentTheme.value = theme
  }

  function applyTheme() {
    const root = document.documentElement
    if (currentTheme.value === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  watch(currentTheme, (newTheme) => {
    saveTheme(newTheme)
    applyTheme()
  })

  onMounted(() => {
    currentTheme.value = loadTheme()
    applyTheme()
  })

  return {
    currentTheme,
    toggleTheme,
    setTheme,
  }
}
