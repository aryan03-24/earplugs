import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider, useStore } from './store'
import Welcome from './screens/Welcome'
import Setup from './screens/Setup'
import Explore from './screens/Explore'
import Search from './screens/Search'
import MoreGigs from './screens/MoreGigs'
import ShowPage from './screens/ShowPage'
import BandPage from './screens/BandPage'
import Profile from './screens/Profile'
import Analytics from './screens/Analytics'
import Pitch from './screens/Pitch'

function RequireOnboarded({ children }: { children: ReactNode }) {
  const { state } = useStore()
  return state.profile.onboarded ? children : <Navigate to="/" replace />
}

function Start() {
  const { state } = useStore()
  if (state.profile.onboarded) return <Navigate to={state.profile.role === 'musician' ? '/analytics' : '/explore'} replace />
  return <Welcome />
}

export default function App() {
  const guard = (el: ReactNode) => <RequireOnboarded>{el}</RequireOnboarded>
  return (
    <StoreProvider>
      <BrowserRouter>
        <div className="device">
          <Routes>
            <Route path="/" element={<Start />} />
            <Route path="/setup/:step" element={<Setup />} />
            <Route path="/explore" element={guard(<Explore />)} />
            <Route path="/search" element={guard(<Search />)} />
            <Route path="/gigs" element={guard(<MoreGigs />)} />
            <Route path="/show/:id" element={guard(<ShowPage />)} />
            <Route path="/band/:id" element={guard(<BandPage />)} />
            <Route path="/profile" element={guard(<Profile />)} />
            <Route path="/analytics" element={guard(<Analytics />)} />
            <Route path="/pitch" element={guard(<Pitch />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </StoreProvider>
  )
}
