import { useNavigate } from 'react-router-dom'
import { Sheet } from '../../components/ui'
import { useStore } from '../../state/store'
import { toast } from '../../lib/native'

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate()
  const { state, updateProfile, signOut, reset, switchRole } = useStore()
  const p = state.profile
  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <label className="row between center-v sheet-row">
        <span>Notifications</span>
        <input type="checkbox" className="switch" checked={p.notifications} onChange={e => updateProfile({ notifications: e.target.checked })} />
      </label>
      <div className="row between sheet-row"><span>Phone</span><span className="muted">{p.phone || '—'}</span></div>
      <div className="row between sheet-row"><span>Account</span><span className="muted">{p.role === 'musician' ? 'Musician' : 'Fan'}</span></div>
      <button className="secondary-btn" onClick={() => { signOut(); onClose(); nav('/', { replace: true }) }}>Log out</button>

      <div className="demo-box">
        <div className="muted small">Demo tools</div>
        <button className="link small" onClick={() => {
          const to = p.role === 'musician' ? 'fan' : 'musician'
          switchRole(to); onClose(); toast(`Viewing as a ${to}`)
          nav(to === 'musician' ? '/gigs' : '/explore', { replace: true })
        }}>Preview the {p.role === 'musician' ? 'fan' : 'musician'} side with this data</button>
      </div>
      <button className="danger-btn" onClick={() => { reset(); nav('/', { replace: true }) }}>Delete account & data</button>
    </Sheet>
  )
}
