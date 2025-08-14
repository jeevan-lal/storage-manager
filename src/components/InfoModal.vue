<script setup lang="ts">
import { X, Database, List, Shield, Github, ExternalLink } from 'lucide-vue-next'

interface Props {
  onClose: () => void
}

defineProps<Props>()

const openLink = (url: string) => {
  window.open(url, '_blank')
}
</script>

<template>
  <div class="modal-overlay" @click="onClose"></div>
  <div class="modal-content">
    <div class="modal-header">
      <h3>Storage Manager Information</h3>
      <button @click="onClose" class="modal-close-btn">
        <X :size="16" />
      </button>
    </div>
    <div class="modal-body">
      <div class="info-section">
        <h4>
          <Database :size="16" /> About Storage Manager
        </h4>
        <p>A powerful Chrome extension for managing browser storage data including Local Storage, Session Storage, and Cookies.</p>
      </div>

      <div class="info-section">
        <h4>
          <List :size="16" /> Features
        </h4>
        <ul>
          <li>View and manage Local Storage data</li>
          <li>Access Session Storage information</li>
          <li>Browse and manage Cookies</li>
          <li>Search and filter storage data</li>
          <li>Export data to JSON format</li>
          <li>Copy storage items to clipboard</li>
          <li>Delete unwanted storage items</li>
        </ul>
      </div>

      <div class="info-section">
        <h4>
          <Shield :size="16" /> Privacy & Security
        </h4>
        <p>This extension only accesses storage data from the currently active tab. No data is sent to external servers.</p>
      </div>

      <div class="info-section">
        <h4>
          <Github :size="16" /> Links & Resources
        </h4>
        <div class="links-container">
          <button @click="openLink('https://github.com/jeevan-lal/storage-manager')" class="link-btn github-btn">
            <Github :size="16" />
            View on GitHub
          </button>
          <button @click="openLink('https://chromewebstore.google.com/detail/storage-manager/kgcblbnojlegbfkkidmhajjippfbokcb')" class="link-btn chrome-btn">
            <ExternalLink :size="16" />
            Chrome Web Store
          </button>
        </div>
      </div>
    </div>
  </div>
</template>