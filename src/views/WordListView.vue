<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useWordStore } from '../composables/useWordStore'

const props = defineProps({
  initialFilter: {
    type: Object, // ref passed from App.vue
    default: null,
  },
})

const { words, updateWord, deleteChapter } = useWordStore()

const searchText = ref('')
const filterStatus = ref(props.initialFilter?.value ?? 'all')
const selectedChapter = ref('__all__')

// Keep status filter in sync when parent triggers it (sidebar click)
watch(
  () => props.initialFilter?.value,
  (val) => { if (val) filterStatus.value = val }
)

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '待学习', value: 'new' },
  { label: '待复习', value: 'learning' },
  { label: '已掌握', value: 'done' },
]

const statusMap = {
  new: { label: '待学习', type: 'info' },
  learning: { label: '待复习', type: 'warning' },
  done: { label: '已掌握', type: 'success' },
}

// Build chapter list with stats
const chapters = computed(() => {
  const map = new Map()
  for (const w of words.value) {
    const key = w.chapter || '未分类'
    if (!map.has(key)) map.set(key, { total: 0, done: 0 })
    map.get(key).total++
    if (w.status === 'done') map.get(key).done++
  }
  return Array.from(map.entries()).map(([name, stat]) => ({ name, ...stat }))
})

const totalDone = computed(() => words.value.filter(w => w.status === 'done').length)

// Words filtered by chapter + status + search
const filtered = computed(() => {
  return words.value.filter((w) => {
    const chapterKey = w.chapter || '未分类'
    const matchChapter = selectedChapter.value === '__all__' || chapterKey === selectedChapter.value
    const matchStatus = filterStatus.value === 'all' || w.status === filterStatus.value
    const matchText =
      !searchText.value ||
      w.word.toLowerCase().includes(searchText.value.toLowerCase()) ||
      w.zh.includes(searchText.value) ||
      w.en.toLowerCase().includes(searchText.value.toLowerCase())
    return matchChapter && matchStatus && matchText
  })
})

const currentChapterLabel = computed(() =>
  selectedChapter.value === '__all__' ? '全部词汇' : selectedChapter.value
)

function toggleStatus(word) {
  const next = word.status === 'done' ? 'new' : 'done'
  updateWord(word.id, { status: next })
}

function chapterProgress(ch) {
  return ch.total > 0 ? Math.round((ch.done / ch.total) * 100) : 0
}

async function confirmDeleteChapter(chName) {
  try {
    await ElMessageBox.confirm(
      `将删除「${chName}」下的全部 ${chapters.value.find(c => c.name === chName)?.total ?? 0} 个词汇，且不可恢复。确定删除吗？`,
      '删除章节',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning', confirmButtonClass: 'el-button--danger' }
    )
    if (selectedChapter.value === chName) selectedChapter.value = '__all__'
    deleteChapter(chName)
    ElMessage.success(`已删除章节「${chName}」`)
  } catch {
    // cancelled
  }
}
</script>

<template>
  <div class="wordlist-layout">
    <!-- Chapter sidebar -->
    <aside class="chapter-sidebar">
      <div class="chapter-sidebar-title">章节</div>

      <button
        class="chapter-item"
        :class="{ active: selectedChapter === '__all__' }"
        @click="selectedChapter = '__all__'"
      >
        <div class="chapter-item-row">
          <span class="chapter-name">全部</span>
          <span class="chapter-count">{{ words.length }}</span>
        </div>
        <div class="chapter-progress-bar">
          <div
            class="chapter-progress-fill"
            :style="{ width: (words.length ? Math.round(totalDone / words.length * 100) : 0) + '%' }"
          />
        </div>
      </button>

      <div
        v-for="ch in chapters"
        :key="ch.name"
        class="chapter-item-wrap"
        :class="{ active: selectedChapter === ch.name }"
      >
        <button
          class="chapter-item"
          @click="selectedChapter = ch.name"
        >
          <div class="chapter-item-row">
            <span class="chapter-name" :title="ch.name">{{ ch.name }}</span>
            <span class="chapter-count">{{ ch.done }}/{{ ch.total }}</span>
          </div>
          <div class="chapter-progress-bar">
            <div
              class="chapter-progress-fill"
              :style="{ width: chapterProgress(ch) + '%' }"
            />
          </div>
        </button>
        <button
          class="chapter-delete-btn"
          title="删除此章节"
          @click.stop="confirmDeleteChapter(ch.name)"
        >
          <el-icon><Delete /></el-icon>
        </button>
      </div>
    </aside>

    <!-- Main word area -->
    <div class="wordlist-main">
      <div class="wordlist-header">
        <div class="header-left">
          <h2 class="page-title">{{ currentChapterLabel }}</h2>
          <p class="page-desc">
            共 {{ filtered.length }} 个词汇
            <template v-if="selectedChapter !== '__all__'">
              ，已掌握 {{ filtered.filter(w => w.status === 'done').length }} 个
            </template>
            <template v-else>
              ，已掌握 {{ totalDone }} / {{ words.length }} 个
            </template>
          </p>
        </div>
      </div>

      <div class="filter-row">
        <el-input
          v-model="searchText"
          placeholder="搜索单词、中文或例句..."
          clearable
          class="search-input"
          prefix-icon="Search"
        />
        <el-radio-group v-model="filterStatus" size="small">
          <el-radio-button v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <div class="word-grid" v-if="filtered.length > 0">
        <div
          v-for="word in filtered"
          :key="word.id"
          class="word-card"
          :class="'status-' + word.status"
        >
          <div class="word-card-top">
            <div class="word-info">
              <span class="word-en">{{ word.word }}</span>
              <span class="word-zh" v-if="word.zh">{{ word.zh }}</span>
            </div>
            <el-tag :type="statusMap[word.status]?.type" size="small" effect="plain">
              {{ statusMap[word.status]?.label }}
            </el-tag>
          </div>
          <p class="word-sentence">{{ word.en }}</p>
          <!-- Chapter badge when showing all chapters -->
          <div v-if="selectedChapter === '__all__' && word.chapter" class="word-chapter-badge">
            {{ word.chapter }}
          </div>
          <div class="word-card-footer" v-if="word.userZh || word.userEn">
            <div v-if="word.userZh" class="saved-translation">
              <span class="saved-label">我的中译：</span>{{ word.userZh }}
            </div>
            <div v-if="word.userEn" class="saved-translation">
              <span class="saved-label">我的回译：</span>{{ word.userEn }}
            </div>
          </div>
          <div class="word-card-actions">
            <el-button
              size="small"
              :type="word.status === 'done' ? 'default' : 'success'"
              plain
              @click="toggleStatus(word)"
            >
              {{ word.status === 'done' ? '取消掌握' : '标记掌握' }}
            </el-button>
          </div>
        </div>
      </div>

      <el-empty v-else description="没有符合条件的词汇" />
    </div>
  </div>
