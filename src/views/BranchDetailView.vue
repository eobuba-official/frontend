<script setup lang="ts">
import {
  BookOpen,
  Building2,
  Car,
  Clock,
  CreditCard,
  MessageCircle,
  Phone,
  UserPlus,
  Users,
  CircleAlert,
  MapPin,
} from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import { routePaths } from '@/router/routePaths'

const router = useRouter()

const branch = {
  name: 'KB국민은행 강남지점',
  distance: '700m',
  address: '서울 강남구 테헤란로 123',
  hours: '09:00 ~ 16:00',
  phone: '02-1234-5678',
  parking: '가능',
  congestion: '보통',
}

const details = [
  { label: '영업시간', value: branch.hours, icon: Clock },
  { label: '전화', value: branch.phone, icon: Phone },
  { label: '주차', value: branch.parking, icon: Car },
  { label: '혼잡도', value: branch.congestion, icon: Users },
]

const services = [
  { title: '통장', description: '신규 가입, 재발급 등', icon: BookOpen },
  { title: '계좌 개설', description: '입출금, 예·적금 등', icon: UserPlus },
  { title: '카드', description: '신규 발급, 재발급 등', icon: CreditCard },
  { title: '대출 상담', description: '주택담보대출, 신용대출 등', icon: MessageCircle },
]
</script>

<template>
  <AppScreen>
    <template #header>
      <FlowHeader :current="1" :total="6" :back-to="routePaths.branchMap" label="지점 선택" hide-home />
    </template>

    <section class="branch-detail">
      <div class="branch-detail__heading">
        <h1>지점 상세 정보</h1>
        <p>선택한 지점의 자세한 정보를 확인하세요.</p>
      </div>

      <article class="branch-hero">
        <span class="branch-hero__icon" aria-hidden="true">
          <Building2 :size="42" :stroke-width="2.1" />
        </span>
        <div>
          <h2>{{ branch.name }}</h2>
          <p>
            <MapPin :size="20" :stroke-width="2.2" />
            {{ branch.distance }}
            <span></span>
            {{ branch.address }}
          </p>
        </div>
      </article>

      <article class="detail-list">
        <button v-for="detail in details" :key="detail.label" class="detail-row" type="button">
          <span class="detail-row__icon" aria-hidden="true">
            <component :is="detail.icon" :size="22" :stroke-width="2.2" />
          </span>
          <strong>{{ detail.label }}</strong>
          <span class="detail-row__value">
            {{ detail.value }}
            <i v-if="detail.label === '혼잡도'" aria-hidden="true">
              <b></b>
              <b></b>
              <b></b>
            </i>
          </span>
        </button>
      </article>

      <div class="service-section">
        <h2>이 지점에서 가능한 서비스</h2>
        <p>이 지점에서 이용할 수 있는 주요 서비스를 확인하세요.</p>

        <div class="service-grid">
          <article v-for="service in services" :key="service.title" class="service-card">
            <span aria-hidden="true">
              <component :is="service.icon" :size="28" :stroke-width="2.2" />
            </span>
            <div>
              <strong>{{ service.title }}</strong>
              <small>{{ service.description }}</small>
            </div>
          </article>
        </div>
      </div>

      <div class="branch-notice">
        <CircleAlert :size="24" :stroke-width="2.2" aria-hidden="true" />
        <p>제공 서비스는 지점 사정에 따라 달라질 수 있어요. 방문 전 꼭 전화로 확인하세요.</p>
      </div>
    </section>

    <template #footer>
      <div class="branch-detail__footer">
        <BaseButton variant="ghost" block>길찾기</BaseButton>
        <BaseButton block @click="router.push(routePaths.visitSummary)">이 지점 선택</BaseButton>
      </div>
    </template>
  </AppScreen>
</template>

<style scoped>
.branch-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.branch-detail__heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.branch-detail h1,
.service-section h2 {
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 900;
  line-height: 1.25;
}

.branch-detail__heading p,
.service-section > p {
  color: var(--color-ink-soft);
  font-size: var(--text-lg);
  font-weight: 600;
}

.branch-hero {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 12% 10%, rgba(255, 243, 191, 0.82), transparent 44%),
    var(--color-yellow-faint);
  box-shadow: var(--shadow-card);
}

.branch-hero__icon,
.detail-row__icon,
.service-card > span {
  display: grid;
  place-items: center;
  border-radius: var(--radius-pill);
  background: var(--color-yellow-faint);
  color: var(--color-accent-deep);
}

.branch-hero__icon {
  width: 72px;
  height: 72px;
}

.branch-hero h2 {
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: var(--text-xl);
  font-weight: 900;
}

.branch-hero p {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  font-weight: 600;
}

.branch-hero p span {
  width: 1px;
  height: 16px;
  background: var(--color-line);
}

.detail-list {
  display: flex;
  flex-direction: column;
  padding-inline: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.detail-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-4);
  min-height: 72px;
  padding-block: var(--space-3);
  border: 0;
  border-bottom: 1px solid var(--color-line);
  background: transparent;
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
}

.detail-row:last-child {
  border-bottom: 0;
}

.detail-row__icon,
.service-card > span {
  width: 44px;
  height: 44px;
}

.detail-row strong,
.detail-row__value {
  font-size: var(--text-lg);
  font-weight: 800;
}

.detail-row__value {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-ink);
}

.detail-row__value i {
  display: inline-flex;
  align-items: end;
  gap: 5px;
  height: 24px;
}

.detail-row__value b {
  display: block;
  width: 8px;
  border-radius: var(--radius-pill);
  background: var(--color-line);
}

.detail-row__value b:nth-child(1) {
  height: 14px;
  background: var(--color-accent);
}

.detail-row__value b:nth-child(2) {
  height: 22px;
  background: var(--color-accent);
}

.detail-row__value b:nth-child(3) {
  height: 18px;
}

.service-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.service-card {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--space-3);
  min-height: 82px;
  padding: var(--space-3);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.service-card strong {
  display: block;
  color: var(--color-ink);
  font-size: var(--text-base);
  font-weight: 900;
}

.service-card small {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 600;
}

.branch-notice {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  font-weight: 600;
}

.branch-detail__footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
</style>
