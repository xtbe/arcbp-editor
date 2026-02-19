/**
 * Typed API layer for the `blueprints` PocketBase collection.
 *
 * PocketBase collection schema (create once via the Admin UI or migrations):
 *   Collection name : blueprints
 *   Fields:
 *     name             Text
 *     workshop         Text
 *     image            Text (URL or base64 data URI)
 *     crafting_recipe  JSON
 *     available        Bool
 *     loot             Bool
 *     harvester_event  Bool
 *     quest_reward     Bool
 *     trials_reward    Bool
 */

import { pb } from './pb'
import type { Blueprint } from '../types'

const COLLECTION = 'blueprints'

// ── Helpers ────────────────────────────────────────────────────────────────

/** Strip PocketBase meta-fields and map a record to our Blueprint type. */
function recordToBlueprint(r: Record<string, unknown>): Blueprint {
  return {
    id: String(r['id'] ?? ''),
    name: String(r['name'] ?? ''),
    workshop: String(r['workshop'] ?? ''),
    image: String(r['image'] ?? ''),
    crafting_recipe: Array.isArray(r['crafting_recipe']) ? r['crafting_recipe'] : [],
    available: Boolean(r['available']),
    loot: Boolean(r['loot']),
    harvester_event: Boolean(r['harvester_event']),
    quest_reward: Boolean(r['quest_reward']),
    trials_reward: Boolean(r['trials_reward']),
  }
}

/** Map our Blueprint type to the plain body PocketBase expects. */
function blueprintToBody(bp: Omit<Blueprint, 'id'>): Record<string, unknown> {
  return {
    name: bp.name,
    workshop: bp.workshop,
    image: bp.image,
    crafting_recipe: bp.crafting_recipe,
    available: bp.available,
    loot: bp.loot,
    harvester_event: bp.harvester_event,
    quest_reward: bp.quest_reward,
    trials_reward: bp.trials_reward,
  }
}

// ── CRUD ───────────────────────────────────────────────────────────────────

/** Fetch all blueprints. batch:200 stays within PocketBase v0.36's perPage limit. */
export async function fetchBlueprints(): Promise<Blueprint[]> {
  const result = await pb.collection(COLLECTION).getFullList({ batch: 200 })
  return result.map((r) => recordToBlueprint(r as unknown as Record<string, unknown>))
}

/** Create a new blueprint record and return it (with its new id). */
export async function createBlueprint(bp: Omit<Blueprint, 'id'>): Promise<Blueprint> {
  const record = await pb.collection(COLLECTION).create(blueprintToBody(bp))
  return recordToBlueprint(record as unknown as Record<string, unknown>)
}

/** Patch specific fields on an existing blueprint. */
export async function updateBlueprint(id: string, updates: Partial<Omit<Blueprint, 'id'>>): Promise<Blueprint> {
  const record = await pb.collection(COLLECTION).update(id, updates as Record<string, unknown>)
  return recordToBlueprint(record as unknown as Record<string, unknown>)
}

/** Delete a blueprint by id. */
export async function deleteBlueprint(id: string): Promise<void> {
  await pb.collection(COLLECTION).delete(id)
}

/**
 * Bulk-import: deletes everything in the collection, then creates all
 * supplied blueprints. Used for "Load JSON file" / "Paste JSON" / "Reset".
 * Returns the freshly created blueprints with their new PocketBase ids.
 */
export async function replaceAllBlueprints(blueprints: Omit<Blueprint, 'id'>[]): Promise<Blueprint[]> {
  // 1. Delete all existing records
  const existing = await pb.collection(COLLECTION).getFullList({ fields: 'id', batch: 200 })
  await Promise.all(existing.map((r) => pb.collection(COLLECTION).delete(r.id)))

  // 2. Create all new records sequentially to preserve order
  const created: Blueprint[] = []
  for (const bp of blueprints) {
    created.push(await createBlueprint(bp))
  }
  return created
}
