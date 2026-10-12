<script setup>
import { RouterLink } from 'vue-router'
import { achievements, formatDate, game, quizDoneToday } from '../stores/game'
import PearlCount from '../components/PearlCount.vue'
</script>

<template>
  <main class="container al-page">
    <h1 class="al-title mb-3">Quiz</h1>

    <div class="row g-3">
      <!-- Today's quiz -->
      <section class="col-12 col-lg-8">
        <div class="al-card al-card--raised h-100">
          <div class="row g-3 align-items-center">
            <div class="col-12 col-sm-4">
              <div class="al-ph quiz-art" aria-hidden="true">🐠</div>
            </div>
            <div class="col-12 col-sm-8">
              <h2 class="h4">Today's quiz</h2>
              <p v-if="quizDoneToday" class="text-muted-al">
                You have finished today's quiz. You can replay it for practice, but pearls are only
                paid once a day.
              </p>
              <p v-else class="text-muted-al">
                5 questions about real fish care. Each correct answer earns
                <PearlCount :amount="10" />.
              </p>
              <RouterLink class="btn btn-aqua" :to="{ name: 'quiz-play' }">
                {{ quizDoneToday ? 'Practise again' : 'Start quiz' }}
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Streak -->
      <section class="col-12 col-lg-4">
        <div class="al-card h-100 text-center">
          <h2 class="h5">Streak</h2>
          <p class="streak mb-0"><span aria-hidden="true">🔥</span> {{ game.quiz.streak }}</p>
          <p class="text-muted-al mb-0">days in a row</p>
        </div>
      </section>

      <!-- Badges -->
      <section class="col-12 col-md-6">
        <div class="al-card h-100">
          <h2 class="h5">Badges</h2>
          <div class="row g-2">
            <div v-for="badge in achievements" :key="badge.id" class="col-6 col-sm-4">
              <div class="badge-tile" :class="{ 'opacity-50': !badge.earned }">
                <span class="badge-tile__icon" aria-hidden="true">{{ badge.emoji }}</span>
                <span class="small fw-bold">{{ badge.name }}</span>
                <span class="visually-hidden">{{ badge.earned ? '(earned)' : '(locked)' }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Past scores -->
      <section class="col-12 col-md-6">
        <div class="al-card h-100">
          <h2 class="h5">Past scores</h2>
          <p v-if="game.quiz.scores.length === 0" class="text-muted-al mb-0">No quizzes yet.</p>
          <ul v-else class="al-list">
            <li v-for="score in game.quiz.scores" :key="score.date">
              <span class="al-grow">{{ formatDate(score.date) }}</span>
              <span class="al-chip">{{ score.score }} / {{ score.total }}</span>
              <PearlCount :amount="score.reward" signed />
            </li>
          </ul>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.quiz-art {
  aspect-ratio: 16 / 9;
}

.streak {
  font-size: clamp(2.2rem, 1.6rem + 3vw, 3.5rem);
  font-weight: 900;
  color: var(--al-warn);
}

.badge-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  height: 100%;
  padding: 0.75rem 0.5rem;
  border-radius: var(--al-radius-sm);
  background: var(--al-surface-2);
  text-align: center;
}

.badge-tile__icon {
  font-size: 1.8rem;
}
</style>
