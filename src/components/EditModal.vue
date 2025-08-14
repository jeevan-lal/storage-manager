<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Maximize2, Minimize2 } from 'lucide-vue-next'
import { usePopupStore } from '@src/store/popupStore'
import JsonViewer from '@ctechhindi/vue3-json-viewer'
import '@ctechhindi/vue3-json-viewer/dist/index.css'

const popupStore = usePopupStore()
const isFullScreen = ref(true)
const isDarkTheme = ref(false)
let keyValue = ref({})
let mode = ref<'tree' | 'text'>('tree')
let hideSwitcher = ref(false)

try {
  keyValue.value = JSON.parse(popupStore.editingItem?.value ?? '{}')
} catch (error) {
  keyValue.value = popupStore.editingItem?.value ?? ''
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

const handleDataUpdate = (data: any) => {
  if (typeof data === 'object') {
    popupStore.updateStorageItem(popupStore.editingItem?.key ?? '', JSON.stringify(data), popupStore.editingItemIndex ?? 0)
  } else {
    popupStore.updateStorageItem(popupStore.editingItem?.key ?? '', data, popupStore.editingItemIndex ?? 0)
  }
}

</script>

<template>
  <div class="modal-overlay" @click="onClose"></div>
  <div class="modal-content" :class="{ 'fullscreen': isFullScreen }">
    <div class="modal-header">
      <h4>Edit Item</h4>
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
      <div class="key-name" v-if="popupStore.editingItem?.key">
        <span>{{ popupStore.editingItem?.key }}</span>
      </div>
      <JsonViewer v-model:data="keyValue" :hide-edit-controls="false" :show-line-numbers="true" :max-depth="2" :theme="isDarkTheme ? 'dark' : 'light'" @update:data="handleDataUpdate" @theme-change="handleThemeChange" :hide-action-text="true" :hide-mode-switcher="hideSwitcher" :defaultMode="mode" />
    </div>
  </div>
</template>