<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { formatDate, LOW_PEARLS, xpPerLevel, useGameStore } from '../stores/game'
import PearlCount from '../components/PearlCount.vue'
import TankSwiper from '../components/TankSwiper.vue'
import AppIcon from '../components/AppIcon.vue'

const gameStore = useGameStore()
const game = gameStore.game
const care = gameStore.care
const { level, lowOnPearls, quizDoneToday, xpInLevel, xpPercent } = storeToRefs(gameStore)
const { getTasks, tanksNeedingCare, loadCare } = gameStore

// One row per tank with living fish, holding that tank's four tasks.
const tankTasks = computed(() =>
  tanksNeedingCare().map((tank) => {
    const tasks = getTasks(tank.id)
    return { tank, tasks, doneCount: tasks.filter((task) => task.done).length }
  }),
)
const recentActivity = computed(() => game.history.slice(0, 4))
// True while at least one care task can still earn pearls today.
const tasksLeft = computed(() => tankTasks.value.some((row) => row.doneCount < row.tasks.length))

function openTank(tankId) {
  game.currentTankId = tankId
}

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

    <!-- Shown while the balance is below LOW_PEARLS -->
    <section v-if="lowOnPearls" class="al-card low-pearls mb-3" role="alert">
      <AppIcon name="pearl" :size="36" />
      <div class="al-grow">
        <h2 class="h5 mb-1">Oh no, you're running out of pearls!</h2>
        <p class="small mb-0">
          You have fewer than {{ LOW_PEARLS }} pearls.
          <template v-if="tasksLeft || !quizDoneToday">Care for your tank and take the daily quiz to earn more.</template>
          <template v-else>You've done everything for today. Come back tomorrow to earn more.</template>
        </p>
      </div>
      <!-- Each button only shows while that way of earning is still open today -->
      <div v-if="tasksLeft || !quizDoneToday" class="d-flex flex-wrap gap-2">
        <RouterLink v-if="tasksLeft" class="btn btn-aqua btn-sm" :to="{ name: 'main-tank' }">Do care tasks</RouterLink>
        <RouterLink v-if="!quizDoneToday" class="btn btn-ghost btn-sm" :to="{ name: 'quiz-play' }">Take the quiz</RouterLink>
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
              <p v-if="tankTasks.length === 0" class="text-muted-al mb-0">Add fish to a tank to get daily care tasks.</p>
              <ul v-else class="al-list">
                <li v-for="row in tankTasks" :key="row.tank.id">
                  <span class="al-grow">
                    <strong class="d-block">{{ row.tank.name }}</strong>
                    <span class="task-icons">
                      <span
                        v-for="task in row.tasks"
                        :key="task.id"
                        class="task-icon"
                        :class="{ 'task-icon--done': task.done }"
                        :title="`${task.label}: ${task.done ? 'done' : `+${task.reward} pearls`}`"
                      >
                        <AppIcon :name="task.done ? 'check' : task.icon" :size="16" />
                      </span>
                    </span>
                  </span>
                  <span class="al-chip" :class="row.doneCount === row.tasks.length ? 'al-chip--ok' : ''">
                    {{ row.doneCount }} / {{ row.tasks.length }}
                  </span>
                  <RouterLink class="btn btn-ghost btn-sm" :to="{ name: 'main-tank' }" @click="openTank(row.tank.id)">Open</RouterLink>
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
.task-icons {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.35rem;
}
.task-icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--al-border);
  border-radius: 50%;
  color: var(--al-muted);
}
.task-icon--done {
  border-color: var(--al-ok);
  background: var(--al-ok);
  color: var(--al-bg);
}
.low-pearls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  border-color: var(--al-warn);
  background: color-mix(in srgb, var(--al-warn) 10%, var(--al-surface-1));
}
.low-pearls .al-grow {
  flex-basis: 14rem;
}
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
