<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { NDataTable, NTabs, NTabPane, NInput, NSpace, darkTheme, NConfigProvider, NButton, NSwitch, NText, NDrawer, NDrawerContent, NSelect, NDivider, NBadge } from 'naive-ui'
import { middle_1 } from '../dictionary/middle_1'
import { middle_2 } from '../dictionary/middle_2'
import { primary_1 } from '../dictionary/primary_1'
import { primary_2 } from '../dictionary/primary_2'
import { n2 } from '../dictionary/n2'
import { high_1 } from '../dictionary/high_1'
import { high_2 } from '../dictionary/high_2'

const words = { middle_1, middle_2, primary_1, primary_2, n2, high_1, high_2 }

// localStorage keys
const STORAGE_SHOW = 'showRemembered'
const STORAGE_HIDDEN = 'hiddenWordNos' // 使用no字段存储，格式更简洁

const showRemembered = ref(localStorage.getItem(STORAGE_SHOW) !== 'false')
// 迁移：清除旧格式数据（如果存在）
if (localStorage.getItem('hiddenWordKeys')) {
  localStorage.removeItem('hiddenWordKeys')
}
const hiddenWordKeys = ref(JSON.parse(localStorage.getItem(STORAGE_HIDDEN) || '[]'))

// settings drawer
const showSettings = ref(false)

// viewport for template
const viewH = ref(window.innerHeight)

// draggable float button state
const floatBtnPos = ref({ x: -1, y: -1 })
const isDragging = ref(false)
let floatBtnDown = false  // mousedown originated from float button
const DRAG_THRESHOLD = 10
let dragStart = { x: 0, y: 0 }
let dragStarted = false

function getFloatBtnInitialPos() {
  return { x: window.innerWidth - 80, y: window.innerHeight - 120 }
}

function onFloatBtnMouseDown(e) {
  floatBtnDown = true
  const p = floatBtnPos.value.x === -1 ? getFloatBtnInitialPos() : floatBtnPos.value
  dragStart = { x: e.clientX - p.x, y: e.clientY - p.y }
  dragStarted = false
  isDragging.value = true
}

function onFloatBtnMouseMove(e) {
  if (!isDragging.value) return
  const dx = e.clientX - dragStart.x - floatBtnPos.value.x
  const dy = e.clientY - dragStart.y - floatBtnPos.value.y
  if (!dragStarted && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
    dragStarted = true
  }
  if (dragStarted) {
    const vw = window.innerWidth
    const vh = window.innerHeight
    floatBtnPos.value = {
      x: Math.max(0, Math.min(e.clientX - dragStart.x, vw - 48)),
      y: Math.max(0, Math.min(e.clientY - dragStart.y, vh - 48))
    }
  }
}

function onFloatBtnMouseUp() {
  if (floatBtnDown && !dragStarted) {
    showSettings.value = !showSettings.value
  }
  isDragging.value = false
  dragStarted = false
  floatBtnDown = false
}

onMounted(() => {
  window.addEventListener('mousemove', onFloatBtnMouseMove)
  window.addEventListener('mouseup', onFloatBtnMouseUp)
  window.addEventListener('hashchange', onHashChange)
  floatBtnPos.value = getFloatBtnInitialPos()
  loadScrollPositions()
  // 初始化当前章节的滚动位置
  setTimeout(() => {
    restoreScrollPosition(chapValue.value)
  }, 1000)  // 加长延时确保表格渲染完成
})

// wordlist computed
// Parse initial page from URL hash
function getInitialPage() {
  const hash = window.location.hash.slice(1) // remove #
  if (['words', 'hidden', 'quiz'].includes(hash)) {
    return hash
  }
  return 'words'
}

const activePage = ref(getInitialPage()) // 'words' | 'hidden' | 'quiz' 当前页面

// Watch activePage and update URL hash
watch(activePage, (val) => {
  window.location.hash = val
})

// Listen for hash changes (browser back/forward)
function onHashChange() {
  const hash = window.location.hash.slice(1)
  if (['words', 'hidden', 'quiz'].includes(hash) && hash !== activePage.value) {
    activePage.value = hash
  }
}
const hiddenChapValue = ref('primary_1')
let isRestoringScroll = false  // 恢复滚动时暂停保存

