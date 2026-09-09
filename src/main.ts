import { createApp } from 'vue'
import { createPinia } from 'pinia'

import './assets/styles/base.css'

import App from './App.vue'
import router from './router'
import { registerServiceWorker } from './registerServiceWorker'
import { applyTextSize, getTextSize } from './utils/textSize'

applyTextSize(getTextSize())
registerServiceWorker()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
