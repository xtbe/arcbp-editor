import type { BlueprintsData } from '../types'
import { ensureShape } from './dataUtils'

const STORAGE_KEY = 'blueprints_editor_v3_paging'

export function saveToStorage(data: BlueprintsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Silently fail; caller handles status display
  }
}

export function loadFromStorage(): BlueprintsData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return ensureShape(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}
