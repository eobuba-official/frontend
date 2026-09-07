<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Keyboard, Mic, Settings, ShieldAlert } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import logoMark from '@/assets/img/logo-mark.png'
import { routePaths } from '@/router/routePaths'
import { speechService } from '@/services/speechService'
import { useConsultationFlowStore } from '@/stores/consultationFlow'
import { isVoicePermissionEnabled } from '@/utils/permissionPreferences'
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
const micCoreScale = computed(() => {
  if (!isListening.value) {
    return 1
  }

  const averageLevel = barLevels.value.reduce((sum, level) => sum + level, 0) / barLevels.value.length
  return 1 + Math.min(0.1, averageLevel * 0.1)
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
  if (!isVoicePermissionEnabled()) {
    micError.value = '설정에서 음성 권한을 켜주세요.'
    return
  }

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
    <div class="home" :class="{ 'home--listening': isListening }">
      <div v-if="isListening" class="home__listening-overlay" aria-hidden="true"></div>

      <header class="home__header">
        <div class="home__brand">
          <span
            class="home__brand-avatar"
            :style="{ backgroundImage: `url(${logoMark})` }"
            aria-hidden="true"
          ></span>
          <div class="home__brand-copy">
            <h1 class="home__brand-name">어부바</h1>
            <p class="home__brand-tagline">말로 은행 업무를 도와드려요</p>
          </div>
        </div>

        <button class="home__settings-button" type="button" aria-label="설정" @click="goSettings">
          <Settings :size="20" :stroke-width="2.4" />
        </button>
      </header>

      <section class="home__hero" aria-labelledby="home-title">
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

        <button
          class="voice-orb"
          :class="{ 'voice-orb--listening': isListening }"
          type="button"
          :aria-label="micButtonLabel"
          :disabled="isProcessing"
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
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.home__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.home__brand-avatar {
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-pill);
  background-color: var(--color-yellow-light);
  background-repeat: no-repeat;
  background-position: center;
  background-size: 58% auto;
}

.home__brand-copy {
  min-width: 0;
}

.home__brand-name {
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.2;
}

.home__brand-tagline {
  margin-top: 2px;
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  font-weight: 600;
}

.home__settings-button {
  display: grid;
  flex-shrink: 0;
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

.home__hero {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding-block: var(--space-2);
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
  .home__brand-name {
    font-size: 1.3rem;
  }

  .home__brand-tagline {
    font-size: var(--text-sm);
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
