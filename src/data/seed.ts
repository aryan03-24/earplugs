// Sample content for the prototype. Swap for API calls when a backend exists.
import live1 from '../assets/live1.jpg'
import live2 from '../assets/live2.jpg'
import type { Application, Band, Friend, Show, Venue } from '../types'

export const GENRES = [
  'Hiphop', 'Pop', 'R&B', 'Jazz', 'Country', 'Punk', 'Classical',
  'K-pop', 'EDM', 'Blues', 'Indie', 'Alternative', 'Rock', 'A little of everything',
]

export const VENUES: Venue[] = [
  { id: 'starry', name: 'The Starry Plough', city: 'Berkeley', address: '3101 Shattuck Ave', lat: 37.8553, lng: -122.2669, capacity: 150, ages: '21+', hue: 215 },
  { id: 'parish', name: 'The New Parish', city: 'Oakland', address: '1743 San Pablo Ave', lat: 37.8066, lng: -122.2735, capacity: 400, ages: '18+', hue: 265 },
  { id: 'cornerstone', name: 'Cornerstone', city: 'Berkeley', address: '2367 Shattuck Ave', lat: 37.8669, lng: -122.2678, capacity: 600, ages: 'All ages', hue: 20 },
  { id: 'eli', name: "Eli's Mile High Club", city: 'Oakland', address: '3629 MLK Jr Way', lat: 37.8278, lng: -122.2709, capacity: 120, ages: '21+', hue: 340 },
  { id: 'gilman', name: '924 Gilman', city: 'Berkeley', address: '924 Gilman St', lat: 37.8796, lng: -122.2993, capacity: 300, ages: 'All ages', hue: 110 },
  { id: 'bottom', name: 'Bottom of the Hill', city: 'San Francisco', address: '1233 17th St', lat: 37.765, lng: -122.3963, capacity: 350, ages: '21+', hue: 190 },
  { id: 'freight', name: 'Freight & Salvage', city: 'Berkeley', address: '2020 Addison St', lat: 37.871, lng: -122.269, capacity: 440, ages: 'All ages', hue: 45 },
]

export const BANDS: Band[] = [
  { id: 'sobo', name: 'SOBO', genres: ['Indie', 'Alternative', 'Rock'], city: 'Berkeley, CA', tagline: 'Suns Out Buns Out', bio: 'SOBO is a band from UC Berkeley made up of Matthew Fehr (Drums), Mathew Dip (Lead Guitar), Gala Basco (Lead Vocals + Rhythm Guitar), & Anandi Joshi (Bass Guitar).', followers: 640, hue: 230, photo: live1, media: [live1, live2] },
  { id: 'youthquake', name: 'YouthQuake', genres: ['Punk', 'Rock'], city: 'Oakland, CA', tagline: 'Loud, fast, local', bio: 'Four-piece East Bay punk band playing basements and back rooms since 2024.', followers: 412, hue: 0, media: [] },
  { id: 'velvet', name: 'Velvet Static', genres: ['Indie', 'Pop'], city: 'Berkeley, CA', tagline: 'Dream pop for night drives', bio: 'Hazy guitars, big choruses, and a drum machine named Gary.', followers: 289, hue: 290, media: [] },
  { id: 'lowtide', name: 'Low Tide Choir', genres: ['Jazz', 'R&B'], city: 'San Francisco, CA', tagline: 'Neo-soul collective', bio: 'A rotating cast of SF musicians blending jazz harmony with R&B grooves.', followers: 905, hue: 190, media: [] },
  { id: 'mosspit', name: 'Moss Pit', genres: ['Punk', 'Alternative'], city: 'Berkeley, CA', tagline: 'Garden-variety punk', bio: 'Three friends, two chords, one van that mostly works.', followers: 158, hue: 120, media: [] },
  { id: 'kilowatt', name: 'Kilowatt Kids', genres: ['EDM', 'Pop'], city: 'Oakland, CA', tagline: 'Bedroom bangers', bio: 'Live electronic duo with synths, samplers, and too many cables.', followers: 733, hue: 50, media: [] },
  { id: 'dustbowl', name: 'Dust Bowl Revival', genres: ['Country', 'Blues'], city: 'Berkeley, CA', tagline: 'Porch songs, amplified', bio: 'Americana trio with banjo, slide guitar and three-part harmonies.', followers: 377, hue: 30, media: [] },
  { id: 'versefive', name: 'Verse Five', genres: ['Hiphop', 'R&B'], city: 'Oakland, CA', tagline: 'Bay Area bars', bio: 'Hip-hop crew with a live band backing every set.', followers: 1204, hue: 330, media: [] },
  { id: 'seoulmate', name: 'Seoul Mate', genres: ['K-pop', 'Pop'], city: 'San Francisco, CA', tagline: 'Bilingual bops', bio: 'Five-piece K-pop cover and originals group from SF State.', followers: 862, hue: 310, media: [] },
  { id: 'quartet', name: 'Addison Quartet', genres: ['Classical', 'Jazz'], city: 'Berkeley, CA', tagline: 'Strings, unplugged', bio: 'Berkeley conservatory students reimagining pop songs for string quartet.', followers: 221, hue: 170, media: [] },
]

