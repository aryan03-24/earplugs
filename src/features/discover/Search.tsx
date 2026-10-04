import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Carousel, Chip, Empty, PageHeader, Screen, SectionHeader } from '../../components/ui'
import { BandGrid, GigRow, ShowCard } from '../../components/cards'
import { applyFilters, FILTERS, search, useCatalog, type Filter } from '../../state/catalog'
import { useStore } from '../../state/store'
import { LocationTag, SearchBar } from './shared'

export default function Search() {
  const { state, addHistory, clearHistory } = useStore()
  const cat = useCatalog()
  const [q, setQ] = useState('')
  const term = q.trim()

  const results = useMemo(() => {
    if ((FILTERS as readonly string[]).includes(term))
      return { shows: applyFilters(cat.upcoming, [term as Filter], state.profile.genres, cat.venue), bands: [], venues: [] }
    return search(cat, term)
  }, [cat, term, state.profile.genres])

  const similar = useMemo(() => {
    const g = new Set([...results.bands.flatMap(b => b.genres), ...results.shows.flatMap(s => s.genres)])
    return cat.bands.filter(b => !results.bands.includes(b) && b.genres.some(x => g.has(x))).slice(0, 4)
  }, [cat, results])

  const nothing = term && !results.shows.length && !results.bands.length && !results.venues.length

  return (
    <Screen tabs>
      <PageHeader title="Search" back="/explore">
        <div className="row end"><LocationTag /></div>
        <SearchBar value={q} autoFocus onChange={setQ} onSubmit={v => v.trim() && addHistory(v.trim())} />
      </PageHeader>

      {!term && (
        <>
          <SectionHeader title="Your History" action={state.history.length > 0 && <button className="link" onClick={clearHistory}>Clear</button>} />
          {state.history.length ? (
            <div className="chip-row wrap">
              {state.history.map(h => <Chip key={h} onClick={() => { setQ(h); addHistory(h) }}>{h}</Chip>)}
            </div>
          ) : <Empty>Your recent searches will show up here.</Empty>}
          <SectionHeader title="Trending Near You" />
          <Carousel>{cat.upcoming.slice(0, 6).map(s => <ShowCard key={s.id} show={s} />)}</Carousel>
          <SectionHeader title="Bands to Know" />
          <BandGrid bands={cat.bands.filter(b => b.id !== cat.myBand?.id).slice(0, 4)} />
        </>
      )}

      {nothing && <Empty>No results for “{term}”. Try a genre like “Indie” or a venue name.</Empty>}

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
          <div className="list-card pad-x-in">
            {results.venues.map(v => (
              <Link key={v.id} to={`/venue/${v.id}`} className="list-item">
                <div><b>{v.name}</b><div className="muted small">{v.address}, {v.city}</div></div>
                <span className="muted small">{cat.showsAt(v.id).length} show{cat.showsAt(v.id).length === 1 ? '' : 's'}</span>
              </Link>
            ))}
          </div>
        </>
      )}
      {term && similar.length > 0 && (
        <>
          <SectionHeader title="Similar Bands" />
          <BandGrid bands={similar} />
        </>
      )}
      {results.shows.length > 0 && (
        <>
          <SectionHeader title="All Matching Gigs" />
          <div className="gig-list">{results.shows.map(s => <GigRow key={s.id} show={s} />)}</div>
        </>
      )}
    </Screen>
  )
}
