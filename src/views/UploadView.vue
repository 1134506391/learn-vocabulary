<script setup>
import { ref } from 'vue'
import { useWordStore } from '../composables/useWordStore'
import { parseTxtContent } from '../data/wordData'
import { ElMessage, ElMessageBox } from 'element-plus'

const { words, addWords, resetAll } = useWordStore()

const chapterTitle = ref('')
const pasteText = ref('')
const previewWords = ref([])
const isParsed = ref(false)

function handleFilePick(e) {
  const file = e.target.files[0]
  if (!file) return
  // Auto-fill chapter title from filename if empty
  if (!chapterTitle.value) {
    chapterTitle.value = file.name.replace(/\.[^.]+$/, '')
  }
  const reader = new FileReader()
  reader.onload = (ev) => {
    pasteText.value = ev.target.result
    runParse()
  }
  reader.readAsText(file, 'utf-8')
  e.target.value = ''
}

function runParse() {
  if (!pasteText.value.trim()) {
    ElMessage.warning('内容为空，请粘贴或上传文件')
    return
  }
  previewWords.value = parseTxtContent(pasteText.value)
  isParsed.value = true
  if (previewWords.value.length === 0) {
    ElMessage.error('未能解析出任何词汇，请检查格式')
  }
}

function confirmImport() {
  if (previewWords.value.length === 0) return
  const chapter = chapterTitle.value.trim() || '未命名章节'
  const wordsWithChapter = previewWords.value.map(w => ({ ...w, chapter }))
  addWords(wordsWithChapter)
  ElMessage.success(`已成功导入 ${wordsWithChapter.length} 个词汇到「${chapter}」`)
  pasteText.value = ''
  chapterTitle.value = ''
  previewWords.value = []
  isParsed.value = false
}

async function handleReset() {
  try {
    await ElMessageBox.confirm(
      '将清空所有词汇和学习记录，操作不可恢复。确定吗？',
      '清空词库',
      { confirmButtonText: '确定清空', cancelButtonText: '取消', type: 'warning' }
    )
    resetAll()
    ElMessage.success('词库已清空')
  } catch {
    // cancelled
  }
}
</script>

<template>
  <div class="upload-wrap">
    <div class="upload-header">
      <h2 class="page-title">上传词表</h2>
      <p class="page-desc">支持 .txt 文件上传或直接粘贴文本。每组词汇格式：单词单独一行，例句另起一行；或"单词, 例句"写在同一行。</p>
    </div>

    <div class="format-example">
      <div class="format-title">格式示例</div>
      <pre class="format-code">Galaxy.
The sun is only a very small star in the galaxy.

