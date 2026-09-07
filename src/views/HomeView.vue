<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Keyboard, Mic, Settings, ShieldAlert } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import { routePaths } from '@/router/routePaths'
import { useConsultationFlowStore } from '@/stores/consultationFlow'

const VOICE_FALLBACK_UTTERANCE = '통장을 잃어버렸는데 다시 만들고 싶어'

const router = useRouter()
const consultationFlow = useConsultationFlowStore()
const userName = '김부바'
const isListening = ref(false)
const micError = ref('')
const barLevels = ref([0.38, 0.64, 0.88, 0.52, 0.7, 0.44])

let animationFrame = 0
let recognition: SpeechRecognition | null = null
let pendingTranscript = ''
let isCompleting = false

const micButtonLabel = computed(() =>
  isListening.value ? '듣고 있어요. 그만하시려면 다시 눌러주세요' : '동그라미를 누르고 말로 은행 업무를 알려주세요',
)
const todayLabel = computed(() => {
  const today = new Date()
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(today)
})
const micCoreScale = computed(() => {
  if (!isListening.value) {
    return 1
  }

  const averageLevel = barLevels.value.reduce((sum, level) => sum + level, 0) / barLevels.value.length
  return 1 + Math.min(0.1, averageLevel * 0.1)
})

function handleVoiceStart() {
  if (isListening.value) {
    completeVoiceInput()
    return
  }

  pendingTranscript = ''
  isCompleting = false
  isListening.value = true
  micError.value = ''
  startFallbackMotion()
  startSpeechRecognition()
}

function startSpeechRecognition() {
  const RecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition

  if (!RecognitionCtor) {
    return
  }

  recognition = new RecognitionCtor()
  recognition.lang = 'ko-KR'
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  recognition.onresult = (event) => {
    const results = Array.from(event.results)
    const transcript = results
      .map((result) => result[0]?.transcript ?? '')
      .join(' ')
      .trim()

    if (transcript) {
      pendingTranscript = transcript
    }
  }

  recognition.onerror = () => {
    micError.value = '잘 듣지 못했어요. 다시 눌러서 말씀해 주세요.'
    stopMicrophone()
  }

  recognition.onend = () => {
    if (isListening.value && pendingTranscript.trim() && !isCompleting) {
      completeVoiceInput(pendingTranscript)
    } else if (isListening.value && !isCompleting) {
      stopMicrophone()
    }
  }

  try {
    recognition.start()
  } catch {
    micError.value = '마이크를 시작하지 못했어요. 글자로 알려주세요.'
  }
}

function completeVoiceInput(transcript = pendingTranscript) {
  if (isCompleting) {
    return
  }

  isCompleting = true
  consultationFlow.setUtterance({
    utterance: transcript.trim() || VOICE_FALLBACK_UTTERANCE,
    inputMethod: 'VOICE',
    sttConfidence: null,
  })
  stopMicrophone()
  void router.push(routePaths.utteranceConfirm)
}

function goTextInput() {
  void router.push(routePaths.input)
}

function goFraudWarning() {
  void router.push(routePaths.fraudWarning)
}

function goSettings() {
  void router.push(routePaths.settings)
}

function startFallbackMotion() {
  const tick = () => {
    const now = Date.now() / 260
    barLevels.value = barLevels.value.map((_, index) => 0.34 + Math.abs(Math.sin(now + index * 0.65)) * 0.62)
    animationFrame = window.requestAnimationFrame(tick)
  }

  tick()
}

function stopMicrophone() {
  window.cancelAnimationFrame(animationFrame)
  recognition?.abort()
  recognition = null
  isListening.value = false
  barLevels.value = [0.38, 0.64, 0.88, 0.52, 0.7, 0.44]
}

onBeforeUnmount(stopMicrophone)
</script>

