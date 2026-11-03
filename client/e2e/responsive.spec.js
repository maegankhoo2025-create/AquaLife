import { expect } from '@playwright/test'
import { signUpFreshUser, test } from './helpers.js'

const API = 'http://localhost:8000'
const NAVBAR_EXPANDS_AT = 992 // Bootstrap's lg breakpoint, used by navbar-expand-lg
const PHONE_SHOP_BELOW = 768 // below this the shop splits its items into pages
const PHONE_HISTORY_BELOW = 768 // below this History is a stacked list instead of a table
const MIN_CARD_PADDING = 8

test.describe.configure({ timeout: 60000 })

// A headed desktop browser takes 15px for its scrollbar, which phones do not, and a
// full-page screenshot then cuts that much off the right of every tall page.
test.use({ headless: true })

const VIEWPORTS = [
  { name: 'iPhone 6 portrait', width: 375, height: 667 },
  { name: 'Mobile portrait', width: 390, height: 844 },
  { name: 'Phone landscape', width: 667, height: 375 },
  { name: 'Tablet portrait', width: 768, height: 1024 },
  { name: 'Tablet landscape', width: 1024, height: 768 },
  { name: 'Desktop XL', width: 1200, height: 800 },
]

const NAV_LINKS = [
  { name: 'Dashboard', url: /\/dashboard\/?$/, heading: /^Welcome back/ },
  { name: 'My Tank', url: /\/main-tank\/?$/, heading: 'My aquarium' },
  { name: 'Shop', url: /\/browse\/?$/, heading: 'Shop' },
  { name: 'Quiz', url: /\/quiz\/?$/, heading: 'Quiz' },
  { name: 'History', url: /\/history\/?$/, heading: 'History' },
  { name: 'Friends', url: /\/friends\/?$/, heading: 'Friends' },
]

function mainLink(page, name) {
  return page.getByRole('main').getByRole('link', { name, exact: true })
}

function mainButton(page, name) {
  return page.getByRole('main').getByRole('button', { name, exact: true })
}

// ready: shows once the page has its data, so overflow is not measured on a half-drawn page.
// actions: the main controls on the page. Disabled ones, like Clean tank at 100% water, are left out.
const PAGES = [
  {
    name: 'Login',
    path: '/login',
    ready: (page) => page.getByRole('heading', { name: 'Log in', level: 1 }),
    actions: (page) => [
      mainButton(page, 'Log in'),
      mainButton(page, "Don't have an account? Sign up"),
    ],
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    ready: (page) => page.getByRole('list', { name: 'Daily care record' }).getByRole('listitem').first(),
    actions: (page) => [
      mainLink(page, 'Open tank'),
      mainLink(page, 'Start quiz'),
      mainLink(page, 'Open'),
      mainLink(page, 'See all'),
    ],
  },
  {
    name: 'My Tank',
    path: '/main-tank',
    ready: (page) => page.getByRole('heading', { name: 'Fish (1)' }),
    actions: (page) => [
      mainButton(page, 'New tank'),
      mainLink(page, 'Shop'),
      mainButton(page, 'Decorate'),
      page.getByRole('button', { name: /^Feed fish/ }),
      page.getByRole('button', { name: /^Check temperature/ }),
      page.getByRole('button', { name: /^Check pH/ }),
      page.getByRole('button', { name: 'Remove Zebra Danio' }),
    ],
  },
  {
    name: 'Shop',
    path: '/browse',
    ready: (page) => page.getByRole('region', { name: 'Shop items' }).getByRole('button').first(),
    actions: (page, viewport) => [
      page.getByLabel('Shopping for'),
      page.getByRole('region', { name: 'Shop items' }).getByRole('button').first(),
      mainButton(page, viewport.width < NAVBAR_EXPANDS_AT ? 'Filters' : 'Clear filters'),
      ...(viewport.width < PHONE_SHOP_BELOW
        ? [page.getByRole('navigation', { name: 'Shop pages' }).getByRole('button', { name: 'Next' })]
        : []),
    ],
  },
  {
    name: 'Quiz',
    path: '/quiz',
    ready: (page) => page.getByRole('heading', { name: 'Day streak' }),
    actions: (page) => [mainLink(page, 'Start quiz')],
  },
  {
    name: 'History',
    path: '/history',
    ready: (page) => page.getByText('1 × Zebra Danio for Tank 1').filter({ visible: true }),
    actions: (page) => ['All', 'Purchases', 'Rewards', 'Refunds', 'Gifts'].map((name) => mainButton(page, name)),
  },
  {
    name: 'Friends',
    path: '/friends',
    ready: (page) => page.getByLabel('Your invitation link'),
    actions: (page) => [
      mainButton(page, 'Refresh friends and inbox'),
      page.getByLabel('Search by name or email'),
      mainButton(page, 'Copy link'),
      mainLink(page, 'WhatsApp'),
      mainLink(page, 'Telegram'),
    ],
  },
  {
    name: 'Profile',
    path: '/profile',
    ready: (page) => page.getByLabel('Profile picture'),
    actions: (page) => [
      page.getByLabel('Profile picture'),
      mainButton(page, 'Save name and email'),
      page.getByRole('switch', { name: 'Reduce motion' }),
    ],
  },
]

function slug(text) {
  return text.toLowerCase().replaceAll(' ', '-')
}

