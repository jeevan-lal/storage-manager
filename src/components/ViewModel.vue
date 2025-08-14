<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Maximize2, Minimize2 } from 'lucide-vue-next'
import { usePopupStore } from '@src/store/popupStore'
import JsonViewer from '@ctechhindi/vue3-json-viewer'
import '@ctechhindi/vue3-json-viewer/dist/index.css'

const popupStore = usePopupStore()
const isFullScreen = ref(false)
const isDarkTheme = ref(false)
let keyValue = ref({})
let hideSwitcher = ref(false)
let mode = ref<'tree' | 'text'>('tree')

try {
  keyValue.value = JSON.parse(popupStore.viewingItem?.value ?? '{}')
} catch (error) {
  keyValue.value = popupStore.viewingItem?.value ?? ''
  mode.value = 'text'
  hideSwitcher.value = true
}

interface Props {
  onClose: () => void
}

defineProps<Props>()

const toggleFullScreen = () => {
  isFullScreen.value = !isFullScreen.value
}

const handleThemeChange = (theme: "light" | "dark") => {
  isDarkTheme.value = theme === "dark";
};

</script>

<template>
  <div class="modal-overlay" @click="onClose"></div>
  <div class="modal-content" :class="{ 'fullscreen': isFullScreen }">
    <div class="modal-header">
      <h4>View Item</h4>
      <div class="modal-actions">
        <button @click="toggleFullScreen" class="modal-fullscreen-btn" :title="isFullScreen ? 'Exit Full Screen' : 'Full Screen'">
          <Maximize2 v-if="!isFullScreen" :size="16" />
          <Minimize2 v-else :size="16" />
        </button>
        <button @click="onClose" class="modal-close-btn">
          <X :size="16" />
        </button>
      </div>
    </div>
    <div class="modal-body json-viewer-body">
      <div class="key-name" v-if="popupStore.viewingItem?.key">
        <span>{{ popupStore.viewingItem?.key }}</span>
      </div>
      <JsonViewer v-model:data="keyValue" :hide-edit-controls="true" :show-line-numbers="true" :max-depth="2" :theme="isDarkTheme ? 'dark' : 'light'" @theme-change="handleThemeChange" :hide-action-text="true" :hide-mode-switcher="hideSwitcher" :defaultMode="mode" />
    </div>
  </div>
</template>