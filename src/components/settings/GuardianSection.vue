<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Plus, Trash2, User } from '@lucide/vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import PhoneNumberField from '@/components/common/PhoneNumberField.vue'
import { authService } from '@/services/authService'
import type { Guardian, GuardianRelation } from '@/api/types'

const relations: GuardianRelation[] = ['아들', '딸', '배우자', '기타']

const guardians = ref<Guardian[]>([])
const isLoadingGuardians = ref(true)
const guardiansError = ref('')

const isAddGuardianOpen = ref(false)
const newGuardianName = ref('')
const newGuardianPhoneDigits = ref('')
const newGuardianRelation = ref<GuardianRelation>('아들')
const isAddingGuardian = ref(false)
const addGuardianError = ref('')

const canAddGuardian = computed(
  () => newGuardianName.value.trim().length > 0 && newGuardianPhoneDigits.value.length === 8 && !isAddingGuardian.value,
)

const pendingDeleteGuardian = ref<Guardian | null>(null)
const isDeletingGuardian = ref(false)
const deleteGuardianError = ref('')

function formatPhone(phoneNumber: string) {
  return phoneNumber.length === 11 ? `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}` : phoneNumber
}

onMounted(async () => {
  try {
    const me = await authService.getMe()
    guardians.value = me.guardians
  } catch (error) {
    guardiansError.value = error instanceof Error ? error.message : '가족 정보를 불러오지 못했어요.'
  } finally {
    isLoadingGuardians.value = false
  }
})

function openAddGuardian() {
  newGuardianName.value = ''
  newGuardianPhoneDigits.value = ''
  newGuardianRelation.value = '아들'
  addGuardianError.value = ''
  isAddGuardianOpen.value = true
}

function closeAddGuardian() {
  isAddGuardianOpen.value = false
}

async function submitAddGuardian() {
  if (!canAddGuardian.value) return

  isAddingGuardian.value = true
  addGuardianError.value = ''

  try {
    const result = await authService.addGuardian({
      name: newGuardianName.value.trim(),
      phoneNumber: `010${newGuardianPhoneDigits.value}`,
      relation: newGuardianRelation.value,
    })
    guardians.value = [...guardians.value, result.guardian]
    isAddGuardianOpen.value = false
  } catch (error) {
    addGuardianError.value = error instanceof Error ? error.message : '가족을 추가하지 못했어요. 다시 시도해 주세요.'
  } finally {
    isAddingGuardian.value = false
  }
}

function requestDeleteGuardian(guardian: Guardian) {
  deleteGuardianError.value = ''
  pendingDeleteGuardian.value = guardian
}

function cancelDeleteGuardian() {
  pendingDeleteGuardian.value = null
}

async function confirmDeleteGuardian() {
  const guardian = pendingDeleteGuardian.value
  if (!guardian?.guardianId) return

  isDeletingGuardian.value = true
  deleteGuardianError.value = ''

  try {
    await authService.deleteGuardian(guardian.guardianId)
    guardians.value = guardians.value.filter((item) => item.guardianId !== guardian.guardianId)
    pendingDeleteGuardian.value = null
  } catch (error) {
    deleteGuardianError.value = error instanceof Error ? error.message : '삭제하지 못했어요. 다시 시도해 주세요.'
  } finally {
    isDeletingGuardian.value = false
  }
}
</script>

