<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import { mockChecklist } from '@/mocks'
import { routePaths } from '@/router/routePaths'

const router = useRouter()
const checkedItemCodes = ref<Set<string>>(new Set())

const requiredComplete = computed(() =>
  mockChecklist.items.filter((item) => item.required).every((item) => checkedItemCodes.value.has(item.itemCode)),
)

function toggleItem(itemCode: string) {
  const nextCheckedItems = new Set(checkedItemCodes.value)

  if (nextCheckedItems.has(itemCode)) {
    nextCheckedItems.delete(itemCode)
  } else {
    nextCheckedItems.add(itemCode)
  }

  checkedItemCodes.value = nextCheckedItems
}
</script>

<template>
  <AppScreen>
    <template #header>
      <FlowHeader :current="4" :total="6" :back-to="routePaths.visitDecision" />
    </template>

    <section class="checklist">
      <h1>이것들을 챙겨 가세요</h1>
      <p>하나씩 눌러서 확인해보세요.</p>

      <div class="checklist__items">
        <label
          v-for="item in mockChecklist.items"
          :key="item.itemCode"
          class="prepare-item"
          :class="{ 'prepare-item--checked': checkedItemCodes.has(item.itemCode) }"
        >
          <input
            type="checkbox"
            :checked="checkedItemCodes.has(item.itemCode)"
            @change="toggleItem(item.itemCode)"
          />
          <span class="prepare-item__box" aria-hidden="true">
            <Check :size="15" :stroke-width="3" />
          </span>
          <span class="prepare-item__text">
            <strong>
              {{ item.name }}
              <em v-if="item.required">필수</em>
            </strong>
            <small>{{ item.easyDescription }}</small>
          </span>
        </label>
      </div>
    </section>

    <template #footer>
      <BaseButton block :disabled="!requiredComplete" @click="router.push(routePaths.branches)">
        지점 보기
      </BaseButton>
    </template>
  </AppScreen>
</template>

<style scoped>
.checklist {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.checklist h1 {
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 800;
}

.checklist > p {
  color: var(--color-ink-soft);
}

.checklist__items {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.prepare-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 76px;
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.prepare-item--checked {
  border-color: var(--color-accent);
  background: var(--color-yellow-faint);
}

.prepare-item:active {
  transform: scale(0.99);
}

.prepare-item input {
  position: absolute;
  opacity: 0;
}

.prepare-item__box {
  display: grid;
  place-items: center;
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-accent-deep);
  background: transparent;
  color: var(--color-accent-deep);
  transform: scale(1);
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1.2);
}

.prepare-item__box svg {
  opacity: 0;
  transform: scale(0.45);
  transition:
    opacity 140ms ease,
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1.4);
}

.prepare-item input:checked + .prepare-item__box {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-accent-ink);
  transform: scale(1.08);
}

.prepare-item input:checked + .prepare-item__box svg {
  opacity: 1;
  transform: scale(1);
}

.prepare-item__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.prepare-item strong {
  color: var(--color-ink);
  font-size: var(--text-base);
  font-weight: 800;
}

.prepare-item em {
  margin-left: var(--space-1);
  color: var(--color-alert);
  font-size: var(--text-xs);
  font-style: normal;
}

.prepare-item small {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}
</style>
