import { useState, useCallback, useEffect } from 'react'
import type { Blueprint, BlueprintsData, FilterAvailability, RecipeItem, StatusMessage, StatusType } from './types'
import { SAMPLE } from './lib/sampleData'
import { saveToStorage, loadFromStorage } from './lib/storage'
import { ensureShape, getFilteredIndices } from './lib/dataUtils'
import { useTheme } from './lib/theme'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import type { AppView } from './components/Sidebar'
import { BlueprintList } from './components/BlueprintList'
import { BlueprintEditor } from './components/BlueprintEditor'
import { StatusBar } from './components/StatusBar'
import { PasteModal } from './components/PasteModal'
import { JsonModal } from './components/JsonModal'

function App() {
  const { resolved: resolvedTheme, toggleTheme } = useTheme()
  const [activeView, setActiveView] = useState<AppView>('blueprints')
  const [data, setData] = useState<BlueprintsData>(() => loadFromStorage() ?? structuredClone(SAMPLE))
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [filterAvailability, setFilterAvailability] = useState<FilterAvailability>('all')
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [jsonModalOpen, setJsonModalOpen] = useState(false)
  const [pasteModalOpen, setPasteModalOpen] = useState(false)

  // Try loading from data/blueprints.json on mount (overrides localStorage)
  useEffect(() => {
    let cancelled = false
    fetch('data/blueprints.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
      .then((json: unknown) => {
        if (!cancelled) {
          setData(ensureShape(json))
          setStatus({ type: 'info', text: 'Loaded from data/blueprints.json' })
        }
      })
      .catch(() => {
        if (!cancelled) {
          const stored = loadFromStorage()
          setStatus({ type: 'info', text: stored ? 'Loaded from localStorage.' : 'Loaded sample data.' })
        }
      })
    return () => { cancelled = true }
  }, [])

  // Keep selected item on its correct page when search/filter changes
  useEffect(() => {
    if (selectedIndex < 0) return
    const filtered = getFilteredIndices(data.blueprints, search, filterAvailability)
    const pos = filtered.indexOf(selectedIndex)
    if (pos === -1) return
    setPage(Math.floor(pos / pageSize) + 1)
    // Intentionally only runs when search/filter changes, not on every pageSize change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterAvailability])

  // ── Status helper ──────────────────────────────────────────────────────────

  const setStatusMsg = useCallback((type: StatusType, text: string) => {
    setStatus({ type, text })
  }, [])

  // ── Data mutations ─────────────────────────────────────────────────────────

  const applyData = useCallback((next: BlueprintsData) => {
    setData(next)
    saveToStorage(next)
  }, [])

  const updateBlueprint = useCallback((index: number, updates: Partial<Blueprint>) => {
    setData((prev) => {
      const blueprints = [...prev.blueprints]
      blueprints[index] = { ...blueprints[index], ...updates }
      const next = { ...prev, blueprints }
      saveToStorage(next)
      return next
    })
  }, [])

  const updateRecipeItem = useCallback(
    (bpIndex: number, recipeIndex: number, updates: Partial<RecipeItem>) => {
      setData((prev) => {
        const blueprints = [...prev.blueprints]
        const recipe = [...blueprints[bpIndex].crafting_recipe]
        recipe[recipeIndex] = { ...recipe[recipeIndex], ...updates }
        blueprints[bpIndex] = { ...blueprints[bpIndex], crafting_recipe: recipe }
        const next = { ...prev, blueprints }
        saveToStorage(next)
        return next
      })
    },
    [],
  )

  const addRecipeItem = useCallback((bpIndex: number) => {
    setData((prev) => {
      const blueprints = [...prev.blueprints]
      const recipe = [...blueprints[bpIndex].crafting_recipe, { item: '', quantity: 0 }]
      blueprints[bpIndex] = { ...blueprints[bpIndex], crafting_recipe: recipe }
      const next = { ...prev, blueprints }
      saveToStorage(next)
      return next
    })
  }, [])

  const removeRecipeItem = useCallback((bpIndex: number, recipeIndex: number) => {
    setData((prev) => {
      const blueprints = [...prev.blueprints]
      const recipe = blueprints[bpIndex].crafting_recipe.filter((_, i) => i !== recipeIndex)
      blueprints[bpIndex] = { ...blueprints[bpIndex], crafting_recipe: recipe }
      const next = { ...prev, blueprints }
      saveToStorage(next)
      return next
    })
  }, [])

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  function handleNew() {
    const newBp: Blueprint = {
      name: 'New Blueprint',
      workshop: '',
      image: '',
      crafting_recipe: [{ item: '', quantity: 0 }],
      available: true,
      loot: false,
      harvester_event: false,
      quest_reward: false,
      trials_reward: false,
    }
    const next = { blueprints: [...data.blueprints, newBp] }
    applyData(next)
    setSelectedIndex(next.blueprints.length - 1)
    setStatus({ type: 'ok', text: 'Added a new blueprint.' })
  }

  function handleDelete() {
    if (selectedIndex < 0) return
    const name = data.blueprints[selectedIndex]?.name || 'this blueprint'
    if (!confirm(`Delete "${name}"?`)) return
    const blueprints = data.blueprints.filter((_, i) => i !== selectedIndex)
    applyData({ ...data, blueprints })
    setSelectedIndex(Math.min(selectedIndex, blueprints.length - 1))
    setStatus({ type: 'ok', text: 'Deleted.' })
  }

  function handleDuplicate() {
    if (selectedIndex < 0) return
    const original = data.blueprints[selectedIndex]
    const copy: Blueprint = {
      ...structuredClone(original),
      name: original.name ? `${original.name} (Copy)` : 'Copy',
    }
    const blueprints = [...data.blueprints]
    blueprints.splice(selectedIndex + 1, 0, copy)
    applyData({ ...data, blueprints })
    setSelectedIndex(selectedIndex + 1)
    setStatus({ type: 'ok', text: 'Duplicated.' })
  }

  function handleReset() {
    if (!confirm('Reset editor to the sample data? This overwrites your current work (localStorage too).')) return
    applyData(structuredClone(SAMPLE))
    setSelectedIndex(-1)
    setPage(1)
    setPageSize(10)
    setStatus({ type: 'ok', text: 'Reset to sample.' })
  }

  async function handleFileLoad(file: File) {
    try {
      const text = await file.text()
      const parsed = ensureShape(JSON.parse(text) as unknown)
      applyData(parsed)
      setSelectedIndex(-1)
      setPage(1)
      setStatus({ type: 'ok', text: `Loaded ${file.name}` })
    } catch (e) {
      setStatus({ type: 'err', text: `Could not load JSON: ${(e as Error).message ?? String(e)}` })
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const selectedBlueprint = selectedIndex >= 0 ? data.blueprints[selectedIndex] : null

  return (
    <div className="bg-zinc-950 text-zinc-100 flex h-screen overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────── */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        isDark={resolvedTheme === 'dark'}
        onThemeToggle={toggleTheme}
      />

      {/* ── Main column ─────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          onNew={handleNew}
          onFileLoad={handleFileLoad}
          onPaste={() => setPasteModalOpen(true)}
          onViewJson={() => setJsonModalOpen(true)}
          onReset={handleReset}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: list */}
              <section className="lg:col-span-5 xl:col-span-4">
                <BlueprintList
                  blueprints={data.blueprints}
                  selectedIndex={selectedIndex}
                  search={search}
                  filterAvailability={filterAvailability}
                  page={page}
                  pageSize={pageSize}
                  onSearchChange={(q) => { setSearch(q); setPage(1) }}
                  onFilterChange={(f) => { setFilterAvailability(f); setPage(1) }}
                  onSelect={setSelectedIndex}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
                />
                <StatusBar status={status} />
              </section>

              {/* Right: editor */}
              <section className="lg:col-span-7 xl:col-span-8">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                  <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
                    <div className="mr-auto">
                      <div className="font-semibold">Editor</div>
                      <div className="text-xs text-zinc-400">Select a blueprint on the left to edit</div>
                    </div>
                    <button
                      className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={selectedIndex < 0}
                      onClick={handleDuplicate}
                    >
                      Duplicate
                    </button>
                    <button
                      className="px-3 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed
                        bg-red-100 border-red-300 text-red-700 hover:bg-red-200
                        dark:bg-red-600/90 dark:hover:bg-red-600 dark:border-transparent dark:text-white"
                      disabled={selectedIndex < 0}
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                  </div>

                  <div className="p-4">
                    {selectedBlueprint ? (
                      // key=selectedIndex forces a full remount when switching blueprints,
                      // resetting any local UI state (drag-over, image error, etc.)
                      <BlueprintEditor
                        key={selectedIndex}
                        blueprint={selectedBlueprint}
                        onUpdate={(updates) => updateBlueprint(selectedIndex, updates)}
                        onUpdateRecipeItem={(ri, updates) => updateRecipeItem(selectedIndex, ri, updates)}
                        onAddRecipeItem={() => addRecipeItem(selectedIndex)}
                        onRemoveRecipeItem={(ri) => removeRecipeItem(selectedIndex, ri)}
                        onStatus={setStatusMsg}
                      />
                    ) : (
                      <div className="text-zinc-400 text-sm">No blueprint selected.</div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {pasteModalOpen && (
        <PasteModal
          onLoad={(parsed) => {
            applyData(parsed)
            setSelectedIndex(-1)
            setPage(1)
            setStatus({ type: 'ok', text: 'Loaded pasted JSON.' })
          }}
          onClose={() => setPasteModalOpen(false)}
        />
      )}

      {jsonModalOpen && (
        <JsonModal
          data={data}
          onClose={() => setJsonModalOpen(false)}
          onCopied={() => setStatus({ type: 'ok', text: 'Copied JSON to clipboard.' })}
          onDownloaded={() => setStatus({ type: 'ok', text: 'Downloaded JSON.' })}
          onCopyFailed={() => setStatus({ type: 'warn', text: 'Clipboard copy failed (browser permissions).' })}
        />
      )}
    </div>
  )
}

export default App
