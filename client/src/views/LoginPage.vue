<script setup>
import { computed, ref } from 'vue'
import LoginApi from '../LoginApi'
import { useRoute, useRouter } from 'vue-router'
import AquaLogo from '../components/AquaLogo.vue'
// This lets this page tell Vue Router to open a different page.
const router = useRouter()
const route = useRoute()

const message = ref('')
const messageIsError = ref(false)
const isSubmitting = ref(false)

const mode = ref('login')
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


async function handleSubmit() {
  message.value = ''
  isSubmitting.value = true

  try {
    let response

    if (mode.value === 'signup') {
      response = await LoginApi.post('/auth/signup', {
        name: name.value,
        email: email.value,
        password: password.value,
      })
    } else {
      response = await LoginApi.post('/auth/login', {
        email: email.value,
        password: password.value,
      })
    }

    message.value = response.data.message
    messageIsError.value = !response.data.user

    if (response.data.user) {
      await router.push(typeof route.query.invite === 'string'
        ? { name: 'friends', query: { invite: route.query.invite } }
        : { name: 'dashboard' })
    }
  } catch (error) {
    console.error('Unable to contact the server:', error)
    message.value = 'Unable to contact the server. Please try again.'
    messageIsError.value = true
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <!--
    Split screen: tank artwork on the left, form on the right.
    Below the lg breakpoint the two columns stack, so the artwork becomes a banner on top.
  -->
  <main class="container-fluid">
    <div class="row login">
      <div class="col-12 col-lg-6 login__art">
        <!-- Bubbles drift up behind the logo (switched off by Reduce motion) -->
        <span v-for="n in 6" :key="n" class="login__bubble" :class="`login__bubble--${n}`" aria-hidden="true"></span>
        <AquaLogo class="login__icon" :size="120" />
        <p class="login__brand mb-0">AquaLife</p>
        <p class="login__tagline mb-0">Learn fish care by keeping a virtual aquarium.</p>
      </div>

      <div class="col-12 col-lg-6 login__form">
        <section class="al-card login__card">
          <h1 class="h3 mb-4">
            {{ mode === 'signup' ? 'Sign up' : 'Log in' }}
          </h1>

          <form @submit.prevent="handleSubmit">
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
                class="form-text login__hint"
                role="alert"
              >
                Use at least 5 characters, including at least 1 letter and 1 number.
              </p>
            </div>

            <button
              class="btn btn-aqua w-100"
              type="submit"
              :disabled="isSubmitting || (mode === 'signup' && !isPasswordValid)"
            >
              {{ mode === 'signup' ? 'Create account' : 'Log in' }}
            </button>
          </form>

          <p
            v-if="message"
            class="alert mt-3 mb-0"
            :class="messageIsError ? 'alert-danger' : 'alert-success'"
            role="alert"
          >
            {{ message }}
          </p>

          <button
            class="btn btn-link w-100 mt-3"
            type="button"
            @click="mode = mode === 'signup' ? 'login' : 'signup'"
          >
            {{
              mode === 'signup'
                ? 'Already have an account? Log in'
                : "Don't have an account? Sign up"
            }}
          </button>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* From lg the two halves sit side by side and fill the whole screen height */
@media (min-width: 992px) {
  .login {
    min-height: 100dvh;
  }
}

.login__art {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  /* Banner height on phones and tablets; the lg rule above stretches it on desktop */
  min-height: clamp(150px, 30vh, 260px);
  padding: 1.5rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  /* Light from the surface fading into deep water */
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--al-aqua) 22%, transparent), transparent),
    linear-gradient(180deg, var(--al-surface-2), var(--al-bg));
}

.login__icon {
  position: relative; /* stays in front of the bubbles */
  filter: drop-shadow(0 8px 24px rgb(79 216 224 / 35%));
  animation: login-float 4s ease-in-out infinite;
}

.login__brand,
.login__tagline {
  position: relative;
}

.login__bubble {
  position: absolute;
  bottom: -40px;
  border: 2px solid color-mix(in srgb, var(--al-aqua) 55%, transparent);
  border-radius: 50%;
  animation: login-rise 9s linear infinite;
}

/* Each bubble has its own position, size and start time */
.login__bubble--1 { left: 12%; width: 14px; height: 14px; animation-delay: 0s; }
.login__bubble--2 { left: 28%; width: 24px; height: 24px; animation-delay: 3s; }
.login__bubble--3 { left: 45%; width: 10px; height: 10px; animation-delay: 6s; }
.login__bubble--4 { left: 62%; width: 18px; height: 18px; animation-delay: 1.5s; }
.login__bubble--5 { left: 78%; width: 12px; height: 12px; animation-delay: 4.5s; }
.login__bubble--6 { left: 90%; width: 20px; height: 20px; animation-delay: 7.5s; }

@keyframes login-rise {
  from { transform: translateY(0); opacity: 0; }
  10% { opacity: 1; }
  to { transform: translateY(-110vh); opacity: 0; }
}

@keyframes login-float {
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50% { transform: translateY(-8px) rotate(3deg); }
}

.login__brand {
  font-size: clamp(1.8rem, 1.3rem + 2.5vw, 3rem);
  font-weight: 900;
  color: var(--al-aqua);
}

.login__tagline {
  color: var(--al-text);
}

.login__form {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 4vw, 3rem);
}

.login__card {
  width: min(100%, 440px);
}

.login__hint {
  color: var(--al-bad);
}
</style>
