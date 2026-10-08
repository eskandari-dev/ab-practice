// progress is kept in the browser only, so it works without an account
const HISTORY_KEY = 'history'
const MISTAKES_KEY = 'mistakes'

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function dayKey(date) {
  return date.toISOString().slice(0, 10)
}

export function addResult(result) {
  const history = read(HISTORY_KEY, [])
  history.push({ ...result, date: new Date().toISOString() })
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-200)))
}

export function getHistory() {
  return read(HISTORY_KEY, [])
}

export function getAllMistakes() {
  return read(MISTAKES_KEY, [])
}

export function getStats() {
  const history = read(HISTORY_KEY, [])
  if (history.length === 0) return null

  const percents = history.map((h) => Math.round((h.score / h.total) * 100))
  const days = new Set(history.map((h) => h.date.slice(0, 10)))

  let streak = 0
  const day = new Date()
  if (!days.has(dayKey(day))) day.setDate(day.getDate() - 1)
  while (days.has(dayKey(day))) {
    streak++
    day.setDate(day.getDate() - 1)
  }

  return {
    exams: history.length,
    best: Math.max(...percents),
    average: Math.round(percents.reduce((a, b) => a + b, 0) / percents.length),
    streak,
  }
}

export function getMistakes(region) {
  return read(MISTAKES_KEY, []).filter((q) => q.region === region)
}

export function updateMistakes(region, wrongQuestions, rightIds) {
  const others = read(MISTAKES_KEY, []).filter((q) => q.region !== region)
  const mine = new Map(getMistakes(region).map((q) => [q.id, q]))
  rightIds.forEach((id) => mine.delete(id))
  wrongQuestions.forEach((q) => mine.set(q.id, { ...q, region }))
  localStorage.setItem(MISTAKES_KEY, JSON.stringify([...others, ...mine.values()]))
}
