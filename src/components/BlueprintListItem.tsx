import { useState, memo } from 'react'
import type { Blueprint } from '../types'

// ── Thumbnail ──────────────────────────────────────────────────────────────

interface BlueprintThumbnailProps {
  image: string
  index: number
  name: string
}

function BlueprintThumbnail({ image, index, name }: BlueprintThumbnailProps) {
  const [imgError, setImgError] = useState(false)
  const label = String(index + 1).padStart(2, '0')

  if (image && !imgError) {
    return (
      <img
        src={image}
        alt={name || 'Blueprint'}
        className="mt-0.5 w-9 h-9 rounded-xl border border-zinc-800 bg-zinc-950 object-cover"
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div className="mt-0.5 w-9 h-9 rounded-xl border border-zinc-800 bg-zinc-950 grid place-items-center text-sm">
      {label}
    </div>
  )
}

// ── BlueprintListItem ──────────────────────────────────────────────────────

interface BlueprintListItemProps {
  blueprint: Blueprint
  index: number
  isSelected: boolean
  onClick: () => void
}

export const BlueprintListItem = memo(function BlueprintListItem({
  blueprint: bp,
  index,
  isSelected,
  onClick,
}: BlueprintListItemProps) {
  const flags = [
    bp.available ? 'Available' : 'Unavailable',
    bp.loot ? 'Loot' : null,
    bp.harvester_event ? 'Harvester' : null,
    bp.quest_reward ? 'Quest' : null,
    bp.trials_reward ? 'Trials' : null,
  ].filter((f): f is string => f !== null)

  return (
    <button
      className={`w-full text-left p-3 border-b border-zinc-800 hover:bg-zinc-800/40 focus:outline-none ${
        isSelected ? 'bg-indigo-950/40' : 'bg-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <BlueprintThumbnail image={bp.image} index={index} name={bp.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold truncate">{bp.name || '(unnamed)'}</div>
            {bp.available ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-900 text-emerald-200">
                A
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                NA
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-400 truncate">{bp.workshop}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {flags.map((f) => (
              <span
                key={f}
                className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300"
              >
                {f}
              </span>
            ))}
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400">
              Recipe: {bp.crafting_recipe.length}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
})
