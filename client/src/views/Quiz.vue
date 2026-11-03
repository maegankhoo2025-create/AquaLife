<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { formatDate, useGameStore } from '../stores/game'
import PearlCount from '../components/PearlCount.vue'
import AppIcon from '../components/AppIcon.vue'
import BadgeMedal from '../components/BadgeMedal.vue'

const gameStore = useGameStore()
const game = gameStore.game
const { achievements, quizDoneToday } = storeToRefs(gameStore)

const streakBadge = computed(() => achievements.value.find((badge) => badge.id === 'streak'))
const otherBadges = computed(() => achievements.value.filter((badge) => badge.id !== 'streak'))
const recentScores = computed(() => game.quiz.scores.slice(0, 7)) // newest first, last 7 quizzes

// Streak milestones (3, 5, 7, 10, 14, 21, 30 days) come from the server with their bonus pearls.
const milestones = computed(() => game.quiz.milestones || [])

// The next milestone still to reach, or null once every milestone is passed.
const nextMilestone = computed(() => milestones.value.find((milestone) => milestone.days > game.quiz.streak) || null)

// Streak lengths that also upgrade the Quiz Streak badge (3, 7, 14, 21, 30).
function badgeTierAt(days) {
  const tier = streakBadge.value?.tiers.find((step) => step.target === days)
  return tier ? tier.name : ''
}

function nextTierPercent(badge) {
  if (!badge.nextTarget) return 100
  return Math.min(100, (badge.progress / badge.nextTarget) * 100)
}
</script>

<template>
  <main class="container al-page">
    <h1 class="al-title mb-3">Quiz</h1>

    <div class="row g-3">
      <!-- Today's quiz -->
      <section class="col-12 col-lg-7">
        <div class="al-card al-card--raised quiz-hero h-100">
          <div class="quiz-hero__art"><AppIcon name="book" :size="56" /></div>
          <div class="al-grow">
            <h2 class="h4">Today's quiz</h2>
            <p v-if="quizDoneToday" class="text-muted-al">
              Done for today. Your streak is safe! Replay for practice; pearls are paid once a day.
            </p>
            <p v-else class="text-muted-al">
              5 questions about real fish care. Each correct answer earns <PearlCount :amount="10" />.
              Finish it today to keep your streak going.
            </p>
            <RouterLink class="btn btn-aqua" :to="{ name: 'quiz-play' }">
              {{ quizDoneToday ? 'Practise again' : 'Start quiz' }}
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- Streak: current days, streak badge and the milestone ladder -->
      <section class="col-12 col-lg-5">
        <div class="al-card h-100">
          <div class="d-flex align-items-center gap-3">
            <div class="streak-count">
              <AppIcon name="flame" :size="34" />
              <span>{{ game.quiz.streak }}</span>
            </div>
            <div class="al-grow">
              <h2 class="h5 mb-1">Day streak</h2>
              <p class="small text-muted-al mb-0">
                <template v-if="nextMilestone">
                  {{ nextMilestone.days - game.quiz.streak }} more day{{ nextMilestone.days - game.quiz.streak === 1 ? '' : 's' }}
                  to the {{ nextMilestone.days }}-day bonus.
                </template>
                <template v-else>Every milestone reached. Amazing!</template>
                Best: {{ game.quiz.bestStreak || game.quiz.streak }} days.
              </p>
            </div>
            <BadgeMedal v-if="streakBadge" :badge="streakBadge" :size="56" stars />
          </div>

          <ol class="milestones mt-3 mb-0" aria-label="Quiz streak milestones">
            <li
              v-for="milestone in milestones"
              :key="milestone.days"
              :class="{ 'milestones__done': game.quiz.streak >= milestone.days, 'milestones__next': milestone === nextMilestone }"
            >
              <span class="milestones__dot">
                <AppIcon v-if="game.quiz.streak >= milestone.days" name="check" :size="14" />
              </span>
              <span class="al-grow">
                <strong>{{ milestone.days }} days</strong>
                <span v-if="badgeTierAt(milestone.days)" class="small text-muted-al"> · {{ badgeTierAt(milestone.days) }} badge</span>
              </span>
              <PearlCount :amount="milestone.reward" signed />
            </li>
          </ol>
        </div>
      </section>

      <!-- Badges -->
      <section class="col-12 col-md-6">
        <div class="al-card h-100">
          <h2 class="h5">Badges</h2>
          <p class="small text-muted-al">Every badge has 5 tiers: Bronze, Silver, Gold, Platinum and Diamond.</p>
          <ul class="badge-list">
            <li v-for="badge in [streakBadge, ...otherBadges].filter(Boolean)" :key="badge.id">
              <BadgeMedal :badge="badge" :size="48" />
              <div class="al-grow">
                <strong class="d-block">{{ badge.name }} <span class="small text-muted-al">· {{ badge.tierName }}</span></strong>
                <div class="badge-progress" role="progressbar" :aria-valuenow="badge.progress" aria-valuemin="0" :aria-valuemax="badge.nextTarget || badge.progress" :aria-label="`${badge.name} progress`">
                  <span :style="{ width: `${nextTierPercent(badge)}%` }"></span>
                </div>
                <span class="small text-muted-al">
                  {{ badge.nextTarget ? `${badge.progress} / ${badge.nextTarget} ${badge.unit} for ${badge.nextTierName}` : 'Highest tier reached!' }}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <!-- Past scores -->
      <section class="col-12 col-md-6">
        <div class="al-card h-100">
          <h2 class="h5">Recent scores</h2>
          <p v-if="game.quiz.scores.length === 0" class="text-muted-al mb-0">No quizzes yet.</p>
          <ul v-else class="al-list">
            <li v-for="score in recentScores" :key="score.date">
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
.quiz-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
}

.quiz-hero .al-grow {
  flex-basis: 16rem;
}

.quiz-hero__art {
  display: grid;
  place-items: center;
  width: 112px;
  height: 112px;
  flex-shrink: 0;
  border-radius: var(--al-radius);
  background: linear-gradient(145deg, color-mix(in srgb, var(--al-aqua) 30%, var(--al-surface-3)), var(--al-surface-3));
  color: var(--al-aqua);
}

.streak-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 64px;
  color: var(--al-warn);
  font-size: 2rem;
  font-weight: 900;
  line-height: 1.1;
}

/* Milestone ladder: a dot per milestone, filled in once reached */
.milestones {
  list-style: none;
  padding: 0;
}

.milestones li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.45rem 0.5rem;
  border-radius: var(--al-radius-sm);
}

.milestones__dot {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border: 2px solid var(--al-border);
  border-radius: 50%;
}

.milestones__done .milestones__dot {
  border-color: var(--al-ok);
  background: var(--al-ok);
  color: var(--al-bg);
}

.milestones__next {
  background: color-mix(in srgb, var(--al-warn) 12%, transparent);
}

.milestones__next .milestones__dot {
  border-color: var(--al-warn);
}

.badge-list {
  display: grid;
  gap: 0.75rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.badge-list li {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border: 1px solid var(--al-border);
  border-radius: var(--al-radius-sm);
  background: var(--al-surface-2);
}

.badge-progress {
  height: 6px;
  margin: 0.4rem 0 0.2rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--al-surface-3);
}

.badge-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--al-aqua);
  transition: width 180ms ease;
}
</style>