</template>

<style scoped>
.wordlist-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* ── Chapter Sidebar ── */
.chapter-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  padding: 20px 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chapter-sidebar-title {
  font-size: 11px;
  font-weight: 700;
  color: #c0c4cc;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 0 8px 10px;
}

/* "全部" button (standalone) */
.chapter-item {
  width: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 7px;
  padding: 8px 10px;
  text-align: left;
  transition: background 0.15s;
}

.chapter-item:hover {
  background: #f5f7fa;
}

.chapter-item.active {
  background: #ecf5ff;
}

.chapter-item.active .chapter-name {
  color: #409eff;
}

/* Chapter row wrapper (chapter button + delete button) */
.chapter-item-wrap {
  display: flex;
  align-items: center;
  border-radius: 7px;
  transition: background 0.15s;
}

.chapter-item-wrap:hover {
  background: #f5f7fa;
}

.chapter-item-wrap.active {
  background: #ecf5ff;
}

.chapter-item-wrap .chapter-item {
  flex: 1;
  border-radius: 7px 0 0 7px;
  min-width: 0;
}

.chapter-item-wrap .chapter-item:hover {
  background: transparent;
}

.chapter-item-wrap.active .chapter-name {
  color: #409eff;
}

.chapter-delete-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  color: #c0c4cc;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
  margin-right: 4px;
}

.chapter-item-wrap:hover .chapter-delete-btn {
  opacity: 1;
}

.chapter-delete-btn:hover {
  color: #f56c6c;
  background: #fef0f0;
}

.chapter-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  margin-bottom: 5px;
}

.chapter-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.chapter-count {
  font-size: 11px;
  color: #909399;
  white-space: nowrap;
  flex-shrink: 0;
}

.chapter-progress-bar {
  height: 3px;
  background: #e4e7ed;
  border-radius: 2px;
  overflow: hidden;
}

.chapter-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* ── Main Content ── */
.wordlist-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.wordlist-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-left {}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 4px;
}

.page-desc {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  width: 260px;
}

/* ── Word Grid ── */
.word-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.word-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e4e7ed;
  padding: 14px 16px;
  transition: box-shadow 0.2s;
}

.word-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.word-card.status-done  { border-left: 3px solid #67c23a; }
.word-card.status-learning { border-left: 3px solid #e6a23c; }
.word-card.status-new   { border-left: 3px solid #dcdfe6; }

.word-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.word-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.word-en {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}

.word-zh {
  font-size: 13px;
  color: #606266;
}

.word-sentence {
  font-size: 12px;
  color: #909399;
  margin: 0 0 8px;
  line-height: 1.6;
}

.word-chapter-badge {
  display: inline-block;
  font-size: 11px;
  color: #409eff;
  background: #ecf5ff;
  border-radius: 4px;
  padding: 1px 6px;
  margin-bottom: 8px;
}

.word-card-footer {
  border-top: 1px solid #f2f3f5;
  padding-top: 6px;
  margin-bottom: 8px;
}

.saved-translation {
  font-size: 11px;
  color: #909399;
  line-height: 1.7;
}

.saved-label {
  font-weight: 600;
  color: #606266;
}

.word-card-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
