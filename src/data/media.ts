// Real show photography (served from /public/media). Grouped by who/what is in the shot.
const m = (n: number) => `/media/p${n}.jpg`

/** The four-piece in the blue hoodie / racing jacket: vocals + guitar, Jazzmaster, bass, drums. */
export const SOBO = {
  hero: m(45), // full band + crowd
  group: m(40),
  members: [m(38), m(27), m(30), m(41)], // singer, guitarist, drummer, bassist + singer
  clips: [m(17), m(18), m(39), m(44), m(22), m(28)],
  more: [m(19), m(20), m(21), m(23), m(24), m(25), m(26), m(31), m(32), m(42), m(46)],
}

/** Blonde vocalist + red Strat band. */
export const RED_STRAT = {
  hero: m(52),
  group: m(55),
  members: [m(54), m(59), m(60), m(57)],
  clips: [m(53), m(56), m(58), m(61), m(62)],
}

/** Varsity-jacket vocal group with keys and horns. */
export const VARSITY = {
  hero: m(15),
  group: m(8),
  members: [m(10), m(13), m(14), m(7)],
  clips: [m(9), m(11), m(12)],
}

/** Crowd and venue-wide shots. */
export const CROWD = [m(47), m(34), m(51), m(33), m(43), m(29), m(48), m(35), m(36), m(37), m(49), m(50), m(44)]

/** Wide shots used as each venue's photo. */
export const VENUE_PHOTO: Record<string, string> = {
  starry: m(47),
  parish: m(34),
  cornerstone: m(51),
  eli: m(33),
  gilman: m(43),
  bottom: m(29),
  freight: m(48),
}

/** Photos fans "posted" from past shows (show id → media). */
export const SEED_FAN_MEDIA: { id: string; url: string; showId: string }[] = [
  { id: 'fm1', url: m(50), showId: 'p1' },
  { id: 'fm2', url: m(36), showId: 'p1' },
  { id: 'fm3', url: m(35), showId: 'p2' },
  { id: 'fm4', url: m(37), showId: 'p2' },
  { id: 'fm5', url: m(49), showId: 'p3' },
  { id: 'fm6', url: m(46), showId: 'p3' },
]

/** Fallback for any frame that has no specific photo: a stable crowd shot picked from a number. */
export function fallbackPhoto(seed: number) {
  return CROWD[Math.abs(Math.round(seed)) % CROWD.length]
}

/** Images on the "Who are you?" circles. */
export const ROLE_PHOTO = { fan: m(50), musician: m(38) }