<template>
  <AppScreen no-top-padding>
    <div class="home" :class="{ 'home--listening': isListening }">
      <div v-if="isListening" class="home__listening-overlay" aria-hidden="true"></div>

      <header class="home__header">
        <div class="home__topline">
          <span class="home__bank">KB</span>
          <button class="home__settings-button" type="button" aria-label="설정" @click="goSettings">
            <Settings :size="20" :stroke-width="2.4" />
          </button>
        </div>

        <div class="home__profile">
          <span class="home__logo" aria-hidden="true"></span>
          <div class="home__profile-copy">
            <h1 class="home__title">{{ userName }}</h1>
            <p class="home__subtitle">좋은 하루 되세요 :)</p>
          </div>
          <time class="home__date">{{ todayLabel }}</time>
        </div>
      </header>

      <section class="home__hero" aria-labelledby="home-title">
        <div class="home__copy">
          <h2 id="home-title">{{ isListening ? '듣고 있어요...' : '무엇을 도와드릴까요?' }}</h2>
          <p>{{ isListening ? '끝나면 동그라미를 다시 눌러주세요' : '동그라미를 누르고 편하게 말씀하세요' }}</p>
          <small v-if="micError">{{ micError }}</small>
        </div>

        <button
          class="voice-orb"
          :class="{ 'voice-orb--listening': isListening }"
          type="button"
          :aria-label="micButtonLabel"
          @click="handleVoiceStart"
        >
          <span
            class="voice-orb__center"
            :style="{ transform: `scale(${micCoreScale})` }"
            aria-hidden="true"
          >
            <Mic :size="52" :stroke-width="1.9" />
          </span>
        </button>
      </section>

      <section class="quick-actions" aria-label="빠른 실행">
        <button class="quick-card" type="button" @click="goTextInput">
          <span class="quick-card__icon quick-card__icon--keyboard" aria-hidden="true">
            <Keyboard :size="34" :stroke-width="2.2" />
          </span>
          <strong>글자로 알려주기</strong>
          <span>말로 하기 어려우실 때</span>
        </button>

        <button class="quick-card" type="button" @click="goFraudWarning">
          <span class="quick-card__icon quick-card__icon--shield" aria-hidden="true">
            <ShieldAlert :size="38" :stroke-width="2.2" />
          </span>
          <strong>보이스피싱 예방</strong>
          <span>수상한 전화 확인하기</span>
        </button>
      </section>
    </div>
  </AppScreen>
</template>

<style scoped>
.home {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg);
  padding: var(--space-5) 0 var(--space-7);
}

.home__listening-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: rgba(31, 35, 41, 0.32);
  pointer-events: none;
}

.home__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.home__topline,
.home__profile {
  display: flex;
  align-items: center;
  width: 100%;
}

.home__topline {
  justify-content: space-between;
}

.home__bank {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  font-weight: 800;
}

.home__settings-button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
}

.home__settings-button:hover {
  background: var(--color-surface-alt);
}

.home__profile {
  gap: var(--space-3);
}

.home__logo {
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: transparent;
}

.home__profile-copy {
  min-width: 0;
}

.home__title {
  font-family: var(--font-body);
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1.05;
}

.home__subtitle {
  margin-top: var(--space-1);
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  font-weight: 600;
}

.home__date {
  margin-left: auto;
  color: var(--color-ink-soft);
  font-size: var(--text-lg);
  font-weight: 700;
  white-space: nowrap;
}

.home__hero {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-7);
  min-height: 520px;
  padding-block: var(--space-8);
  text-align: center;
}

