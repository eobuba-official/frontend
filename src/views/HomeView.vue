<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Keyboard, ShieldAlert } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BottomTabBar from '@/components/common/BottomTabBar.vue'
import charMascot from '@/assets/img/char.png'
import { routePaths } from '@/router/routePaths'
import { speechAnalysisService } from '@/services/speechAnalysisService'
import { useConsultationFlowStore } from '@/stores/consultationFlow'
import { isVoicePermissionEnabled } from '@/utils/permissionPreferences'
import { encodeWav, mergeAudioChunks } from '@/utils/wavEncoder'
import VoiceOrb from './VoiceOrb.vue'

const router = useRouter()
const consultationFlow = useConsultationFlowStore()
const isListening = ref(false)
const isProcessing = ref(false)
const micError = ref('')
const voiceMediaStream = ref<MediaStream | null>(null)
const idleMascotMood = ref<'default' | 'sleepy' | 'surprised'>('default')

let mediaStream: MediaStream | null = null
let audioContext: AudioContext | null = null
let sourceNode: MediaStreamAudioSourceNode | null = null
let processorNode: ScriptProcessorNode | null = null
let silentGainNode: GainNode | null = null
let audioChunks: Float32Array[] = []
let idleTimer: number | undefined
let sleepyTimer: number | undefined
let surprisedTimer: number | undefined

const voiceOrbState = computed<'idle' | 'listening' | 'thinking'>(() => {
  if (isProcessing.value) return 'thinking'
  if (isListening.value) return 'listening'
  return 'idle'
})

const voiceOrbMood = computed<'default' | 'sleepy' | 'surprised' | 'error'>(() => {
  if (micError.value) return 'error'
  return idleMascotMood.value
})

async function handleVoiceStart() {
  if (isProcessing.value) return
  clearIdleMascotTimers()
  idleMascotMood.value = 'default'

  if (isListening.value) {
    await stopRecordingAndTranscribe()
    return
  }

  micError.value = ''
  // clear the previous consultation only when a new one actually starts — resetting on
  // every Home mount wiped the state that the flow screens still need when the user
  // navigates back into them
  consultationFlow.reset()
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

  voiceMediaStream.value = mediaStream
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
}

function handleOrbPermissionDenied() {
  clearIdleMascotTimers()
  idleMascotMood.value = 'default'
  micError.value = '마이크 권한이 꺼져 있어요. 브라우저 주소창의 마이크 아이콘에서 허용해 주세요.'
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
    const { transcription, analysis } = await speechAnalysisService.transcribeAndAnalyze(wavBlob)
    consultationFlow.setUtterance({
      utterance: transcription.transcript,
      inputMethod: 'VOICE',
      sttConfidence: transcription.sttConfidence,
    })
    consultationFlow.setAnalyzeResult(analysis)
    await router.push(
      analysis.status === 'FRAUD_WARNING' ? routePaths.fraudWarning : routePaths.utteranceConfirm,
    )
  } catch {
    micError.value = '음성을 분석하지 못했어요. 다시 눌러서 말씀해 주세요.'
  } finally {
    isProcessing.value = false
    if (!micError.value) scheduleIdleMascot()
  }
}

function clearIdleMascotTimers() {
  if (idleTimer) window.clearTimeout(idleTimer)
  if (sleepyTimer) window.clearTimeout(sleepyTimer)
  if (surprisedTimer) window.clearTimeout(surprisedTimer)
  idleTimer = undefined
  sleepyTimer = undefined
  surprisedTimer = undefined
}

function scheduleIdleMascot() {
  clearIdleMascotTimers()
  if (isListening.value || isProcessing.value || micError.value) return

  idleTimer = window.setTimeout(() => {
    idleMascotMood.value = 'sleepy'

    sleepyTimer = window.setTimeout(() => {
      idleMascotMood.value = 'surprised'

      surprisedTimer = window.setTimeout(() => {
        idleMascotMood.value = 'default'
        scheduleIdleMascot()
      }, 700)
    }, 2600)
  }, 10000)
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
  processorNode?.disconnect()
  sourceNode?.disconnect()
  silentGainNode?.disconnect()
  mediaStream?.getTracks().forEach((track) => track.stop())
  void audioContext?.close()

  processorNode = null
  sourceNode = null
  silentGainNode = null
  mediaStream = null
  voiceMediaStream.value = null
  audioContext = null
}

function goTextInput() {
  clearIdleMascotTimers()
  consultationFlow.reset()
  void router.push(routePaths.input)
}

function goFraudWarning() {
  clearIdleMascotTimers()
  void router.push(routePaths.fraudWarning)
}

