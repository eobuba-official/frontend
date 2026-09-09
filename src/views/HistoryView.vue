<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Landmark,
  PiggyBank,
  UserRoundPlus,
} from '@lucide/vue'
import AppScreen from '@/components/common/AppScreen.vue'
import BottomTabBar from '@/components/common/BottomTabBar.vue'
import InfoCard from '@/components/common/InfoCard.vue'
import { consultationService } from '@/services/consultationService'
import type { ConsultationHistoryItem, ConsultationStatus } from '@/api/types'

type TabKey = 'CONFIRMED' | 'NEEDS_CHECK'

const TAB_ORDER: TabKey[] = ['CONFIRMED', 'NEEDS_CHECK']
const NEEDS_CHECK_STATUSES: ConsultationStatus[] = [
  'UNCLASSIFIED',
  'CORRECTION_CONFIRMATION_REQUIRED',
]
const NEEDS_CHECK_REASON = '말씀을 정확히 이해하지 못했어요'
const PAGE_SIZE = 6

const today = new Date()

const items = ref<ConsultationHistoryItem[]>([])
const taskTypeNames = ref<Record<string, string>>({})
const isLoading = ref(true)
const errorMessage = ref('')
const activeTab = ref<TabKey>('CONFIRMED')
const transitionName = ref<'history-slide-forward' | 'history-slide-back'>('history-slide-forward')
const expandedTabs = ref<Set<TabKey>>(new Set())
const selectedMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))

function taskLabel(taskTypeCode: string | null) {
  if (!taskTypeCode) return '업무 확정'
  return taskTypeNames.value[taskTypeCode] ?? taskTypeCode
}

