import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { sideOf, StoreProvider, useStore } from './state/store'
import type { Profile, Role } from './types'
import Welcome from './features/onboarding/Welcome'
import RolePick from './features/onboarding/RolePick'
import Login from './features/onboarding/Login'
import Setup from './features/onboarding/Setup'
import { MediaPrompt, Simulations } from './features/account/Background'

// Shared discovery
const Explore = lazy(() => import('./features/discover/Explore'))
const Search = lazy(() => import('./features/discover/Search'))
const MoreGigs = lazy(() => import('./features/discover/MoreGigs'))
const ShowPage = lazy(() => import('./features/discover/ShowPage'))
const BandPage = lazy(() => import('./features/discover/BandPage'))
const VenuePage = lazy(() => import('./features/discover/VenuePage'))
const Profile = lazy(() => import('./features/fan/Profile'))
// Fan
const Plugged = lazy(() => import('./features/fan/Plugged'))
const Tickets = lazy(() => import('./features/fan/Tickets'))
const TicketPass = lazy(() => import('./features/fan/TicketPass'))
const SelectTickets = lazy(() => import('./features/fan/SelectTickets'))
const CheckoutPage = lazy(() => import('./features/fan/CheckoutPage'))
const OrderConfirmed = lazy(() => import('./features/fan/OrderConfirmed'))
// Musician
const Gigs = lazy(() => import('./features/musician/Gigs'))
const Analytics = lazy(() => import('./features/musician/Analytics'))
const Pitch = lazy(() => import('./features/musician/Pitch'))
const Bookings = lazy(() => import('./features/musician/Bookings'))
const ApplicationDetail = lazy(() => import('./features/musician/ApplicationDetail'))
const GetBooked = lazy(() => import('./features/musician/GetBooked'))
const HostGig = lazy(() => import('./features/musician/HostGig'))
const GigDashboard = lazy(() => import('./features/musician/GigDashboard'))
const DoorCheckin = lazy(() => import('./features/musician/DoorCheckin'))

const homeFor = (p: Profile) => (sideOf(p) === 'artist' ? '/gigs' : '/explore')

/** Requires a signed-in account, and optionally a specific persona. */
function Guard({ children, role }: { children: ReactNode; role?: Role }) {
  const { state } = useStore()
  const p = state.profile
  if (!p.onboarded || !p.signedIn) return <Navigate to="/" replace />
  // Fan screens follow the side being shown; artist screens need a musician account.
  if (role === 'fan' && sideOf(p) !== 'fan') return <Navigate to={homeFor(p)} replace />
  if (role === 'musician' && p.role !== 'musician') return <Navigate to={homeFor(p)} replace />
  return children
}

function SignedOutOnly({ children }: { children: ReactNode }) {
  const { state } = useStore()
  return state.profile.onboarded && state.profile.signedIn ? <Navigate to={homeFor(state.profile)} replace /> : children
}

const any = (el: ReactNode) => <Guard>{el}</Guard>
const fan = (el: ReactNode) => <Guard role="fan">{el}</Guard>
const musician = (el: ReactNode) => <Guard role="musician">{el}</Guard>

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <div className="device">
          <Simulations />
          <MediaPrompt />
          <Suspense fallback={<div className="screen loading" aria-busy="true" />}>
            <Routes>
              {/* Onboarding */}
              <Route path="/" element={<SignedOutOnly><Welcome /></SignedOutOnly>} />
              <Route path="/start" element={<SignedOutOnly><RolePick /></SignedOutOnly>} />
              <Route path="/login" element={<SignedOutOnly><Login /></SignedOutOnly>} />
              <Route path="/setup/:step" element={<Setup />} />

              {/* Shared discovery */}
              <Route path="/explore" element={fan(<Explore />)} />
              <Route path="/search" element={fan(<Search />)} />
              <Route path="/more" element={fan(<MoreGigs />)} />
              <Route path="/show/:id" element={any(<ShowPage />)} />
              <Route path="/band/:id" element={any(<BandPage />)} />
              <Route path="/venue/:id" element={any(<VenuePage />)} />
              <Route path="/profile" element={any(<Profile />)} />

              {/* Fan ticketing */}
              <Route path="/plugged" element={fan(<Plugged />)} />
              <Route path="/tickets" element={any(<Tickets />)} />
              <Route path="/tickets/:id" element={any(<TicketPass />)} />
              <Route path="/show/:id/tickets" element={any(<SelectTickets />)} />
              <Route path="/checkout" element={any(<CheckoutPage />)} />
              <Route path="/order/:orderId" element={any(<OrderConfirmed />)} />

              {/* Musician */}
              <Route path="/gigs" element={musician(<Gigs />)} />
              <Route path="/analytics" element={musician(<Analytics />)} />
              <Route path="/pitch" element={musician(<Pitch />)} />
              <Route path="/applications" element={musician(<Bookings />)} />
              <Route path="/bookings" element={<Navigate to="/applications" replace />} />
              <Route path="/bookings/apply" element={musician(<GetBooked />)} />
              <Route path="/bookings/:id" element={musician(<ApplicationDetail />)} />
              <Route path="/host/new" element={musician(<HostGig />)} />
              <Route path="/host/:id" element={musician(<GigDashboard />)} />
              <Route path="/host/:id/edit" element={musician(<HostGig />)} />
              <Route path="/host/:id/door" element={musician(<DoorCheckin />)} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </StoreProvider>
  )
}
