import { useNavigate } from 'react-router-dom'
import { Sheet } from '../../components/ui'
import { useStore } from '../../state/store'

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate()
  const { state, updateProfile, signOut, reset } = useStore()
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

      <button className="danger-btn" onClick={() => { reset(); nav('/', { replace: true }) }}>Delete account & data</button>
    </Sheet>
  )
}
