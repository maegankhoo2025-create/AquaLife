<script setup>
// The quiz player: one question per screen, instant feedback, then a result screen.
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { finishQuiz, getQuizQuestions } from '../stores/game'
import PearlCount from '../components/PearlCount.vue'

const questions = getQuizQuestions()

const index = ref(0) // which question is on screen
const chosen = ref(null) // index of the answer the user picked, null = not answered yet
const score = ref(0)
const finished = ref(false)
const reward = ref(0)

const question = computed(() => questions[index.value])
const answered = computed(() => chosen.value !== null)
const isLast = computed(() => index.value === questions.length - 1)
// The bar fills as questions are answered, not just shown.
const progress = computed(
  () => ((index.value + (answered.value ? 1 : 0)) / questions.length) * 100,
)

function choose(answerIndex) {
  if (answered.value) return // only the first choice counts
  chosen.value = answerIndex
  if (answerIndex === question.value.correct) score.value += 1
}

function next() {
  if (isLast.value) {
    reward.value = finishQuiz(score.value, questions.length)
    finished.value = true
  } else {
    index.value += 1
    chosen.value = null
  }
}

// Colours an answer button once the question has been answered.
function answerClass(answerIndex) {
  if (!answered.value) return ''
  if (answerIndex === question.value.correct) return 'answer--correct'
  if (answerIndex === chosen.value) return 'answer--wrong'
  return 'opacity-50'
}
</script>

<template>
  <main class="container al-page quiz-play">
    <!-- Result screen -->
    <section v-if="finished" class="al-card al-card--raised text-center">
      <div class="result-icon" aria-hidden="true">🎉</div>
      <h1 class="al-title">{{ score }} / {{ questions.length }} correct</h1>
      <p v-if="reward > 0" class="fs-5 mt-2">You earned <PearlCount :amount="reward" signed /></p>
      <p v-else class="text-muted-al mt-2">Practice round: no pearls this time.</p>
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
        <div class="al-ph question-art mb-3" aria-hidden="true">{{ question.emoji }}</div>
        <h1 class="h4 mb-3">{{ question.question }}</h1>

        <!-- 2 x 2 from the sm breakpoint, one column on phones -->
        <div class="row g-2">
          <div v-for="(answer, answerIndex) in question.answers" :key="answer" class="col-12 col-sm-6">
            <button
              class="btn btn-ghost answer w-100 h-100"
              :class="answerClass(answerIndex)"
              type="button"
              :aria-disabled="answered"
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
              :class="chosen === question.correct ? 'al-chip--ok' : 'al-chip--bad'"
            >
              {{ chosen === question.correct ? 'Correct!' : 'Not quite' }}
            </span>
          </p>
          <p><strong>Did you know?</strong> {{ question.fact }}</p>
          <button class="btn btn-aqua w-100" type="button" @click="next">
            {{ isLast ? 'See results' : 'Next question' }}
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.quiz-play {
  max-width: 760px;
}

.question-art {
  height: clamp(110px, 26vw, 200px);
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

.result-icon {
  font-size: clamp(3rem, 2rem + 5vw, 5rem);
}
</style>
