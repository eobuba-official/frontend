<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Keyboard, Mic, ShieldAlert } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import { routePaths } from '@/router/routePaths'
import { speechService } from '@/services/speechService'
import { useConsultationFlowStore } from '@/stores/consultationFlow'
import { encodeWav, mergeAudioChunks } from '@/utils/wavEncoder'

const router = useRouter()
const consultationFlow = useConsultationFlowStore()
const isListening = ref(false)
const isProcessing = ref(false)
const micError = ref('')
const barLevels = ref([0.38, 0.64, 0.88, 0.52, 0.7, 0.44])

let animationFrame = 0
let mediaStream: MediaStream | null = null
let audioContext: AudioContext | null = null
let sourceNode: MediaStreamAudioSourceNode | null = null
let processorNode: ScriptProcessorNode | null = null
let silentGainNode: GainNode | null = null
let audioChunks: Float32Array[] = []

const micButtonLabel = computed(() => {
  if (isProcessing.value) return '확인하고 있어요. 잠시만 기다려주세요'
  return isListening.value ? '듣고 있어요. 그만하시려면 다시 눌러주세요' : '동그라미를 누르고 말로 은행 업무를 알려주세요'
})

async function handleVoiceStart() {
  if (isProcessing.value) return

  if (isListening.value) {
    await stopRecordingAndTranscribe()
    return
  }

  micError.value = ''
  await startRecording()
}

async function startRecording() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch (error) {
    micError.value = mapGetUserMediaError(error)
    return
  }

  audioContext = new AudioContext()
  sourceNode = audioContext.createMediaStreamSource(mediaStream)
  processorNode = audioContext.createScriptProcessor(4096, 1, 1)
  silentGainNode = audioContext.createGain()
  silentGainNode.gain.value = 0

  audioChunks = []
  processorNode.onaudioprocess = (event) => {
    audioChunks.push(new Float32Array(event.inputBuffer.getChannelData(0)))
  }

  sourceNode.connect(processorNode)
  processorNode.connect(silentGainNode)
  silentGainNode.connect(audioContext.destination)

  isListening.value = true
  startFallbackMotion()
}

async function stopRecordingAndTranscribe() {
  const samples = mergeAudioChunks(audioChunks)
  const sampleRate = audioContext?.sampleRate ?? 16000
  closeAudioGraph()
  isListening.value = false

  if (samples.length === 0) {
    micError.value = '말씀이 들리지 않았어요. 다시 눌러서 말씀해 주세요.'
    return
  }

  isProcessing.value = true

  try {
    const wavBlob = encodeWav(samples, sampleRate)
    const result = await speechService.transcribe(wavBlob)
    consultationFlow.setUtterance({
      utterance: result.transcript,
      inputMethod: 'VOICE',
      sttConfidence: result.sttConfidence,
    })
    await router.push(routePaths.utteranceConfirm)
  } catch (error) {
    micError.value = error instanceof Error ? error.message : '잘 듣지 못했어요. 다시 눌러서 말씀해 주세요.'
  } finally {
    isProcessing.value = false
  }
}

function mapGetUserMediaError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : ''
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return '마이크 권한이 꺼져 있어요. 브라우저 주소창의 마이크 아이콘에서 허용해 주세요.'
    case 'NotFoundError':
      return '마이크를 찾을 수 없어요. 마이크가 연결되어 있는지 확인해 주세요.'
    default:
      return '마이크를 시작하지 못했어요. 다시 눌러주세요.'
  }
}

function closeAudioGraph() {
  window.cancelAnimationFrame(animationFrame)
  processorNode?.disconnect()
  sourceNode?.disconnect()
  silentGainNode?.disconnect()
  mediaStream?.getTracks().forEach((track) => track.stop())
  void audioContext?.close()

  processorNode = null
  sourceNode = null
  silentGainNode = null
  mediaStream = null
  audioContext = null
  barLevels.value = [0.38, 0.64, 0.88, 0.52, 0.7, 0.44]
}

function goTextInput() {
  void router.push(routePaths.input)
}

function goFraudWarning() {
  void router.push(routePaths.fraudWarning)
}

