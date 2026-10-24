// Pearls, XP, levels, daily tasks, streaks and achievements.
// Server copy of the rules in client/src/stores/game.js.

const XP_PER_LEVEL = 200

// Extra pearls for reaching each quiz streak (days in a row).
// The steps get further apart: 3 days, 5 days, one week, 10 days, two weeks, three weeks, a month.
const QUIZ_STREAK_BONUSES = { 3: 15, 5: 25, 7: 40, 10: 60, 14: 80, 21: 120, 30: 200 }

// Every badge has five tiers. Reaching a higher target upgrades the same badge.
const TIER_NAMES = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']

// Each badge: what it counts, and the five targets with a title for each tier.
const BADGES = [
  {
    id: 'fish', icon: 'fish', name: 'Fish Keeper', unit: 'living fish',
    tiers: [
      { target: 1, title: 'First Fin' },
      { target: 5, title: 'Growing School' },
      { target: 10, title: 'Big School' },
      { target: 25, title: 'Aquarium Keeper' },
      { target: 50, title: 'Reef Master' },
    ],
  },
  {
    id: 'streak', icon: 'flame', name: 'Quiz Streak', unit: 'days in a row (best)',
    tiers: [
      { target: 3, title: 'Warming Up' },
      { target: 7, title: 'One Week Strong' },
      { target: 14, title: 'Two Week Wave' },
      { target: 21, title: 'Steady Current' },
      { target: 30, title: 'Monthly Legend' },
    ],
  },
  {
    id: 'scholar', icon: 'book', name: 'Fish Scholar', unit: 'correct quiz answers',
    tiers: [
      { target: 5, title: 'Curious Minnow' },
      { target: 25, title: 'Keen Learner' },
      { target: 75, title: 'Fish Expert' },
      { target: 150, title: 'Aqua Professor' },
      { target: 300, title: 'Ocean Sage' },
    ],
  },
  {
    id: 'friends', icon: 'user', name: 'Social Fish', unit: 'friends',
    tiers: [
      { target: 1, title: 'New Buddy' },
      { target: 3, title: 'Small Pod' },
      { target: 5, title: 'Friendly Shoal' },
      { target: 10, title: 'Big Shoal' },
      { target: 20, title: 'Ocean Community' },
    ],
  },
]

const DAILY_TASKS = [
  { id: 'feed', label: 'Feed your fish', reward: 20 },
  { id: 'clean', label: 'Clean the tank', reward: 30 },
  { id: 'temp', label: 'Check temperature', reward: 15 },
  { id: 'ph', label: 'Check pH', reward: 15 },
]

// Days are counted in Singapore time, so "today" is the same for everyone
// whatever time zone the server runs in. Returns YYYY-MM-DD.
function dayKey(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
}

function yesterdayKey() {
  return dayKey(new Date(Date.now() - 24 * 60 * 60 * 1000))
}

function levelInfo(xp) {
  return {
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    xpInLevel: xp % XP_PER_LEVEL,
    xpPerLevel: XP_PER_LEVEL,
  }
}

// Daily tasks already rewarded today, as "taskId:tankId" (an old day's list counts as empty).
function tasksDoneToday(user) {
  return user.tasks.day === dayKey() ? user.tasks.done : []
}

// The streak only survives if the last quiz was today or yesterday.
function currentStreak(user) {
  const last = user.quiz.lastDay
  return last === dayKey() || last === yesterdayKey() ? user.quiz.streak : 0
}


// The longest quiz streak ever reached, so streak badges are kept after a missed day.
function bestStreak(user) {
  return Math.max(user.quiz.bestStreak || 0, currentStreak(user))
}

// Works out which tier of one badge has been reached.
// tier is 0 (not earned yet) up to 5 (Diamond).
function tieredBadge(badge, progress) {
  let tier = 0
  for (const step of badge.tiers) {
    if (progress >= step.target) tier += 1
  }
  const current = tier > 0 ? badge.tiers[tier - 1] : null
  const next = tier < badge.tiers.length ? badge.tiers[tier] : null
  return {
    id: badge.id,
    icon: badge.icon,
    name: badge.name,
    unit: badge.unit,
    progress,
    tier,
    tierName: current ? TIER_NAMES[tier - 1] : 'Locked',
    title: current ? current.title : badge.tiers[0].title,
    earned: tier > 0,
    nextTarget: next ? next.target : null,
    nextTierName: next ? TIER_NAMES[tier] : null,
    tiers: badge.tiers.map((step, index) => ({ ...step, name: TIER_NAMES[index] })),
  }
}

// Dead fish (health 0) stay in the tank but do not count towards achievements.
function achievements(user, tanks, friendCount = 0) {
  const fishCount = tanks.flatMap((tank) => tank.fish.filter((fish) => fish.health > 0)).length
  const correctAnswers = user.quiz.scores.reduce((sum, entry) => sum + (entry.score || 0), 0)
  const progress = {
    fish: fishCount,
    streak: bestStreak(user),
    scholar: correctAnswers,
    friends: friendCount,
  }
  return BADGES.map((badge) => tieredBadge(badge, progress[badge.id]))
}

module.exports = {
  DAILY_TASKS,
  QUIZ_STREAK_BONUSES,
  dayKey,
  yesterdayKey,
  levelInfo,
  tasksDoneToday,
  currentStreak,
  bestStreak,
  achievements,
}
