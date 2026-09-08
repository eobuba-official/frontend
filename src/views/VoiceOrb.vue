<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Mic } from '@lucide/vue'

type VoiceOrbState = 'idle' | 'listening' | 'thinking'

const props = defineProps<{
  state: VoiceOrbState
  mediaStream?: MediaStream | null
}>()

const emit = defineEmits<{
  toggle: []
  'permission-denied': []
}>()

const previousState = ref<VoiceOrbState>(props.state)
const barHeights = ref([8, 8, 8, 8, 8])

let ownedMediaStream: MediaStream | null = null
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let freqData: Uint8Array<ArrayBuffer> | null = null
let rafId = 0

const ariaLabel = computed(() => {
  if (props.state === 'listening') return '다 말했어요'
  if (props.state === 'thinking') return '생각하는 중'
  return '눌러서 말하기'
})

const fadeDurationMs = computed(() => {
  const pair = [previousState.value, props.state].sort().join('-')
  return pair === 'idle-listening' ? 400 : 300
})

function handleToggle() {
  emit('toggle')
}

function stopListeningAudio() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
  analyser = null
  freqData = null
  ownedMediaStream?.getTracks().forEach((track) => track.stop())
  ownedMediaStream = null
  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
  barHeights.value = [8, 8, 8, 8, 8]
}

function runVisualizer() {
  const bandSize = freqData ? Math.max(1, Math.floor(freqData.length / 5)) : 1

  const tick = () => {
    if (!analyser || !freqData) return
    analyser.getByteFrequencyData(freqData)

    barHeights.value = barHeights.value.map((prevHeight, index) => {
      const start = index * bandSize
      const end = start + bandSize
      const slice = freqData!.subarray(start, end)
      let sum = 0
      for (const value of slice) sum += value
      const average = slice.length > 0 ? sum / slice.length : 0
      const target = 8 + (average / 255) * (34 - 8)
      return prevHeight + (target - prevHeight) * 0.3
    })

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
}

function buildAnalyser(stream: MediaStream) {
  audioContext = new AudioContext()
  const source = audioContext.createMediaStreamSource(stream)
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 64
  freqData = new Uint8Array(analyser.frequencyBinCount)
  source.connect(analyser)
  runVisualizer()
}

async function startListeningAudio() {
  if (props.mediaStream) {
    buildAnalyser(props.mediaStream)
    return
  }

  try {
    ownedMediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
        sampleRate: 16000,
      },
    })
  } catch {
    emit('permission-denied')
    return
  }

  buildAnalyser(ownedMediaStream)
}

watch(
  () => props.state,
  (next, prev) => {
    previousState.value = prev
    if (next === 'listening') {
      void startListeningAudio()
    } else {
      stopListeningAudio()
    }
  },
)

onBeforeUnmount(stopListeningAudio)
</script>

<template>
  <div
    class="voice-orb"
    :class="`voice-orb--${state}`"
    role="button"
    tabindex="0"
    :aria-label="ariaLabel"
    aria-live="polite"
    @click="handleToggle"
    @keydown.enter.prevent="handleToggle"
    @keydown.space.prevent="handleToggle"
  >
    <div class="voice-orb__surface">
      <span class="voice-orb__blob voice-orb__blob--1"><i></i></span>
      <span class="voice-orb__blob voice-orb__blob--2"><i></i></span>
      <span class="voice-orb__blob voice-orb__blob--3"><i></i></span>
      <span class="voice-orb__blob voice-orb__blob--4"><i></i></span>
      <span class="voice-orb__blob voice-orb__blob--5"><i></i></span>

      <Transition name="voice-orb-fade" mode="out-in">
        <div v-if="state === 'idle'" key="idle" class="voice-orb__core voice-orb__core--idle">
          <Mic class="voice-orb__mic" :size="32" :stroke-width="2" />
        </div>
        <div v-else-if="state === 'listening'" key="listening" class="voice-orb__core voice-orb__core--listening">
          <span class="voice-orb__bars">
            <span
              v-for="(height, index) in barHeights"
              :key="index"
              class="voice-orb__bar"
              :style="{ height: `${height}px` }"
            ></span>
          </span>
        </div>
        <div v-else key="thinking" class="voice-orb__core voice-orb__core--thinking">
          <span class="voice-orb__dots">
            <span class="voice-orb__dot voice-orb__dot--1"></span>
            <span class="voice-orb__dot voice-orb__dot--2"></span>
            <span class="voice-orb__dot voice-orb__dot--3"></span>
          </span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.voice-orb {
  position: relative;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  cursor: pointer;
  animation: voice-orb-breathe-idle 4s ease-in-out infinite;
}

