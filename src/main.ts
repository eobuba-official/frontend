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

// AppErrorBoundary handles render/setup errors; this catches what escapes it, such as
// throws inside watchers and async handlers, so they're never silently swallowed
app.config.errorHandler = (error, _instance, info) => {
  console.error('[app] error', info, error)
}

app.use(createPinia())
app.use(router)

app.mount('#app')
