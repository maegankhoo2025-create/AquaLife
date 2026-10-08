<script setup>
// ref stores values that can change and appear on the page.
import { ref } from 'vue'

// useRouter lets this component navigate to the login page.
import { useRouter } from 'vue-router'

// LoginApi sends requests to the backend and includes the session cookie.
import LoginApi from '../LoginApi'

const router = useRouter()
const isLoggingOut = ref(false)
const logoutMessage = ref('')

async function logOut() {
  logoutMessage.value = ''
  isLoggingOut.value = true

  try {
    // Ask the backend to end this browser's login session.
    const response = await LoginApi.post('/auth/logout')

    // The backend sends this message when it successfully ends the session.
    if (response.data.message !== 'Logged out successfully.') {
      logoutMessage.value = response.data.message || 'Unable to log out. Please try again.'
      return
    }

    // Go to the login page after the backend confirms logout.
    await router.push({ name: 'login' })
  } catch (error) {
    // Show a message if the request could not reach the backend.
    console.error('Unable to log out:', error)
    logoutMessage.value = 'Unable to log out. Please try again.'
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <div>
    <button
      class="btn btn-outline-secondary"
      type="button"
      :disabled="isLoggingOut"
      @click="logOut"
    >
      {{ isLoggingOut ? 'Logging out...' : 'Log out' }}
    </button>

    <p v-if="logoutMessage" class="alert alert-danger mt-3 mb-0" role="alert">
      {{ logoutMessage }}
    </p>
  </div>
</template>