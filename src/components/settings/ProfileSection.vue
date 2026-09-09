<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { UserRound } from '@lucide/vue'
import type { MeResult } from '@/api/types'
import { authService } from '@/services/authService'
import BaseButton from '@/components/common/BaseButton.vue'

const profile = ref<MeResult | null>(null)
const loading = ref(true)
const error = ref('')

async function loadProfile() {
  loading.value = true
  error.value = ''
  try {
    profile.value = await authService.getMe()
  } catch {
    error.value = '내 정보를 불러오지 못했어요.'
  } finally {
    loading.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <section class="profile-card" aria-label="내 프로필" :aria-busy="loading">
    <span class="profile-card__icon" aria-hidden="true"><UserRound :size="28" /></span>
    <div class="profile-card__copy">
      <p v-if="loading" role="status">내 정보를 불러오는 중이에요.</p>
      <template v-else-if="error">
        <p role="alert">{{ error }}</p>
        <BaseButton variant="text" @click="loadProfile">다시 시도</BaseButton>
      </template>
      <template v-else-if="profile">
        <h2>{{ profile.name }}</h2>
        <p>{{ profile.phoneNumber.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3') }}</p>
      </template>
    </div>
  </section>
</template>

<style scoped>
.profile-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
.profile-card__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-pill);
  background: var(--color-yellow-light);
  color: var(--color-ink);
}
.profile-card__copy {
  min-width: 0;
  overflow-wrap: anywhere;
}
.profile-card h2 {
  font-size: var(--text-xl);
}
.profile-card p {
  color: var(--color-ink-soft);
  font-size: var(--text-base);
}
</style>
