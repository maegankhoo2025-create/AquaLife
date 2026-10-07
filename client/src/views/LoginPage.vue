<script setup>
import { computed, ref } from 'vue'

const mode = ref('signup')
const name = ref('')
const email = ref('')
const password = ref('')

const isPasswordValid = computed(() => {
  const pw = password.value

  // Rule 1: at least 5 characters long
  if (pw.length < 5) {
    return false
  }

  // Rule 2 and 3: at least one letter and at least one number
  let hasLetter = false
  let hasNumber = false

  for (let i = 0; i < pw.length; i++) {
    const ch = pw[i]

    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
      hasLetter = true
    }

    if (ch >= '0' && ch <= '9') {
      hasNumber = true
    }
  }

  return hasLetter && hasNumber
})
</script>

<template>
  <main class="container py-5">
    <h1 class="text-center mb-4">Aqualife</h1>

    <div class="row justify-content-center">
      <div class="col-12 col-md-8 col-lg-5">
        <section class="card shadow-sm">
          <div class="card-body p-4">
            <h2 class="h4 mb-4">
              {{ mode === 'signup' ? 'Sign up' : 'Log in' }}
            </h2>

            <form @submit.prevent>
              <div v-if="mode === 'signup'" class="mb-3">
                <label for="name" class="form-label">Name</label>
                <input
                  id="name"
                  v-model="name"
                  class="form-control"
                  type="text"
                  autocomplete="name"
                  required
                />
              </div>

              <div class="mb-3">
                <label for="email" class="form-label">Email address</label>
                <input
                  id="email"
                  v-model="email"
                  class="form-control"
                  type="email"
                  autocomplete="email"
                  required
                />
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input
                  id="password"
                  v-model="password"
                  class="form-control"
                  type="password"
                  :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
                  :aria-invalid="mode === 'signup' && password.length > 0 && !isPasswordValid"
                  required
                />

                <p
                  v-if="mode === 'signup' && password.length > 0 && !isPasswordValid"
                  class="form-text text-danger"
                  role="alert"
                >
                  Password must be at least 5 characters long and contain at least
                  1 letter and at least 1 number.
                </p>
              </div>

              <button
                class="btn btn-primary w-100"
                type="submit"
                :disabled="mode === 'signup' && !isPasswordValid"
              >
                {{ mode === 'signup' ? 'Create account' : 'Log in' }}
              </button>
            </form>

            <button
              class="btn btn-link w-100 mt-3"
              type="button"
              @click="mode = mode === 'signup' ? 'login' : 'signup'"
            >
              {{
                mode === 'signup'
                  ? 'Already an existing user? Log in'
                  : "Don't have an account? Sign up"
              }}
            </button>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>