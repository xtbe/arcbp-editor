import type { RecipeItem } from '../types'
import { clampInt } from '../lib/utils'

interface RecipeEditorProps {
  recipe: RecipeItem[]
  onAdd: () => void
  onUpdate: (index: number, updates: Partial<RecipeItem>) => void
  onRemove: (index: number) => void
}

export function RecipeEditor({ recipe, onAdd, onUpdate, onRemove }: RecipeEditorProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 overflow-hidden">
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <div className="font-semibold">Crafting recipe</div>
          <div className="text-xs text-zinc-400">Edit items and quantities</div>
        </div>
        <button
          className="px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-sm font-medium"
          onClick={onAdd}
        >
          + Add ingredient
        </button>
      </div>

      <div className="p-3 space-y-2">
        {recipe.length === 0 ? (
          <div className="text-sm text-zinc-400">No ingredients. Add one.</div>
        ) : (
          recipe.map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                className="col-span-7 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={row.item}
                placeholder="Item name"
                onChange={(e) => onUpdate(i, { item: e.target.value })}
              />
              <input
                type="number"
                min="0"
                step="1"
                className="col-span-3 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={String(row.quantity ?? 0)}
                onChange={(e) => onUpdate(i, { quantity: clampInt(e.target.value, 0) })}
              />
              <button
                className="col-span-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-red-600/20 border border-zinc-800 hover:border-red-800 text-sm font-medium"
                onClick={() => onRemove(i)}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