// Quiz state - 默认与单词页面选择一致（在 chapValue 定义后初始化）
const quizChapValue = ref('primary_2')
const quizWords = ref([])
const quizIndex = ref(0)
const quizInput = ref('')
const quizResult = ref(null) // null | 'correct' | 'wrong'
const quizBatchSize = ref(5)
const quizDisplayMode = ref('kanji') // 'kanji' | 'chinese' - what to show as question

// Generate random quiz words (exclude hidden words)
function generateQuizWords() {
  const chapWords = (words[quizChapValue.value] || []).filter(
    item => !hiddenWordKeys.value.includes(wordKey(item))
  )
  if (chapWords.length === 0) {
    quizWords.value = []
    return
  }

  // Shuffle and take batch size
  const shuffled = [...chapWords].sort(() => Math.random() - 0.5)
  quizWords.value = shuffled.slice(0, Math.min(quizBatchSize.value, shuffled.length))
  quizIndex.value = 0
  quizInput.value = ''
  quizResult.value = null
  // Randomly decide what to show for this batch
  quizDisplayMode.value = Math.random() > 0.5 ? 'kanji' : 'chinese'
}

// Check quiz answer
function checkQuizAnswer() {
  if (quizWords.value.length === 0) return
  
  const current = quizWords.value[quizIndex.value]
  const input = quizInput.value.trim()
  
  // User can answer with any of the other two fields
  const validAnswers = [current.kanji, current.kana, current.chinese]
  quizResult.value = validAnswers.includes(input) ? 'correct' : 'wrong'
}

// Next quiz word
function nextQuizWord() {
  if (quizIndex.value < quizWords.value.length - 1) {
    quizIndex.value++
    quizInput.value = ''
    quizResult.value = null
  } else {
    // Batch complete, generate new batch
    generateQuizWords()
  }
}

// Start quiz
function startQuiz() {
  generateQuizWords()
}

// 滚动事件处理 - 监听表格滚动（需要在 activePage 和 hiddenChapValue 定义后）
function onTableScroll(e) {
  const scrollTop = e.target.scrollTop
  const index = Math.round(scrollTop / 24)  // 估算行索引
  if (index >= 0) {
    // 根据当前页面和章节保存位置
    const key = activePage.value === 'words' ? chapValue.value : 'hidden_' + hiddenChapValue.value
    // 恢复滚动时不保存
    if (!isRestoringScroll) {
      saveScrollPosition(key, index)
    }
  }
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onFloatBtnMouseMove)
  window.removeEventListener('mouseup', onFloatBtnMouseUp)
  window.removeEventListener('hashchange', onHashChange)
})

// 双击计时器状态
let lastClickTime = 0
let lastClickKey = null  // 存 key 字符串

function makeCellClickHandler(row) {
  const key = wordKey(row)
  const now = Date.now()
  
  if (now - lastClickTime < 350 && lastClickKey === key) {
    // 双击同一行
    if (activePage.value === 'words') {
      hideWord(row)
    } else if (activePage.value === 'hidden') {
      unhideWord(key)
    }
    lastClickTime = 0
    lastClickKey = null
  } else {
    lastClickTime = now
    lastClickKey = key
  }
}

const columns = ref([
  { title: "", key: "no", width: 50, className: 'column-class' },
  { title: "かな", key: "kana", className: 'column-class' },
  { title: "漢字", key: "kanji", className: 'column-class' },
  { title: "词性", key: "part", width: 60, className: 'column-class' },
  { title: "中文", key: "chinese", className: 'column-class' },
])

function createRowProps(row) {
  return { onClick: () => makeCellClickHandler(row) }
}

const chapValue = ref(localStorage.getItem('defaultChap') || 'primary_2')
quizChapValue.value = chapValue.value  // 同步初始值
const firstVisibleIndex = ref({})  // 存储每个章节第一个可见行的索引

// 加载保存的滚动位置
function loadScrollPositions() {
  try {
    const saved = localStorage.getItem('scrollPositions')
    if (saved) {
      firstVisibleIndex.value = JSON.parse(saved)
    }
  } catch (e) {
    firstVisibleIndex.value = {}
  }
}

