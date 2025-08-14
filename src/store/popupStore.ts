import { defineStore } from 'pinia'

// @ts-ignore
import { detectBrowser, detectVersion } from "@src/lib/lib.ts";
import { ExtensionDriver } from '@ctechhindi/core-browser-extension/src/ExtensionDriver'
const ex = new ExtensionDriver(detectBrowser(), detectVersion());

interface StorageItem {
  key: string
  value: string
  domain?: string
  path?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: string
  expirationDate?: number
}

interface PopupState {
  currentStorageType: string
  storageData: StorageItem[]
  filteredData: StorageItem[]
  selectedItems: Set<number>
  isLoading: boolean
  isPopupWindow: boolean
  searchTerm: string
  cookiesFilter: string
  showInfoModal: boolean
  hasError: boolean
  errorMessage: string
  openDropdownIndex: number | null
  showViewModal: boolean
  viewingItem: StorageItem | null
  showEditModal: boolean
  editingItem: StorageItem | null
  editingItemIndex: number | null
}

export const usePopupStore = defineStore('popup', {
  state: (): PopupState => ({
    currentStorageType: 'local',
    storageData: [],
    filteredData: [],
    selectedItems: new Set(),
    isLoading: false,
    isPopupWindow: false,
    searchTerm: '',
    cookiesFilter: 'all-domains',
    showInfoModal: false,
    hasError: false,
    errorMessage: '',
    openDropdownIndex: null,
    showViewModal: false,
    viewingItem: null,
    showEditModal: false,
    editingItem: null,
    editingItemIndex: null
  }),

  getters: {
    selectedCount: (state) => state.selectedItems.size,
    totalCount: (state) => state.filteredData.length,
    selectionText: (state) => `${state.selectedItems.size} of ${state.filteredData.length} selected`,
    showBulkActions: (state) => state.selectedItems.size > 0,
    showCookiesFilter: (state) => state.currentStorageType === 'cookies',
    showDataTable: (state) => state.filteredData.length > 0,
    showEmptyState: (state) => !state.filteredData.length
  },

  actions: {
    async initialize() {
      await this.initializeStorage()
      await this.loadStorageData()

      // Add click outside handler for dropdowns
      if (typeof window !== 'undefined') {
        document.addEventListener('click', (e) => {
          if (!(e.target as Element).closest('.dropdown')) {
            this.closeDropdown()
          }
        })
      }
    },

    async initializeStorage() {
      try {
        const result = await ex.storage?.local?.get('storage_manager_is_popup_window')
        this.isPopupWindow = result.storage_manager_is_popup_window === true
      } catch (error) {
        this.isPopupWindow = false
      }
    },

    async loadStorageData() {
      if (this.isLoading) return

      this.isLoading = true
      this.storageData = []
      this.selectedItems.clear()
      this.clearErrorState()

      try {
        switch (this.currentStorageType) {
          case 'local':
            await this.loadLocalStorage()
            break
          case 'session':
            await this.loadSessionStorage()
            break
          case 'cookies':
            await this.loadCookies()
            break
        }
      } catch (error) {
        console.error('Error loading storage data:', error)
        this.showErrorState()
      } finally {
        this.isLoading = false
        this.filterData()

        // Clear error state if we successfully loaded data
        if (this.storageData.length > 0) {
          this.clearErrorState()
        }
      }
    },

    async loadLocalStorage() {
      try {
        if (this.isPopupWindow) {
          const storedData = await ex.storage?.local?.get('storage_manager_active_tab_url')
          const storedTabUrl = storedData?.storage_manager_active_tab_url

          if (!storedTabUrl) {
            throw new Error('No stored tab information found')
          }

          const tabs = await ex.tabs?.query({ url: storedTabUrl })
          let tab = tabs?.[0]

          if (!tab) {
            const allTabs = await ex.tabs?.query({})
            tab = allTabs?.find((t: any) => t.url && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('chrome://'))
          }

          if (!tab) {
            throw new Error('No valid web page tab found')
          }

          const result = await ex.scripting?.executeScript({
            target: { tabId: tab.id },
            function: () => {
              const items = []
              const length = localStorage.length
              for (let i = 0; i < length; i++) {
                const key = localStorage.key(i)
                if (key) {
                  const value = localStorage.getItem(key)
                  items.push({
                    key,
                    value,
                    domain: window.location.hostname
                  })
                }
              }
              return items
            }
          })

          this.storageData = result[0]?.result || []
        } else {

          const tabs = await ex.tabs?.query({ active: true, currentWindow: true })
          const tab = tabs?.[0]

          if (!tab) {
            throw new Error('No active tab found')
          }

          const result = await ex.scripting?.executeScript({
            target: { tabId: tab.id },
            function: () => {
              const items = []
              const length = localStorage.length
              for (let i = 0; i < length; i++) {
                const key = localStorage.key(i)
                if (key) {
                  const value = localStorage.getItem(key)
                  items.push({
                    key,
                    value,
                    domain: window.location.hostname
                  })
                }
              }
              return items
            }
          })

          this.storageData = result[0]?.result || []
        }
      } catch (error) {
        console.error('Error loading localStorage:', error)
        this.storageData = []
        this.showErrorState('Failed to load Local Storage data. Please check if you have permission to access this page.')
      }
    },

    async loadSessionStorage() {
      try {
        if (this.isPopupWindow) {
          const storedData = await ex.storage?.local?.get('storage_manager_active_tab_url')
          const storedTabUrl = storedData?.storage_manager_active_tab_url

          if (!storedTabUrl) {
            throw new Error('No stored tab information found')
          }

          const tabs = await ex.tabs?.query({ url: storedTabUrl })
          let tab = tabs?.[0]

          if (!tab) {
            const allTabs = await ex.tabs?.query({})
            tab = allTabs?.find((t: any) => t.url && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('chrome://'))
          }

          if (!tab) {
            throw new Error('No valid web page tab found')
          }

          const result = await ex.scripting?.executeScript({
            target: { tabId: tab.id },
            function: () => {
              const items = []
              const length = sessionStorage.length
              for (let i = 0; i < length; i++) {
                const key = sessionStorage.key(i)
                if (key) {
                  const value = sessionStorage.getItem(key)
                  items.push({
                    key,
                    value,
                    domain: window.location.hostname
                  })
                }
              }
              return items
            }
          })

          this.storageData = result[0]?.result || []
        } else {
          const tabs = await ex.tabs?.query({ active: true, currentWindow: true })
          const tab = tabs?.[0]

          if (!tab) {
            throw new Error('No active tab found')
          }

          const result = await ex.scripting?.executeScript({
            target: { tabId: tab.id },
            function: () => {
              const items = []
              const length = sessionStorage.length
              for (let i = 0; i < length; i++) {
                const key = sessionStorage.key(i)
                if (key) {
                  const value = sessionStorage.getItem(key)
                  items.push({
                    key,
                    value,
                    domain: window.location.hostname
                  })
                }
              }
              return items
            }
          })

          this.storageData = result[0]?.result || []
        }
      } catch (error) {
        console.error('Error loading sessionStorage:', error)
        this.storageData = []
        this.showErrorState('Failed to load Session Storage data. Please check if you have permission to access this page.')
      }
    },

    async loadCookies() {
      try {
        if (this.isPopupWindow) {
          const storedData = await ex.storage?.local?.get('storage_manager_active_tab_url')
          const storedTabUrl = storedData?.storage_manager_active_tab_url

          if (!storedTabUrl) {
            throw new Error('No stored tab information found')
          }

          const tabs = await ex.tabs?.query({ url: storedTabUrl })
          let tab = tabs?.[0]

          if (!tab) {
            const allTabs = await ex.tabs?.query({})
            tab = allTabs?.find((t: any) => t.url && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('chrome://'))
          }

          if (!tab) {
            throw new Error('No valid web page tab found')
          }

          const cookies = await ex.cookies?.getAll({ url: tab.url })

          this.storageData = cookies?.map((cookie: any) => ({
            key: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite,
            expirationDate: cookie.expirationDate
          })) || []

        } else {
          const tabs = await ex.tabs?.query({ active: true, currentWindow: true })
          const tab = tabs?.[0]

          if (!tab) {
            throw new Error('No active tab found')
          }

          const cookies = await ex.cookies?.getAll({ url: tab.url })

          this.storageData = cookies?.map((cookie: any) => ({
            key: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite,
            expirationDate: cookie.expirationDate
          })) || []
        }
      } catch (error) {
        console.error('Error loading cookies:', error)
        this.storageData = []
        this.showErrorState('Failed to load Cookies data. Please check if you have permission to access this page.')
      }
    },

    filterData() {
      const searchTerm = this.searchTerm.toLowerCase()
      const cookiesFilter = this.cookiesFilter

      this.filteredData = this.storageData.filter(item => {
        const matchesSearch = !searchTerm ||
          item.key.toLowerCase().includes(searchTerm) ||
          item.value.toLowerCase().includes(searchTerm) ||
          (item.domain && item.domain.toLowerCase().includes(searchTerm))

        if (this.currentStorageType === 'cookies' && cookiesFilter === 'all-frames') {
          // Additional filtering logic for frames can be added here
        }

        return matchesSearch
      })

      // Clear error state if we have data after filtering
      if (this.filteredData.length > 0) {
        this.clearErrorState()
      }
    },

    handleStorageTypeChange(storageType: string) {
      this.currentStorageType = storageType
      this.cookiesFilter = 'all-domains'
      this.clearErrorState()
      this.closeDropdown()
      this.loadStorageData()
    },

    handleSearchInput(searchTerm: string) {
      this.searchTerm = searchTerm
      this.clearErrorState()
      this.closeDropdown()
      this.filterData()
    },

    handleCookiesFilterChange(cookiesFilter: string) {
      this.cookiesFilter = cookiesFilter
      this.clearErrorState()
      this.closeDropdown()
      this.filterData()
    },

    toggleItemSelection(index: number, selected: boolean) {
      if (selected) {
        this.selectedItems.add(index)
      } else {
        this.selectedItems.delete(index)
      }
    },

    toggleSelectAll(selected: boolean) {
      if (selected) {
        this.filteredData.forEach((_, index) => this.selectedItems.add(index))
      } else {
        this.selectedItems.clear()
      }
    },

    async handleItemAction(action: string, item: StorageItem, index: number) {
      switch (action) {
        case 'view':
          this.viewItem(item)
          break
        case 'edit':
          this.editItem(item, index)
          break
        case 'copy':
          this.copyItem(item)
          break
        case 'delete':
          await this.deleteItems([index])
          break
      }
    },

    async handleBulkAction(action: string) {
      const selectedIndices = Array.from(this.selectedItems)

      switch (action) {
        case 'export':
          this.exportItems(selectedIndices)
          break
        case 'delete':
          await this.deleteItems(selectedIndices)
          break
        case 'block':
          this.blockItems(selectedIndices)
          break
        case 'copy':
          this.copyItems(selectedIndices)
          break
      }
    },

    viewItem(item: StorageItem) {
      this.viewingItem = item
      this.showViewModal = true
      this.closeDropdown()
    },

    async editItem(item: StorageItem, index: number) {
      this.editingItem = item
      this.showEditModal = true
      this.editingItemIndex = index
      this.closeDropdown()
      // await this.updateStorageItem(item.key, newValue, index)
    },

    async copyItem(item: StorageItem) {
      const text = `${item.key}: ${item.value}`
      try {
        await navigator.clipboard.writeText(text)
        this.showNotification('Copied to clipboard')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
      }
    },

    async copyItems(indices: number[]) {
      const items = indices.map(i => this.filteredData[i])
      const text = items.map(item => `${item.key}: ${item.value}`).join('\n')
      try {
        await navigator.clipboard.writeText(text)
        this.showNotification(`Copied ${items.length} items to clipboard`)
      } catch (error) {
        console.error('Error copying to clipboard:', error)
      }
    },

    exportItems(indices: number[]) {
      const items = indices.map(i => this.filteredData[i])
      const data = JSON.stringify(items, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `storage-export-${Date.now()}.json`
      a.click()

      URL.revokeObjectURL(url)
      this.showNotification(`Exported ${items.length} items`)
    },

    async deleteItems(indices: number[]) {
      const items = indices.map(i => this.filteredData[i])
      const confirmMsg = items.length === 1
        ? `Delete "${items[0].key}"?`
        : `Delete ${items.length} items?`

      if (!confirm(confirmMsg)) return

      for (const item of items) {
        await this.deleteStorageItem(item)
      }

      this.selectedItems.clear()
      await this.loadStorageData()
      this.showNotification(`Deleted ${items.length} items`)
    },

    blockItems(indices: number[]) {
      const count = indices.length
      this.showNotification(`Blocked ${count} item${count > 1 ? 's' : ''}`)
    },

    async updateStorageItem(key: string, value: string, index: number) {
      try {
        let tab

        if (this.isPopupWindow) {
          const storedData = await ex.storage?.local?.get('storage_manager_active_tab_url')
          const storedTabUrl = storedData?.storage_manager_active_tab_url

          if (!storedTabUrl) {
            throw new Error('No stored tab information found')
          }

          const tabs = await ex.tabs?.query({ url: storedTabUrl })
          tab = tabs?.[0]

          if (!tab) {
            const allTabs = await ex.tabs?.query({})
            tab = allTabs?.find((t: any) => t.url && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('chrome://'))
          }

          if (!tab) {
            throw new Error('No valid web page tab found')
          }
        } else {
          const tabs = await ex.tabs?.query({ active: true, currentWindow: true })
          tab = tabs?.[0]

          if (!tab) {
            throw new Error('No active tab found')
          }
        }

        switch (this.currentStorageType) {
          case 'local':
            await ex.scripting?.executeScript({
              target: { tabId: tab.id },
              function: (k: string, v: string) => localStorage.setItem(k, v),
              args: [key, value]
            })
            break
          case 'session':
            await ex.scripting?.executeScript({
              target: { tabId: tab.id },
              function: (k: string, v: string) => sessionStorage.setItem(k, v),
              args: [key, value]
            })
            break
        }

        this.filteredData[index].value = value
        this.showNotification('Item updated')
      } catch (error) {
        console.error('Error updating item:', error)
        this.showNotification('Failed to update item', 'error')
      }
    },

    async deleteStorageItem(item: StorageItem) {
      try {
        let tab

        if (this.isPopupWindow) {
          const storedData = await ex.storage?.local?.get('storage_manager_active_tab_url')
          const storedTabUrl = storedData?.storage_manager_active_tab_url

          if (!storedTabUrl) {
            throw new Error('No stored tab information found')
          }

          const tabs = await ex.tabs?.query({ url: storedTabUrl })
          tab = tabs?.[0]

          if (!tab) {
            const allTabs = await ex.tabs?.query({})
            tab = allTabs?.find((t: any) => t.url && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('chrome://'))
          }

          if (!tab) {
            throw new Error('No valid web page tab found')
          }
        } else {
          const tabs = await ex.tabs?.query({ active: true, currentWindow: true })
          tab = tabs?.[0]

          if (!tab) {
            throw new Error('No active tab found')
          }
        }

        switch (this.currentStorageType) {
          case 'local':
            await ex.scripting?.executeScript({
              target: { tabId: tab.id },
              function: (key: string) => localStorage.removeItem(key),
              args: [item.key]
            })
            break
          case 'session':
            await ex.scripting?.executeScript({
              target: { tabId: tab.id },
              function: (key: string) => localStorage.removeItem(key),
              args: [item.key]
            })
            break
          case 'cookies':
            const url = `http${item.secure ? 's' : ''}://${item.domain}${item.path || '/'}`
            await ex.cookies?.remove({
              url: url,
              name: item.key
            })
            break
        }
      } catch (error) {
        console.error('Error deleting item:', error)
        throw error
      }
    },

    async openNewWindow() {
      const popupUrl = ex.runtime?.getURL('pages/popup/popup.html')
      const windowFeatures = 'width=700,height=550,scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no,directories=no,titlebar=no,popup=yes'

      try {
        const tabs = await ex.tabs?.query({ active: true, currentWindow: true })
        const activeTab = tabs?.[0]

        await ex.storage?.local?.set('storage_manager_active_tab_id', activeTab.id.toString())
        await ex.storage?.local?.set('storage_manager_active_tab_url', activeTab.url || '')
        await ex.storage?.local?.set('storage_manager_is_popup_window', true)

        const newWindow = window.open(popupUrl, 'storage_manager_popup', windowFeatures)

        setTimeout(() => {
          window.close()
        }, 30)

        if (newWindow) {
          newWindow.focus()
        }
      } catch (error) {
        console.error('Error opening popup window:', error)
      }
    },

    closeWindow() {
      window.close()
    },

    openInfoModal() {
      this.showInfoModal = true
    },

    closeInfoModal() {
      this.showInfoModal = false
    },

    openViewModal() {
      this.showViewModal = true
    },

    closeViewModal() {
      this.showViewModal = false
    },

    openEditModal() {
      this.showEditModal = true
    },

    closeEditModal() {
      this.showEditModal = false
    },

    async clearStoredTabId() {
      try {
        await ex.storage?.local?.remove('storage_manager_active_tab_id')
        await ex.storage?.local?.remove('storage_manager_active_tab_url')
        await ex.storage?.local?.remove('storage_manager_is_popup_window')
      } catch (error) {
        console.error('Error clearing stored tab ID:', error)
      }
    },

    showNotification(message: string, type: 'success' | 'error' = 'success') {
      const notification = document.createElement('div')
      notification.textContent = message
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        font-size: 14px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
      `

      document.body.appendChild(notification)

      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease'
        setTimeout(() => notification.remove(), 300)
      }, 3000)
    },

    showErrorState(message: string = 'Failed to load data') {
      this.hasError = true
      this.errorMessage = message
    },

    clearErrorState() {
      this.hasError = false
      this.errorMessage = ''
    },

    toggleDropdown(index: number) {
      if (this.openDropdownIndex === index) {
        this.openDropdownIndex = null
      } else {
        this.openDropdownIndex = index
      }
    },

    closeDropdown() {
      this.openDropdownIndex = null
    },

    escapeHtml(text: string) {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    }
  }
})
