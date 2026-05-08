<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useWordStore } from '../composables/useWordStore'

const { words, updateWord } = useWordStore()

// ── Chapter selector ──────────────────────────────────────────
const LAST_CHAPTER_KEY = 'btLastChapter'
const CHAPTER_POS_KEY  = 'btChapterPos'

function saveLastChapter(ch) {
  localStorage.setItem(LAST_CHAPTER_KEY, ch)
}
function loadLastChapter() {
  return localStorage.getItem(LAST_CHAPTER_KEY) || '__all__'
}
function saveChapterPos(ch, idx) {
  try {
    const map = JSON.parse(localStorage.getItem(CHAPTER_POS_KEY) || '{}')
    map[ch] = idx
    localStorage.setItem(CHAPTER_POS_KEY, JSON.stringify(map))
  } catch { /* ignore */ }
}
function loadChapterPos(ch) {
  try {
    const map = JSON.parse(localStorage.getItem(CHAPTER_POS_KEY) || '{}')
    return map[ch] ?? 0
  } catch { return 0 }
}

const selectedChapter = ref('__all__')

const chapterList = computed(() => {
  const set = new Set()
  for (const w of words.value) {
    if (w.chapter) set.add(w.chapter)
  }
  return Array.from(set)
})

const wordsInChapter = computed(() => {
  if (selectedChapter.value === '__all__') return words.value
  return words.value.filter(w => (w.chapter || '未分类') === selectedChapter.value)
})

// ── Practice state ────────────────────────────────────────────
const currentIndex = ref(0)
const currentStep  = ref(1)
const inputZh      = ref('')
const inputEn      = ref('')
const savedUserZh  = ref('')

const currentWord = computed(() => wordsInChapter.value[currentIndex.value])

// Reset step when word changes
watch(currentIndex, () => {
  currentStep.value = 1
  inputZh.value = currentWord.value?.userZh ?? ''
  inputEn.value = ''
  savedUserZh.value = ''
  saveChapterPos(selectedChapter.value, currentIndex.value)
})

// When chapter changes: save old position, restore new chapter's position
watch(selectedChapter, (newCh) => {
  saveLastChapter(newCh)
  const saved = loadChapterPos(newCh)
  const max   = Math.max(0, wordsInChapter.value.length - 1)
  currentIndex.value = Math.min(saved, max)
  currentStep.value  = 1
  inputZh.value = currentWord.value?.userZh ?? ''
  inputEn.value = ''
  savedUserZh.value = ''
})

onMounted(() => {
  selectedChapter.value = loadLastChapter()
  // Make sure the loaded chapter still exists
  if (selectedChapter.value !== '__all__' && !chapterList.value.includes(selectedChapter.value)) {
    selectedChapter.value = '__all__'
  }
  const saved = loadChapterPos(selectedChapter.value)
  const max   = Math.max(0, wordsInChapter.value.length - 1)
  currentIndex.value = Math.min(saved, max)
})

// ── Navigation ───────────────────────────────────────────────
function goNext() {
  if (currentIndex.value < wordsInChapter.value.length - 1) currentIndex.value++
}
function goPrev() {
  if (currentIndex.value > 0) currentIndex.value--
}
function skipWord() { goNext() }

// ── Step actions ──────────────────────────────────────────────
function completeStep1() {
  if (!inputZh.value.trim()) return
  savedUserZh.value = inputZh.value.trim()
  updateWord(currentWord.value.id, {
    userZh: inputZh.value.trim(),
    status: currentWord.value.status === 'new' ? 'learning' : currentWord.value.status,
  })
  currentStep.value = 2
  inputEn.value = ''
}

function completeStep2() {
  if (!inputEn.value.trim()) return
  updateWord(currentWord.value.id, { userEn: inputEn.value.trim() })
  currentStep.value = 3
}

function markDone() {
  updateWord(currentWord.value.id, { status: 'done' })
  goNext()
}

function markReview() {
  updateWord(currentWord.value.id, { status: 'learning' })
  goNext()
}

