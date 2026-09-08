<script setup lang="ts">
import { ChevronRight, History, LogOut } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { clearAccessToken } from '@/api/client'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import GuardianSection from '@/components/settings/GuardianSection.vue'
import PermissionSection from '@/components/settings/PermissionSection.vue'
import { routePaths } from '@/router/routePaths'

const router = useRouter()

function handleLogout() {
  clearAccessToken()
  void router.push(routePaths.login)
}
</script>

<template>
  <AppScreen>
    <template #header>
      <button class="back-button" type="button" @click="router.back()">← 이전</button>
    </template>

    <section class="settings">
      <h1>설정</h1>

      <div class="settings-group">
        <p class="settings-group__label">바로가기</p>
        <div class="settings-card">
          <button class="settings-row" type="button" @click="router.push(routePaths.history)">
            <span class="settings-row__icon" aria-hidden="true">
              <History :size="20" :stroke-width="2.2" />
            </span>
            <span class="settings-row__copy">
              <strong>상담 내역</strong>
              <small>이전 상담 내용을 확인해요</small>
            </span>
            <ChevronRight :size="20" :stroke-width="2.2" aria-hidden="true" />
          </button>
        </div>
      </div>

      <GuardianSection />
      <PermissionSection />

      <BaseButton variant="ghost" block @click="handleLogout">
        <template #icon>
          <LogOut :size="20" :stroke-width="2.2" />
        </template>
        로그아웃
      </BaseButton>
    </section>
  </AppScreen>
</template>

<style scoped>
.back-button {
  border: 0;
  background: transparent;
  color: var(--color-ink-soft);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

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

.settings-row > svg {
  flex-shrink: 0;
  color: var(--color-ink-muted);
}
</style>
