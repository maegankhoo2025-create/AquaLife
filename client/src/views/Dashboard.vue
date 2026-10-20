<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  care,
  formatDate,
  game,
  getTasks,
  level,
  loadCare,
  quizDoneToday,
  xpInLevel,
  xpPercent,
  xpPerLevel,
} from '../stores/game'
import PearlCount from '../components/PearlCount.vue'
import TankSwiper from '../components/TankSwiper.vue'
import AppIcon from '../components/AppIcon.vue'

const tasks = computed(() => getTasks())
const recentActivity = computed(() => game.history.slice(0, 4))

const careChecks = computed(() => care.today?.checks || [])
const fullDays = computed(() => care.days.filter((entry) => entry.recorded && entry.met === entry.total).length)

let careTimer
let refreshingCare = false
async function updateCare() {
  if (document.hidden || refreshingCare) return
  refreshingCare = true
  try {
    await loadCare()
  } catch (error) {
    console.error('Unable to refresh care progress:', error)
  } finally {
    refreshingCare = false
  }
}
function onCareVisibility() {
  clearInterval(careTimer)
  if (document.hidden) return
  updateCare()
  careTimer = setInterval(updateCare, 60000)
}
onMounted(() => {
  updateCare()
  if (!document.hidden) careTimer = setInterval(updateCare, 60000)
  document.addEventListener('visibilitychange', onCareVisibility)
})
onUnmounted(() => {
  clearInterval(careTimer)
  document.removeEventListener('visibilitychange', onCareVisibility)
})
</script>

<template>
  <main class="container al-page">
    <!-- Welcome strip: name, level and progress. Balance stays in the navbar. -->
    <section class="al-card al-card--raised mb-3">
      <div class="row g-3 align-items-center">
        <div class="col-12">
          <h1 class="al-title">Welcome back, {{ game.user.name }}</h1>
          <div class="d-flex align-items-center gap-2 mt-2">
            <span class="al-chip al-chip--aqua">Level {{ level }}</span>
            <span class="small text-muted-al">{{ xpInLevel }} / {{ xpPerLevel }} XP</span>
          </div>
          <div
            class="al-progress mt-2"
            role="progressbar"
            aria-label="XP towards next level"
            :aria-valuenow="xpInLevel"
            aria-valuemin="0"
            :aria-valuemax="xpPerLevel"
          >
            <div :style="{ width: `${xpPercent}%` }"></div>
          </div>
        </div>
      </div>
    </section>

    <div class="row g-3">
      <!-- Tank preview -->
      <section class="col-12 col-lg-8">
        <div class="al-card h-100">
          <div class="d-flex align-items-center justify-content-between gap-2 mb-3">
            <h2 class="h5 mb-0">Your tanks</h2>
            <RouterLink class="btn btn-ghost" :to="{ name: 'main-tank' }">Open tank</RouterLink>
          </div>
          <TankSwiper v-model="game.currentTankId" :tanks="game.tanks" />
        </div>
      </section>

      <div class="col-12 col-lg-4">
        <div class="row g-3">
          <!-- Daily quiz -->
          <section class="col-12 col-md-6 col-lg-12">
            <div class="al-card h-100">
              <h2 class="h5">Daily quiz</h2>
              <p class="text-muted-al">
                <template v-if="quizDoneToday">Done for today. Come back tomorrow!</template>
                <template v-else>5 questions. Earn up to <PearlCount :amount="50" />.</template>
              </p>
              <div class="d-flex flex-wrap align-items-center gap-2">
                <RouterLink class="btn btn-aqua" :to="{ name: quizDoneToday ? 'quiz' : 'quiz-play' }">
                  {{ quizDoneToday ? 'View quiz hub' : 'Start quiz' }}
                </RouterLink>
                <span class="al-chip al-chip--warn"><AppIcon name="flame" /> {{ game.quiz.streak }}-day streak</span>
              </div>
            </div>
          </section>

          <!-- Today's care tasks -->
          <section class="col-12 col-md-6 col-lg-12">
            <div class="al-card h-100">
              <h2 class="h5">Today's care tasks</h2>
              <ul class="al-list">
                <li v-for="task in tasks" :key="task.id">
                  <AppIcon :name="task.icon" />
                  <span class="al-grow">{{ task.label }}</span>
                  <span v-if="task.done" class="al-chip al-chip--ok">Done</span>
                  <PearlCount v-else :amount="task.reward" signed />
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>


      <section class="col-12" aria-labelledby="care-progress-title">
        <div class="al-card">
          <h2 id="care-progress-title" class="h5">Responsible fish care</h2>
          <p class="fw-bold mb-2">{{ care.percent }}% over {{ care.windowDays }} days · {{ care.streak }}{{ care.streak === care.windowDays ? '+' : '' }}-day streak</p>
          <div
            class="al-progress"
            role="progressbar"
            aria-label="Responsible fish care progress"
            :aria-valuenow="care.percent"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div :style="{ width: `${care.percent}%` }"></div>
          </div>
          <p class="small text-muted-al mt-2">{{ fullDays }} of the last {{ care.windowDays }} days had every check met.</p>
          <ol class="care-days" aria-label="Daily care record">
            <li v-for="day in care.days" :key="day.day" :class="{ 'care-days__full': day.recorded && day.met === day.total }" :title="`${day.day}: ${day.recorded ? `${day.met}/${day.total} checks` : 'Not recorded'}`">
              <span>{{ day.day.slice(8) }}</span>
              <strong>{{ day.recorded ? `${day.met}/${day.total}` : '-' }}</strong>
            </li>
          </ol>
          <h3 class="h6 mt-3">Today</h3>
          <ul class="al-list mt-2">
            <li v-for="item in careChecks" :key="item.id">
              <span class="al-grow">
                <strong>{{ item.label }}</strong>
                <span class="d-block small text-muted-al">{{ item.evidence }}</span>
              </span>
              <span class="al-chip" :class="item.met ? 'al-chip--ok' : 'al-chip--warn'">{{ item.met ? 'Met' : 'Needs care' }}</span>
            </li>
          </ul>
          <p class="small mb-0">Each day is saved, so the bar reflects consistent care rather than one visit. Before keeping real fish, research your species and equipment, cycle the filter without fish, and test ammonia, nitrite, nitrate and source water.</p>
        </div>
      </section>

      <!-- Recent activity -->
      <section class="col-12">
        <div class="al-card h-100">
          <div class="d-flex align-items-center justify-content-between gap-2">
            <h2 class="h5 mb-0">Recent activity</h2>
            <RouterLink class="btn btn-link" :to="{ name: 'history' }">See all</RouterLink>
          </div>
          <ul class="al-list">
            <li v-for="entry in recentActivity" :key="entry.id">
              <span class="al-grow">
                {{ entry.label }}
                <span class="d-block small text-muted-al">{{ formatDate(entry.date) }}</span>
              </span>
              <PearlCount :amount="entry.amount" signed />
            </li>
          </ul>
        </div>
      </section>
    </div>
  </main>
</template>


<style scoped>
.care-days {
  display: grid;
  grid-template-columns: repeat(14, minmax(0, 1fr));
  gap: 0.35rem;
  list-style: none;
  padding: 0;
}
.care-days li {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.4rem 0.15rem;
  border: 1px solid var(--al-border);
  border-radius: 8px;
  color: var(--al-muted);
  font-size: 0.75rem;
}
.care-days .care-days__full {
  border-color: var(--al-ok);
  color: var(--al-text);
}
@media (max-width: 575px) {
  .care-days { grid-template-columns: repeat(7, minmax(0, 1fr)); }
}
</style>
