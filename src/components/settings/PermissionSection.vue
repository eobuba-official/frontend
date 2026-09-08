<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { MapPin, Mic } from '@lucide/vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import {
  isBrowserPermissionBlocked,
  isLocationPermissionEnabled,
  isVoicePermissionEnabled,
  setLocationPermissionEnabled,
  setVoicePermissionEnabled,
} from '@/utils/permissionPreferences'

const locationEnabled = ref(isLocationPermissionEnabled())
const voiceEnabled = ref(isVoicePermissionEnabled())
const locationBlocked = ref(false)
const voiceBlocked = ref(false)
const pendingTurnOff = ref<'location' | 'voice' | null>(null)
const blockedNotice = ref<'location' | 'voice' | null>(null)

const locationSwitchOn = computed(() => locationEnabled.value && !locationBlocked.value)
const voiceSwitchOn = computed(() => voiceEnabled.value && !voiceBlocked.value)

const turnOffModalCopy = computed(() => {
  if (pendingTurnOff.value === 'location') {
    return { title: '위치 권한을 끌까요?', description: '가까운 지점을 찾을 때 위치를 사용하지 않아요.' }
  }
  if (pendingTurnOff.value === 'voice') {
    return { title: '음성 권한을 끌까요?', description: '말로 요청하는 기능을 사용할 수 없어요.' }
  }
  return null
})

const blockedNoticeCopy = computed(() => {
  if (blockedNotice.value === 'location') {
    return { title: '위치 권한이 차단돼 있어요', description: '브라우저 설정에서 이 사이트의 위치 접근을 허용해야 사용할 수 있어요.' }
  }
  if (blockedNotice.value === 'voice') {
    return { title: '음성 권한이 차단돼 있어요', description: '브라우저 설정에서 이 사이트의 마이크 접근을 허용해야 사용할 수 있어요.' }
  }
  return null
})

onMounted(async () => {
  const [micBlocked, geoBlocked] = await Promise.all([
    isBrowserPermissionBlocked('microphone'),
    isBrowserPermissionBlocked('geolocation'),
  ])
  voiceBlocked.value = micBlocked
  locationBlocked.value = geoBlocked
})

function toggleLocation() {
  if (locationBlocked.value) {
    blockedNotice.value = 'location'
    return
  }
  if (locationEnabled.value) {
    pendingTurnOff.value = 'location'
    return
  }
  locationEnabled.value = true
  setLocationPermissionEnabled(true)
}

function toggleVoice() {
  if (voiceBlocked.value) {
    blockedNotice.value = 'voice'
    return
  }
  if (voiceEnabled.value) {
    pendingTurnOff.value = 'voice'
    return
  }
  voiceEnabled.value = true
  setVoicePermissionEnabled(true)
}

function cancelTurnOff() {
  pendingTurnOff.value = null
}

function confirmTurnOff() {
  if (pendingTurnOff.value === 'location') {
    locationEnabled.value = false
    setLocationPermissionEnabled(false)
  } else if (pendingTurnOff.value === 'voice') {
    voiceEnabled.value = false
    setVoicePermissionEnabled(false)
  }
  pendingTurnOff.value = null
}

function closeBlockedNotice() {
  blockedNotice.value = null
}
</script>

<template>
  <div class="settings-group">
    <p class="settings-group__label">권한 설정</p>
    <div class="settings-card">
      <button
        class="settings-row"
        type="button"
        role="switch"
        :aria-checked="locationSwitchOn"
        @click="toggleLocation"
      >
        <span class="settings-row__icon" aria-hidden="true">
          <MapPin :size="20" :stroke-width="2.2" />
        </span>
        <span class="settings-row__copy">
          <strong>위치 권한</strong>
          <small>{{ locationBlocked ? '브라우저에서 차단돼 있어요' : '가까운 지점을 찾을 때 사용해요' }}</small>
        </span>
        <span class="switch" :class="{ 'switch--on': locationSwitchOn }" aria-hidden="true">
          <span class="switch__thumb"></span>
        </span>
      </button>

      <div class="settings-row-divider" aria-hidden="true"></div>

      <button
        class="settings-row"
        type="button"
        role="switch"
        :aria-checked="voiceSwitchOn"
        @click="toggleVoice"
      >
        <span class="settings-row__icon" aria-hidden="true">
          <Mic :size="20" :stroke-width="2.2" />
        </span>
        <span class="settings-row__copy">
          <strong>음성 권한</strong>
          <small>{{ voiceBlocked ? '브라우저에서 차단돼 있어요' : '말로 요청할 때 사용해요' }}</small>
        </span>
        <span class="switch" :class="{ 'switch--on': voiceSwitchOn }" aria-hidden="true">
          <span class="switch__thumb"></span>
        </span>
      </button>
    </div>
  </div>

  <ConfirmModal
    v-if="turnOffModalCopy"
    role="alertdialog"
    :title="turnOffModalCopy.title"
    :description="turnOffModalCopy.description"
    @close="cancelTurnOff"
  >
    <template #actions>
      <BaseButton variant="ghost" block @click="cancelTurnOff">취소</BaseButton>
      <BaseButton block @click="confirmTurnOff">끌게요</BaseButton>
    </template>
  </ConfirmModal>

  <ConfirmModal
    v-if="blockedNoticeCopy"
    role="alertdialog"
    :title="blockedNoticeCopy.title"
    :description="blockedNoticeCopy.description"
    single-action
    @close="closeBlockedNotice"
  >
    <template #actions>
      <BaseButton block @click="closeBlockedNotice">확인했어요</BaseButton>
    </template>
  </ConfirmModal>
</template>

<style scoped>
.settings-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.settings-group__label {
  padding-left: var(--space-1);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 700;
}

.settings-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.settings-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  border: 0;
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.settings-row__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-pill);
  background: var(--color-yellow-light);
  color: var(--color-accent-deep);
}

.settings-row__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.settings-row__copy strong {
  font-size: var(--text-lg);
  font-weight: 800;
}

.settings-row__copy small {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 600;
}

.settings-row-divider {
  height: 1px;
  margin-inline: var(--space-4);
  background: var(--color-line);
}

.switch {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  width: 52px;
  height: 30px;
  padding: 3px;
  border-radius: var(--radius-pill);
  background: var(--color-line);
  transition: background-color 160ms ease;
}

.switch--on {
  background: var(--color-accent);
}

.switch__thumb {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-pill);
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(31, 35, 41, 0.25);
  transition: transform 160ms ease;
}

.switch--on .switch__thumb {
  transform: translateX(22px);
}
</style>
