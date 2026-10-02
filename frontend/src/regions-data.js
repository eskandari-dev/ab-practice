import { useEffect, useState } from 'react'
import { api } from './api.js'

let cache = null

export function refreshRegions() {
  cache = null
}

// rules and question counts for every region, from GET /regions
export function useRegions() {
  const [data, setData] = useState(cache)

  useEffect(() => {
    if (cache) return
    api('/regions')
      .then((d) => {
        cache = d
        setData(d)
      })
      .catch(() => {})
  }, [])

  return data
}

export function isReady(regions, region) {
  if (!regions) return Boolean(region.ready)
  return (regions[region.id]?.available ?? 0) > 0
}

// only allow paths inside this site after login
export function safeNext(next, fallback) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}

export function fill(text, n) {
  return text.replace('{n}', n)
}