// A real fish fills the pages with content, so the screenshots show more than empty
// states. This goes through the API so no toast is left covering the screenshot.
async function addFishToFirstTank(page) {
  const { tanks } = await (await page.request.get(`${API}/api/tanks`)).json()
  const response = await page.request.post(`${API}/api/game/buy`, {
    data: { itemId: 'zebra-danio', tankId: tanks[0]._id },
  })
  expect(response.status()).toBe(201)
}

async function expectNoHorizontalOverflow(page) {
  const { scrollWidth, innerWidth, offenders } = await page.evaluate(() => {
    function insideScroller(element) {
      for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        if (getComputedStyle(parent).overflowX !== 'visible') return true
      }
      return false
    }
    const tooWide = [...document.querySelectorAll('body *')]
      .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 0.5 && !insideScroller(element))
      .slice(0, 5)
      .map((element) => `<${element.tagName.toLowerCase()} class="${element.getAttribute('class') || ''}">`)
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      offenders: tooWide,
    }
  })
  expect(scrollWidth, `page is ${scrollWidth}px wide in a ${innerWidth}px window. Too wide: ${offenders.join(', ')}`)
    .toBeLessThanOrEqual(innerWidth)
}

// click({ trial: true }) makes every check a real click makes, including that nothing
// is covering the control, but does not click, so the page stays as it was.
async function expectMainActionsUsable(page, pageInfo, viewport) {
  for (const action of pageInfo.actions(page, viewport)) {
    await expect(action).toBeVisible()
    await action.click({ trial: true })
  }
}

async function expectHistoryRowInsideCardPadding(page) {
  const row = page.getByRole('listitem').filter({ hasText: '1 × Zebra Danio for Tank 1' })
  const { left, right } = await row.evaluate((element) => {
    const rowBox = element.getBoundingClientRect()
    const cardBox = element.closest('.al-card').getBoundingClientRect()
    return { left: rowBox.left - cardBox.left, right: cardBox.right - rowBox.right }
  })
  expect(left, 'gap between the card and the left of its row').toBeGreaterThanOrEqual(MIN_CARD_PADDING)
  expect(right, 'gap between the card and the right of its row').toBeGreaterThanOrEqual(MIN_CARD_PADDING)
}

// A wrapped navbar takes two rows of a small screen, on every page.
async function expectCollapsedNavbarOnOneRow(page) {
  const nav = page.getByRole('navigation', { name: 'Main' })
  const brand = await nav.getByRole('link', { name: 'AquaLife' }).boundingBox()
  const toggle = await nav.getByRole('button', { name: 'Toggle menu' }).boundingBox()
  const brandCentre = brand.y + brand.height / 2
  expect(brandCentre, 'the logo and the menu toggle should share a row').toBeGreaterThanOrEqual(toggle.y)
  expect(brandCentre, 'the logo and the menu toggle should share a row').toBeLessThanOrEqual(toggle.y + toggle.height)
}

async function expectNavLinkOpensPage(page, link) {
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: link.name, exact: true }).click()
  await expect(page).toHaveURL(link.url)
  await expect(page.getByRole('heading', { name: link.heading, level: 1 })).toBeVisible()
}

async function expectCollapsedNavbarWorks(page) {
  const nav = page.getByRole('navigation', { name: 'Main' })
  const toggle = nav.getByRole('button', { name: 'Toggle menu' })

  for (const link of NAV_LINKS) {
    await expect(toggle).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(nav.getByRole('link', { name: link.name, exact: true })).toBeHidden()

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    for (const { name } of NAV_LINKS) {
      await expect(nav.getByRole('link', { name, exact: true })).toBeVisible()
    }

    await expectNavLinkOpensPage(page, link)
  }
}

async function expectExpandedNavbarWorks(page) {
  const nav = page.getByRole('navigation', { name: 'Main' })
  await expect(nav.getByRole('button', { name: 'Toggle menu' })).toBeHidden()

  for (const { name } of NAV_LINKS) {
    await expect(nav.getByRole('link', { name, exact: true })).toBeVisible()
  }
  for (const link of NAV_LINKS) {
    await expectNavLinkOpensPage(page, link)
    await expect(nav.getByRole('button', { name: 'Toggle menu' })).toBeHidden()
  }
}

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const pageInfo of PAGES) {
      test(`${pageInfo.name} on ${viewport.name} has no overflow, usable buttons and working navigation`, async ({ page }) => {
        await signUpFreshUser(page)
        await addFishToFirstTank(page)
        await page.goto(pageInfo.path)
        await expect(pageInfo.ready(page)).toBeVisible()

        // The screenshot comes first, so a person can still see a page that fails a check.
        await page.screenshot({
          path: `test-results/responsive/${slug(pageInfo.name)}-${slug(viewport.name)}.png`,
          fullPage: true,
          // The Vue DevTools button only exists on the dev server and floats over the page.
          style: '#__vue-devtools-container__ { display: none !important; }',
        })

        await expectNoHorizontalOverflow(page)
        await expectMainActionsUsable(page, pageInfo, viewport)

        if (pageInfo.name === 'History' && viewport.width < PHONE_HISTORY_BELOW) {
          await expectHistoryRowInsideCardPadding(page)
        }

        // The login page has no navbar, because nobody needs one before logging in.
        if (pageInfo.name === 'Login') {
          await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0)
        } else if (viewport.width < NAVBAR_EXPANDS_AT) {
          await expectCollapsedNavbarOnOneRow(page)
          await expectCollapsedNavbarWorks(page)
        } else {
          await expectExpandedNavbarWorks(page)
        }
      })
    }
  })
}
