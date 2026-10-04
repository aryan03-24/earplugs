import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

const base = (size = 24, p: P) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  'aria-hidden': true, ...p,
})

// From Figma: dashicons:arrow-right-alt2
export const ChevronRight = ({ size = 20, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden {...p}>
    <path d="M6 15L11 10L6 5L7 3L14 10L7 17L6 15Z" />
  </svg>
)
export const ChevronLeft = ({ size = 20, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden {...p}>
    <path d="M14 15L9 10L14 5L13 3L6 10L13 17L14 15Z" />
  </svg>
)
// From Figma: fluent:home-16-regular
export const Home = ({ size = 32, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 44.5017 44.5017" fill="currentColor" aria-hidden {...p}>
    <path d="M20.3401 3.51007C20.8565 3.02184 21.5402 2.74981 22.2508 2.74981C22.9615 2.74981 23.6452 3.02184 24.1616 3.51007L37.6345 16.2459C38.4689 17.033 38.939 18.1317 38.939 19.2776V34.7697C38.939 35.8762 38.4994 36.9374 37.717 37.7198C36.9346 38.5022 35.8734 38.9418 34.767 38.9418H29.2042C28.6561 38.9418 28.1134 38.8338 27.607 38.6239C27.1007 38.4141 26.6406 38.1065 26.2532 37.7188C25.8657 37.3311 25.5585 36.8709 25.349 36.3644C25.1395 35.8579 25.0318 35.3151 25.0322 34.767V27.8136C25.0322 27.4447 24.8857 27.091 24.6249 26.8302C24.3641 26.5694 24.0104 26.4229 23.6415 26.4229H20.8602C20.4913 26.4229 20.1376 26.5694 19.8768 26.8302C19.616 27.091 19.4695 27.4447 19.4695 27.8136V34.767C19.4695 35.8734 19.0299 36.9346 18.2475 37.717C17.4651 38.4994 16.4039 38.939 15.2975 38.939H9.73475C8.62825 38.939 7.56708 38.4994 6.78467 37.717C6.00226 36.9346 5.56271 35.8734 5.56271 34.767V19.2748C5.56271 18.1289 6.03554 17.0302 6.86995 16.2431L20.3401 3.51007ZM22.2508 5.52934L8.77796 18.2679C8.64118 18.3976 8.53219 18.5537 8.45761 18.7268C8.38302 18.8999 8.34439 19.0863 8.34407 19.2748V34.767C8.34407 35.1358 8.49059 35.4895 8.75139 35.7503C9.01219 36.0111 9.36591 36.1576 9.73475 36.1576H15.2975C15.6663 36.1576 16.02 36.0111 16.2808 35.7503C16.5416 35.4895 16.6881 35.1358 16.6881 34.767V27.8136C16.6881 26.7071 17.1277 25.6459 17.9101 24.8635C18.6925 24.0811 19.7537 23.6415 20.8602 23.6415H23.6415C24.748 23.6415 25.8092 24.0811 26.5916 24.8635C27.374 25.6459 27.8136 26.7071 27.8136 27.8136V34.767C27.8136 35.1358 27.9601 35.4895 28.2209 35.7503C28.4817 36.0111 28.8354 36.1576 29.2042 36.1576H34.767C35.1358 36.1576 35.4895 36.0111 35.7503 35.7503C36.0111 35.4895 36.1576 35.1358 36.1576 34.767V19.2748C36.1577 19.0859 36.1192 18.8989 36.0446 18.7253C35.97 18.5517 35.8609 18.3952 35.7237 18.2652L22.2508 5.52934Z" />
  </svg>
)
export const Bookmark = ({ size = 24, filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size, p)} fill={filled ? 'currentColor' : 'none'}><path d="M6 3h12v18l-6-4.5L6 21z" /></svg>
)
export const Share = ({ size = 24, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7" /></svg>
)
export const Close = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2.5}><path d="M6 6l12 12M18 6 6 18" /></svg>
)
export const Pin = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
)
export const Search = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)
export const User = ({ size = 28, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={1.6}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" /></svg>
)
export const Chart = ({ size = 28, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={1.8}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
)
export const Plus = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 5v14M5 12h14" /></svg>
)
export const Play = ({ size = 16, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M7 4v16l13-8z" /></svg>
)
export const Up = ({ size = 12, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor" aria-hidden {...p}><path d="M6 1l5 9H1z" /></svg>
)
export const Down = ({ size = 12, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor" aria-hidden {...p}><path d="M6 11 1 2h10z" /></svg>
)
export const Check = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={3}><path d="m5 12 5 5 9-10" /></svg>
)
export const Download = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 4v12M7 11l5 5 5-5M5 20h14" /></svg>
)
export const ArrowUp = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2.5}><path d="M12 19V5M6 11l6-6 6 6" /></svg>
)
export const Star = ({ size = 14, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="m12 2 3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z" /></svg>
)
export const Target = ({ size = 14, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="12" cy="12" r="7" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
)
export const TicketIcon = ({ size = 26, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={1.8}><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" /><path d="M14 6v12" strokeDasharray="2 2" /></svg>
)
/** Plug icon used for the "Plugged" (saved + following) tab. */
export const PlugIcon = ({ size = 26, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={1.8}><path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4" /></svg>
)
export const Calendar = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
)
export const Message = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}><path d="M4 5h16v11H9l-5 4z" /></svg>
)
export const Edit = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" /></svg>
)
export const Trash = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
)
export const Sparkle = ({ size = 14, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" /></svg>
)
export const Send = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}><path d="M4 12 20 4l-6 16-3-7z" /></svg>
)
export const Clock = ({ size = 14, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
)
export const QrIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2M14 18h2v2M18 18h2v2" /></svg>
)
export const LinkIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" /></svg>
)
export const Mic = ({ size = 36, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={1.6}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
)
export const AppleLogo = ({ size = 16, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M16.37 12.6c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.27 3.14-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.04-2.74-4.12zM13.78 4.97c.72-.87 1.2-2.07 1.07-3.27-1.03.04-2.28.69-3.02 1.55-.66.77-1.24 2-1.09 3.18 1.15.09 2.32-.58 3.04-1.46z" /></svg>
)
