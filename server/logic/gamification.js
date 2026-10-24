// Pearls, XP, levels, daily tasks, streaks and achievements.
// Server copy of the rules in client/src/stores/game.js.

const XP_PER_LEVEL = 200
const QUIZ_STREAK_BONUSES = { 5: 5, 10: 10, 20: 20, 40: 40, 80: 80 }
const FISH_BADGES = [
  { count: 1, name: 'First Fin' },
  { count: 5, name: 'Growing School' },
  { count: 10, name: 'Big School' },
  { count: 25, name: 'Aquarium Keeper' },
]
const STREAK_BADGES = [
  { count: 1, name: 'First Day' },
  { count: 3, name: 'Three-Day Streak' },
  { count: 5, name: 'Five-Day Streak' },
  { count: 10, name: 'Ten-Day Streak' },
  { count: 20, name: 'Twenty-Day Streak' },
]

const DAILY_TASKS = [
  { id: 'feed', label: 'Feed your fish', reward: 10 },
  { id: 'clean', label: 'Start a partial water change', reward: 20 },
  { id: 'temp', label: 'Check temperature', reward: 10 },
  { id: 'ph', label: 'Check pH', reward: 10 },
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

// Daily tasks already rewarded today (an old day's list counts as empty).
function tasksDoneToday(user) {
  return user.tasks.day === dayKey() ? user.tasks.done : []
}

// The streak only survives if the last quiz was today or yesterday.
function currentStreak(user) {
  const last = user.quiz.lastDay
  return last === dayKey() || last === yesterdayKey() ? user.quiz.streak : 0
}


function progressBadge(id, icon, name, progress, target) {
  return {
    id,
    icon,
    name,
    earned: progress >= target,
    progress: Math.min(progress, target),
    target,
  }
}

// Dead fish (health 0) stay in the tank but do not count towards achievements.
function achievements(user, tanks, friendCount = 0) {
  const livingFish = tanks.flatMap((tank) => tank.fish.filter((fish) => fish.health > 0))
  const fishCount = livingFish.length

  const badges = FISH_BADGES.map((badge) =>
    progressBadge(`fish-${badge.count}`, 'fish', badge.name, fishCount, badge.count),
  )
  for (const badge of STREAK_BADGES) {
    badges.push(progressBadge(
      `streak-${badge.count}`,
      'flame',
      badge.name,
      currentStreak(user),
      badge.count,
    ))
  }
  badges.push(progressBadge('friends-5', 'user', 'Connected with 5 friends', friendCount, 5))
  return badges
}

module.exports = {
  DAILY_TASKS,
  QUIZ_STREAK_BONUSES,
  dayKey,
  yesterdayKey,
  levelInfo,
  tasksDoneToday,
  currentStreak,
  achievements,
}
