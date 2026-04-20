<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['click'])

const buttonRef = ref(null)
const isDragging = ref(false)
const pos = ref({ x: -1, y: -1 }) // -1 means not positioned yet

const DRAG_THRESHOLD = 10
let dragStart = { x: 0, y: 0 }
let dragStarted = false

function getInitialPos() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  return {
    x: vw - 80,
    y: vh - 120
  }
}

function onMouseDown(e) {
  e.preventDefault()
  const p = pos.value.x === -1 ? getInitialPos() : pos.value
  dragStart = { x: e.clientX - p.x, y: e.clientY - p.y }
  dragStarted = false
  isDragging.value = true
}

function onMouseMove(e) {
  if (!isDragging.value) return
  const dx = e.clientX - dragStart.x - pos.value.x
  const dy = e.clientY - dragStart.y - pos.value.y
  if (!dragStarted && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
    dragStarted = true
  }
  if (dragStarted) {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const bw = 48
    const bh = 48
    pos.value = {
      x: Math.max(0, Math.min(e.clientX - dragStart.x, vw - bw)),
      y: Math.max(0, Math.min(e.clientY - dragStart.y, vh - bh))
    }
  }
}

function onMouseUp() {
  isDragging.value = false
  if (!dragStarted) {
    emit('click')
  }
  dragStarted = false
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<template>
  <Teleport to="body">
    <button
      v-if="pos.x !== -1"
      ref="buttonRef"
      class="float-btn"
      :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
      @mousedown="onMouseDown"
    >
      ⚙
    </button>
  </Teleport>
</template>

<style scoped>
.float-btn {
  position: fixed;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #18a058;
  color: #fff;
  border: none;
  font-size: 20px;
  cursor: pointer;
  z-index: 9999;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  user-select: none;
  transition: background 0.2s;
}
.float-btn:hover {
  background: #36ad6a;
}
</style>
