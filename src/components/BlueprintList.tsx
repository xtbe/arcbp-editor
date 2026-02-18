import type { Blueprint, FilterAvailability } from '../types'
import { getFilteredIndices } from '../lib/dataUtils'
import { BlueprintListItem } from './BlueprintListItem'
import { PagingBar } from './PagingBar'

interface BlueprintListProps {
  blueprints: Blueprint[]
  selectedIndex: number
  search: string
  filterAvailability: FilterAvailability
  page: number
  pageSize: number
  onSearchChange: (q: string) => void
  onFilterChange: (f: FilterAvailability) => void
  onSelect: (index: number) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function BlueprintList({
  blueprints,
  selectedIndex,
  search,
  filterAvailability,
  page,
  pageSize,
  onSearchChange,
  onFilterChange,
  onSelect,
  onPageChange,
  onPageSizeChange,
}: BlueprintListProps) {
  const filtered = getFilteredIndices(blueprints, search, filterAvailability)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const pageIndices = filtered.slice(start, start + pageSize)

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
        <input
          placeholder="Search name/workshop…"
          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <select
          className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          value={filterAvailability}
          onChange={(e) => onFilterChange(e.target.value as FilterAvailability)}
        >
          <option value="all">All</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      <div className="max-h-[72vh] overflow-auto">
        {pageIndices.length === 0 ? (
          <div className="p-6 text-sm text-zinc-400">
            No matches. Try a different search/filter.
          </div>
        ) : (
          pageIndices.map((idx) => (
            <BlueprintListItem
              key={idx}
              blueprint={blueprints[idx]}
              index={idx}
              isSelected={idx === selectedIndex}
              onClick={() => onSelect(idx)}
            />
          ))
        )}
      </div>

      <PagingBar
        countShown={filtered.length}
        page={safePage}
        pageTotal={totalPages}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        onPrevPage={() => onPageChange(Math.max(1, safePage - 1))}
        onNextPage={() => onPageChange(Math.min(totalPages, safePage + 1))}
      />
    </div>
  )
}
