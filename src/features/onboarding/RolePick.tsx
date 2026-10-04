import { useNavigate } from 'react-router-dom'
import { BackButton, Logo } from '../../components/ui'
import { Mic, User } from '../../components/icons'
import { useStore } from '../../state/store'
import { haptic } from '../../lib/native'
import { ROLE_PHOTO } from '../../data/media'
import type { Role } from '../../types'

/** Login Screen 2 from the Figma: "Who are you?" */
export default function RolePick() {
  const nav = useNavigate()
  const { state, updateProfile } = useStore()

  const pick = (role: Role) => {
    haptic(15)
    // Starting a new sign-up replaces any half-finished one.
    if (state.profile.role !== role) updateProfile({ role, genres: [] })
    nav('/setup/0')
  }

  return (
    <div className="screen role-pick">
      <div className="pad-x top-bar"><BackButton to="/" /></div>
      <div className="role-content">
        <Logo size={72} />
        <h1>Who are you?</h1>
        <div className="role-options">
          {([['fan', 'Fan', <User key="u" size={44} />], ['musician', 'Musician', <Mic key="m" size={44} />]] as const).map(([role, label, icon]) => (
            <button key={role} className="role-option" onClick={() => pick(role)}>
              <span className="role-label">{label}</span>
              <span className="role-circle" style={{ backgroundImage: `url(${ROLE_PHOTO[role]})` }} aria-hidden>{icon}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
