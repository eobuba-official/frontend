<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import hoduCharacter from '@/assets/img/hodu-character.png'
import hoduError from '@/assets/img/hodu-error.png'
import hoduSleepy from '@/assets/img/hodu-sleepy.png'
import hoduSurprised from '@/assets/img/hodu-surprised.png'

type VoiceOrbState = 'idle' | 'listening' | 'thinking'
type VoiceOrbMood = 'default' | 'sleepy' | 'surprised' | 'error'

const props = defineProps<{
  state: VoiceOrbState
  mood?: VoiceOrbMood
  mediaStream?: MediaStream | null
}>()

defineEmits<{
  toggle: []
  'permission-denied': []
}>()

const voiceLevel = ref(0)
const voiceWobble = ref(0)

let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let sourceNode: MediaStreamAudioSourceNode | null = null
let timeData: Uint8Array<ArrayBuffer> | null = null
let rafId = 0

const ariaLabel = computed(() => {
  if (props.state === 'listening') return '다 말했어요'
  if (props.state === 'thinking') return '생각하는 중'
  return '눌러서 말하기'
})

const orbStyle = computed(() => ({
  '--voice-level': voiceLevel.value.toFixed(3),
  '--voice-wobble': voiceWobble.value.toFixed(3),
  '--hodu-mask-image': `url(${hoduCharacter})`,
}))

const activeMood = computed(() => props.mood ?? 'default')
const isSpeaking = computed(() => props.state === 'listening' && voiceLevel.value > 0.045)

const mascotSrc = computed(() => {
  if (props.state === 'thinking') return hoduCharacter
  if (activeMood.value === 'sleepy') return hoduSleepy
  if (activeMood.value === 'surprised') return hoduSurprised
  if (activeMood.value === 'error') return hoduError
  return hoduCharacter
})

function stopAudioMeter() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
  sourceNode?.disconnect()
  analyser = null
  sourceNode = null
  timeData = null
  voiceLevel.value = 0
  voiceWobble.value = 0

  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
}

function runAudioMeter() {
  const tick = () => {
    if (!analyser || !timeData) return

    analyser.getByteTimeDomainData(timeData)
    let sum = 0
    for (const value of timeData) {
      const normalized = (value - 128) / 128
      sum += normalized * normalized
    }

    const rms = Math.sqrt(sum / timeData.length)
    const target = Math.min(1, rms * 4.5)
    const speakingStrength = target > 0.035 ? target : 0
    const wobbleTarget = Math.sin(performance.now() / 58) * Math.min(1, speakingStrength * 1.8)

    voiceLevel.value += (target - voiceLevel.value) * 0.35
    voiceWobble.value += (wobbleTarget - voiceWobble.value) * 0.42
    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
}

function startAudioMeter(stream: MediaStream) {
  stopAudioMeter()
  audioContext = new AudioContext()
  sourceNode = audioContext.createMediaStreamSource(stream)
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 512
  timeData = new Uint8Array(analyser.fftSize)
  sourceNode.connect(analyser)
  runAudioMeter()
}

watch(
  () => [props.state, props.mediaStream] as const,
  ([state, stream]) => {
    if (state === 'listening' && stream) {
      startAudioMeter(stream)
      return
    }

    stopAudioMeter()
  },
)

onBeforeUnmount(stopAudioMeter)
</script>

<template>
  <button
    class="voice-orb"
    :class="[
      `voice-orb--${state}`,
      `voice-orb--mood-${activeMood}`,
      { 'voice-orb--speaking': isSpeaking },
    ]"
    type="button"
    :style="orbStyle"
    :aria-label="ariaLabel"
    aria-live="polite"
    @click="$emit('toggle')"
  >
    <span class="voice-orb__ripples" aria-hidden="true">
      <i class="voice-orb__ripple voice-orb__ripple--1"></i>
      <i class="voice-orb__ripple voice-orb__ripple--2"></i>
      <i class="voice-orb__ripple voice-orb__ripple--3"></i>
    </span>
    <span class="voice-orb__stage" aria-hidden="true">
      <img class="voice-orb__mascot" :src="mascotSrc" alt="" />
      <span class="voice-orb__thoughts">
        <i></i>
        <i></i>
        <i></i>
      </span>
    </span>
  </button>
</template>

<style scoped>
.voice-orb {
  position: relative;
  z-index: 2;
  display: grid;
  place-items: center;
  width: min(64vw, 248px);
  height: min(64vw, 248px);
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transform: translateZ(0);
  transition:
    transform 0.24s ease,
    filter 0.24s ease;
}

@media (max-width: 420px) {
  .voice-orb {
    width: min(60vw, 232px);
    height: min(60vw, 232px);
  }
}

.voice-orb__stage {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 86%;
  height: 86%;
}

.voice-orb__ripples {
  position: absolute;
  z-index: 0;
  inset: -6%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.24s ease;
}

.voice-orb__ripples::before {
  position: absolute;
  inset: 1%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 46% 42%, rgba(255, 251, 231, 0.84) 0%, transparent 31%),
    radial-gradient(circle at 54% 62%, rgba(255, 188, 0, 0.42) 0%, transparent 58%),
    radial-gradient(circle, rgba(255, 246, 205, 0.48) 0%, rgba(216, 170, 32, 0.28) 54%, transparent 77%);
  content: '';
  filter: blur(11px);
  opacity: calc(0.68 + var(--voice-level) * 0.34);
  transform: scale(calc(0.98 + var(--voice-level) * 0.05));
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.voice-orb--listening .voice-orb__ripples {
  opacity: 1;
}

