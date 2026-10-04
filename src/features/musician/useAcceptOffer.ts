import { useStore } from '../../state/store'
import { MY_BAND_ID, offerDate, useCatalog } from '../../state/catalog'
import { haptic, toast, uid } from '../../lib/native'
import type { Application } from '../../types'

/** Accepting an offer books the show and publishes it to fans in Explore. */
export function useAcceptOffer() {
  const { addShow, updateApplication } = useStore()
  const cat = useCatalog()
  return (a: Application) => {
    const venue = cat.venue(a.venueId)
    const showId = uid('show')
    addShow({
      id: showId,
      title: `${a.actName} at ${venue.name.replace(/^The /, '')}`,
      venueId: a.venueId,
      bandIds: [MY_BAND_ID],
      date: offerDate(a),
      price: 10,
      genres: a.genres.length ? a.genres : ['Indie'],
      hue: venue.hue,
      plugging: 0,
      createdByMe: true,
      loadIn: '17:00',
    })
    updateApplication(a.id, {
      decided: 'Booked',
      showId,
      messages: [...a.messages, { from: 'me', text: 'We accept — thank you! See you there.', at: new Date().toISOString() }],
    })
    haptic(20)
    toast('Booked! Your show is now live for fans.')
  }
}
