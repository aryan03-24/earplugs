import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider, useStore } from './state/store'
import type { Role } from './types'
import Welcome from './features/onboarding/Welcome'
import Setup from './features/onboarding/Setup'
const Explore = lazy(() => import('./features/discover/Explore'))
const Search = lazy(() => import('./features/discover/Search'))
const MoreGigs = lazy(() => import('./features/discover/MoreGigs'))
const ShowPage = lazy(() => import('./features/discover/ShowPage'))
const BandPage = lazy(() => import('./features/discover/BandPage'))
const VenuePage = lazy(() => import('./features/discover/VenuePage'))
const Profile = lazy(() => import('./features/fan/Profile'))
const Plugged = lazy(() => import('./features/fan/Plugged'))
const Tickets = lazy(() => import('./features/fan/Tickets'))
const Analytics = lazy(() => import('./features/musician/Analytics'))
const Pitch = lazy(() => import('./features/musician/Pitch'))
const Bookings = lazy(() => import('./features/musician/Bookings'))
const ApplicationDetail = lazy(() => import('./features/musician/ApplicationDetail'))
const GetBooked = lazy(() => import('./features/musician/GetBooked'))
const NewShow = lazy(() => import('./features/musician/NewShow'))

/** Requires a finished onboarding, and optionally a specific persona. */
function Guard({ children, role }: { children: ReactNode; role?: Role }) {
  const { state } = useStore()
  const p = state.profile
  if (!p.onboarded) return <Navigate to="/" replace />
  if (role && p.role !== role) return <Navigate to={home(p.role)} replace />
  return children
}

const home = (role: Role | null) => (role === 'musician' ? '/analytics' : '/explore')

function Start() {
  const { state } = useStore()
  return state.profile.onboarded ? <Navigate to={home(state.profile.role)} replace /> : <Welcome />
}

const any = (el: ReactNode) => <Guard>{el}</Guard>
const fan = (el: ReactNode) => <Guard role="fan">{el}</Guard>
const musician = (el: ReactNode) => <Guard role="musician">{el}</Guard>

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <div className="device">
          <Suspense fallback={<div className="screen loading" aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<Start />} />
            <Route path="/setup/:step" element={<Setup />} />

            {/* Shared discovery */}
            <Route path="/explore" element={any(<Explore />)} />
            <Route path="/search" element={any(<Search />)} />
            <Route path="/gigs" element={any(<MoreGigs />)} />
            <Route path="/show/:id" element={any(<ShowPage />)} />
            <Route path="/band/:id" element={any(<BandPage />)} />
            <Route path="/venue/:id" element={any(<VenuePage />)} />
            <Route path="/profile" element={any(<Profile />)} />

            {/* Fan */}
            <Route path="/plugged" element={fan(<Plugged />)} />
            <Route path="/tickets" element={any(<Tickets />)} />

            {/* Musician */}
            <Route path="/analytics" element={musician(<Analytics />)} />
            <Route path="/pitch" element={musician(<Pitch />)} />
            <Route path="/bookings" element={musician(<Bookings />)} />
            <Route path="/bookings/apply" element={musician(<GetBooked />)} />
            <Route path="/bookings/new-show" element={musician(<NewShow />)} />
            <Route path="/bookings/:id" element={musician(<ApplicationDetail />)} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </StoreProvider>
  )
}
