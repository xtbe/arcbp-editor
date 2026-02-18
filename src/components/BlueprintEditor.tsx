import type { ReactNode } from 'react'
import type { Blueprint, RecipeItem, StatusType } from '../types'
import { CheckboxPill } from './CheckboxPill'
import { ImageField } from './ImageField'
import { RecipeEditor } from './RecipeEditor'

// ── EditorRow ──────────────────────────────────────────────────────────────

interface EditorRowProps {
  label: string
  help?: string
  children: ReactNode
}

function EditorRow({ label, help, children }: EditorRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
      <div className="md:col-span-4">
        <div className="text-sm font-medium">{label}</div>
        {help && <div className="text-xs text-zinc-400 mt-0.5">{help}</div>}
      </div>
      <div className="md:col-span-8">{children}</div>
    </div>
  )
}

// ── Constants ──────────────────────────────────────────────────────────────

type BooleanBlueprintKey = 'available' | 'loot' | 'harvester_event' | 'quest_reward' | 'trials_reward'

const FLAG_FIELDS: Array<[string, BooleanBlueprintKey]> = [
  ['Available', 'available'],
  ['Loot', 'loot'],
  ['Harvester event', 'harvester_event'],
  ['Quest reward', 'quest_reward'],
  ['Trials reward', 'trials_reward'],
]

// ── BlueprintEditor ────────────────────────────────────────────────────────

interface BlueprintEditorProps {
  blueprint: Blueprint
  onUpdate: (updates: Partial<Blueprint>) => void
  onUpdateRecipeItem: (index: number, updates: Partial<RecipeItem>) => void
  onAddRecipeItem: () => void
  onRemoveRecipeItem: (index: number) => void
  onStatus: (type: StatusType, msg: string) => void
}

export function BlueprintEditor({
  blueprint,
  onUpdate,
  onUpdateRecipeItem,
  onAddRecipeItem,
  onRemoveRecipeItem,
  onStatus,
}: BlueprintEditorProps) {
  return (
    <div className="space-y-4">
      <EditorRow label="Name" help="Blueprint display name">
        <input
          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          value={blueprint.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
      </EditorRow>

      <EditorRow label="Workshop" help="e.g. Gunsmith II, Utility Station I, N/A">
        <input
          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          value={blueprint.workshop}
          onChange={(e) => onUpdate({ workshop: e.target.value })}
        />
      </EditorRow>

      <EditorRow label="Image" help="Path or upload an image file">
        <ImageField
          value={blueprint.image}
          onChange={(v) => onUpdate({ image: v })}
          onStatus={onStatus}
        />
      </EditorRow>

      <EditorRow label="Flags" help="Toggle each boolean field">
        <div className="flex flex-wrap gap-2">
          {FLAG_FIELDS.map(([label, key]) => (
            <CheckboxPill
              key={key}
              label={label}
              checked={blueprint[key]}
              onChange={(v) => onUpdate({ [key]: v } as Partial<Blueprint>)}
            />
          ))}
        </div>
      </EditorRow>

      <RecipeEditor
        recipe={blueprint.crafting_recipe}
        onAdd={onAddRecipeItem}
        onUpdate={onUpdateRecipeItem}
        onRemove={onRemoveRecipeItem}
      />
    </div>
  )
}
