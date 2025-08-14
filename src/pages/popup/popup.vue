<script setup lang="ts">
import { onMounted } from 'vue'
import {
  RefreshCw, X, ExternalLink, Settings, Info, FileDown, Trash2, Ban, Copy, MoreVertical, Loader2, Database, List, Shield, Eye, Edit3, Copy as CopyIcon, Trash
} from 'lucide-vue-next'

// Store
import { usePopupStore } from '@src/store/popupStore'

// Components
import InfoModal from '@src/components/InfoModal.vue'
import ViewModel from '@src/components/ViewModel.vue'
import EditModal from '@src/components/EditModal.vue'

const popupStore = usePopupStore()

onMounted(() => {
  popupStore.initialize()
  window.addEventListener('beforeunload', () => {
    if (popupStore.isPopupWindow) {
      popupStore.clearStoredTabId().catch(error => {
        console.error('Error clearing stored tab ID on unload:', error)
      })
    }
  })
})
</script>

<template>
  <div class="container">
    <!-- Header Section -->
    <header class="header">
      <div class="header-title">
        <img src="/icons/32x32.png" alt="Storage Manager">
        <h1>Storage Manager</h1>
      </div>
      <div class="header-actions">
        <button @click="popupStore.loadStorageData" class="icon-btn" title="Reload">
          <RefreshCw :size="16" />
        </button>
        <button @click="popupStore.isPopupWindow ? popupStore.closeWindow() : popupStore.openNewWindow()" class="icon-btn" :title="popupStore.isPopupWindow ? 'Close Window' : 'Open in New Window'">
          <X v-if="popupStore.isPopupWindow" :size="16" />
          <ExternalLink v-else :size="16" />
        </button>
        <button @click="popupStore.openInfoModal" class="icon-btn" title="Information">
          <Info :size="16" />
        </button>
      </div>
    </header>

    <!-- Filter Section -->
    <section class="filter-section">
      <input type="text" v-model="popupStore.searchTerm" @input="(e) => popupStore.handleSearchInput((e.target as HTMLInputElement).value)" class="search-input" placeholder="Search...">
      <div class="filter-controls">
        <select v-model="popupStore.currentStorageType" @change="(e) => popupStore.handleStorageTypeChange((e.target as HTMLSelectElement).value)" class="filter-select">
          <option value="local">Local Storage</option>
          <option value="session">Session Storage</option>
          <option value="cookies">Cookies</option>
        </select>
        <select v-if="popupStore.showCookiesFilter" v-model="popupStore.cookiesFilter" @change="(e) => popupStore.handleCookiesFilterChange((e.target as HTMLSelectElement).value)" class="filter-select">
          <option value="all-domains">All Domains</option>
          <option value="all-frames">All Frames</option>
        </select>
      </div>
    </section>

    <!-- Data Section -->
    <section class="data-section">
      <div class="data-header">
        <div class="selection-info">
          <span>{{ popupStore.selectionText }}</span>
        </div>
        <div v-if="popupStore.showBulkActions" class="bulk-actions">
          <button @click="popupStore.handleBulkAction('export')" class="action-btn" title="Export">
            <FileDown :size="16" />
          </button>
          <button @click="popupStore.handleBulkAction('delete')" class="action-btn" title="Delete">
            <Trash2 :size="16" />
          </button>
          <button @click="popupStore.handleBulkAction('block')" class="action-btn" title="Block">
            <Ban :size="16" />
          </button>
          <button @click="popupStore.handleBulkAction('copy')" class="action-btn" title="Copy">
            <Copy :size="16" />
          </button>
        </div>
      </div>

      <div class="table-container">
        <table v-if="popupStore.showDataTable" class="data-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input type="checkbox" :checked="popupStore.selectedCount > 0 && popupStore.selectedCount === popupStore.totalCount" :indeterminate="popupStore.selectedCount > 0 && popupStore.selectedCount < popupStore.totalCount" @change="(e) => popupStore.toggleSelectAll((e.target as HTMLInputElement).checked)" class="checkbox">
              </th>
              <th>Key</th>
              <th>Value</th>
              <th>Domain</th>
              <th class="actions-col"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in popupStore.filteredData" :key="index" :data-index="index">
              <td class="checkbox-col">
                <input type="checkbox" :checked="popupStore.selectedItems.has(index)" @change="(e) => popupStore.toggleItemSelection(index, (e.target as HTMLInputElement).checked)" class="checkbox row-checkbox">
              </td>
              <td class="key-cell">
                <span @click="popupStore.viewItem(item)" class="key-cell-view">
                  {{ popupStore.escapeHtml(item.key) }}
                </span>
              </td>
              <td @click="popupStore.editItem(item, index)" class="value-cell" :title="popupStore.escapeHtml(item.value)">
                {{ popupStore.escapeHtml(item.value) }}
              </td>
              <td class="domain-cell">{{ popupStore.escapeHtml(item.domain || '-') }}</td>
              <td class="actions-col">
                <div class="dropdown">
                  <button @click="popupStore.toggleDropdown(index)" class="dropdown-trigger">
                    <MoreVertical :size="16" />
                  </button>
                  <div class="dropdown-menu" :class="{ show: popupStore.openDropdownIndex === index }">
                    <button @click="popupStore.handleItemAction('view', item, index);" class="dropdown-item">
                      <Eye :size="16" class="dropdown-icon" />
                      <span>View</span>
                    </button>
                    <button @click="popupStore.handleItemAction('edit', item, index);" class="dropdown-item">
                      <Edit3 :size="16" class="dropdown-icon" />
                      <span>Edit</span>
                    </button>
                    <button @click="popupStore.handleItemAction('copy', item, index);" class="dropdown-item">
                      <CopyIcon :size="16" class="dropdown-icon" />
                      <span>Copy</span>
                    </button>
                    <button @click="popupStore.handleItemAction('delete', item, index);" class="dropdown-item">
                      <Trash :size="16" class="dropdown-icon" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="popupStore.showEmptyState" class="empty-state">
          <Loader2 v-if="popupStore.isLoading" class="loading-icon" :size="48" />
          <div v-else-if="popupStore.hasError" class="error-state">
            <Shield class="error-icon" :size="48" />
            <p class="error-message">{{ popupStore.errorMessage }}</p>
            <button @click="popupStore.loadStorageData" class="retry-btn">
              <RefreshCw :size="16" />
              Retry
            </button>
          </div>
          <div v-else class="no-data-state">
            <Database class="empty-icon" :size="48" />
            <p>No data found</p>
          </div>
        </div>
      </div>
    </section>
  </div>

  <!-- Info Modal -->
  <div v-if="popupStore.showInfoModal" class="modal">
    <InfoModal :onClose="popupStore.closeInfoModal" />
  </div>

  <!-- View Modal -->
  <div v-if="popupStore.showViewModal" class="modal">
    <ViewModel :onClose="popupStore.closeViewModal" />
  </div>

  <!-- Edit Modal -->
  <div v-if="popupStore.showEditModal" class="modal">
    <EditModal :onClose="popupStore.closeEditModal" />
  </div>

</template>