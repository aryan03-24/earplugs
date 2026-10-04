import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BandGrid, Carousel, Chip, GigRow, Logo, Screen, SectionHeader, ShowCard } from '../components/ui'
import { Pin, Search } from '../components/icons'
import { BANDS, distanceKm, isTonight, upcoming, venueById, formatDate, formatTime, type Show } from '../data'
import { useStore } from '../store'

export const FILTERS = ['Tonight', 'Free', 'My Top Genres', 'By Distance'] as const
export type Filter = (typeof FILTERS)[number]

export function applyFilters(shows: Show[], filters: Filter[], myGenres: string[]) {
  let out = shows
  if (filters.includes('Tonight')) out = out.filter(isTonight)
  if (filters.includes('Free')) out = out.filter(s => s.price === 0)
  if (filters.includes('My Top Genres') && myGenres.length && !myGenres.includes('A little of everything'))
    out = out.filter(s => s.genres.some(g => myGenres.includes(g)))
  if (filters.includes('By Distance'))
    out = [...out].sort((a, b) => distanceKm(venueById(a.venueId)) - distanceKm(venueById(b.venueId)))
  return out
}

export function LocationTag() {
  const { state } = useStore()
  return (
    <span className="location-tag"><Pin size={20} />{state.profile.homeBase || 'Berkeley, CA'}</span>
  )
}

export function SearchBar({ onFocus, value, onChange, autoFocus, onSubmit }: {
  onFocus?: () => void; value?: string; onChange?: (v: string) => void; autoFocus?: boolean; onSubmit?: (v: string) => void
}) {
  return (
    <form className="search-bar" role="search" onSubmit={e => { e.preventDefault(); onSubmit?.(value ?? '') }}>
      <Search size={16} />
      <input placeholder="Search for any genre, artist, venue, or show" value={value} onFocus={onFocus} autoFocus={autoFocus}
        onChange={e => onChange?.(e.target.value)} readOnly={!onChange} aria-label="Search" />
    </form>
  )
}

const pinIcon = L.divIcon({ className: 'map-pin', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] })

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'map' ? 'map' : 'list'
  const nav = useNavigate()
  const { state } = useStore()
  const [filters, setFilters] = useState<Filter[]>([])
  const city = (state.profile.homeBase || 'Berkeley, CA')

  const shows = useMemo(() => applyFilters(upcoming(), filters, state.profile.genres), [filters, state.profile.genres])
  const toggleFilter = (f: Filter) => setFilters(fs => (fs.includes(f) ? fs.filter(x => x !== f) : [...fs, f]))

  const liked = useMemo(() => {
    const g = state.profile.genres
    const scored = BANDS.map(b => ({ b, score: b.genres.filter(x => g.includes(x)).length }))
    return scored.sort((a, b) => b.score - a.score).slice(0, 4).map(x => x.b)
  }, [state.profile.genres])

  const friends = [...upcoming()].sort((a, b) => b.plugging - a.plugging).slice(0, 5)

  return (
    <Screen tabs>
      <header className="page-header">
        <div className="row between">
          <Logo size={42} />
          <div className="segmented" role="tablist">
            <button role="tab" aria-selected={view === 'list'} className={view === 'list' ? 'on' : ''} onClick={() => setParams({})}>List</button>
            <button role="tab" aria-selected={view === 'map'} className={view === 'map' ? 'on' : ''} onClick={() => setParams({ view: 'map' })}>Map</button>
          </div>
        </div>
        <div className="row between baseline">
          <h1 className="large-title">Explore</h1>
          <LocationTag />
        </div>
        <SearchBar onFocus={() => nav('/search')} />
        <div className="chip-row">
          {FILTERS.map(f => <Chip key={f} active={filters.includes(f)} onClick={() => toggleFilter(f)}>{f}</Chip>)}
        </div>
      </header>

      {view === 'list' ? (
        <>
          <SectionHeader title={`Popular in ${city}`} to={`/gigs?title=${encodeURIComponent(`Popular in ${city}`)}`} />
          {shows.length ? (
            <Carousel>{shows.map(s => <ShowCard key={s.id} show={s} />)}</Carousel>
          ) : (
            <p className="empty">No shows match those filters. <button className="link" onClick={() => setFilters([])}>Clear filters</button></p>
          )}

          <SectionHeader title="Bands We Think You’ll Like" to="/gigs?tab=bands" />
          <BandGrid bands={liked} />

          <SectionHeader title={<>What Your Friends<br />Are Plugging</>} />
          <Carousel>{friends.map(s => <ShowCard key={s.id} show={s} wide />)}</Carousel>
        </>
      ) : (
        <>
          <div className="map-wrap">
            <MapContainer center={[37.84, -122.29]} zoom={11} scrollWheelZoom className="map" attributionControl={false}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" className="dark-tiles" />
              {shows.map(s => {
                const v = venueById(s.venueId)
                return (
                  <Marker key={s.id} position={[v.lat, v.lng]} icon={pinIcon}>
                    <Popup>
                      <Link to={`/show/${s.id}`} className="map-popup">
                        <b>{s.title}</b><br />{v.name}<br />{formatDate(s.date, { month: 'short', day: 'numeric' })} · {formatTime(s.date)}
                      </Link>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>
          <SectionHeader title="More Gigs" to="/gigs" />
          <div className="gig-list">{shows.slice(0, 6).map(s => <GigRow key={s.id} show={s} showShare={false} />)}</div>
        </>
      )}
    </Screen>
  )
}