function retryWord() {
  inputZh.value = ''
  inputEn.value = ''
  savedUserZh.value = ''
  currentStep.value = 1
}

// ── Progress ──────────────────────────────────────────────────
const chapterDoneCount = computed(() =>
  wordsInChapter.value.filter(w => w.status === 'done').length
)
const progressPercent = computed(() =>
  wordsInChapter.value.length > 0
    ? Math.round((chapterDoneCount.value / wordsInChapter.value.length) * 100)
    : 0
)

const stepLabels = {
  1: { num: '01', desc: '阅读英文，翻译成中文' },
  2: { num: '02', desc: '只看中文，回译成英文' },
  3: { num: '03', desc: '对比原文，查漏补缺' },
}

const chapterSelectLabel = computed(() =>
  selectedChapter.value === '__all__'
    ? `全部词汇（${words.value.length}）`
    : `${selectedChapter.value}（${wordsInChapter.value.length}）`
)
</script>

<template>
  <div class="practice-wrap">

    <!-- Chapter selector bar -->
    <div class="chapter-bar">
      <span class="chapter-bar-label">练习章节</span>
      <el-select
        v-model="selectedChapter"
        size="small"
        class="chapter-select"
        :placeholder="chapterSelectLabel"
      >
        <el-option value="__all__" :label="`全部词汇（${words.length}）`" />
        <el-option
          v-for="ch in chapterList"
          :key="ch"
          :value="ch"
          :label="ch"
        />
      </el-select>
    </div>

    <!-- Progress bar -->
    <div class="progress-bar-wrap">
      <div class="progress-bar-track">
        <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }" />
      </div>
      <span class="progress-label">{{ chapterDoneCount }}/{{ wordsInChapter.length }} 已掌握</span>
    </div>

    <!-- Practice card -->
    <div class="practice-card" v-if="currentWord">
      <!-- Step indicator -->
      <div class="step-indicator">
        <span class="step-badge">STEP {{ stepLabels[currentStep].num }}</span>
        <span class="step-desc">— {{ stepLabels[currentStep].desc }}</span>
      </div>

      <!-- Word tag -->
      <div class="word-tag-wrap">
        <el-tag type="warning" effect="light" size="large" class="word-tag">
          {{ currentWord.word }}
          <template v-if="currentWord.zh"> — {{ currentWord.zh }}</template>
        </el-tag>
        <span v-if="currentWord.chapter" class="word-chapter-tag">{{ currentWord.chapter }}</span>
      </div>

      <!-- Step 1: Read English, write Chinese -->
      <template v-if="currentStep === 1">
        <div class="sentence-block">
          <p class="en-sentence">{{ currentWord.en }}</p>
        </div>
        <div class="input-section">
          <div class="input-label">你的中文翻译</div>
          <el-input
            v-model="inputZh"
            type="textarea"
            :rows="4"
            placeholder="把上面的英文句子翻译成中文..."
            resize="none"
          />
        </div>
        <div class="action-row">
          <el-button @click="skipWord" plain>跳过</el-button>
          <el-button type="primary" @click="completeStep1" :disabled="!inputZh.trim()">
            完成，进入第 2 步 →
          </el-button>
        </div>
      </template>

      <!-- Step 2: Only see Chinese, back-translate to English -->
      <template v-else-if="currentStep === 2">
        <div class="user-zh-block">
          <div class="block-label">你的中文翻译</div>
          <p class="user-zh-text">{{ savedUserZh || currentWord.userZh }}</p>
        </div>
        <div class="input-section">
          <div class="input-label">你的英文回译</div>
          <el-input
            v-model="inputEn"
            type="textarea"
            :rows="4"
            placeholder="根据上面的中文，回译成英文（不能偷看原句）..."
            resize="none"
          />
        </div>
        <div class="action-row">
          <el-button @click="skipWord" plain>跳过</el-button>
          <el-button type="primary" @click="completeStep2" :disabled="!inputEn.trim()">
            完成，进入第 3 步 →
          </el-button>
        </div>
      </template>

      <!-- Step 3: Compare original and back-translation -->
      <template v-else-if="currentStep === 3">
        <div class="compare-block">
          <div class="compare-item original">
            <span class="compare-label">原文</span>
            <p class="compare-text">{{ currentWord.en }}</p>
          </div>
          <div class="compare-item user-translation">
            <span class="compare-label">你的回译</span>
            <p class="compare-text">{{ currentWord.userEn }}</p>
          </div>
        </div>
        <div class="compare-hint">
          <el-icon><InfoFilled /></el-icon>
          对比关键词与句式，找出自己表达的差距，重点记忆
        </div>
        <div class="action-row step3-actions">
          <el-button @click="retryWord" plain>重新练习</el-button>
          <div class="step3-right">
            <el-button @click="markReview">加入复习</el-button>
            <el-button type="primary" @click="markDone">标记已掌握 →</el-button>
          </div>
        </div>
      </template>
    </div>

    <!-- Bottom navigation -->
    <div class="nav-row" v-if="currentWord">
      <el-button text :disabled="currentIndex === 0" @click="goPrev" class="nav-btn">
        ← 上一个
      </el-button>
      <span class="nav-counter">{{ currentIndex + 1 }} / {{ wordsInChapter.length }}</span>
      <el-button text :disabled="currentIndex === wordsInChapter.length - 1" @click="goNext" class="nav-btn">
        下一个 →
      </el-button>
    </div>

    <!-- Empty state -->
    <div class="empty-state" v-else>
      <el-empty
        :description="words.length === 0 ? '还没有词汇，请先上传词表' : '该章节暂无词汇'"
        :image-size="120"
      >
        <el-button v-if="words.length === 0" type="primary">去上传词表</el-button>
      </el-empty>
    </div>

  </div>