function taskIcon(taskTypeCode: string | null) {
  const name = taskLabel(taskTypeCode)
  if (name.includes('카드')) return CreditCard
  if (name.includes('통장')) return BookOpen
  if (name.includes('계좌')) return UserRoundPlus
  if (name.includes('예금') || name.includes('적금')) return PiggyBank
  return Landmark
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function sortByDateDesc(list: ConsultationHistoryItem[]) {
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function isInSelectedMonth(item: ConsultationHistoryItem) {
  const createdAt = new Date(item.createdAt)
  return (
    createdAt.getFullYear() === selectedMonth.value.getFullYear() &&
    createdAt.getMonth() === selectedMonth.value.getMonth()
  )
}

const monthLabel = computed(() => `${selectedMonth.value.getFullYear()}년 ${selectedMonth.value.getMonth() + 1}월`)

const isCurrentMonth = computed(
  () =>
    selectedMonth.value.getFullYear() === today.getFullYear() &&
    selectedMonth.value.getMonth() === today.getMonth(),
)

function changeMonth(offset: number) {
  if (offset > 0 && isCurrentMonth.value) return
  selectedMonth.value = new Date(selectedMonth.value.getFullYear(), selectedMonth.value.getMonth() + offset, 1)
  expandedTabs.value = new Set()
}

const confirmedItems = computed(() =>
  sortByDateDesc(items.value.filter((item) => item.status === 'TASK_CONFIRMED' && isInSelectedMonth(item))),
)

const needsCheckItems = computed(() =>
  sortByDateDesc(
    items.value.filter((item) => NEEDS_CHECK_STATUSES.includes(item.status) && isInSelectedMonth(item)),
  ),
)

const tabOptions = computed<{ key: TabKey; label: string; count: number }[]>(() => [
  { key: 'CONFIRMED', label: '업무 확정', count: confirmedItems.value.length },
  { key: 'NEEDS_CHECK', label: '확인 필요', count: needsCheckItems.value.length },
])

const currentItems = computed(() =>
  activeTab.value === 'CONFIRMED' ? confirmedItems.value : needsCheckItems.value,
)

const visibleItems = computed(() =>
  expandedTabs.value.has(activeTab.value)
    ? currentItems.value
    : currentItems.value.slice(0, PAGE_SIZE),
)

const hasMore = computed(
  () => currentItems.value.length > PAGE_SIZE && !expandedTabs.value.has(activeTab.value),
)

const emptyMessage = computed(() =>
  activeTab.value === 'CONFIRMED'
    ? '아직 업무 확정 내역이 없어요.'
    : '아직 확인이 필요한 내역이 없어요.',
)

const tabDescription = computed(() =>
  activeTab.value === 'CONFIRMED'
    ? '어떤 업무인지 확인된 상담이에요'
    : '업무를 정확히 확인하지 못한 상담이에요',
)

function selectTab(tab: TabKey) {
  if (tab === activeTab.value) return
  transitionName.value =
    TAB_ORDER.indexOf(tab) > TAB_ORDER.indexOf(activeTab.value)
      ? 'history-slide-forward'
      : 'history-slide-back'
  activeTab.value = tab
}

function expandCurrentTab() {
  expandedTabs.value = new Set(expandedTabs.value).add(activeTab.value)
}

onMounted(async () => {
  try {
    const [historyResult, taskTypes] = await Promise.all([
      consultationService.getConsultationHistory(),
      consultationService.getTaskTypes(),
    ])

    items.value = historyResult.consultations
    taskTypeNames.value = Object.fromEntries(
      taskTypes.map((taskType) => [taskType.taskTypeCode, taskType.name]),
    )
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '상담 내역을 불러오지 못했어요.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <AppScreen no-top-padding flush-footer>
    <div class="history">
      <header class="history__header">
        <h1>상담 내역</h1>
        <p>말씀하신 내용을 모두 기록했어요</p>
      </header>

      <div class="history__month-nav">
        <button type="button" class="history__month-btn" aria-label="이전 달" @click="changeMonth(-1)">
          <ChevronLeft :size="20" :stroke-width="2.4" />
        </button>
        <span class="history__month-label">{{ monthLabel }}</span>
        <button
          type="button"
          class="history__month-btn"
          aria-label="다음 달"
          :disabled="isCurrentMonth"
          @click="changeMonth(1)"
        >
          <ChevronRight :size="20" :stroke-width="2.4" />
        </button>
      </div>

      <p v-if="isLoading" class="history__status">불러오는 중...</p>
      <p v-else-if="errorMessage" class="history__status history__status--error">
        {{ errorMessage }}
      </p>

      <InfoCard
        v-else-if="items.length === 0"
        title="아직 상담 내역이 없어요"
        description="말씀하시면 여기에 기록이 남아요."
      />

      <template v-else>
        <div class="history__stats" role="tablist" aria-label="상담 내역 필터">
          <button
            v-for="tab in tabOptions"
            :key="tab.key"
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.key"
            class="history-stat"
            :class="[
              `history-stat--${tab.key === 'CONFIRMED' ? 'confirmed' : 'needsCheck'}`,
              { 'history-stat--active': activeTab === tab.key },
            ]"
            @click="selectTab(tab.key)"
          >
            <span class="history-stat__count">{{ tab.count }}</span>
            <span class="history-stat__label">{{ tab.label }}</span>
            <span v-if="activeTab === tab.key" class="history-stat__underline" aria-hidden="true"></span>
          </button>
        </div>

        <div class="history__viewport">
          <Transition :name="transitionName" mode="out-in">
            <p v-if="currentItems.length === 0" :key="`${activeTab}-empty`" class="history__empty">
              {{ emptyMessage }}
            </p>

            <div v-else :key="activeTab" class="history-tab-panel">
              <div class="history-card">
                <div
                  v-for="item in visibleItems"
                  :key="item.consultationId"
                  class="history-row"
                  :class="`history-row--${activeTab === 'CONFIRMED' ? 'confirmed' : 'needsCheck'}`"
                >
                  <template v-if="activeTab === 'CONFIRMED'">
                    <p class="history-row__badge history-row__badge--confirmed">
                      <component :is="taskIcon(item.taskTypeCode)" :size="14" :stroke-width="2.4" />
                      {{ taskLabel(item.taskTypeCode) }}
                    </p>
                  </template>
                  <template v-else>
                    <p class="history-row__badge history-row__badge--needsCheck">
                      <HelpCircle :size="14" :stroke-width="2.4" />
                      {{ NEEDS_CHECK_REASON }}
                    </p>
                  </template>

                  <strong class="history-row__headline">{{ item.correctedUtterance }}</strong>

                  <div class="history-row__meta">
                    <span class="history-row__date">{{ formatDate(item.createdAt) }}</span>
                    <span class="history-row__time">{{ formatTime(item.createdAt) }}</span>
                  </div>
                </div>

                <button
                  v-if="hasMore"
                  type="button"
                  class="history-card__more"
                  @click="expandCurrentTab"
                >
                  더보기
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </template>
    </div>

    <template #footer>
      <BottomTabBar />
    </template>
  </AppScreen>
</template>

<style scoped>
.history {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-top: var(--space-5);
}

.history__header h1 {
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 900;
}

.history__header p {
  margin-top: 2px;
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  font-weight: 600;
}

.history__month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
}

.history__month-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-surface-raised);
  color: var(--color-ink);
  cursor: pointer;
}

.history__month-btn:disabled {
  color: var(--color-ink-faint);
  cursor: not-allowed;
}

.history__month-label {
  min-width: 8em;
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: 800;
  text-align: center;
}

.history__status {
  color: var(--color-ink-soft);
  font-size: var(--text-base);
}

.history__status--error {
  color: var(--color-alert);
}

.history__empty {
  padding: var(--space-6) 0;
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  font-weight: 600;
  text-align: center;
}

.history__stats {
  display: flex;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.history-stat {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-5) var(--space-3);
  border: 0;
  background: var(--color-surface);
  cursor: pointer;
  transition: background-color 220ms ease;
}

.history-stat__count {
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: var(--text-hero);
  font-weight: 900;
  line-height: 1;
}

.history-stat__label {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 700;
}

.history-stat__underline {
  width: 28px;
  height: 4px;
  margin-top: 2px;
  border-radius: var(--radius-pill);
  background: currentColor;
}

.history-stat--confirmed.history-stat--active {
  background: var(--color-yellow-faint);
}

.history-stat--confirmed.history-stat--active .history-stat__count,
.history-stat--confirmed.history-stat--active .history-stat__underline {
  color: var(--color-accent-deep);
}

.history-stat--needsCheck.history-stat--active {
  background: var(--color-alert-bg);
}

.history-stat--needsCheck.history-stat--active .history-stat__count,
.history-stat--needsCheck.history-stat--active .history-stat__underline {
  color: var(--color-alert);
}

.history__viewport {
  position: relative;
  overflow: hidden;
}

.history-slide-forward-enter-active,
.history-slide-forward-leave-active,
.history-slide-back-enter-active,
.history-slide-back-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.history-slide-forward-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.history-slide-forward-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.history-slide-back-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.history-slide-back-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.history-tab-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.history-tab-panel__desc {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 600;
}

.history-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  overflow: hidden;
}

.history-row {
  display: flex;
  flex-direction: column;
  padding: var(--space-4);
}

.history-row + .history-row {
  border-top: 1px solid var(--color-line);
}

.history-card__more {
  padding: var(--space-3);
  border: 0;
  border-top: 1px solid var(--color-line);
  background: var(--color-surface-alt);
  color: var(--color-ink-soft);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 700;
  text-align: center;
  cursor: pointer;
}

.history-row__badge {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: var(--space-1);
  padding: 3px var(--space-3);
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  font-weight: 700;
}

.history-row__badge--confirmed {
  background: var(--color-confirmed-bg);
  color: var(--color-confirmed);
}

.history-row__badge--needsCheck {
  background: var(--color-alert-bg);
  color: var(--color-alert);
}

.history-row__headline {
  margin-top: var(--space-2);
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: 800;
}

.history-row__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-2);
}

.history-row__date {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 600;
}

.history-row__time {
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--color-surface-alt);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 700;
}
</style>
