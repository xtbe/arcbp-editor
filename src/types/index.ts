export interface RecipeItem {
  item: string
  quantity: number
}

export interface Blueprint {
  id?: string        // PocketBase record id; absent on unsaved/local-only records
  name: string
  workshop: string
  image: string
  crafting_recipe: RecipeItem[]
  available: boolean
  loot: boolean
  harvester_event: boolean
  quest_reward: boolean
  trials_reward: boolean
}

export interface BlueprintsData {
  blueprints: Blueprint[]
}

export type StatusType = 'ok' | 'warn' | 'err' | 'info'

export interface StatusMessage {
  type: StatusType
  text: string
}

export type FilterAvailability = 'all' | 'available' | 'unavailable'