// 保存滚动位置
function saveScrollPositions() {
  localStorage.setItem('scrollPositions', JSON.stringify(firstVisibleIndex.value))
}

let filterKeyword = ref(null)

const tabOptions = [
  { label: '初上', value: 'primary_1' },
  { label: '初下', value: 'primary_2' },
  { label: '中上', value: 'middle_1' },
  { label: '中下', value: 'middle_2' },
  { label: 'N2', value: 'n2' },
  { label: '高上', value: 'high_1' },
  { label: '高下', value: 'high_2' },
]

// build unique key for a word entry
function wordKey(item) {
  if (!item) return ''
  return String(item.no || '')
}

// hide a word (记住)
// 统一回退栈：每次操作只记录一条，可以是 'hide' 或 'restore'
const undoStack = ref([])
const toastMsg = ref('')
let toastTimer = null

function showToast(msg, duration = 4000) {
  toastMsg.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMsg.value = ''
  }, duration)
}

function hideWord(item) {
  const key = wordKey(item)
  if (!hiddenWordKeys.value.includes(key)) {
    hiddenWordKeys.value.push(key)
    localStorage.setItem(STORAGE_HIDDEN, JSON.stringify(hiddenWordKeys.value))
    undoStack.value = [] // 新操作清空栈，保持只有一条
    undoStack.value.push({ type: 'hide', key, label: item.kana })
    if (undoStack.value.length > 20) undoStack.value.shift()
    showToast(`已记住：${item.kana}`, 4000)
  }
}

function unhideWord(key) {
  hiddenWordKeys.value = hiddenWordKeys.value.filter(k => k !== key)
  localStorage.setItem(STORAGE_HIDDEN, JSON.stringify(hiddenWordKeys.value))
  // 找到这个 word 的完整数据用于回退时重新隐藏
  let wordData = null
  Object.keys(words).forEach(chap => {
    const found = (words[chap] || []).find(w => wordKey(w) === key)
    if (found) wordData = found
  })
  undoStack.value = [] // 新操作清空栈，保持只有一条
  undoStack.value.push({ type: 'restore', key, label: wordData?.kana || '' })
  showToast(`已恢复：${wordData?.kana || ''}`, 4000)
}

function undoLastHide() {
  if (undoStack.value.length === 0) return
  const op = undoStack.value.pop()
  if (op.type === 'hide') {
    // 回退隐藏：把 key 从 hiddenWordKeys 中移除
    hiddenWordKeys.value = hiddenWordKeys.value.filter(k => k !== op.key)
  } else if (op.type === 'restore') {
    // 回退恢复：把 key 重新加回 hiddenWordKeys
    if (!hiddenWordKeys.value.includes(op.key)) {
      hiddenWordKeys.value.push(op.key)
    }
  }
  localStorage.setItem(STORAGE_HIDDEN, JSON.stringify(hiddenWordKeys.value))
  showToast('已回退')
}

function clearAllHidden() {
  hiddenWordKeys.value = []
  localStorage.setItem(STORAGE_HIDDEN, '[]')
}

function toggleShowRemembered(val) {
  showRemembered.value = val
  localStorage.setItem(STORAGE_SHOW, val)
}

watch(chapValue, (val) => {
  localStorage.setItem('defaultChap', val)
  // 同步更新测试页面的章节选择
  quizChapValue.value = val
  // 延迟恢复滚动位置，确保数据加载完成
  setTimeout(() => {
    restoreScrollPosition(val)
  }, 300)
})

// 保存当前可见的第一个行索引
function saveScrollPosition(chap, index) {
  firstVisibleIndex.value[chap] = index
  saveScrollPositions()
}

// 恢复滚动位置 - 遍历所有元素找滚动容器
function restoreScrollPosition(chap) {
  const saved = firstVisibleIndex.value[chap]
  const targetScrollTop = (typeof saved === 'number' && saved > 0) ? saved * 24 : 0
  isRestoringScroll = true

  // 遍历所有DOM元素找滚动容器
  const doRestore = () => {
    const allElements = document.querySelectorAll('*')
    let restored = false

    for (const el of allElements) {
      const style = getComputedStyle(el)
      if (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay') {
        const oldTop = el.scrollTop
        // 直接设置滚动位置
        el.scrollTop = targetScrollTop
        if (el.scrollTop !== oldTop) {
          restored = true
          break
        }
      }
    }

    isRestoringScroll = false
  }
  
  // 延迟执行，等待表格渲染
  if (targetScrollTop > 0) {
    setTimeout(doRestore, 800)  // 缩短到800ms
  } else {
    doRestore()
  }
}

