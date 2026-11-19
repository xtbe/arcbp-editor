/**
 * storage.ts — JSON export / import helpers.
 *
 * localStorage persistence has been removed in favour of PocketBase.
 * These utilities remain to support the "Download JSON" and "Load JSON file"
 * features that let users keep offline backups.
 */

import type { BlueprintsData } from '../types'

/** Serialise the current dataset to a pretty-printed JSON string. */
export function toJsonString(data: BlueprintsData): string {
  // Strip PocketBase ids before exporting so the file is portable
  const portable: BlueprintsData = {
    blueprints: data.blueprints.map(({ id: _id, ...rest }) => rest),
  }
  return JSON.stringify(portable, null, 2)
}

/** Trigger a browser download of the current dataset as blueprints.json. */
export function downloadJson(data: BlueprintsData): void {
  const blob = new Blob([toJsonString(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'blueprints.json'
  a.click()
  URL.revokeObjectURL(url)
}