</template>

<style scoped>
.practice-wrap {
  padding: 24px;
  max-width: 680px;
  margin: 0 auto;
}

/* ── Chapter bar ── */
.chapter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.chapter-bar-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
  font-weight: 500;
}

.chapter-select {
  flex: 1;
  max-width: 360px;
}

/* ── Progress ── */
.progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.progress-bar-track {
  flex: 1;
  height: 6px;
  background: #e4e7ed;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.progress-label {
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
}

/* ── Card ── */
.practice-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.step-badge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #f56c1c;
  background: #fef0e6;
  padding: 3px 8px;
  border-radius: 4px;
}

.step-desc {
  font-size: 13px;
  color: #909399;
}

.word-tag-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.word-tag {
  font-size: 14px;
  font-weight: 600;
}

.word-chapter-tag {
  font-size: 11px;
  color: #909399;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 2px 8px;
  border: 1px solid #e4e7ed;
}

.sentence-block {
  background: #f8f9fb;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
}

.en-sentence {
  font-size: 18px;
  font-weight: 500;
  color: #1d2129;
  margin: 0;
  line-height: 1.6;
}

.user-zh-block {
  background: #f0f7ff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  border-left: 3px solid #409eff;
}

.block-label {
  font-size: 11px;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.user-zh-text {
  font-size: 16px;
  color: #1d2129;
  margin: 0;
  line-height: 1.7;
}

.input-section {
  margin-bottom: 20px;
}

.input-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.compare-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.compare-item {
  border-radius: 8px;
  padding: 14px 18px;
}

.compare-item.original {
  background: #f6ffed;
  border-left: 3px solid #67c23a;
}

.compare-item.user-translation {
  background: #fff7e6;
  border-left: 3px solid #e6a23c;
}

.compare-label {
  font-size: 11px;
  font-weight: 600;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 6px;
}

.compare-text {
  font-size: 15px;
  color: #1d2129;
  margin: 0;
  line-height: 1.6;
}

.compare-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
  background: #f5f7fa;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 20px;
}

.step3-actions { justify-content: space-between; }
.step3-right { display: flex; gap: 10px; }

.nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding: 0 4px;
}

.nav-counter {
  font-size: 14px;
  color: #909399;
}

.nav-btn {
  font-size: 14px;
  color: #606266;
}

.empty-state {
  display: flex;
  justify-content: center;
  padding-top: 60px;
}
</style>