.voice-orb {
  position: relative;
  z-index: 2;
  display: grid;
  place-items: center;
  width: min(53vw, 231px);
  aspect-ratio: 1;
  border: 0;
  border-radius: var(--radius-pill);
  background:
    radial-gradient(circle at 27% 24%, rgba(255, 255, 255, 0.95) 0 12%, rgba(255, 255, 255, 0.28) 22%, transparent 34%),
    radial-gradient(circle at 70% 72%, rgba(255, 244, 196, 0.7) 0 7%, transparent 18%),
    radial-gradient(circle at 50% 50%, #ffffff 0 28%, transparent 29%),
    conic-gradient(from 218deg at 52% 50%, #efcc58, #f7e692, #fff4c4, #f1d45d, #dfb12d, #efcf61, #fae9a4, #f7e692, #efcc58),
    radial-gradient(circle at 50% 54%, #fae9a4 0, #efcc58 72%, #f7e692 100%);
  box-shadow:
    0 16px 38px rgba(216, 170, 32, 0.14),
    inset 0 10px 34px rgba(255, 255, 255, 0.38);
  cursor: pointer;
  isolation: isolate;
}

.voice-orb::before,
.voice-orb::after {
  position: absolute;
  inset: 10%;
  z-index: -1;
  border-radius: inherit;
  background: rgba(255, 188, 0, 0.12);
  content: '';
  opacity: 0;
}

.voice-orb--listening::before {
  animation: pulse-ring 1.4s ease-out infinite;
}

.voice-orb--listening::after {
  animation: pulse-ring 1.4s 0.35s ease-out infinite;
}

.voice-orb__center {
  display: grid;
  place-items: center;
  width: 68px;
  aspect-ratio: 1;
  border-radius: var(--radius-pill);
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(31, 35, 41, 0.06);
  transition: transform 80ms linear;
}

.voice-orb__center :deep(svg) {
  width: 42px;
  height: 42px;
  color: var(--color-accent-deep);
}

.home__copy {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.home--listening .home__copy {
  color: #ffffff;
}

.home__copy h2 {
  font-family: var(--font-body);
  font-size: 2.35rem;
  font-weight: 800;
  line-height: 1.18;
}

.home--listening .home__copy h2 {
  color: #ffffff;
}

.home__copy p {
  color: var(--color-ink-soft);
  font-size: var(--text-xl);
  font-weight: 600;
}

.home--listening .home__copy p {
  color: rgba(255, 255, 255, 0.86);
}

.home__copy small {
  color: var(--color-accent-deep);
  font-size: var(--text-sm);
  font-weight: 700;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.quick-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  min-height: 174px;
  padding: var(--space-6) var(--space-3);
  border: 1px solid #f2f2f2;
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  box-shadow: 0 8px 20px rgba(31, 35, 41, 0.04);
  color: var(--color-ink);
  cursor: pointer;
}

.quick-card__icon {
  display: grid;
  place-items: center;
  width: 66px;
  height: 66px;
  border-radius: 28px;
  margin-bottom: var(--space-3);
}

.quick-card__icon--keyboard {
  background: var(--color-yellow-light);
}

.quick-card__icon--keyboard :deep(svg) {
  color: var(--color-accent-deep);
}

.quick-card__icon--shield {
  background: var(--color-alert-bg);
  color: var(--color-alert);
}

.quick-card__icon--shield :deep(svg) {
  color: var(--color-alert);
}

.quick-card strong {
  font-size: var(--text-xl);
  font-weight: 800;
  line-height: 1.25;
  text-align: center;
}

.quick-card > span:last-child {
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  font-weight: 600;
  text-align: center;
}

@keyframes pulse-ring {
  0% {
    opacity: 0.5;
    transform: scale(0.85);
  }

  100% {
    opacity: 0;
    transform: scale(1.22);
  }
}

@media (max-width: 420px) {
  .home__title {
    font-size: 2rem;
  }

  .home__subtitle {
    font-size: var(--text-sm);
  }

  .home__date {
    font-size: var(--text-base);
  }

  .home__copy h2 {
    font-size: 2rem;
  }

  .home__copy p {
    font-size: var(--text-lg);
  }

  .quick-actions {
    gap: var(--space-3);
  }

  .quick-card {
    min-height: 156px;
    padding-inline: var(--space-2);
  }

  .quick-card strong {
    font-size: var(--text-lg);
  }
}
</style>