.voice-orb::before {
  content: '';
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  box-shadow: 0 12px 42px -6px rgba(242, 167, 59, 0.3);
  opacity: 0.25;
  pointer-events: none;
}

.voice-orb--idle::before {
  animation: voice-orb-glow 4s ease-in-out infinite;
}

.voice-orb--listening {
  animation: voice-orb-breathe-listening 4s ease-in-out infinite;
}

.voice-orb--thinking {
  animation: none;
}

.voice-orb--thinking .voice-orb__blob {
  animation-duration: calc(var(--spin) / 2);
}

.voice-orb__surface {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-orb__blob {
  position: absolute;
  inset: 0;
  transform-origin: 50% 50%;
  will-change: transform;
  animation-name: voice-orb-spin;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-duration: var(--spin);
  animation-direction: var(--dir);
}

.voice-orb__blob i {
  position: absolute;
  display: block;
  border-radius: 50%;
}

.voice-orb__blob--1 {
  --spin: 18s;
  --dir: normal;
}

.voice-orb__blob--1 i {
  width: 150px;
  height: 130px;
  top: -6%;
  left: 8%;
  background: #f2a73b;
  filter: blur(34px);
}

.voice-orb__blob--2 {
  --spin: 24s;
  --dir: reverse;
}

.voice-orb__blob--2 i {
  width: 130px;
  height: 150px;
  top: 45%;
  left: 55%;
  background: #ffd98a;
  filter: blur(36px);
}

.voice-orb__blob--3 {
  --spin: 30s;
  --dir: normal;
}

.voice-orb__blob--3 i {
  width: 170px;
  height: 140px;
  top: 18%;
  left: -8%;
  background: #e8863a;
  filter: blur(32px);
}

.voice-orb__blob--4 {
  --spin: 26s;
  --dir: reverse;
}

.voice-orb__blob--4 i {
  width: 120px;
  height: 120px;
  top: 58%;
  left: 12%;
  background: #ffffff;
  filter: blur(38px);
}

.voice-orb__blob--5 {
  --spin: 21s;
  --dir: normal;
}

.voice-orb__blob--5 i {
  width: 140px;
  height: 160px;
  top: -8%;
  left: 48%;
  background: #fff3d6;
  filter: blur(30px);
}

.voice-orb__core {
  position: relative;
  z-index: 2;
  width: 78px;
  height: 78px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-orb__core--idle,
.voice-orb__core--thinking {
  background: #ffffff;
}

.voice-orb__core--listening {
  background: #f2a73b;
}

.voice-orb__mic {
  color: #f2a73b;
}

.voice-orb__bars {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  height: 34px;
}

.voice-orb__bar {
  width: 5px;
  border-radius: 3px;
  background: #ffffff;
}

.voice-orb__dots {
  display: flex;
  align-items: center;
  gap: 8px;
}

.voice-orb__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f2a73b;
  animation: voice-orb-dot-bounce 0.9s ease-in-out infinite;
}

.voice-orb__dot--1 {
  animation-delay: 0s;
}

.voice-orb__dot--2 {
  animation-delay: 0.15s;
}

.voice-orb__dot--3 {
  animation-delay: 0.3s;
}

.voice-orb-fade-enter-active,
.voice-orb-fade-leave-active {
  transition: opacity v-bind('`${fadeDurationMs}ms`') ease;
}

.voice-orb-fade-enter-from,
.voice-orb-fade-leave-to {
  opacity: 0;
}

@keyframes voice-orb-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes voice-orb-breathe-idle {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04);
  }
}

@keyframes voice-orb-breathe-listening {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

@keyframes voice-orb-glow {
  0%,
  100% {
    opacity: 0.25;
  }
  50% {
    opacity: 0.4;
  }
}

@keyframes voice-orb-dot-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .voice-orb,
  .voice-orb--listening,
  .voice-orb__blob,
  .voice-orb--idle::before {
    animation: none !important;
  }

  .voice-orb::before {
    opacity: 0.25;
  }
}
</style>
