import type { Blueprint, BlueprintsData, FilterAvailability, RecipeItem } from '../types'
import { clampInt } from './utils'

export function ensureShape(obj: unknown): BlueprintsData {
  if (!obj || typeof obj !== 'object') throw new Error('Root must be an object')
  const root = obj as Record<string, unknown>
  if (!Array.isArray(root.blueprints)) root.blueprints = []
  const blueprints = (root.blueprints as unknown[]).map((bp: unknown): Blueprint => {
    const b = (bp && typeof bp === 'object' ? bp : {}) as Record<string, unknown>
    const crafting_recipe: RecipeItem[] = Array.isArray(b.crafting_recipe)
      ? (b.crafting_recipe as unknown[]).map((r: unknown): RecipeItem => {
          const rr = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>
          return {
            item: String(rr.item ?? ''),
            quantity: clampInt(rr.quantity ?? 0, 0),
          }
        })
      : []
    return {
      ...(b.id ? { id: String(b.id) } : {}),
      name: String(b.name ?? ''),
      workshop: String(b.workshop ?? ''),
      image: String(b.image ?? ''),
      crafting_recipe,
      available: !!b.available,
      loot: !!b.loot,
      harvester_event: !!b.harvester_event,
      quest_reward: !!b.quest_reward,
      trials_reward: !!b.trials_reward,
    }
  })
  return { blueprints }
}

export function getFilteredIndices(
  blueprints: Blueprint[],
  search: string,
  filterAvailability: FilterAvailability,
): number[] {
  const q = search.trim().toLowerCase()
  return blueprints
    .map((bp, idx) => ({ bp, idx }))
    .filter(({ bp }) => {
      const hay = `${bp.name} ${bp.workshop}`.toLowerCase()
      const matchQ = !q || hay.includes(q)
      const matchAvail =
        filterAvailability === 'all' ||
        (filterAvailability === 'available' && bp.available) ||
        (filterAvailability === 'unavailable' && !bp.available)
      return matchQ && matchAvail
    })
    .map((x) => x.idx)
}
