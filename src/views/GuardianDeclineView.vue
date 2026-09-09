<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BellOff, CheckCircle2, ShieldCheck, TriangleAlert } from '@lucide/vue'
import { useRoute } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import logoMark from '@/assets/img/logo-mark.png'
import { ApiClientError } from '@/api/client'
import type { GuardianDeclineInfoResult } from '@/api/types'
import { authService } from '@/services/authService'

type PageState = 'loading' | 'ready' | 'declined' | 'already-declined' | 'invalid'

const route = useRoute()
const token = computed(() => {
  const value = route.query.token
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
})

const pageState = ref<PageState>('loading')
const info = ref<GuardianDeclineInfoResult | null>(null)
const errorMessage = ref('')
const isSubmitting = ref(false)

const displayStatus = computed(() => info.value?.status ?? (pageState.value === 'declined' ? 'DECLINED' : 'ACTIVE'))

const title = computed(() => {
  if (pageState.value === 'loading') return '요청을 확인하고 있어요'
  if (pageState.value === 'declined') return '수신 거부가 완료됐어요'
  if (pageState.value === 'already-declined') return '이미 처리된 요청이에요'
  if (pageState.value === 'invalid') return '링크를 확인할 수 없어요'
  return '보호 가족 등록 안내'
})

const description = computed(() => {
  if (pageState.value === 'declined') {
    return '앞으로 이 번호로 어부바 알림을 보내지 않아요.'
  }
  if (pageState.value === 'already-declined') {
    return '이미 알림 수신을 거부한 등록 요청이에요.'
  }
  if (pageState.value === 'invalid') {
    return errorMessage.value || '잘못됐거나 만료된 링크일 수 있어요.'
  }
  if (!info.value) return '잠시만 기다려 주세요.'

  return `${info.value.userName}님이 회원님을 보호 가족(${info.value.relation})으로 등록했어요.`
})

const canDecline = computed(
  () => pageState.value === 'ready' && displayStatus.value !== 'DECLINED' && !isSubmitting.value,
)

function mapDeclineError(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 400) return '토큰이 없어 요청을 처리할 수 없어요.'
    if (error.status === 404) return '잘못됐거나 만료된 링크예요.'
    if (error.status === 409) return '이미 처리된 요청이에요.'
    return error.message
  }
  return '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.'
}

async function loadDeclineInfo() {
  if (!token.value) {
    pageState.value = 'invalid'
    errorMessage.value = '토큰이 없어 요청을 처리할 수 없어요.'
    return
  }

  pageState.value = 'loading'
  errorMessage.value = ''

  try {
    info.value = await authService.getGuardianDeclineInfo(token.value)
    pageState.value = info.value.status === 'DECLINED' ? 'already-declined' : 'ready'
  } catch (error) {
    errorMessage.value = mapDeclineError(error)
    pageState.value = error instanceof ApiClientError && error.status === 409 ? 'already-declined' : 'invalid'
  }
}

async function decline() {
  if (!canDecline.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const result = await authService.declineGuardian({ token: token.value })
    pageState.value = result.status === 'DECLINED' ? 'declined' : 'ready'
  } catch (error) {
    errorMessage.value = mapDeclineError(error)
    if (error instanceof ApiClientError && error.status === 409) {
      pageState.value = 'already-declined'
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(loadDeclineInfo)
</script>

<template>
  <AppScreen>
    <section class="decline">
      <header class="decline__brand">
        <span class="decline__logo" :style="{ backgroundImage: `url(${logoMark})` }" aria-hidden="true"></span>
        <strong>어부바</strong>
      </header>

      <div class="decline__icon" :class="{ 'decline__icon--done': displayStatus === 'DECLINED' }" aria-hidden="true">
        <CheckCircle2 v-if="displayStatus === 'DECLINED'" :size="34" :stroke-width="2.2" />
        <ShieldCheck v-else-if="pageState === 'ready'" :size="34" :stroke-width="2.2" />
        <TriangleAlert v-else-if="pageState === 'invalid'" :size="34" :stroke-width="2.2" />
        <BellOff v-else :size="34" :stroke-width="2.2" />
      </div>

      <h1>{{ title }}</h1>
      <p>{{ description }}</p>

      <article v-if="info" class="decline-card" aria-label="등록 정보">
        <dl>
          <div>
            <dt>등록한 분</dt>
            <dd>{{ info.userName }}</dd>
          </div>
          <div>
            <dt>받는 분</dt>
            <dd>{{ info.guardianName }}</dd>
          </div>
          <div>
            <dt>관계</dt>
            <dd>{{ info.relation }}</dd>
          </div>
        </dl>
        <span class="decline-card__badge" :class="{ 'decline-card__badge--declined': displayStatus === 'DECLINED' }">
          {{ displayStatus === 'DECLINED' ? '수신 거부됨' : '알림 수신 중' }}
        </span>
      </article>

      <p v-if="errorMessage && pageState !== 'invalid'" class="decline__error" role="alert">
        {{ errorMessage }}
      </p>
    </section>

    <template v-if="pageState === 'ready'" #footer>
      <BaseButton variant="ghost" block :disabled="isSubmitting" @click="decline">
        {{ isSubmitting ? '처리하는 중...' : '알림 수신 거부하기' }}
      </BaseButton>
    </template>
  </AppScreen>
</template>

<style scoped>
.decline {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  text-align: center;
}

.decline__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-ink);
  font-size: var(--text-lg);
}

.decline__logo {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-pill);
  background-color: var(--color-yellow-light);
  background-repeat: no-repeat;
  background-position: center;
  background-size: 62% auto;
}

.decline__icon {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: var(--radius-pill);
  background: var(--color-yellow-light);
  color: var(--color-accent-deep);
}

.decline__icon--done {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.decline h1 {
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 800;
  line-height: 1.25;
}

.decline > p {
  max-width: 300px;
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  font-weight: 600;
  line-height: 1.6;
}

.decline-card {
  display: grid;
  gap: var(--space-4);
  width: 100%;
  margin-top: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  text-align: left;
}

.decline-card dl {
  display: grid;
  gap: var(--space-3);
  margin: 0;
}

.decline-card dl > div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.decline-card dt {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 700;
}

.decline-card dd {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-base);
  font-weight: 800;
}

.decline-card__badge {
  justify-self: start;
  padding: 4px var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--color-yellow-light);
  color: var(--color-accent-deep);
  font-size: var(--text-sm);
  font-weight: 800;
}

.decline-card__badge--declined {
  background: var(--color-alert-bg);
  color: var(--color-alert);
}

.decline__error {
  color: var(--color-alert);
}
</style>
