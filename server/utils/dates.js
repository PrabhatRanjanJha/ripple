const msPerDay = 24 * 60 * 60 * 1000

// turn 'YYYY-MM-DD' into a UTC date
const parseDay = (text) => {
    const [year, month, day] = text.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day))
}

const addDays = (date, days) => new Date(date.getTime() + days * msPerDay)

// turn a date back into 'YYYY-MM-DD'
const formatDay = (date) => date.toISOString().slice(0, 10)

// whole days from a to b, negative when b is earlier
const daysBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / msPerDay)

export { parseDay, addDays, formatDay, daysBetween }