import { ChevronLeft, ChevronRight } from './icons'

export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
export const keyToDate = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m, d) }
const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** Month grid from the Figma (Gigs Page 2): circular days, blue ring for today, white fill when selected. */
export function MonthCalendar({ month, onMonth, selected, onSelect, dots, disablePast, legend = true }: {
  month: Date
  onMonth: (m: Date) => void
  selected: string[]
  onSelect: (key: string) => void
  dots?: Map<string, 'blue' | 'gray'>
  disablePast?: boolean
  legend?: boolean
}) {
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const lead = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: (Date | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]
  const shift = (n: number) => onMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))
  const atCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth()

  return (
    <section className="cal-card" aria-label="Calendar">
      <div className="row between center-v cal-head">
        <h2>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
        <div className="row gap-sm">
          <button className="cal-nav" aria-label="Previous month" disabled={disablePast && atCurrentMonth} onClick={() => shift(-1)}><ChevronLeft size={18} /></button>
          <button className="cal-nav" aria-label="Next month" onClick={() => shift(1)}><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="cal-grid">
        {WEEK.map((w, i) => <span key={i} className="cal-dow">{w}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />
          const k = dayKey(d)
          const isPast = d.getTime() < startOfToday
          const dot = dots?.get(k)
          const cls = ['cal-day', selected.includes(k) && 'sel', k === dayKey(today) && 'today', isPast && 'past'].filter(Boolean).join(' ')
          return (
            <button key={i} className={cls} disabled={disablePast && isPast} onClick={() => onSelect(k)} aria-label={d.toDateString()} aria-pressed={selected.includes(k)}>
              <span className="cal-num">{d.getDate()}</span>
              <span className="cal-dot">{dot && <i className={dot === 'blue' ? 'dot-blue' : 'dot-gray'} />}</span>
            </button>
          )
        })}
      </div>
      {legend && dots && <div className="cal-legend"><span><i className="dot-blue" /> Confirmed</span><span><i className="dot-gray" /> Pending / draft</span></div>}
    </section>
  )
}
