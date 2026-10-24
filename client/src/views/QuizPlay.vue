<script setup>
// The quiz player: one question per screen, instant feedback, then a result screen.
// Questions come from the server without their answers; each answer is checked
// by the server, which also does the final marking.
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { achievements, answerQuestion, finishQuiz, getQuizQuestions, notify } from '../stores/game'
import PearlCount from '../components/PearlCount.vue'
import AppIcon from '../components/AppIcon.vue'
import BadgeMedal from '../components/BadgeMedal.vue'

const questions = ref([])
const loading = ref(true)

const index = ref(0) // which question is on screen
const chosen = ref(null) // index of the answer the user picked, null = not answered yet
const feedback = ref(null) // { correct, isCorrect, fact } from the server
const score = ref(0)
const finished = ref(false)
const reward = ref(0)
const streakBonus = ref(0)
const streak = ref(0)
const practice = ref(false)
const photoFailed = ref(false)

onMounted(async () => {
  try {
    questions.value = await getQuizQuestions()
  } catch (error) {
    console.error('Unable to load the quiz:', error)
    notify('Unable to load the quiz. Please try again.', true)
  } finally {
    loading.value = false
  }
})

// After a real (not practice) quiz: did today's streak reach a new tier of the Quiz Streak badge?
const streakBadge = computed(() => achievements.value.find((badge) => badge.id === 'streak'))
const newStreakTier = computed(() => {
  if (practice.value || !streakBadge.value) return null
  return streakBadge.value.tiers.find((step) => step.target === streak.value) || null
})

const question = computed(() => questions.value[index.value])
const answered = computed(() => feedback.value !== null)
const isLast = computed(() => index.value === questions.value.length - 1)
// The bar fills as questions are answered, not just shown.
const progress = computed(
  () => ((index.value + (answered.value ? 1 : 0)) / questions.value.length) * 100,
)

async function choose(answerIndex) {
  if (chosen.value !== null) return // only the first choice counts
  chosen.value = answerIndex
  try {
    feedback.value = await answerQuestion(question.value.id, answerIndex)
    chosen.value = feedback.value.chosen
    if (feedback.value.isCorrect) score.value += 1
  } catch (error) {
    console.error('Unable to check the answer:', error)
    notify('Unable to check that answer. Please try again.', true)
    chosen.value = null
  }
}

async function next() {
  if (isLast.value) {
    const result = await finishQuiz()
    if (!result) return // finishQuiz already showed the error
    score.value = result.score
    reward.value = result.reward
    streakBonus.value = result.streakBonus
    streak.value = result.streak
    practice.value = result.practice
    finished.value = true
  } else {
    index.value += 1
    chosen.value = null
    feedback.value = null
    photoFailed.value = false
  }
}

// Colours an answer button once the question has been answered.
function answerClass(answerIndex) {
  if (!answered.value) return ''
  if (answerIndex === feedback.value.correct) return 'answer--correct'
  if (answerIndex === chosen.value) return 'answer--wrong'
  return 'opacity-50'
}
</script>