<template>
  <div class="settings-group">
    <p class="settings-group__label">가족 관리</p>
    <div class="settings-card">
      <p v-if="isLoadingGuardians" class="settings-status">불러오는 중...</p>
      <p v-else-if="guardiansError" class="settings-status settings-status--error">{{ guardiansError }}</p>
      <p v-else-if="guardians.length === 0" class="settings-status">
        등록된 가족이 없어요. 수상한 전화가 감지돼도 알려드릴 수 없어요.
      </p>
      <template v-else>
        <template v-for="(guardian, index) in guardians" :key="guardian.guardianId ?? guardian.phoneNumber">
          <div class="settings-row settings-row--static">
            <span class="settings-row__icon" aria-hidden="true">
              <User :size="20" :stroke-width="2.2" />
            </span>
            <span class="settings-row__copy">
              <strong>
                {{ guardian.name }}
                <span class="guardian-relation-badge">{{ guardian.relation }}</span>
              </strong>
              <small>{{ formatPhone(guardian.phoneNumber) }}</small>
            </span>
            <button
              class="settings-row__delete"
              type="button"
              :aria-label="`${guardian.name} 삭제`"
              @click="requestDeleteGuardian(guardian)"
            >
              <Trash2 :size="18" :stroke-width="2.2" />
            </button>
          </div>
          <div v-if="index < guardians.length - 1" class="settings-row-divider" aria-hidden="true"></div>
        </template>
      </template>
    </div>
    <button class="settings-add-button" type="button" @click="openAddGuardian">
      <Plus :size="18" :stroke-width="2.4" />
      가족 추가
    </button>
  </div>

  <ConfirmModal
    v-if="isAddGuardianOpen"
    title="가족을 추가해 주세요"
    description="수상한 전화가 감지되면 이 분께 바로 알려드려요."
    @close="closeAddGuardian"
  >
    <label class="modal-field" for="new-guardian-name">
      <span>이름</span>
      <input
        id="new-guardian-name"
        v-model="newGuardianName"
        type="text"
        placeholder="이름을 입력해 주세요"
      />
    </label>

    <div class="modal-field">
      <PhoneNumberField id="new-guardian-phone" v-model="newGuardianPhoneDigits" />
    </div>

    <div class="modal-relation">
      <span>어떤 사이신가요</span>
      <div class="modal-relation__options">
        <button
          v-for="option in relations"
          :key="option"
          type="button"
          class="relation-chip"
          :class="{ 'relation-chip--active': newGuardianRelation === option }"
          @click="newGuardianRelation = option"
        >
          {{ option }}
        </button>
      </div>
    </div>

    <p v-if="addGuardianError" class="modal-error">{{ addGuardianError }}</p>

    <template #actions>
      <BaseButton variant="ghost" block @click="closeAddGuardian">취소</BaseButton>
      <BaseButton block :disabled="!canAddGuardian" @click="submitAddGuardian">
        {{ isAddingGuardian ? '추가하는 중...' : '추가하기' }}
      </BaseButton>
    </template>
  </ConfirmModal>

  <ConfirmModal
    v-if="pendingDeleteGuardian"
    role="alertdialog"
    :title="`${pendingDeleteGuardian.name}님을 삭제할까요?`"
    description="삭제하면 수상한 전화가 감지돼도 이 분께는 더 이상 알려드리지 않아요."
    @close="cancelDeleteGuardian"
  >
    <p v-if="deleteGuardianError" class="modal-error">{{ deleteGuardianError }}</p>

    <template #actions>
      <BaseButton variant="ghost" block @click="cancelDeleteGuardian">취소</BaseButton>
      <BaseButton block :disabled="isDeletingGuardian" @click="confirmDeleteGuardian">
        {{ isDeletingGuardian ? '삭제하는 중...' : '삭제하기' }}
      </BaseButton>
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

.settings-row--static {
  cursor: default;
}

.settings-status {
  padding: var(--space-4);
  color: var(--color-ink-soft);
  font-size: var(--text-base);
}

.settings-status--error {
  color: var(--color-alert);
}

.guardian-relation-badge {
  margin-left: var(--space-2);
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--color-yellow-light);
  color: var(--color-accent-deep);
  font-size: var(--text-xs);
  font-weight: 700;
}

.settings-row__delete {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink-muted);
  cursor: pointer;
}

.settings-row__delete:hover {
  background: var(--color-alert-bg);
  color: var(--color-alert);
}

.settings-add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 48px;
  padding: var(--space-3);
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--color-ink-soft);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.settings-add-button:hover {
  border-color: var(--color-accent);
  color: var(--color-accent-deep);
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: var(--space-4);
}

.modal-field > span {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 700;
}

.modal-field input {
  min-height: 44px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  font: inherit;
  font-size: var(--text-base);
  font-weight: 700;
}

.modal-field input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.modal-relation {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.modal-relation > span {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 700;
}

.modal-relation__options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
}

.relation-chip {
  min-height: 40px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 700;
  cursor: pointer;
}

.relation-chip--active {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-accent-ink);
}

.modal-error {
  margin-top: var(--space-3);
  color: var(--color-alert);
  font-size: var(--text-sm);
}
</style>
