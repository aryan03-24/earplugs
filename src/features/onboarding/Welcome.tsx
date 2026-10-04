import { useNavigate } from 'react-router-dom'
import bg from '../../assets/landing-bg.jpg'
import { Logo } from '../../components/ui'
import { haptic } from '../../lib/native'

/** Login Screen from the Figma: wordmark, tagline, Sign Up / Log In. */
export default function Welcome() {
  const nav = useNavigate()
  return (
    <div className="screen landing" style={{ backgroundImage: `url(${bg})` }}>
      <div className="landing-shade" />
      <div className="landing-content">
        <Logo size={96} />
        <h1 className="wordmark">EarPlug</h1>
        <p className="tagline">Listen Local</p>
        <div className="landing-actions">
          <button className="pill-primary" onClick={() => { haptic(); nav('/start') }}>SIGN UP</button>
          <button className="pill-outline" onClick={() => { haptic(); nav('/login') }}>LOG IN</button>
        </div>
      </div>
    </div>
  )
}
