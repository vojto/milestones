import { useEffect, useState } from "react"
import { todayKey, type DayKey } from "../dates/day"

// Today, as something a component can render and trust. An app whose whole
// subject is "how far has this got by now" cannot read the date once at
// startup: leave it open overnight and every unfinished milestone would stop a
// day short. So the day is state, rechecked on the minute and whenever the
// window comes back — both cheap, and between them they cover the two ways a
// session survives midnight (left running, or slept and woken).
//
// Actions read todayKey() directly instead; a click is its own moment and
// needs no subscription.
export function useToday(): DayKey {
  const [day, setDay] = useState(todayKey)

  useEffect(() => {
    const check = () => {
      setDay(todayKey())
    }
    const interval = setInterval(check, 60_000)
    window.addEventListener("focus", check)
    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", check)
    }
  }, [])

  return day
}
