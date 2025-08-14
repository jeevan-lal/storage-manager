import { createApp } from 'vue'
import Popup from './popup.vue'
import { createPinia } from 'pinia'

import '@src/assets/css/styles.css'

const pinia = createPinia()
const app = createApp(Popup)

app.use(pinia)
app.mount('#popup')
