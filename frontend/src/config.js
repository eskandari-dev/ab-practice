import { useEffect, useState } from 'react'
import { api } from './api.js'

const OFFLINE = { firebase: null, payments: false, support_email: '' }
let configPromise = null

// public site settings from the server, loaded once per visit
export function getConfig() {
  if (!configPromise) {
    configPromise = api('/config').catch(() => {
      configPromise = null
      return OFFLINE
    })
  }
  return configPromise
}

export function useConfig() {
  const [config, setConfig] = useState(null)
  useEffect(() => {
    let cancelled = false
    getConfig().then((data) => {
      if (!cancelled) setConfig(data)
    })
    return () => {
      cancelled = true
    }
  }, [])
  return config
}
