<script setup>
import { ref, provide } from 'vue'
import { useWordStore } from './composables/useWordStore'
import PracticeView from './views/PracticeView.vue'
import WordListView from './views/WordListView.vue'
import UploadView from './views/UploadView.vue'

const { doneCount, learningCount, totalCount } = useWordStore()

const currentView = ref('practice')
const wordListFilter = ref('all')

// Shared so WordListView can read the initial filter set by the sidebar
provide('wordListFilter', wordListFilter)

const navItems = [
  { key: 'practice', icon: '◈', label: '回译练习' },
  { key: 'wordlist', icon: '◉', label: '单词总览' },
  { key: 'upload', icon: '⇑', label: '上传词表' },
]

function goWordList(filter = 'all') {
  wordListFilter.value = filter
  currentView.value = 'wordlist'
}
</script>

<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-title">回译</div>
        <div class="brand-subtitle">Back Translation</div>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: currentView === item.key }"
          @click="currentView = item.key"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar-stats">
        <button class="stat-row stat-clickable" @click="goWordList('done')">
          <span class="stat-icon done-icon">✦</span>
          <span class="stat-text">已掌握</span>
          <span class="stat-val">{{ doneCount }} / {{ totalCount }}</span>
        </button>
        <button class="stat-row stat-clickable" @click="goWordList('learning')">
          <span class="stat-icon review-icon">◎</span>
          <span class="stat-text">待复习</span>
          <span class="stat-val">{{ learningCount }}</span>
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <PracticeView v-if="currentView === 'practice'" />
      <WordListView v-else-if="currentView === 'wordlist'" :initial-filter="wordListFilter" />
      <UploadView v-else-if="currentView === 'upload'" />
    </main>
  </div>
</template>

<style>
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #app {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
}
</style>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f0f2f5;
}

/* ── Sidebar ── */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #0f1629;
  display: flex;
  flex-direction: column;
  padding: 28px 0 24px;
  color: #fff;
}

.sidebar-brand {
  padding: 0 24px 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
}

.brand-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.5px;
  margin-top: 3px;
  font-style: italic;
}

/* ── Nav ── */
.sidebar-nav {
  flex: 1;
  padding: 16px 12px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  text-align: left;
  width: 100%;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.85);
}

.nav-item.active {
  background: rgba(64, 158, 255, 0.18);
  color: #5badff;
}

.nav-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.nav-label {
  font-weight: 500;
}

/* ── Stats ── */
.sidebar-stats {
  padding: 16px 24px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.stat-clickable {
  width: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  padding: 5px 4px;
  transition: background 0.15s;
  text-align: left;
}

.stat-clickable:hover {
  background: rgba(255, 255, 255, 0.07);
}

.stat-icon {
  font-size: 12px;
}

.done-icon { color: #52c41a; }
.review-icon { color: #faad14; }

.stat-text {
  color: rgba(255, 255, 255, 0.45);
  flex: 1;
}

.stat-val {
  color: rgba(255, 255, 255, 0.75);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* ── Main ── */
.main-content {
  flex: 1;
  overflow-y: auto;
  background: #f0f2f5;
}
</style>