.voice-orb__ripple {
  position: absolute;
  inset: 0;
  border-radius: 0;
  background:
    radial-gradient(
      ellipse at 50% 54%,
      rgba(255, 251, 231, 0.2) 0%,
      rgba(255, 210, 75, 0.42) 45%,
      rgba(255, 188, 0, 0.38) 62%,
      transparent 78%
    ),
    radial-gradient(
      ellipse at 42% 36%,
      rgba(255, 255, 255, 0.78) 0%,
      rgba(255, 246, 205, 0.42) 22%,
      transparent 55%
    ),
    radial-gradient(
      ellipse at 62% 68%,
      rgba(232, 134, 58, 0.34) 0%,
      transparent 48%
    );
  filter: blur(6px) drop-shadow(0 12px 18px rgba(216, 170, 32, 0.22));
  mask-image: var(--hodu-mask-image);
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  opacity: 0;
  transform: scale(0.96);
  transform-origin: center;
  will-change: transform, opacity;
  -webkit-mask-image: var(--hodu-mask-image);
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
}

.voice-orb__mascot {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 20px 24px rgba(216, 170, 32, 0.16));
  transform-origin: 50% 78%;
  animation: hodu-idle 2.8s ease-in-out infinite;
  transition:
    transform 0.24s ease,
    filter 0.24s ease;
}

.voice-orb__thoughts {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  top: 10%;
  right: 7%;
  min-width: 58px;
  height: 36px;
  padding: 0 12px;
  border: 2px solid rgba(150, 78, 24, 0.52);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 8px 18px rgba(124, 68, 18, 0.12);
}

.voice-orb__thoughts i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #8c4d1f;
  animation: hodu-thought 0.9s ease-in-out infinite;
}

.voice-orb__thoughts i:nth-child(2) {
  animation-delay: 0.14s;
}

.voice-orb__thoughts i:nth-child(3) {
  animation-delay: 0.28s;
}

.voice-orb--idle:hover {
  transform: translateY(-2px);
}

.voice-orb--speaking .voice-orb__ripple {
  animation: voice-orb-ripple 2.35s cubic-bezier(0.2, 0.65, 0.3, 1) infinite;
}

.voice-orb--speaking .voice-orb__ripple--2 {
  animation-delay: 0.78s;
}

.voice-orb--speaking .voice-orb__ripple--3 {
  animation-delay: 1.56s;
}

.voice-orb--listening .voice-orb__mascot {
  animation: none;
  transform:
    translateY(calc(var(--voice-level) * -8px))
    rotate(calc(var(--voice-wobble) * 5deg))
    scale(calc(1 + var(--voice-level) * 0.14));
  filter: drop-shadow(0 24px 28px rgba(216, 170, 32, 0.2));
  transition:
    transform 80ms linear,
    filter 0.2s ease;
}

.voice-orb--thinking .voice-orb__mascot {
  animation: hodu-thinking 1.1s ease-in-out infinite;
}

.voice-orb--thinking .voice-orb__thoughts {
  opacity: 1;
}

.voice-orb--mood-sleepy .voice-orb__mascot {
  animation: hodu-sleepy 1.55s ease-in-out infinite;
  transform-origin: 50% 88%;
}

.voice-orb--mood-surprised .voice-orb__mascot {
  animation: hodu-surprised 0.52s ease-out both;
}

.voice-orb--mood-error .voice-orb__mascot {
  animation: hodu-error 0.42s ease-out both;
}

@keyframes hodu-idle {
  0%,
  100% {
    transform: translateY(0) rotate(-1.4deg) scale(1);
  }

  50% {
    transform: translateY(-9px) rotate(1.4deg) scale(1.015);
  }
}

@keyframes hodu-thinking {
  0%,
  100% {
    transform: rotate(-2deg) translateY(0);
  }

  50% {
    transform: rotate(2deg) translateY(-5px);
  }
}

@keyframes hodu-sleepy {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg) scale(0.995);
  }

  50% {
    transform: translateY(10px) rotate(2deg) scale(1);
  }
}

@keyframes hodu-surprised {
  0% {
    transform: translateY(0) scale(0.97);
  }

  45% {
    transform: translateY(-12px) scale(1.06);
  }

  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes hodu-error {
  0% {
    transform: translateX(0);
  }

  28% {
    transform: translateX(-5px) rotate(-1deg);
  }

  58% {
    transform: translateX(5px) rotate(1deg);
  }

  100% {
    transform: translateX(0);
  }
}

@keyframes hodu-thought {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }

  50% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

@keyframes voice-orb-ripple {
  0% {
    opacity: 0;
    transform: scale(0.96);
  }

  16% {
    opacity: calc(0.38 + var(--voice-level) * 0.38);
  }

  58% {
    opacity: calc(0.22 + var(--voice-level) * 0.28);
  }

  100% {
    opacity: 0;
    transform: scale(1.13);
  }
}

@media (prefers-reduced-motion: reduce) {
  .voice-orb,
  .voice-orb__mascot,
  .voice-orb__ripple,
  .voice-orb__thoughts i {
    animation: none !important;
    transition: none !important;
  }
}
</style>
