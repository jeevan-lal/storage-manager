import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => {
    return {
      app: null as AppInfo | null,
    }
  },
  actions: {
  },
  getters: {
  }
});