function wordRowClass({ row }) {
  const cls = []
  const key = wordKey(row)
  if (hiddenWordKeys.value.includes(key)) {
    cls.push('row-hidden')
  }
  return cls.join(' ')
}

// 双击计时器状态


// 获取有已记住单词的章节列表
const hiddenChapOptions = computed(() => {
  const chapsWithHidden = []
  Object.keys(words).forEach(chap => {
    const hasHidden = (words[chap] || []).some(item => 
      hiddenWordKeys.value.includes(wordKey(item))
    )
    if (hasHidden) {
      const opt = tabOptions.find(o => o.value === chap)
      if (opt) chapsWithHidden.push(opt)
    }
  })
  return chapsWithHidden.length > 0 ? chapsWithHidden : [{ label: '全部', value: 'all' }]
})

// 监听 hiddenChapOptions 变化，确保 hiddenChapValue 始终是有效值
watch(hiddenChapOptions, (newOptions) => {
  if (!newOptions || newOptions.length === 0) return
  const validValues = newOptions.map(o => o.value)
  if (!validValues.includes(hiddenChapValue.value)) {
    hiddenChapValue.value = validValues[0]
  }
}, { immediate: true })

// 监听 hiddenChapValue 变化，恢复滚动位置
watch(hiddenChapValue, (val) => {
  setTimeout(() => {
    restoreScrollPosition('hidden_' + val)
  }, 300)
})

// 所有单词（不过滤），用于已记住页面显示
const allWordsForHiddenPage = computed(() => {
  let list = []
  // 合并所有章节的单词
  Object.keys(words).forEach(chap => {
    list = list.concat(words[chap] || [])
  })
  // 只保留已隐藏的单词
  list = list.filter(item => hiddenWordKeys.value.includes(wordKey(item)))
  return list
})

// 已记住页面按章节过滤后的列表
const hiddenWordlist = computed(() => {
  if (hiddenChapValue.value === 'all') {
    return allWordsForHiddenPage.value
  }
  return allWordsForHiddenPage.value.filter(item => {
    // 通过 no 字段匹配单词所在的章节
    const chapWords = words[hiddenChapValue.value] || []
    return chapWords.some(w => w.no === item.no)
  })
})

const wordlist = computed({
  get() {
    // 已记住页面：显示按章节过滤后的已记住单词
    if (activePage.value === 'hidden') {
      return hiddenWordlist.value
    }
    
    // 单词页面：显示当前章节未隐藏的单词
    let list = words[chapValue.value] || []
    // filter by keyword
    if (filterKeyword.value) {
      const kw = filterKeyword.value.toLowerCase()
      list = list.filter(item =>
        item.kana?.toLowerCase().includes(kw) ||
        item.kanji?.toLowerCase().includes(kw) ||
        item.chinese?.toLowerCase().includes(kw)
      )
    }
    // 始终过滤掉已隐藏的单词
    list = list.filter(item => !hiddenWordKeys.value.includes(wordKey(item)))
    return list
  },
  set: () => {}
})
</script>

