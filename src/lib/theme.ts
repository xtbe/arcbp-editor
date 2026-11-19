import { useState, useEffect } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'arcbp-theme'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.classList.toggle('light', resolved === 'light')
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    return stored ?? 'system'
  })

  const resolved: 'light' | 'dark' = mode === 'system' ? getSystemTheme() : mode

  // Apply class to <html> whenever resolved theme changes
  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  // When in system mode, keep in sync with OS changes
  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  function toggleTheme() {
    // Toggle between light and dark; if we were in system mode, commit to
    // the explicit opposite of what's currently shown.
    const next: ThemeMode = resolved === 'dark' ? 'light' : 'dark'
    setMode(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  return { mode, resolved, toggleTheme }
}
