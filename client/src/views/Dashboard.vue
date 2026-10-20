<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  checkCompatibility,
  formatDate,
  game,
  getTasks,
  getItem,
  level,
  quizDoneToday,
  safeRange,
  xpInLevel,
  xpPercent,
  xpPerLevel,
} from '../stores/game'
import PearlCount from '../components/PearlCount.vue'
import TankSwiper from '../components/TankSwiper.vue'
import AppIcon from '../components/AppIcon.vue'

const tasks = computed(() => getTasks())
const recentActivity = computed(() => game.history.slice(0, 4))

// Four equally weighted learning activities, not a real-world readiness formula.
const readiness = computed(() => {
  const scores = game.quiz.scores || []
  const correct = scores.reduce((total, entry) => total + entry.score, 0)
  const careDone = tasks.value.filter((task) => task.done).length
  const safeTanks = game.tanks.filter((tank) => {
    if (!tank.fish.length || tank.fish.some((fish) => fish.health < 70)) return false
    const safe = safeRange(tank)
    const actualSafe = Object.keys(safe).every((key) =>
      safe[key] && tank.conditions[key] >= safe[key][0] && tank.conditions[key] <= safe[key][1],
    )
    return actualSafe && tank.fish.every((fish) => {
      const item = getItem(fish.speciesId)
      return item && checkCompatibility(item, tank).ok
    })
  })
  return [
    { label: 'Take part in a quiz', done: scores.length > 0, evidence: `${scores.length} submitted quiz results saved.` },
    { label: 'Demonstrate some correct knowledge', done: correct > 0, evidence: `${correct} correct answers across saved quiz results; one or more completes this item, not mastery of every topic.` },
    { label: 'Practise all three care actions today', done: careDone === tasks.value.length, evidence: `${careDone} / ${tasks.value.length} care tasks rewarded today. This item resets daily; rewards may be earned across tanks.` },
    { label: 'Keep a stocked virtual tank currently safe', done: safeTanks.length > 0, evidence: safeTanks.length ? `Currently meets this item: ${safeTanks.map((tank) => tank.name).join(', ')}.` : 'No stocked tank currently meets every condition below.' },
  ]
})
const readinessDone = computed(() => readiness.value.filter((item) => item.done).length)
const readinessPercent = computed(() => Math.round(readinessDone.value / readiness.value.length * 100))
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


      <section class="col-12" aria-labelledby="readiness-title">
        <div class="al-card">
          <h2 id="readiness-title" class="h5">Real-world aquarium preparation: learning checklist</h2>
          <p><strong>Learning progress, not certification.</strong> These four equally weighted items reflect saved in-app evidence, not proof that you are ready to keep real fish.</p>
          <p class="fw-bold mb-2">{{ readinessDone }} / {{ readiness.length }} learning items currently met ({{ readinessPercent }}%)</p>
          <div
            class="al-progress"
            role="progressbar"
            aria-label="In-app learning checklist progress"
            :aria-valuenow="readinessDone"
            aria-valuemin="0"
            :aria-valuemax="readiness.length"
          >
            <div :style="{ width: `${readinessPercent}%` }"></div>
          </div>
          <ul class="al-list mt-2">
            <li v-for="item in readiness" :key="item.label">
              <span class="al-grow">
                <strong>{{ item.label }}</strong>
                <span class="d-block small text-muted-al">{{ item.evidence }}</span>
              </span>
              <span class="al-chip" :class="item.done ? 'al-chip--ok' : 'al-chip--warn'">{{ item.done ? 'Met' : 'Not yet' }}</span>
            </li>
          </ul>
          <p class="small text-muted-al">A safe virtual tank must contain fish, have every fish at 70% health or higher (no dead fish), compatible temperaments, and actual temperature and pH in every living species’ shared range, with water quality at least 70%. Targets alone do not count. This current-state item can become unmet as conditions change.</p>
          <p class="small mb-0">Before keeping real fish, research the species, suitable tank size and equipment, establish a fishless nitrogen cycle, test ammonia/nitrite/nitrate and source water, and plan stocking and ongoing care. This game does not verify any of that preparation, and even 4 / 4 is not a real-tank readiness guarantee.</p>
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

