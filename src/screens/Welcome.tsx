import { useNavigate } from 'react-router-dom'
import bg from '../assets/login-bg.png'
import { useStore, type Role } from '../store'

export default function Welcome() {
  const nav = useNavigate()
  const { updateProfile } = useStore()

  const pick = (role: Role) => {
    updateProfile({ role })
    nav('/setup/0')
  }

  return (
    <div className="screen welcome" style={{ backgroundImage: `url(${bg})` }}>
      <div className="welcome-fade" />
      <div className="welcome-actions">
        <button onClick={() => pick('fan')}>Fan</button>
        <button onClick={() => pick('musician')}>Musician</button>
      </div>
      <p className="welcome-hint">Choose how you want to plug in</p>
    </div>
  )
}