<template>
  <n-config-provider :theme="darkTheme">
    <n-space vertical :size="4" class="top-area">

      <!-- tabs - words page shows chapter tabs, hidden page shows chapters with hidden words -->
      <n-tabs v-show="activePage === 'words'" type="segment" v-model:value="chapValue">
        <n-tab-pane name="primary_1" tab="初上" />
        <n-tab-pane name="primary_2" tab="初下" />
        <n-tab-pane name="middle_1" tab="中上" />
        <n-tab-pane name="middle_2" tab="中下" />
        <n-tab-pane name="n2" tab="N2" />
        <n-tab-pane name="high_1" tab="高上" />
        <n-tab-pane name="high_2" tab="高下" />
      </n-tabs>

      <!-- search - only show on words page -->
      <n-input v-show="activePage === 'words'" v-model:value="filterKeyword" type="text" placeholder="查询" clearable />

      <!-- tabs for hidden page -->
      <n-tabs v-show="activePage === 'hidden'" type="segment" v-model:value="hiddenChapValue">
        <n-tab-pane v-for="opt in hiddenChapOptions" :key="opt.value" :name="opt.value" :tab="opt.label" />
      </n-tabs>
    </n-space>

    <!-- table - only show on words and hidden pages -->
    <div v-show="activePage !== 'quiz'" class="table-wrapper">
    <n-data-table
      :columns="columns"
      :data="wordlist"
      :row-class-name="wordRowClass"
      :max-height="viewH - 200"
      :row-props="createRowProps"
      size="small"
      striped
      :single-line="false"
      @scroll="onTableScroll"

    />
    </div>

    <!-- Quiz Page -->
    <div v-show="activePage === 'quiz'" class="quiz-container">
      <n-space vertical size="large">
        <!-- Quiz Settings -->
        <n-space justify="space-between" align="center">
          <n-select
            v-model:value="quizChapValue"
            :options="tabOptions"
            size="small"
            style="width: 140px"
            @update:value="generateQuizWords"
          />
          <n-button type="primary" size="small" @click="generateQuizWords">
            换一批
          </n-button>
        </n-space>
        
        <!-- Quiz Content -->
        <div v-if="quizWords.length > 0" class="quiz-card">
          <div class="quiz-progress">
            {{ quizIndex + 1 }} / {{ quizWords.length }}
          </div>
          
          <div class="quiz-question">
            <template v-if="quizDisplayMode === 'kanji'">
              <!-- Show kanji if available, otherwise show kana -->
              <div class="quiz-show">{{ quizWords[quizIndex].kanji || quizWords[quizIndex].kana }}</div>
              <div class="quiz-hint">{{ quizWords[quizIndex].kanji ? '请填写读音或中文' : '请填写汉字或中文' }}</div>
            </template>
            <template v-else>
              <!-- Show chinese if available, otherwise show kana -->
              <div class="quiz-show">{{ quizWords[quizIndex].chinese || quizWords[quizIndex].kana }}</div>
              <div class="quiz-hint">{{ quizWords[quizIndex].chinese ? '请填写日文' : '请填写汉字或中文' }}</div>
            </template>
          </div>
          
          <n-input
            v-model:value="quizInput"
            type="text"
            placeholder="输入任意匹配的值"
            size="large"
            :status="quizResult"
            @keyup.enter="quizResult === null ? checkQuizAnswer() : null"
          />
          
          <div v-if="quizResult === 'correct'" class="quiz-feedback correct">
            ✓ 正确！
          </div>
          <div v-else-if="quizResult === 'wrong'" class="quiz-feedback wrong">
            ✗ 错误<br>
            词性：{{ quizWords[quizIndex].part }}<br>
            汉字：{{ quizWords[quizIndex].kanji }}<br>
            假名：{{ quizWords[quizIndex].kana }}<br>
            中文：{{ quizWords[quizIndex].chinese }}
          </div>
          
          <n-space justify="center" style="margin-top: 16px;">
            <n-button 
              v-if="quizResult === null" 
              type="primary" 
              @click="checkQuizAnswer"
              :disabled="!quizInput.trim()"
            >
              检查
            </n-button>
            <n-button 
              v-else 
              type="success" 
              @click="nextQuizWord"
            >
              {{ quizIndex < quizWords.length - 1 ? '下一个' : '新一组' }}
            </n-button>
          </n-space>
        </div>
        
        <div v-else class="quiz-empty">
          点击"开始"生成测试单词
        </div>
      </n-space>
    </div>

  <!-- Toast -->
  <Teleport to="body">
    <transition name="fade">
      <div v-if="toastMsg" class="toast-bar">
        <span>{{ toastMsg }}</span>
        <n-button
          v-if="undoStack.length > 0"
          type="warning"
          size="tiny"
          quaternary
          @click="undoLastHide"
        >
          回退
        </n-button>
      </div>
    </transition>

    <!-- settings drawer -->
    <n-drawer v-model:show="showSettings" :width="320" placement="right">
      <n-drawer-content title="设置" closable>
        <n-space vertical :size="16">

          <n-space vertical :size="8">
            <n-space justify="space-between" align="center">
              <span>默认生词本</span>
              <n-select
                v-model:value="chapValue"
                :options="tabOptions"
                size="small"
                style="width:120px"
              />
            </n-space>
          </n-space>

          <n-divider />

          <n-text depth="3" style="font-size:12px">
            当前已记住 {{ hiddenWordKeys.length }} 个单词
          </n-text>

          <n-button
            v-if="hiddenWordKeys.length > 0"
            block
            type="warning"
            @click="clearAllHidden"
          >
            清除已记住单词（全部恢复可见）
          </n-button>

        </n-space>
      </n-drawer-content>
    </n-drawer>

    <!-- bottom navigation bar -->
    <div class="bottom-nav">
      <div 
        class="nav-item" 
        :class="{ active: activePage === 'words' }"
        @click="activePage = 'words'"
      >
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/>
          </svg>
        </span>
        <span class="nav-label">单词</span>
      </div>
      <div 
        class="nav-item" 
        :class="{ active: activePage === 'quiz' }"
        @click="activePage = 'quiz'"
      >
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </span>
        <span class="nav-label">测试</span>
      </div>
      <div 
        class="nav-item" 
        :class="{ active: activePage === 'hidden' }"
        @click="activePage = 'hidden'"
      >
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </span>
        <span class="nav-label">已记住</span>
      </div>
      <div class="nav-item" @click="showSettings = !showSettings">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        </span>
        <span class="nav-label">设置</span>
      </div>
    </div>
  </Teleport>
