// Sample analytics for the musician dashboard and pitch report.

export const RANGES = ['7D', '30D', '12M', 'All'] as const
export type Range = (typeof RANGES)[number]

export interface KeyStats {
  attendance: number; attendDelta: number
  showUp: number; showUpDelta: number
  repeat: number; repeatDelta: number
  newFans: number; newFansDelta: number
  earnings: number; earnDelta: number; avgTicket: number
  shows: number; showsDelta: number; venues: number
}

export const KEY_STATS: Record<Range, KeyStats> = {
  '7D': { attendance: 104, attendDelta: 9, showUp: 76, showUpDelta: 4, repeat: 22, repeatDelta: 2, newFans: 22, newFansDelta: 6, earnings: 312, earnDelta: 4, avgTicket: 8, shows: 1, showsDelta: 0, venues: 1 },
  '30D': { attendance: 86, attendDelta: 12, showUp: 72, showUpDelta: 5, repeat: 20, repeatDelta: 3, newFans: 140, newFansDelta: 18, earnings: 1240, earnDelta: 9, avgTicket: 8, shows: 6, showsDelta: -1, venues: 4 },
  '12M': { attendance: 71, attendDelta: 31, showUp: 68, showUpDelta: 9, repeat: 17, repeatDelta: 6, newFans: 980, newFansDelta: 44, earnings: 11380, earnDelta: 52, avgTicket: 7, shows: 48, showsDelta: 12, venues: 15 },
  All: { attendance: 64, attendDelta: 0, showUp: 66, showUpDelta: 0, repeat: 15, repeatDelta: 0, newFans: 1210, newFansDelta: 0, earnings: 14020, earnDelta: 0, avgTicket: 7, shows: 61, showsDelta: 0, venues: 18 },
}

export type Metric = 'attendance' | 'showUp' | 'repeat' | 'newFans' | 'earnings' | 'shows'

export const METRIC_LABEL: Record<Metric, string> = {
  attendance: 'Avg. attendance', showUp: 'Show-up rate', repeat: 'Repeat fans',
  newFans: 'New fans', earnings: 'Earnings', shows: 'Attendance',
}

export interface Point { label: string; venue: string; attendance: number; showUp: number; repeat: number; newFans: number; earnings: number; prev: Record<Metric, number> }

const P = (label: string, venue: string, attendance: number, showUp: number, repeat: number, newFans: number, earnings: number, prev: [number, number, number, number, number]): Point => ({
  label, venue, attendance, showUp, repeat, newFans, earnings,
  prev: { attendance: prev[0], showUp: prev[1], repeat: prev[2], newFans: prev[3], earnings: prev[4], shows: prev[0] },
})

/** One point per show in the last 30 days. */
export const SERIES: Point[] = [
  P('Sep 5', 'Cornerstone', 62, 64, 16, 14, 150, [58, 60, 15, 12, 140]),
  P('Sep 10', 'The New Parish', 70, 68, 18, 20, 182, [66, 63, 16, 15, 160]),
  P('Sep 14', 'The Starry Plough', 78, 71, 19, 24, 205, [60, 62, 15, 13, 150]),
  P('Sep 19', 'Cornerstone', 74, 67, 21, 12, 198, [72, 66, 17, 18, 190]),
  P('Sep 23', 'The New Parish', 95, 79, 22, 31, 285, [70, 65, 18, 16, 175]),
  P('Sep 27', 'The Starry Plough', 104, 84, 24, 22, 312, [77, 69, 18, 19, 200]),
]

export interface PerfRow { name: string; shows: number; rsvps: number; attended: number; venues: string[] }

export const CITY_PERF: PerfRow[] = [
  { name: 'Oakland', shows: 2, rsvps: 180, attended: 151, venues: ['The New Parish · 95', 'The New Parish · 56'] },
  { name: 'Berkeley', shows: 3, rsvps: 240, attended: 178, venues: ['The Starry Plough · 104', 'Cornerstone · 74', 'Cornerstone · 62'] },
  { name: 'San Francisco', shows: 1, rsvps: 160, attended: 98, venues: ['Bottom of the Hill · 98'] },
]
export const VENUE_PERF: PerfRow[] = [
  { name: 'The Starry Plough', shows: 2, rsvps: 130, attended: 112, venues: ['Sep 27 · 104', 'Sep 14 · 78'] },
  { name: 'The New Parish', shows: 2, rsvps: 140, attended: 117, venues: ['Sep 23 · 95', 'Sep 10 · 70'] },
  { name: 'Cornerstone', shows: 1, rsvps: 110, attended: 74, venues: ['Sep 19 · 74'] },
  { name: 'Bottom of the Hill', shows: 1, rsvps: 160, attended: 98, venues: ['Aug 30 · 98'] },
]

export const RECENT_SHOWS = [
  { month: 'SEP', day: 27, venue: 'The Starry Plough', city: 'Berkeley', attended: 104, newFans: 22, earnings: 312 },
  { month: 'SEP', day: 23, venue: 'The New Parish', city: 'Oakland', attended: 95, newFans: 31, earnings: 285 },
  { month: 'SEP', day: 19, venue: 'Cornerstone', city: 'Berkeley', attended: 74, newFans: 12, earnings: 198 },
  { month: 'SEP', day: 14, venue: 'The Starry Plough', city: 'Berkeley', attended: 78, newFans: 24, earnings: 205 },
  { month: 'SEP', day: 10, venue: 'The New Parish', city: 'Oakland', attended: 70, newFans: 20, earnings: 182 },
  { month: 'SEP', day: 5, venue: 'Cornerstone', city: 'Berkeley', attended: 62, newFans: 14, earnings: 150 },
]

export const FAN_CITIES = [
  { name: 'Berkeley', pct: 48 },
  { name: 'Oakland', pct: 27 },
  { name: 'San Francisco', pct: 25 },
]

export const rate = (r: PerfRow) => Math.round((r.attended / r.rsvps) * 100)
