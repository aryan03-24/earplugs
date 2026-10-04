import { useEffect, useState } from 'react'
import { Sheet } from '../../components/ui'
import { FRIENDS } from '../../data/seed'
import { useCatalog } from '../../state/catalog'
import { sideOf, useStore } from '../../state/store'
import { isPastDate } from '../../lib/format'
import { resizeImage, toast, uid } from '../../lib/native'

// Demo timings standing in for the other side (friends, venues) responding.
const FRIEND_ACCEPT_MS = 15_000
const VENUE_APPROVE_MS = 45_000
const ATTENDANCE_REPLY_MS = 20_000
const MAX_VIDEO_BYTES = 3_000_000

function notify(title: string, body: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: '/icons/icon-192.png' })
  } catch { /* some browsers only allow notifications from a service worker */ }
}

/** Runs simulated responses from friends and venues while the app is open. */
export function Simulations() {
  const { state, acceptFriend, updateShow } = useStore()
  const cat = useCatalog()

  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      for (const f of state.friends) {
        if (f.status === 'requested' && now - new Date(f.at).getTime() > FRIEND_ACCEPT_MS) {
          acceptFriend(f.id)
          const who = FRIENDS.find(x => x.id === f.id)?.name ?? 'Your friend'
          toast(`${who} accepted your friend request`)
          notify('New friend on EarPlug', `${who} accepted your friend request`)
        }
      }
      for (const s of state.myShows) {
        if (s.venueApproval === 'pending' && s.approvalRequestedAt && now - new Date(s.approvalRequestedAt).getTime() > VENUE_APPROVE_MS) {
          updateShow(s.id, { venueApproval: 'approved', draft: false, publishedAt: new Date().toISOString() })
          toast(`${cat.venue(s.venueId).name} approved ${s.title}`)
          notify('Gig approved', `${cat.venue(s.venueId).name} approved ${s.title}. It’s now live for fans.`)
        }
        if (s.attendanceRequestedAt && s.attendance == null && now - new Date(s.attendanceRequestedAt).getTime() > ATTENDANCE_REPLY_MS) {
          const v = cat.venue(s.venueId)
          const estimate = Math.round(v.capacity * (0.55 + (s.id.length % 4) * 0.08))
          updateShow(s.id, { attendance: estimate })
          toast(`${v.name} sent attendance for ${s.title}`)
        }
      }
    }
    const t = window.setInterval(tick, 3000)
    tick()
    return () => window.clearInterval(t)
  }, [state.friends, state.myShows, acceptFriend, updateShow, cat])

  return null
}

/**
 * After a fan has been to a show (checked in, or the show has passed), ask them once
 * to add a photo or video from it. It shows on their profile and on the artist's page.
 */
export function MediaPrompt() {
  const { state, addMedia, markMediaPrompted } = useStore()
  const cat = useCatalog()
  const [busy, setBusy] = useState(false)
  const [notified, setNotified] = useState(false)

  const pending = sideOf(state.profile) === 'fan' && state.profile.signedIn
    ? state.tickets
        .filter(t => !t.transferredTo && !state.mediaPrompted.includes(t.showId))
        .map(t => cat.anyShow(t.showId))
        .find(s => s && !s.cancelled && (isPastDate(s.date) || state.checkins[s.id]?.length && state.tickets.some(t => t.showId === s.id && state.checkins[s.id].includes(t.code))))
    : undefined

  useEffect(() => {
    if (pending && !notified) {
      notify('How was the show?', `Add a photo or video from ${pending.title} to your EarPlug page.`)
      setNotified(true)
    }
  }, [pending, notified])

  if (!pending) return null
  const band = cat.band(pending.bandIds[0])

  const upload = async (f?: File) => {
    if (!f) return
    setBusy(true)
    try {
      const isVideo = f.type.startsWith('video/')
      if (isVideo && f.size > MAX_VIDEO_BYTES) { toast('That video is too large for the demo. Try a shorter clip or a photo.'); return }
      const url = isVideo ? await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f) }) : await resizeImage(f, 1000)
      addMedia({ id: uid('media'), url, kind: isVideo ? 'video' : 'image', showId: pending.id, at: new Date().toISOString() })
      markMediaPrompted(pending.id)
      toast(`Added to your page and ${band?.name ?? 'the artist'}’s page`)
    } finally { setBusy(false) }
  }

  return (
    <Sheet open onClose={() => markMediaPrompted(pending.id)} title="How was the show?">
      <p className="muted">Add a photo or video of you at <b>{pending.title}</b>. It’ll show on your profile and on {band?.name ?? 'the artist'}’s page under this gig.</p>
      <label className={`primary-btn as-link${busy ? ' disabled' : ''}`}>
        {busy ? 'Uploading…' : 'Add photo or video'}
        <input type="file" accept="image/*,video/*" hidden disabled={busy} onChange={e => upload(e.target.files?.[0])} />
      </label>
      <button className="secondary-btn" onClick={() => markMediaPrompted(pending.id)}>Not now</button>
    </Sheet>
  )
}
