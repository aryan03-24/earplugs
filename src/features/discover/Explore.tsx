import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Carousel, Chip, Empty, PageHeader, Screen, SectionHeader, Segmented } from '../../components/ui'
import { BandGrid, GigRow, ShowCard, VenueCard } from '../../components/cards'
import { applyFilters, FILTERS, useCatalog, type Filter } from '../../state/catalog'
import { useStore } from '../../state/store'
import { formatTime, shortDate } from '../../lib/format'
import { LocationTag, SearchBar } from './shared'

const pinIcon = L.divIcon({ className: 'map-pin', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] })

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'map' ? 'Map' : 'List'
  const nav = useNavigate()
  const { state } = useStore()
  const cat = useCatalog()
  const [filters, setFilters] = useState<Filter[]>([])
  const city = state.profile.homeBase || 'Berkeley, CA'
  const myGenres = state.profile.genres

  const shows = useMemo(() => applyFilters(cat.upcoming, filters, myGenres, cat.venue), [cat, filters, myGenres])
  const toggleFilter = (f: Filter) => setFilters(fs => (fs.includes(f) ? fs.filter(x => x !== f) : [...fs, f]))

  const liked = useMemo(
    () => cat.bands.filter(b => b.id !== cat.myBand?.id)
      .map(b => ({ b, score: b.genres.filter(x => myGenres.includes(x)).length }))
      .sort((a, b) => b.score - a.score).slice(0, 4).map(x => x.b),
    [cat, myGenres],
  )
  const friends = [...shows].sort((a, b) => b.plugging - a.plugging).slice(0, 5)
  const venues = cat.venues.map(v => ({ v, n: cat.showsAt(v.id).length })).filter(x => x.n > 0)

  return (
    <Screen tabs>
      <PageHeader right={<Segmented options={['List', 'Map'] as const} value={view} onChange={v => setParams(v === 'Map' ? { view: 'map' } : {})} />}>
        <div className="row between baseline">
          <h1 className="large-title">Explore</h1>
          <LocationTag />
        </div>
        <SearchBar onFocus={() => nav('/search')} />
        <div className="chip-row">
          {FILTERS.map(f => <Chip key={f} active={filters.includes(f)} onClick={() => toggleFilter(f)}>{f}</Chip>)}
        </div>
      </PageHeader>

      {view === 'List' ? (
        <>
          <SectionHeader title={`Popular in ${city}`} to={`/more?title=${encodeURIComponent(`Popular in ${city}`)}`} />
          {shows.length ? (
            <Carousel>{shows.map(s => <ShowCard key={s.id} show={s} />)}</Carousel>
          ) : (
            <Empty>No shows match those filters. <button className="link" onClick={() => setFilters([])}>Clear filters</button></Empty>
          )}


          <SectionHeader title="Bands We Think You’ll Like" to="/more?tab=bands" />
          <BandGrid bands={liked} />

          <SectionHeader title={<>What Your Friends<br />Are Plugging</>} />
          <Carousel>{friends.map(s => <ShowCard key={s.id} show={s} size="lg" />)}</Carousel>

          <SectionHeader title="Venues Hosting" />
          <Carousel>{venues.map(({ v, n }) => <VenueCard key={v.id} venue={v} count={n} />)}</Carousel>
        </>
      ) : (
        <>
          <div className="map-wrap">
            <MapContainer center={[37.84, -122.29]} zoom={11} scrollWheelZoom className="map" attributionControl={false}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" className="dark-tiles" />
              {shows.map(s => {
                const v = cat.venue(s.venueId)
                return (
                  <Marker key={s.id} position={[v.lat, v.lng]} icon={pinIcon}>
                    <Popup>
                      <Link to={`/show/${s.id}`} className="map-popup">
                        <b>{s.title}</b><br />{v.name}<br />{shortDate(s.date)} · {formatTime(s.date)}
                      </Link>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>
          <SectionHeader title="More Gigs" to="/more" />
          <div className="gig-list">{shows.slice(0, 8).map(s => <GigRow key={s.id} show={s} showShare={false} />)}</div>
        </>
      )}
    </Screen>
  )
}
