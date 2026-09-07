<script setup lang="ts">
import { CheckSquare } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import { mockChecklist } from '@/mocks'
import { routePaths } from '@/router/routePaths'

const router = useRouter()
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
        <label v-for="item in mockChecklist.items" :key="item.itemCode" class="prepare-item">
          <input type="checkbox" />
          <span class="prepare-item__box">
            <CheckSquare :size="20" :stroke-width="2.2" />
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
      <BaseButton block @click="router.push(routePaths.branches)">지점 보기</BaseButton>
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
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  cursor: pointer;
}

.prepare-item input {
  position: absolute;
  opacity: 0;
}

.prepare-item__box {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
  color: transparent;
}

.prepare-item input:checked + .prepare-item__box {
  background: var(--color-accent);
  color: var(--color-surface);
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
