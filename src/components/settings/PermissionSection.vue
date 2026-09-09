<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChevronRight, MapPin, Mic, Type } from '@lucide/vue'
import { getTextSize, saveTextSize, textSizeOptions, type TextSize } from '@/utils/textSize'
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
const textSize = ref(getTextSize())
const textSizeDialog = ref<HTMLDialogElement | null>(null)
const textSizeLabel = computed(
  () => textSizeOptions.find((option) => option.value === textSize.value)?.label,
)

function selectTextSize(value: TextSize) {
  textSize.value = value
  saveTextSize(value)
}

const locationSwitchOn = computed(() => locationEnabled.value && !locationBlocked.value)
const voiceSwitchOn = computed(() => voiceEnabled.value && !voiceBlocked.value)

const turnOffModalCopy = computed(() => {
  if (pendingTurnOff.value === 'location') {
    return {
      title: '위치 사용을 끌까요?',
      description: '끄면 현재 위치를 기준으로\n가까운 은행 지점을 찾을 수 없어요.',
    }
  }
  if (pendingTurnOff.value === 'voice') {
    return {
      title: '음성 입력을 끌까요?',
      description: '끄면 홈 화면에서\n말로 요청하는 기능을 사용할 수 없어요.',
    }
  }
  return null
})

const blockedNoticeCopy = computed(() => {
  if (blockedNotice.value === 'location') {
    return {
      title: '위치 접근이 차단되어 있어요',
      description: '가까운 지점을 찾으려면 브라우저 설정에서\n이 사이트의 위치 접근을 허용해 주세요.',
    }
  }
  if (blockedNotice.value === 'voice') {
    return {
      title: '마이크 접근이 차단되어 있어요',
      description: '말로 요청하려면 브라우저 설정에서\n이 사이트의 마이크 접근을 허용해 주세요.',
    }
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
    <h2 class="settings-group__label">앱 설정</h2>
    <div class="settings-card">
      <button
        class="settings-row"
        type="button"
        aria-haspopup="dialog"
        @click="textSizeDialog?.showModal()"
      >
        <span class="settings-row__icon" aria-hidden="true"
          ><Type :size="20" :stroke-width="2.2"
        /></span>
        <span class="settings-row__copy"
          ><strong>글자 크기</strong><small>읽기 편한 크기로 바꿔요</small></span
        >
        <span class="settings-row__value">{{ textSizeLabel }}</span>
        <ChevronRight class="settings-row__chevron" :size="20" aria-hidden="true" />
      </button>
      <div class="settings-row-divider" aria-hidden="true"></div>
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
          <small>{{
            locationBlocked ? '브라우저에서 차단돼 있어요' : '가까운 지점을 찾을 때 사용해요'
          }}</small>
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
          <small>{{
            voiceBlocked ? '브라우저에서 차단돼 있어요' : '말로 요청할 때 사용해요'
          }}</small>
        </span>
        <span class="switch" :class="{ 'switch--on': voiceSwitchOn }" aria-hidden="true">
          <span class="switch__thumb"></span>
        </span>
      </button>
    </div>
  </div>

  <dialog ref="textSizeDialog" class="text-size-dialog" aria-labelledby="text-size-title">
    <h2 id="text-size-title">글자 크기</h2>
    <p>읽기 편한 크기를 선택해 주세요.</p>
    <fieldset class="text-size-options">
      <legend class="text-size-legend">글자 크기 선택</legend>
      <label v-for="option in textSizeOptions" :key="option.value" class="text-size-option">
        <input
          type="radio"
          name="text-size"
          :value="option.value"
          :checked="textSize === option.value"
          @change="selectTextSize(option.value)"
        />
        <span>{{ option.label }}</span>
      </label>
    </fieldset>
    <div class="text-size-dialog__actions">
      <BaseButton block @click="textSizeDialog?.close()">완료</BaseButton>
    </div>
  </dialog>

  <ConfirmModal
    v-if="turnOffModalCopy"
    role="alertdialog"
    :title="turnOffModalCopy.title"
    :description="turnOffModalCopy.description"
    @close="cancelTurnOff"
  >
    <template #actions>
      <BaseButton variant="ghost" block @click="cancelTurnOff">취소</BaseButton>
      <BaseButton block @click="confirmTurnOff">끄기</BaseButton>
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
      <BaseButton block @click="closeBlockedNotice">확인</BaseButton>
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
  font-size: var(--text-base);
  font-weight: 700;
}

.settings-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  overflow: hidden;
}

.settings-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: 64px;
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

.settings-row__value {
  color: var(--color-ink-soft);
  font-weight: 700;
}
.settings-row__chevron {
  flex-shrink: 0;
}
.text-size-dialog {
  width: calc(100% - 32px);
  max-width: 360px;
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-ink);
}
.text-size-dialog::backdrop {
  background: rgba(31, 35, 41, 0.4);
}
.text-size-dialog h2 {
  font-size: var(--text-xl);
}
.text-size-dialog > p {
  margin-block: var(--space-3);
}
.text-size-options {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  border: 0;
}
.text-size-legend {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.text-size-option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 56px;
  padding: var(--space-3);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-lg);
  font-weight: 700;
}
.text-size-option:has(input:checked) {
  background: var(--color-yellow-faint);
  border-color: var(--color-accent);
}
.text-size-option input {
  width: 24px;
  height: 24px;
  accent-color: var(--color-ink);
  flex-shrink: 0;
}
.text-size-dialog__actions {
  margin-top: var(--space-5);
}
</style>