<template>
  <main class="container al-page quiz-play">
    <p v-if="loading" class="text-muted-al" role="status">Loading today's quiz…</p>

    <p v-else-if="questions.length === 0" class="text-muted-al" role="status">
      The quiz could not be loaded. <RouterLink :to="{ name: 'quiz' }">Back to quiz hub</RouterLink>
    </p>

    <!-- Result screen -->
    <section v-else-if="finished" class="al-card al-card--raised text-center">
      <div class="mb-3"><AppIcon name="trophy" :size="64" /></div>
      <h1 class="al-title">{{ score }} / {{ questions.length }} correct</h1>
      <p v-if="reward > 0" class="fs-5 mt-2">You earned <PearlCount :amount="reward" signed /></p>
      <p v-else-if="practice" class="text-muted-al mt-2">Practice round: no pearls this time.</p>
      <p v-else class="text-muted-al mt-2">No correct answers today. Keep practising for tomorrow.</p>
      <p v-if="!practice" class="streak-line">
        <AppIcon name="flame" :size="22" /> {{ streak }}-day streak
      </p>
      <p v-if="streakBonus > 0" class="text-muted-al">
        Includes <PearlCount :amount="streakBonus" signed /> for your {{ streak }}-day streak.
      </p>
      <div v-if="newStreakTier && streakBadge" class="new-badge mb-3">
        <BadgeMedal :badge="streakBadge" :size="72" stars />
        <p class="fw-bold mb-0">New badge: {{ newStreakTier.name }} Quiz Streak, "{{ newStreakTier.title }}"!</p>
      </div>
      <div class="d-flex flex-wrap justify-content-center gap-2">
        <RouterLink class="btn btn-aqua" :to="{ name: 'quiz' }">Back to quiz hub</RouterLink>
        <RouterLink class="btn btn-ghost" :to="{ name: 'browse' }">Spend pearls</RouterLink>
      </div>
    </section>

    <!-- Question screen -->
    <section v-else>
      <div class="d-flex align-items-center justify-content-between gap-3 mb-2">
        <span class="fw-bold">Question {{ index + 1 }} of {{ questions.length }}</span>
        <RouterLink class="btn btn-link" :to="{ name: 'quiz' }">Quit</RouterLink>
      </div>
      <div
        class="al-progress mb-3"
        role="progressbar"
        aria-label="Quiz progress"
        :aria-valuenow="Math.round(progress)"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div :style="{ width: `${progress}%` }"></div>
      </div>

      <div class="al-card">
        <figure v-if="question.photo && !photoFailed" class="mb-3">
          <img
            class="question-photo"
            :src="question.photo.url"
            alt="Photo of the fish in this question"
            @error="photoFailed = true"
          />
          <figcaption class="small text-muted-al mt-1">
            {{ question.photo.attribution }} (iNaturalist)
          </figcaption>
        </figure>
        <div v-else class="al-ph question-art mb-3">
          <AppIcon :name="question.icon || 'image'" :size="64" />
        </div>
        <h1 class="h4 mb-3">{{ question.question }}</h1>

        <!-- 2 x 2 from the sm breakpoint, one column on phones -->
        <div class="row g-2">
          <div v-for="(answer, answerIndex) in question.answers" :key="answer" class="col-12 col-sm-6">
            <button
              class="btn btn-ghost answer w-100 h-100"
              :class="answerClass(answerIndex)"
              type="button"
              :aria-disabled="chosen !== null"
              @click="choose(answerIndex)"
            >
              {{ answer }}
            </button>
          </div>
        </div>

        <!-- Instant feedback -->
        <div v-if="answered" class="mt-3" role="status">
          <p class="mb-2">
            <span
              class="al-chip"
              :class="feedback.isCorrect ? 'al-chip--ok' : 'al-chip--bad'"
            >
              {{ feedback.isCorrect ? 'Correct!' : 'Not quite' }}
            </span>
          </p>
          <p>{{ feedback.fact }}</p>
          <button class="btn btn-aqua w-100" type="button" @click="next">
            {{ isLast ? 'See results' : 'Next question' }}
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.streak-line {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--al-warn);
  font-weight: 800;
}

.new-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}


.question-art {
  height: clamp(110px, 26vw, 200px);
}

.question-photo {
  display: block;
  width: 100%;
  height: clamp(160px, 40vw, 280px);
  object-fit: cover;
  border-radius: var(--al-radius-sm);
}

.answer {
  min-height: 56px;
  text-align: left;
}

.answer--correct {
  border-color: var(--al-ok);
  background: color-mix(in srgb, var(--al-ok) 18%, transparent);
}

.answer--wrong {
  border-color: var(--al-bad);
  background: color-mix(in srgb, var(--al-bad) 18%, transparent);
}

</style>
