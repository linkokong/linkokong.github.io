<script setup>
import { ref, watch } from 'vue'
import { NDrawer, NDrawerContent, NSwitch, NSpace, NText, NButton, NDivider } from 'naive-ui'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['update:show', 'toggle-hidden', 'clear-hidden'])

const showRemembered = ref(localStorage.getItem('showRemembered') !== 'false')
const hiddenWordKeys = ref(JSON.parse(localStorage.getItem('hiddenWordKeys') || '[]'))

watch(showRemembered, (val) => {
  localStorage.setItem('showRemembered', val)
  emit('toggle-hidden', val)
})

function clearHidden() {
  localStorage.removeItem('hiddenWordKeys')
  hiddenWordKeys.value = []
  emit('clear-hidden')
}
</script>

<template>
  <n-drawer :show="show" @update:show="emit('update:show', $event)" :width="320" placement="right">
    <n-drawer-content title="设置" closable>
      <n-space vertical>

        <n-divider>已记住单词本</n-divider>

        <n-space justify="space-between" align="center">
          <n-text>显示已记住的单词</n-text>
          <n-switch v-model:value="showRemembered" />
        </n-space>

        <n-text depth="3" style="font-size:12px">
          关闭后，已标记为"记住"的单词将从列表中隐藏。
        </n-text>

        <n-divider />

        <n-text depth="3" style="font-size:12px">
          当前已隐藏 {{ hiddenWordKeys.length }} 个单词
        </n-text>

        <n-button
          v-if="hiddenWordKeys.length > 0"
          size="small"
          type="warning"
          @click="clearHidden"
        >
          清除已隐藏单词（全部恢复）
        </n-button>

      </n-space>
    </n-drawer-content>
  </n-drawer>
</template>
