import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chip, Field, PageHeader, Screen } from '../../components/ui'
import { GENRES } from '../../data/seed'
import { MY_BAND_ID, useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import { haptic, toast, uid } from '../../lib/native'

/** Musicians can list a show they booked outside EarPlug; it shows up for fans right away. */
export default function NewShow() {
  const nav = useNavigate()
  const cat = useCatalog()
  const { state, addShow } = useStore()
  const band = cat.myBand!
  const [title, setTitle] = useState(`${band.name} Live`)
  const [venueId, setVenueId] = useState(cat.venues[0].id)
  const [date, setDate] = useState(new Date(Date.now() + 7 * 86400e3).toISOString().slice(0, 10))
  const [time, setTime] = useState('20:00')
  const [price, setPrice] = useState('10')
  const [genres, setGenres] = useState<string[]>(band.genres)
  const [lineup, setLineup] = useState<string[]>([])

  const save = () => {
    if (!title.trim()) { toast('Add a show title'); return }
    const when = new Date(`${date}T${time}`)
    if (isNaN(when.getTime()) || when.getTime() < Date.now()) { toast('Pick a future date and time'); return }
    const id = uid('show')
    addShow({
      id, title: title.trim(), venueId, bandIds: [MY_BAND_ID, ...lineup], date: when.toISOString(),
      price: Math.max(0, Number(price) || 0), genres: genres.length ? genres : band.genres,
      hue: cat.venue(venueId).hue, plugging: 0, createdByMe: true,
    })
    haptic(20)
    toast('Show published to fans')
    nav(`/show/${id}`, { replace: true })
  }

  return (
    <Screen>
      <PageHeader title="Add a Show" back="/bookings" />
      <form className="pad-x stack-form" onSubmit={e => { e.preventDefault(); save() }}>
        <Field label="Show title" value={title} onChange={setTitle} />
        <label className="form-field">
          <span>Venue</span>
          <select value={venueId} onChange={e => setVenueId(e.target.value)}>
            {cat.venues.map(v => <option key={v.id} value={v.id}>{v.name} · {v.city}</option>)}
          </select>
        </label>
        <div className="row gap">
          <div className="grow"><Field label="Date" type="date" value={date} onChange={setDate} /></div>
          <div className="grow"><Field label="Doors" type="time" value={time} onChange={setTime} /></div>
        </div>
        <Field label="Ticket price ($, 0 for free)" inputMode="numeric" value={price} onChange={v => setPrice(v.replace(/[^\d]/g, ''))} />
        <div className="form-field">
          <span>Genres</span>
          <div className="chip-row wrap flush">
            {GENRES.filter(g => g !== 'A little of everything').map(g => (
              <Chip key={g} active={genres.includes(g)} onClick={() => setGenres(gs => (gs.includes(g) ? gs.filter(x => x !== g) : [...gs, g]))}>{g}</Chip>
            ))}
          </div>
        </div>
        <div className="form-field">
          <span>Supporting acts</span>
          <div className="chip-row wrap flush">
            {cat.bands.filter(b => b.id !== MY_BAND_ID).map(b => (
              <Chip key={b.id} active={lineup.includes(b.id)} onClick={() => setLineup(l => (l.includes(b.id) ? l.filter(x => x !== b.id) : [...l, b.id]))}>{b.name}</Chip>
            ))}
          </div>
        </div>
        <button className="primary-btn" type="submit">Publish show</button>
        <p className="muted small center">Fans following {state.profile.artistName || 'you'} will see it in Plugged.</p>
      </form>
    </Screen>
  )
}
