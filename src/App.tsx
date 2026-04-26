import { useState, useRef } from 'react'
import { CardGrid } from './components/CardGrid'
import { AddCardsForm } from './components/AddCardsForm'
import { useCards } from './hooks/useCards'
import { fetchCharacterImage } from './lib/imageSearch'

function App() {
  const [modalOpen, setModalOpen] = useState(false)
  const [fetchProgress, setFetchProgress] = useState<{ done: number; total: number } | null>(null)
  const cancelRef = useRef(false)
  const { clearAll, cards, updateCard } = useCards()

  function handleClearAll() {
    if (window.confirm(`Delete all ${cards?.length ?? 0} cards? This cannot be undone.`)) {
      clearAll()
    }
  }

  async function handleFetchImages() {
    const targets = (cards ?? []).filter(c => !c.image && c.id !== undefined)
    if (targets.length === 0) return
    cancelRef.current = false
    setFetchProgress({ done: 0, total: targets.length })
    for (let i = 0; i < targets.length; i++) {
      if (cancelRef.current) break
      const card = targets[i]
      const image = await fetchCharacterImage(card.name, card.serie)
      if (image && card.id !== undefined) {
        await updateCard(card.id, { image })
      }
      setFetchProgress({ done: i + 1, total: targets.length })
      if (i < targets.length - 1) await new Promise(r => setTimeout(r, 1500))
    }
    setFetchProgress(null)
  }

  function handleStopFetch() {
    cancelRef.current = true
  }

  const missingImages = (cards ?? []).filter(c => !c.image).length

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white border-b flex items-center justify-between px-4 py-3">
        <h1 className="text-2xl font-bold">Mudae Organiser</h1>
        <div className="flex items-center gap-2">
          {missingImages > 0 && (
            <button
              className="flex items-center gap-2 rounded px-3 py-1 text-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              onClick={handleFetchImages}
              disabled={fetchProgress !== null}
            >
              {fetchProgress && (
                <svg className="animate-spin h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {fetchProgress
                ? `Fetching ${fetchProgress.done}/${fetchProgress.total}…`
                : `Fetch images (${missingImages})`}
            </button>
          )}
          {fetchProgress && (
            <button
              className="rounded px-3 py-1 text-sm border border-gray-300 hover:bg-gray-50"
              onClick={handleStopFetch}
            >
              Stop
            </button>
          )}
          {(cards?.length ?? 0) > 0 && (
            <button
              className="rounded px-3 py-1 text-sm border border-red-300 text-red-600 hover:bg-red-50"
              onClick={handleClearAll}
            >
              Clear all
            </button>
          )}
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white text-2xl leading-none"
            onClick={() => setModalOpen(true)}
            aria-label="Add cards"
          >
            +
          </button>
        </div>
      </header>

      <main>
        <CardGrid />
      </main>

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-4 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4 shrink-0">
              <h2 className="font-semibold text-lg">Add cards</h2>
              <button
                className="text-gray-500 hover:text-black text-xl leading-none"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto">
              <AddCardsForm onDone={() => setModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App