<script setup lang="ts">
import { LogOut } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { clearAccessToken } from '@/api/client'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BottomTabBar from '@/components/common/BottomTabBar.vue'
import GuardianSection from '@/components/settings/GuardianSection.vue'
import PermissionSection from '@/components/settings/PermissionSection.vue'
import ProfileSection from '@/components/settings/ProfileSection.vue'
import { version } from '../../package.json'
import { routePaths } from '@/router/routePaths'

const router = useRouter()

function handleLogout() {
  clearAccessToken()
  void router.push(routePaths.login)
}
</script>

<template>
  <AppScreen flush-footer>
    <section class="settings">
      <header class="settings__header">
        <h1>마이페이지</h1>
        <p>내 정보와 앱 설정을 관리해요</p>
      </header>

      <ProfileSection />

      <GuardianSection />

      <PermissionSection />

      <section class="app-info" aria-labelledby="app-info-title">
        <h2 id="app-info-title">앱 정보</h2>
        <dl class="app-info__card">
          <dt>현재 버전</dt>
          <dd>{{ version }}</dd>
        </dl>
      </section>

      <BaseButton variant="ghost" block @click="handleLogout">
        <template #icon>
          <LogOut :size="20" :stroke-width="2.2" />
        </template>
        로그아웃
      </BaseButton>
    </section>

    <template #footer>
      <BottomTabBar />
    </template>
  </AppScreen>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.settings__header p {
  margin-top: 2px;
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  font-weight: 600;
}

.app-info {
  display: grid;
  gap: var(--space-2);
}
.app-info h2 {
  padding-left: var(--space-1);
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  font-weight: 700;
}
.app-info__card {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
.app-info dt {
  font-size: var(--text-lg);
  font-weight: 800;
}
.app-info dd {
  margin: 0;
  color: var(--color-ink-soft);
}
</style>