function goHistory() {
  void router.push(routePaths.history)
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

onBeforeUnmount(closeAudioGraph)
</script>

<template>
  <AppScreen no-top-padding>
    <div class="home">
      <header class="home__header">
        <div class="home__brand">
          <span class="home__logo" aria-hidden="true"></span>
          <div>
            <h1 class="home__title">어부바</h1>
            <p class="home__subtitle">말로 은행 업무를 도와드려요</p>
          </div>
        </div>

        <nav class="home__nav" aria-label="홈 메뉴">
          <button type="button" @click="goHistory">상담 내역</button>
          <button type="button" @click="goSettings">설정</button>
        </nav>
      </header>

      <section class="home__hero" aria-labelledby="home-title">
        <button
          class="voice-orb"
          :class="{ 'voice-orb--listening': isListening }"
          type="button"
          :aria-label="micButtonLabel"
          :disabled="isProcessing"
          @click="handleVoiceStart"
        >
          <span class="voice-orb__bars voice-orb__bars--left" aria-hidden="true">
            <span v-for="(level, index) in barLevels.slice(0, 3)" :key="`left-${index}`" :style="{ transform: `scaleY(${level})` }"></span>
          </span>

          <span class="voice-orb__center" aria-hidden="true">
            <Mic :size="52" :stroke-width="1.9" />
          </span>

          <span class="voice-orb__bars voice-orb__bars--right" aria-hidden="true">
            <span v-for="(level, index) in barLevels.slice(3)" :key="`right-${index}`" :style="{ transform: `scaleY(${level})` }"></span>
          </span>
        </button>

        <div class="home__copy">
          <h2 id="home-title">
            {{ isProcessing ? '확인하고 있어요...' : isListening ? '듣고 있어요...' : '무엇을 도와드릴까요?' }}
          </h2>
          <p>
            {{
              isProcessing
                ? '잠시만 기다려주세요'
                : isListening
                  ? '끝나면 동그라미를 다시 눌러주세요'
                  : '동그라미를 누르고 편하게 말씀하세요'
            }}
          </p>
          <small v-if="micError">{{ micError }}</small>
        </div>
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
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg);
  padding: var(--space-5) 0 var(--space-7);
}

.home__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.home__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.home__logo {
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
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

.home__nav {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding-top: var(--space-4);
}

.home__nav button {
  border: 0;
  background: transparent;
  color: var(--color-ink-soft);
  font: inherit;
  font-size: var(--text-lg);
  font-weight: 700;
  cursor: pointer;
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
  display: grid;
  place-items: center;
  width: min(76vw, 330px);
  aspect-ratio: 1;
  border: 0;
  border-radius: var(--radius-pill);
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.96) 0 28%, transparent 29%),
    radial-gradient(circle at 34% 27%, rgba(255, 255, 255, 0.78) 0 8%, transparent 29%),
    linear-gradient(142deg, #fffaf2 6%, #f7dca4 36%, #f2a73b 66%, #e6dcc7 100%);
  box-shadow:
    0 28px 80px rgba(242, 167, 59, 0.25),
    inset 0 18px 55px rgba(255, 255, 255, 0.45);
  cursor: pointer;
  isolation: isolate;
}

.voice-orb:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.voice-orb::before,
.voice-orb::after {
  position: absolute;
  inset: 10%;
  z-index: -1;
  border-radius: inherit;
  background: rgba(242, 167, 59, 0.14);
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
  width: 112px;
  aspect-ratio: 1;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 45px rgba(51, 40, 28, 0.08);
}

.voice-orb__center :deep(svg) {
  color: var(--color-accent);
}

.voice-orb__bars {
  position: absolute;
  top: 50%;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 90px;
  transform: translateY(-50%);
}

.voice-orb__bars--left {
  left: 18%;
}

.voice-orb__bars--right {
  right: 18%;
}

.voice-orb__bars span {
  width: 10px;
  height: 76px;
  border-radius: var(--radius-pill);
  background: linear-gradient(to bottom, #e6dcc7, var(--color-accent));
  opacity: 0.62;
  transform-origin: center;
  transition: transform 80ms linear;
}

.voice-orb__bars span:nth-child(2) {
  height: 104px;
}

.voice-orb__bars span:nth-child(3) {
  height: 64px;
}

.home__copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.home__copy h2 {
  font-family: var(--font-body);
  font-size: 2.35rem;
  font-weight: 800;
  line-height: 1.18;
}

.home__copy p {
  color: var(--color-ink-soft);
  font-size: var(--text-xl);
  font-weight: 600;
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
  border: 1px solid rgba(230, 220, 199, 0.78);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 35px rgba(51, 40, 28, 0.06);
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
  background: var(--color-surface-alt);
}

.quick-card__icon--keyboard :deep(svg) {
  color: var(--color-accent);
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

  .home__nav {
    gap: var(--space-2);
  }

  .home__nav button {
    font-size: var(--text-base);
  }

  .voice-orb__bars--left {
    left: 12%;
  }

  .voice-orb__bars--right {
    right: 12%;
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