export const FRIENDS: Friend[] = [
  { id: 'f1', name: 'Maya Chen', handle: '@mayac', hue: 200 },
  { id: 'f2', name: 'Jordan Reyes', handle: '@jreyes', hue: 20 },
  { id: 'f3', name: 'Priya Natarajan', handle: '@priyan', hue: 280 },
  { id: 'f4', name: 'Sam Okafor', handle: '@samo', hue: 120 },
  { id: 'f5', name: 'Leo Martins', handle: '@leom', hue: 45 },
  { id: 'f6', name: 'Ava Kim', handle: '@avak', hue: 330 },
  { id: 'f7', name: 'Diego Flores', handle: '@dflo', hue: 160 },
  { id: 'f8', name: 'Nora Patel', handle: '@norap', hue: 240 },
]

function day(offset: number, hour: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const SHOWS: Show[] = [
  { id: 's1', title: 'Sunset Sessions', venueId: 'starry', bandIds: ['sobo', 'velvet'], date: day(0, 19), price: 0, genres: ['Indie', 'Alternative', 'Rock'], hue: 230, plugging: 8 },
  { id: 's2', title: 'Basement Riot', venueId: 'gilman', bandIds: ['youthquake', 'mosspit'], date: day(0, 20), price: 12, genres: ['Punk', 'Rock'], hue: 0, plugging: 3 },
  { id: 's3', title: 'Neo Soul Night', venueId: 'freight', bandIds: ['lowtide'], date: day(1, 20), price: 18, genres: ['Jazz', 'R&B'], hue: 190, plugging: 5 },
  { id: 's4', title: 'Synth City', venueId: 'parish', bandIds: ['kilowatt'], date: day(2, 21), price: 15, genres: ['EDM', 'Pop'], hue: 50, plugging: 11 },
  { id: 's5', title: 'Porch Light', venueId: 'cornerstone', bandIds: ['dustbowl'], date: day(3, 19), price: 0, genres: ['Country', 'Blues'], hue: 30, plugging: 2 },
  { id: 's6', title: 'Bars & Brass', venueId: 'eli', bandIds: ['versefive', 'lowtide'], date: day(4, 21), price: 10, genres: ['Hiphop', 'R&B'], hue: 330, plugging: 6 },
  { id: 's7', title: 'SOBO Live in SF', venueId: 'bottom', bandIds: ['sobo'], date: day(6, 20), price: 10, genres: ['Indie', 'Alternative', 'Rock'], hue: 250, plugging: 14 },
  { id: 's8', title: 'Dream Pop Drive', venueId: 'cornerstone', bandIds: ['velvet', 'kilowatt'], date: day(8, 20), price: 8, genres: ['Indie', 'Pop'], hue: 290, plugging: 4 },
  { id: 's9', title: 'Gilman All-Ages', venueId: 'gilman', bandIds: ['mosspit', 'youthquake', 'sobo'], date: day(10, 18), price: 0, genres: ['Punk', 'Alternative'], hue: 120, plugging: 9 },
  { id: 's10', title: 'Late Night Jazz', venueId: 'freight', bandIds: ['lowtide', 'quartet'], date: day(12, 22), price: 20, genres: ['Jazz', 'Classical'], hue: 200, plugging: 1 },
  { id: 's11', title: 'K-Pop Takeover', venueId: 'parish', bandIds: ['seoulmate'], date: day(5, 20), price: 14, genres: ['K-pop', 'Pop'], hue: 310, plugging: 7 },
  { id: 's12', title: 'Strings Attached', venueId: 'freight', bandIds: ['quartet'], date: day(9, 19), price: 0, genres: ['Classical'], hue: 170, plugging: 2 },
  // Past shows
  { id: 'p1', title: 'Fall Kickoff', venueId: 'starry', bandIds: ['sobo'], date: day(-6, 20), price: 8, genres: ['Indie', 'Rock'], hue: 220, plugging: 0 },
  { id: 'p2', title: 'Parish Presents', venueId: 'parish', bandIds: ['sobo', 'velvet'], date: day(-10, 20), price: 10, genres: ['Indie'], hue: 260, plugging: 0 },
  { id: 'p3', title: 'Cornerstone Locals', venueId: 'cornerstone', bandIds: ['sobo'], date: day(-14, 19), price: 6, genres: ['Rock'], hue: 210, plugging: 0 },
]

function isoDay(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

/** Applications a musician account starts with, so every tab has something in it. */
export function seedApplications(actName: string): Application[] {
  const base = {
    actName, email: 'band@example.com', members: '4', website: '', draw: '80–100',
    soundsLike: 'Arctic Monkeys, Alvvays, The Strokes', videos: [], genres: ['Indie', 'Rock'],
    lastShows: 'The Starry Plough (104), The New Parish (95), Cornerstone (74)', bill: 'Velvet Static, Moss Pit',
  }
  return [
    {
      ...base, id: 'app_seed1', venueId: 'eli', createdAt: new Date(Date.now() - 4 * 86400e3).toISOString(),
      targetStart: isoDay(21), targetEnd: isoDay(23), decided: 'Offered', offerDate: new Date(`${isoDay(22)}T20:00:00`).toISOString(),
      messages: [
        { from: 'me', text: 'Hi! We’d love to play a Friday at Eli’s. Our last three shows averaged ~90 people.', at: new Date(Date.now() - 4 * 86400e3).toISOString() },
        { from: 'venue', text: 'Love the clips. We can offer a Saturday headliner slot, $10 door split 70/30. Interested?', at: new Date(Date.now() - 1 * 86400e3).toISOString() },
      ],
    },
    {
      ...base, id: 'app_seed2', venueId: 'freight', createdAt: new Date(Date.now() - 2 * 86400e3).toISOString(),
      targetStart: isoDay(30), targetEnd: isoDay(32), decided: 'Under review',
      messages: [{ from: 'me', text: 'Applying for an all-ages weekend slot in early November.', at: new Date(Date.now() - 2 * 86400e3).toISOString() }],
    },
    {
      ...base, id: 'app_seed3', venueId: 'gilman', createdAt: new Date(Date.now() - 9 * 86400e3).toISOString(),
      targetStart: isoDay(-2), targetEnd: isoDay(0), decided: 'Declined',
      messages: [
        { from: 'me', text: 'Would love to join an all-ages bill!', at: new Date(Date.now() - 9 * 86400e3).toISOString() },
        { from: 'venue', text: 'Thanks for reaching out — we’re booked through the month. Try us again in December!', at: new Date(Date.now() - 6 * 86400e3).toISOString() },
      ],
    },
  ]
}
