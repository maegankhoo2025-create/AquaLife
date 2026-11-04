import { expect } from '@playwright/test'
import { signUpFreshUser, test } from './helpers.js'
import { ZEBRA_DANIO } from './products.js'
import { buyItem } from './shop-helpers.js'

test.describe.configure({ timeout: 180_000 })

// A headed desktop browser takes 15px for its scrollbar, which phones do not.
test.use({ headless: true })

// iPhone 6, then the smallest width of each Bootstrap breakpoint.
const VIEWPORTS = [
  { name: 'iPhone 6', width: 375, height: 667 },
  { name: 'sm', width: 576, height: 800 },
  { name: 'md', width: 768, height: 800 },
  { name: 'lg', width: 992, height: 800 },
  { name: 'xl', width: 1200, height: 800 },
]

// ready: shows once the page has its data, so overflow is not measured on a half-drawn page.
const LOGIN_PAGE = {
  name: 'Login',
  path: '/login',
  ready: (page) => page.getByRole('heading', { name: 'Log in', level: 1 }),
}

const LOGGED_IN_PAGES = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    ready: (page) => page.getByRole('list', { name: 'Daily care record' }).getByRole('listitem').first(),
  },
  {
    name: 'My Tank',
    path: '/main-tank',
    ready: (page) => page.getByRole('heading', { name: 'Fish (1)' }),
  },
  {
    name: 'Shop',
    path: '/browse',
    ready: (page) => page.getByRole('region', { name: 'Shop items' }).getByRole('button').first(),
  },
  {
    name: 'Quiz',
    path: '/quiz',
    ready: (page) => page.getByRole('heading', { name: 'Day streak' }),
  },
  {
    name: 'History',
    path: '/history',
    ready: (page) => page.getByText(`1 × ${ZEBRA_DANIO.name} for Tank 1`).filter({ visible: true }),
  },
  {
    name: 'Friends',
    path: '/friends',
    ready: (page) => page.getByLabel('Your invitation link'),
  },
  {
    name: 'Profile',
    path: '/profile',
    ready: (page) => page.getByLabel('Profile picture'),
  },
]

async function measureOverflow(page) {
  return page.evaluate(async () => {
    // Two frames, so the layout has caught up with the resize.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    // Anything inside its own scrolling area does not widen the page.
    function insideScroller(element) {
      for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        if (getComputedStyle(parent).overflowX !== 'visible') return true
      }
      return false
    }
    const offenders = [...document.querySelectorAll('body *')]
      .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 0.5 && !insideScroller(element))
      .slice(0, 5)
      .map((element) => `<${element.tagName.toLowerCase()} class="${element.getAttribute('class') || ''}">`)
    return { scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, offenders }
  })
}

// Soft checks, so one bad page still reports every other page and width.
async function expectNoOverflowAtAnyWidth(page, pageInfo) {
  await page.goto(pageInfo.path)

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await expect(pageInfo.ready(page)).toBeVisible()

    const { scrollWidth, innerWidth, offenders } = await measureOverflow(page)
    expect.soft(
      scrollWidth,
      `${pageInfo.name} at ${viewport.name} is ${scrollWidth}px wide in a ${innerWidth}px window. Too wide: ${offenders.join(', ')}`,
    ).toBeLessThanOrEqual(innerWidth)
  }
}

test('no page scrolls sideways on an iPhone 6 or at any Bootstrap breakpoint', async ({ page }) => {
  await expectNoOverflowAtAnyWidth(page, LOGIN_PAGE)

  await signUpFreshUser(page)
  // A real fish fills the pages with content, so they are not measured as empty states.
  await buyItem(page, ZEBRA_DANIO)

  for (const pageInfo of LOGGED_IN_PAGES) {
    await expectNoOverflowAtAnyWidth(page, pageInfo)
  }
})