Fossil, I know that the majority of the energy we consume comes from fossil fuel energy sources.</pre>
    </div>

    <div class="upload-section">
      <!-- Chapter title input -->
      <div class="chapter-input-wrap">
        <div class="chapter-input-label">
          <el-icon><Collection /></el-icon>
          章节 / 分组名称
          <span class="chapter-input-hint">（上传后词汇将归入此章节，例如：雅思词汇真经 Chapter 1）</span>
        </div>
        <el-input
          v-model="chapterTitle"
          placeholder="例如：雅思词汇真经 Chapter 1"
          clearable
          class="chapter-input"
        />
      </div>

      <div class="upload-actions">
        <label class="file-btn">
          <input type="file" accept=".txt" @change="handleFilePick" hidden />
          <el-button>
            <el-icon style="margin-right:4px"><Upload /></el-icon>
            选择 .txt 文件
          </el-button>
        </label>
        <span class="or-divider">或</span>
        <span class="hint">直接在下方粘贴文本</span>
      </div>

      <el-input
        v-model="pasteText"
        type="textarea"
        :rows="10"
        placeholder="在此粘贴词汇文本..."
        resize="none"
        class="paste-area"
      />

      <div class="parse-actions">
        <el-button type="primary" @click="runParse" :disabled="!pasteText.trim()">
          解析预览
        </el-button>
      </div>
    </div>

    <!-- Preview -->
    <div v-if="isParsed" class="preview-section">
      <div class="preview-header">
        <span class="preview-title">解析结果预览（共 {{ previewWords.length }} 条）</span>
        <el-button type="success" @click="confirmImport" :disabled="previewWords.length === 0">
          确认导入
        </el-button>
      </div>

      <div class="preview-list">
        <div v-for="(w, i) in previewWords" :key="i" class="preview-item">
          <span class="preview-index">{{ i + 1 }}</span>
          <div class="preview-content">
            <span class="preview-word">{{ w.word }}</span>
            <span v-if="w.zh" class="preview-zh">{{ w.zh }}</span>
            <p class="preview-en">{{ w.en }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats & Reset -->
    <div class="stats-section">
      <div class="stats-card">
        <div class="stats-num">{{ words.length }}</div>
        <div class="stats-label">词库总量</div>
      </div>
      <div class="stats-divider" />
      <div class="stats-card">
        <div class="stats-num done">{{ words.filter(w => w.status === 'done').length }}</div>
        <div class="stats-label">已掌握</div>
      </div>
      <div class="stats-divider" />
      <div class="stats-card">
        <div class="stats-num learning">{{ words.filter(w => w.status === 'learning').length }}</div>
        <div class="stats-label">学习中</div>
      </div>
    </div>

    <div class="danger-zone">
      <div class="danger-title">危险操作</div>
      <div class="danger-row">
        <span class="danger-desc">清空所有词汇和学习记录，操作不可恢复</span>
        <el-button type="danger" plain size="small" @click="handleReset">清空词库</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-wrap {
  padding: 24px;
  max-width: 760px;
}

.upload-header {
  margin-bottom: 20px;
}

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
  line-height: 1.6;
}

.format-example {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 24px;
}

.format-title {
  font-size: 12px;
  font-weight: 600;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.format-code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: #303133;
  margin: 0;
  line-height: 1.7;
  white-space: pre-wrap;
}

.upload-section {
  margin-bottom: 24px;
}

.chapter-input-wrap {
  background: #f0f7ff;
  border: 1px solid #d0e8ff;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.chapter-input-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.chapter-input-hint {
  font-size: 12px;
  font-weight: 400;
  color: #909399;
}

.chapter-input {
  width: 100%;
}

.upload-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.or-divider {
  color: #c0c4cc;
  font-size: 13px;
}

.hint {
  font-size: 13px;
  color: #909399;
}

.paste-area {
  margin-bottom: 12px;
}

.parse-actions {
  display: flex;
  justify-content: flex-end;
}

.preview-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e4e7ed;
  padding: 16px;
  margin-bottom: 24px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
}

.preview-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  background: #f8f9fb;
  border-radius: 6px;
}

.preview-index {
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e4e7ed;
  border-radius: 50%;
  font-size: 11px;
  color: #606266;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 1px;
}

.preview-content {
  flex: 1;
}

.preview-word {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  margin-right: 8px;
}

.preview-zh {
  font-size: 13px;
  color: #909399;
}

.preview-en {
  font-size: 13px;
  color: #606266;
  margin: 4px 0 0;
  line-height: 1.5;
}

.stats-section {
  display: flex;
  align-items: center;
  gap: 0;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e4e7ed;
  padding: 20px;
  margin-bottom: 24px;
}

.stats-card {
  flex: 1;
  text-align: center;
}

.stats-num {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 6px;
}

.stats-num.done { color: #67c23a; }
.stats-num.learning { color: #e6a23c; }

.stats-label {
  font-size: 13px;
  color: #909399;
}

.stats-divider {
  width: 1px;
  height: 40px;
  background: #e4e7ed;
  margin: 0 10px;
}

.danger-zone {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #fab6b6;
  padding: 16px 20px;
}

.danger-title {
  font-size: 13px;
  font-weight: 600;
  color: #f56c6c;
  margin-bottom: 10px;
}

.danger-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.danger-desc {
  font-size: 13px;
  color: #909399;
}
</style>
