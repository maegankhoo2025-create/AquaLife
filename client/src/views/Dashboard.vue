<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  achievements,
  formatDate,
  game,
  getTasks,
  level,
  quizDoneToday,
  xpInLevel,
  xpPercent,
  xpPerLevel,
} from '../stores/game'
import PearlCount from '../components/PearlCount.vue'
import TankSwiper from '../components/TankSwiper.vue'

const tasks = computed(() => getTasks())
const recentActivity = computed(() => game.history.slice(0, 4))
</script>

<template>
  <main class="container al-page">
    <!-- Welcome strip: name, level, XP bar and pearl balance -->
    <section class="al-card al-card--raised mb-3">
      <div class="row g-3 align-items-center">
        <div class="col-12 col-md-7">
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
        <div class="col-12 col-md-5 text-md-end">
          <p class="small text-muted-al mb-0">Pearl balance</p>
          <p class="balance mb-0"><PearlCount :amount="game.pearls" /></p>
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
                <RouterLink class="btn btn-aqua" :to="{ name: 'quiz' }">
                  {{ quizDoneToday ? 'View quiz hub' : 'Start quiz' }}
                </RouterLink>
                <span class="al-chip al-chip--warn">🔥 {{ game.quiz.streak }}-day streak</span>
              </div>
            </div>
          </section>

          <!-- Today's care tasks -->
          <section class="col-12 col-md-6 col-lg-12">
            <div class="al-card h-100">
              <h2 class="h5">Today's care tasks</h2>
              <ul class="al-list">
                <li v-for="task in tasks" :key="task.id">
                  <span aria-hidden="true">{{ task.emoji }}</span>
                  <span class="al-grow">{{ task.label }}</span>
                  <span v-if="task.done" class="al-chip al-chip--ok">Done</span>
                  <PearlCount v-else :amount="task.reward" signed />
                </li>
              </ul>
              <RouterLink class="btn btn-ghost w-100 mt-2" :to="{ name: 'main-tank' }">
                Go to tank
              </RouterLink>
            </div>
          </section>
        </div>
      </div>

      <!-- Achievements -->
      <section class="col-12 col-md-6">
        <div class="al-card h-100">
          <h2 class="h5">Achievements</h2>
          <ul class="al-list">
            <li v-for="badge in achievements" :key="badge.id" :class="{ 'opacity-50': !badge.earned }">
              <span aria-hidden="true">{{ badge.emoji }}</span>
              <span class="al-grow">{{ badge.name }}</span>
              <span class="al-chip" :class="{ 'al-chip--ok': badge.earned }">
                {{ badge.earned ? 'Earned' : 'Locked' }}
              </span>
            </li>
          </ul>
        </div>
      </section>

      <!-- Recent activity -->
      <section class="col-12 col-md-6">
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
.balance {
  font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2.2rem);
}
</style>
