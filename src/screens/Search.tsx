import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BackButton, BandGrid, Carousel, Chip, GigRow, Logo, Screen, SectionHeader, ShowCard } from '../components/ui'
import { BANDS, searchAll, upcoming } from '../data'
import { useStore } from '../store'
import { applyFilters, FILTERS, LocationTag, SearchBar, type Filter } from './Explore'

export default function Search() {
  const { state, addHistory } = useStore()
  const [q, setQ] = useState('')
  const [active, setActive] = useState<string | null>(null)
  const term = active ?? q

  const results = useMemo(() => {
    if ((FILTERS as readonly string[]).includes(term)) {
      return { shows: applyFilters(upcoming(), [term as Filter], state.profile.genres), bands: [], venues: [] }
    }
    return searchAll(term)
  }, [term, state.profile.genres])

  const similar = useMemo(() => {
    const g = new Set(results.bands.flatMap(b => b.genres).concat(results.shows.flatMap(s => s.genres)))
    return BANDS.filter(b => !results.bands.includes(b) && b.genres.some(x => g.has(x))).slice(0, 4)
  }, [results])

  const runHistory = (h: string) => { setActive(h); setQ(h); addHistory(h) }
  const hasQuery = term.trim().length > 0
  const nothing = hasQuery && !results.shows.length && !results.bands.length && !results.venues.length

  return (
    <Screen tabs>
      <header className="page-header">
        <Logo size={42} />
        <div className="row between baseline">
          <div className="row gap-sm center-v">
            <BackButton to="/explore" />
            <h1 className="large-title">Search</h1>
          </div>
          <LocationTag />
        </div>
        <SearchBar value={q} autoFocus onChange={v => { setQ(v); setActive(null) }} onSubmit={v => v.trim() && addHistory(v.trim())} />
      </header>

      {!hasQuery && (
        <>
          <SectionHeader title="Your History" />
          <div className="chip-row wrap">
            {state.history.map(h => <Chip key={h} onClick={() => runHistory(h)}>{h}</Chip>)}
          </div>
          <SectionHeader title="Trending Near You" />
          <Carousel>{upcoming().slice(0, 5).map(s => <ShowCard key={s.id} show={s} />)}</Carousel>
          <SectionHeader title="Bands to Know" />
          <BandGrid bands={BANDS.slice(0, 4)} />
        </>
      )}

      {hasQuery && (
        <>
          {nothing && <p className="empty">No results for “{term}”. Try a genre like “Indie” or a venue.</p>}
          {results.shows.length > 0 && (
            <>
              <SectionHeader title="Top Results" />
              <Carousel>{results.shows.map(s => <ShowCard key={s.id} show={s} />)}</Carousel>
            </>
          )}
          {results.bands.length > 0 && (
            <>
              <SectionHeader title="Bands" />
              <BandGrid bands={results.bands} />
            </>
          )}
          {results.venues.length > 0 && (
            <>
              <SectionHeader title="Venues" />
              <div className="list-card">
                {results.venues.map(v => (
                  <Link key={v.id} to={`/gigs?venue=${v.id}`} className="list-item">
                    <div><b>{v.name}</b><div className="muted">{v.address}, {v.city}</div></div>
                  </Link>
                ))}
              </div>
            </>
          )}
          {similar.length > 0 && (
            <>
              <SectionHeader title="Similar Bands" />
              <BandGrid bands={similar} />
            </>
          )}
          {results.shows.length > 3 && (
            <div className="gig-list">{results.shows.slice(3).map(s => <GigRow key={s.id} show={s} />)}</div>
          )}
        </>
      )}
    </Screen>
  )
}
