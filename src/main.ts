import { createApp } from 'vue'
import { createPinia } from 'pinia'

import './assets/styles/base.css'

import App from './App.vue'
import router from './router'
import { applyTextSize, getTextSize } from './utils/textSize'

applyTextSize(getTextSize())

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
