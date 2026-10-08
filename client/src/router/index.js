// Bring in two tools from the Vue Router library:
// - createRouter: builds the "map" of pages in the app
// - createWebHistory: makes the browser's address bar and back button work normally
import { createRouter, createWebHistory } from 'vue-router'

// Bring in LoginApi, our helper for talking to the backend server
import LoginApi from '../LoginApi'

// Bring in each page (screen) of the app so the router can show them
import LoginPage from '../views/LoginPage.vue'   // the login screen
import MainTank from '../views/MainTank.vue'     // the main tank screen
import BrowsePage from '../views/BrowsePage.vue' // the browse screen
import History from '../views/History.vue'       // the history screen
import Quiz from '../views/Quiz.vue'             // the quiz screen
import Profile from '../views/Profile.vue'       // the profile screen

// Build the router: the "map" that says which address shows which page
const router = createRouter({
  // Use normal-looking web addresses, like /quiz instead of /#/quiz
  history: createWebHistory(import.meta.env.BASE_URL),

  // The list of all pages in the app
  routes: [
    {
      path: '/login',        // the address typed in the browser
      name: 'login',         // a nickname, so other code can say "go to login"
      component: LoginPage,  // the page to show at this address
      // No "meta" label here, so anyone can visit the login page
    },
    {
      path: '/',                // the home address (just the website name)
      redirect: '/main-tank',   // don't show anything here, jump to /main-tank instead
    },
    {
      path: '/main-tank',
      name: 'main-tank',
      component: MainTank,
      meta: { requiresAuth: true }, // label: you must be logged in to see this page
    },
    {
      path: '/browse',
      name: 'browse',
      component: BrowsePage,
      meta: { requiresAuth: true }, // label: login required
    },
    {
      path: '/history',
      name: 'history',
      component: History,
      meta: { requiresAuth: true }, // label: login required
    },
    {
      path: '/quiz',
      name: 'quiz',
      component: Quiz,
      meta: { requiresAuth: true }, // label: login required
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
      meta: { requiresAuth: true }, // label: login required
    },
  ],
})

// The "security guard": this runs EVERY time the user tries to open a page.
// "to" is the page they are trying to go to.
// "async" means this code is allowed to wait for the server to reply.
router.beforeEach(async (to) => {

  // If the page does NOT have the "requiresAuth" label...
  if (!to.meta.requiresAuth) {
    return true // ...let them in, no questions asked
  }

  // Otherwise, the page needs a login, so check with the server.
  // "try" means: attempt this, and if something breaks, jump to "catch" below.
  try {
    // Ask the server: "Is this user logged in?" and wait for the answer
    const response = await LoginApi.get('/auth/session')

    // If the server says yes, they are logged in...
    if (response.data.loggedIn) {
      return true // ...let them into the page
    }

    // If the server says no, send them to the login page instead
    return { name: 'login' }

  } catch (error) {
    // Something went wrong (e.g. the server is off or unreachable).
    // Print the problem in the browser's developer console for debugging...
    console.error('Unable to check the login session:', error)

    // ...and cancel the page change, so the user stays where they were
    return false
  }
})

// Share this router so the rest of the app (main.js) can use it
export default router