onMounted(scheduleIdleMascot)

onBeforeUnmount(() => {
  clearIdleMascotTimers()
  closeAudioGraph()
})
</script>

<template>
  <AppScreen no-top-padding flush-footer>
    <div class="home" :class="{ 'home--listening': isListening }">
      <div v-if="isListening" class="home__listening-overlay" aria-hidden="true"></div>

      <header class="home__header">
        <div class="home__brand">
          <span
            class="home__brand-avatar"
            :style="{ backgroundImage: `url(${charMascot})` }"
            aria-hidden="true"
          ></span>
          <div class="home__brand-copy">
            <h1 class="home__brand-name">어부바</h1>
            <p class="home__brand-tagline">어르신 부담 바로 덜기</p>
          </div>
        </div>
      </header>

      <section class="home__hero" aria-label="음성으로 말씀해 주세요">
        <div class="home__hero-top">
          <div class="home__hero-copy">
            <p class="home__hero-caption">
              <template v-if="isProcessing">잠시만 기다려 주세요</template>
              <template v-else-if="isListening">말씀을 마치면 다시 눌러 주세요</template>
              <template v-else>저를 누르고 말씀해 주세요</template>
            </p>
          </div>
        </div>

        <VoiceOrb
          :state="voiceOrbState"
          :mood="voiceOrbMood"
          :media-stream="voiceMediaStream"
          @toggle="handleVoiceStart"
          @permission-denied="handleOrbPermissionDenied"
        />

        <small v-if="micError" class="home__hero-error home__hero-error--visible">
          {{ micError }}
        </small>
      </section>

      <section class="quick-actions" aria-label="빠른 실행">
        <button class="quick-card" type="button" @click="goTextInput">
          <span class="quick-card__icon quick-card__icon--keyboard" aria-hidden="true">
            <Keyboard :size="34" :stroke-width="2.2" />
          </span>
          <strong>글자로 알려주기</strong>
        </button>

        <button class="quick-card" type="button" @click="goFraudWarning">
          <span class="quick-card__icon quick-card__icon--shield" aria-hidden="true">
            <ShieldAlert :size="38" :stroke-width="2.2" />
          </span>
          <strong>보이스피싱 예방</strong>
        </button>
      </section>
    </div>

    <template #footer>
      <BottomTabBar />
    </template>
  </AppScreen>
</template>

<style scoped>
.home {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-5);
  background: var(--color-bg);
  padding: var(--space-5) 0 0;
}

.home__listening-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: rgba(31, 35, 41, 0.14);
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
  gap: var(--space-2);
  min-width: 0;
}

.home__brand-avatar {
  flex: 0 0 76px;
  width: 76px;
  height: 76px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% auto;
}

.home__brand-copy {
  min-width: 0;
}

.home__brand-name {
  color: var(--color-ink);
  font-family: 'Jua', var(--font-body);
  font-size: 1.7rem;
  line-height: 1.1;
}

.home__brand-tagline {
  margin-top: 2px;
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  font-weight: 600;
}

.home__hero {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding-block: var(--space-4);
  text-align: center;
}

.home__hero::before {
  position: absolute;
  top: 57%;
  left: 50%;
  width: min(82vw, 360px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 232, 143, 0.34) 0%,
    rgba(255, 246, 207, 0.2) 48%,
    rgba(255, 250, 235, 0) 72%
  );
  content: '';
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.home__hero-top {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
  z-index: 1;
}

.home__hero-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.home__hero-caption {
  position: relative;
  color: var(--color-ink);
  font-size: var(--text-2xl);
  font-weight: 800;
  line-height: 1.35;
}

.home__hero-error {
  min-height: 20px;
  color: var(--color-accent-deep);
  font-size: var(--text-sm);
  font-weight: 700;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
}

.home__hero-error--visible {
  opacity: 1;
  visibility: visible;
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
  min-height: 158px;
  padding: var(--space-5) var(--space-3);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  box-shadow: 0 8px 20px rgba(31, 35, 41, 0.04);
  color: var(--color-ink);
  cursor: pointer;
}

.quick-card__icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 24px;
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
  font-size: var(--text-lg);
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

@media (max-width: 420px) {
  .home {
    gap: var(--space-4);
    padding-top: var(--space-4);
  }

  .home__brand-tagline {
    font-size: var(--text-sm);
  }

  .home__hero-caption {
    font-size: var(--text-xl);
  }

  .quick-actions {
    gap: var(--space-3);
  }

  .quick-card {
    min-height: 140px;
    padding-inline: var(--space-2);
  }

  .quick-card strong {
    font-size: var(--text-lg);
  }
}
</style>