</n-config-provider>
</template>

<style>
html, body, #app {
  background-color: #1a1a1a !important;
  margin: 0;
  min-height: 100vh;
}
.top-area {
  margin-bottom: 8px;
  min-height: 0;
}
.top-area .n-tabs,
.top-area .n-input {
  height: auto;
  margin: 0;
}
/* 隐藏时确保不占位 */
.top-area .n-tabs[style*="display: none"],
.top-area .n-input[style*="display: none"] {
  height: 0 !important;
  margin: 0 !important;
  overflow: hidden;
}
.table-wrapper {
  margin-top: 4px;
}
.column-class {
  font-size: 12px !important;
}
td[data-col-key='chinese'] {
  color: #f46666 !important;
  font-size: 10px !important;
}
.row-hidden td {
  opacity: 0.4;
}

/* toast */
.toast-bar {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9998;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  font-size: 14px;
  color: #ccc;
  white-space: nowrap;
}

/* draggable float btn */
.float-btn {
  position: fixed;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #18a058;
  color: #fff;
  border: none;
  cursor: pointer;
  z-index: 9997;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.float-btn:hover {
  background: #36ad6a;
}

/* fade transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* quiz page styles */
.quiz-container {
  padding: 16px;
  padding-bottom: 80px;
  min-height: calc(100vh - 80px);
}
.quiz-card {
  background: #252525;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}
.quiz-progress {
  font-size: 14px;
  color: #888;
  margin-bottom: 16px;
}
.quiz-question {
  margin-bottom: 24px;
}
.quiz-show {
  font-size: 32px;
  color: #fff;
  font-weight: bold;
  margin: 16px 0;
  line-height: 1.4;
}
.quiz-hint {
  font-size: 14px;
  color: #888;
  margin: 8px 0;
  line-height: 1.6;
}
.quiz-feedback {
  margin-top: 16px;
  font-size: 16px;
  font-weight: bold;
}
.quiz-feedback.correct {
  color: #18a058;
}
.quiz-feedback.wrong {
  color: #d03050;
}
.quiz-empty {
  text-align: center;
  color: #666;
  padding: 40px;
  font-size: 14px;
}

/* bottom navigation bar */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #1e1e1e;
  border-top: 1px solid #333;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 9996;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 8px 20px;
  border-radius: 8px;
  position: relative;
  transition: background 0.2s;
  color: #999;
}
.nav-item:hover {
  background: rgba(255,255,255,0.1);
}
.nav-item.active {
  color: #18a058;
}
.nav-icon {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-icon svg {
  fill: currentColor;
}
.nav-label {
  font-size: 12px;
  color: inherit;
}
</style>
