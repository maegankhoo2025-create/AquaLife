// Pearls, XP, levels, daily tasks, streaks and achievements.
// Server copy of the rules in client/src/stores/game.js.

const Transaction = require('../models/Transaction')
const { getSpecies } = require('../data/species')

const XP_PER_LEVEL = 200

const DAILY_TASKS = [
  { id: 'feed', label: 'Feed your fish', reward: 5 },
  { id: 'clean', label: 'Clean the tank', reward: 10 },
  { id: 'temp', label: 'Adjust the temperature', reward: 5 },
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

// Adds (or with a negative amount, takes) pearls and XP, saves the user and
// writes the change to the history.
async function changePearls(user, { type, label, amount, xp = 0 }) {
  user.pearls += amount
  user.xp += xp
  await user.save()
  await Transaction.create({ user: user._id, type, label, amount })
}

// Dead fish (health 0) stay in the tank but do not count towards achievements.
function achievements(user, tanks) {
  const livingFish = tanks.flatMap((tank) => tank.fish.filter((fish) => fish.health > 0))
  const fishCount = livingFish.length
  const fullyGrown = livingFish.some((fish) => {
    const species = getSpecies(fish.speciesId)
    return species && fish.size >= species.size
  })

  return [
    { id: 'first-fish', emoji: '🐟', name: 'First fish', earned: fishCount >= 1 },
    { id: 'school', emoji: '🐠', name: 'School of 10', earned: fishCount >= 10 },
    { id: 'fully-grown', emoji: '🐋', name: 'Fully grown', earned: fullyGrown },
    { id: 'streak', emoji: '🔥', name: '3-day quiz streak', earned: currentStreak(user) >= 3 },
    { id: 'saver', emoji: '💎', name: '500 pearls saved', earned: user.pearls >= 500 },
    {
      id: 'carer',
      emoji: '🧽',
      name: 'All tasks done today',
      earned: tasksDoneToday(user).length === DAILY_TASKS.length,
    },
  ]
}

module.exports = {
  DAILY_TASKS,
  dayKey,
  yesterdayKey,
  levelInfo,
  tasksDoneToday,
  currentStreak,
  changePearls,
  achievements,
}
