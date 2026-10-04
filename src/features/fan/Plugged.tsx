import { useState } from 'react'
import { Empty, PageHeader, Screen, Segmented } from '../../components/ui'
import { BandGrid, GigRow } from '../../components/cards'
import { MY_BAND_ID, useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import type { Band } from '../../types'
import { isPastDate } from '../../lib/format'

const TABS = ['Saved', 'Following', 'From Bands'] as const

/** Everything a fan has plugged into: saved gigs, followed bands, and those bands' upcoming shows. */
export default function Plugged() {
  const cat = useCatalog()
  const { state } = useStore()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Saved')

  const saved = state.saved.map(id => cat.show(id)).filter(s => !!s).sort((a, b) => a.date.localeCompare(b.date))
  const bands = state.following.map(id => cat.band(id)).filter((b): b is Band => !!b && b.id !== MY_BAND_ID)
  const fromBands = cat.upcoming.filter(s => s.bandIds.some(b => state.following.includes(b)))

  return (
    <Screen tabs>
      <PageHeader title="Plugged" />
      <div className="pad-x"><Segmented options={TABS} value={tab} onChange={setTab} full /></div>
      <div style={{ height: 16 }} />
      {tab === 'Saved' && (saved.length
        ? <div className="gig-list">{saved.map(s => <div key={s.id} className={isPastDate(s.date) ? 'faded' : ''}><GigRow show={s} /></div>)}</div>
        : <Empty>Tap the bookmark on any gig to save it here.</Empty>)}
      {tab === 'Following' && (bands.length ? <BandGrid bands={bands} /> : <Empty>Follow bands from their profile or a show’s lineup.</Empty>)}
      {tab === 'From Bands' && (fromBands.length
        ? <div className="gig-list">{fromBands.map(s => <GigRow key={s.id} show={s} />)}</div>
        : <Empty>Upcoming shows from bands you follow will appear here.</Empty>)}
    </Screen>
  )
}
