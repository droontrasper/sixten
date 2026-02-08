/**
 * Kompakt statistikrad för headern.
 * Visar veckostatistik diskret till höger.
 */

interface StatsBarProps {
  addedThisWeek: number
  handledThisWeek: number
  queueCount: number
}

export function StatsBar({ addedThisWeek, handledThisWeek, queueCount }: StatsBarProps) {
  if (addedThisWeek === 0 && handledThisWeek === 0 && queueCount === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-3 text-xs text-stone-400">
      {addedThisWeek > 0 && (
        <>
          <span className="whitespace-nowrap">
            <span className="font-semibold text-stone-500">+{addedThisWeek}</span>
            <span className="hidden sm:inline"> vecka</span>
          </span>
          {(handledThisWeek > 0 || queueCount > 0) && (
            <span className="text-stone-300">|</span>
          )}
        </>
      )}
      {handledThisWeek > 0 && (
        <>
          <span className="whitespace-nowrap">
            <span className="font-semibold text-emerald-500">{handledThisWeek}</span>
            <span className="hidden sm:inline"> klara</span>
          </span>
          {queueCount > 0 && (
            <span className="text-stone-300">|</span>
          )}
        </>
      )}
      <span className="whitespace-nowrap">
        <span className="font-semibold text-stone-500">{queueCount}</span>
        <span className="hidden sm:inline"> i kön</span>
      </span>
    </div>
  )
}
