import { useEffect, useState } from 'react'

export function useCountdown(endTime: string) {
  const compute = () => {
    const diff = new Date(endTime).getTime() - Date.now()
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, done: true }
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return { hours, minutes, seconds, done: false }
  }

  const [time, setTime] = useState(compute)

  useEffect(() => {
    const id = setInterval(() => setTime(compute()), 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTime])

  return time
}

export function useFlashSaleEnd() {
  // Flash sale ends at the top of the next hour
  const [end, setEnd] = useState(() => {
    const d = new Date()
    d.setHours(d.getHours() + 8, 0, 0, 0)
    return d.toISOString()
  })
  return end
}