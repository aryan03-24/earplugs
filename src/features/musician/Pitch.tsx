import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton, GlassButton, Poster, Segmented } from '../../components/ui'
import { ArrowUp, Download } from '../../components/icons'
import { RANGES, type Range } from '../../data/analytics'
import { useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import { share } from '../../lib/native'
import { buildPitch, PitchReportView } from './PitchReport'

/** Pitch Report – Band → Venue. Loads from Analytics; "Send" opens the booking request with it attached. */
export default function Pitch() {
  const nav = useNavigate()
  const cat = useCatalog()
  const { state } = useStore()
  const band = cat.myBand!
  const [range, setRange] = useState<Range>('30D')
  const [venueId, setVenueId] = useState('bottom')
  const [picking, setPicking] = useState(false)
  const venue = cat.venue(venueId)
  const pitch = buildPitch(band, state.profile.members, range)

  return (
    <div className="screen pitch">
      <div className="row between center-v pad-x top-bar">
        <BackButton to="/analytics" />
        <div className="center">
          <b>Pitch Report</b>
          <div className="muted small">Generated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
        <GlassButton size={36} className="white" aria-label="Share" onClick={() => share(`${band.name} pitch`, `${band.name} pitch report for ${venue.name}`)}><ArrowUp /></GlassButton>
      </div>

      <div className="pad-x">
        <div className="prepared">
          <Poster hue={venue.hue} photo={venue.photo} className="prep-thumb" />
          <div className="grow"><small className="muted">PREPARED FOR</small><div>{venue.name}, {venue.city === 'San Francisco' ? 'SF' : venue.city}</div></div>
          <button className="small-pill" onClick={() => setPicking(p => !p)}>{picking ? 'Done' : 'Edit'}</button>
        </div>
        {picking && (
          <div className="choice-list mt">
            {cat.venues.map(v => (
              <button key={v.id} className={`select-row${v.id === venueId ? ' on' : ''}`} onClick={() => { setVenueId(v.id); setPicking(false) }}>
                <span className="grow left"><b>{v.name}</b><span className="select-sub">{v.city}</span></span>
              </button>
            ))}
          </div>
        )}
        <div className="field-label mt">Analytics range</div>
        <Segmented options={RANGES} value={range} onChange={setRange} full />

        <PitchReportView pitch={pitch} band={band} cat={cat} venueCity={venue.city} />

        <button className="next-pill wide" onClick={() => nav(`/bookings/apply?venue=${venueId}&range=${range}`)}>SEND TO {venue.name.toUpperCase()}</button>
        <button className="secondary-btn" onClick={() => window.print()}><Download /> Download PDF</button>
      </div>
    </div>
  )
}
