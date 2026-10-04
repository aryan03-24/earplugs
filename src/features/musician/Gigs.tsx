import { Link, useSearchParams } from 'react-router-dom'
import { Logo, Screen, Segmented } from '../../components/ui'
import { Plus } from '../../components/icons'
import { LocationTag } from '../discover/shared'
import FindGigs from './FindGigs'
import MyShows from './MyShows'

const TABS = ['Find gigs', 'My shows'] as const

/** Gigs Page 1 & 2 from the Figma. */
export default function Gigs() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'shows' ? 'My shows' : 'Find gigs'
  return (
    <Screen tabs>
      <header className="page-header">
        <Logo />
        <div className="row between center-v">
          <h1 className="large-title">Gigs</h1>
          {tab === 'My shows'
            ? <Link to="/host/new" className="new-show-btn"><Plus size={16} /> New show</Link>
            : <LocationTag />}
        </div>
        <Segmented options={TABS} value={tab} onChange={t => setParams(t === 'My shows' ? { tab: 'shows' } : {}, { replace: true })} full />
      </header>
      {tab === 'Find gigs' ? <FindGigs /> : <MyShows />}
    </Screen>
  )
}
