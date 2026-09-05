import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = (props: IconProps): IconProps => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  ...props,
})

export const IconHome = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 10.5L12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" /></svg>
)
export const IconBag = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 7h12l1.2 13a1.5 1.5 0 01-1.5 1.6H6.3a1.5 1.5 0 01-1.5-1.6L6 7z" /><path d="M9 10V6a3 3 0 016 0v4" /></svg>
)
export const IconHeart = (p: IconProps) => (
  <svg {...base(p)}><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>
)
export const IconHeartFilled = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>
)
export const IconUser = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></svg>
)
export const IconCart = (p: IconProps) => (
  <svg {...base(p)}><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.6 12.4a2 2 0 002 1.6h7.8a2 2 0 002-1.6L21 7H6" /></svg>
)
export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
)
export const IconMenu = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
)
export const IconX = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>
)
export const IconChevronDown = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 9l6 6 6-6" /></svg>
)
export const IconChevronLeft = (p: IconProps) => (
  <svg {...base(p)}><path d="M15 6l-6 6 6 6" /></svg>
)
export const IconChevronRight = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 6l6 6-6 6" /></svg>
)
export const IconTrash = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" /></svg>
)
export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
)
export const IconMinus = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 12h14" /></svg>
)
export const IconStar = (p: IconProps) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.363 1.118l1.287 3.958c.3.922-.755 1.688-1.539 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.196-1.539-1.118l1.287-3.958a1 1 0 00-.363-1.118L2.06 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.287-3.958z" /></svg>
)
export const IconTruck = (p: IconProps) => (
  <svg {...base(p)}><path d="M1 6h13v10H1zM14 9h4l3 3v4h-7z" /><circle cx="6" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></svg>
)
export const IconShield = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 2l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V5l7-3z" /></svg>
)
export const IconRefresh = (p: IconProps) => (
  <svg {...base(p)}><path d="M21 12a9 9 0 11-2.6-6.3M21 3v6h-6" /></svg>
)
export const IconBack = (p: IconProps) => (
  <svg {...base(p)}><path d="M10 19l-7-7 7-7M3 12h18" /></svg>
)
export const IconBox = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2zM12 11v9M4.5 6.5L12 11l7.5-4.5" /></svg>
)
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 12l5 5L20 7" /></svg>
)
export const IconCheckCircle = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>
)
export const IconDoc = (p: IconProps) => (
  <svg {...base(p)}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M8 13h8M8 17h5" /></svg>
)
export const IconBell = (p: IconProps) => (
  <svg {...base(p)}><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" /></svg>
)
export const IconLogout = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
)
export const IconEdit = (p: IconProps) => (
  <svg {...base(p)}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
)
export const IconEye = (p: IconProps) => (
  <svg {...base(p)}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>
)
export const IconEyeOff = (p: IconProps) => (
  <svg {...base(p)}><path d="M17.9 17.9A10.4 10.4 0 0112 19c-7 0-11-7-11-7a15.2 15.2 0 015-4.9M9.3 4.9A10.4 10.4 0 0112 5c7 0 11 7 11 7a15.3 15.3 0 01-4.1 4.1M3 3l18 18" /></svg>
)
export const IconFilter = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 5h16l-6 7v6l-4 2v-8L4 5z" /></svg>
)
export const IconTag = (p: IconProps) => (
  <svg {...base(p)}><path d="M20.6 13.4L13.4 20.6a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z" /><circle cx="8" cy="8" r="1.5" /></svg>
)
export const IconSettings = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3h.1a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.2a1.7 1.7 0 001 1.5h.1a1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9v.1a1.7 1.7 0 001.5 1h.2a2 2 0 110 4h-.2a1.7 1.7 0 00-1.5 1z" /></svg>
)
export const IconChart = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 3v17a1 1 0 001 1h17" /><path d="M7 14l4-5 3 3 5-6" /></svg>
)
export const IconGrid = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
)
export const IconBolt = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></svg>
)
export const IconWallet = (p: IconProps) => (
  <svg {...base(p)}><path d="M20 7H4a2 2 0 01-2-2 2 2 0 012-2h14v4M2 5v14a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2M16 14.5h.01" /></svg>
)
export const IconBuildings = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16M2 21h20M9 7h2M9 11h2M9 15h2M17 9h2a1 1 0 011 1v11h-3" /></svg>
)
export const IconMapPin = (p: IconProps) => (
  <svg {...base(p)}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z" /><circle cx="12" cy="10" r="3" /></svg>
)
export const IconPhone = (p: IconProps) => (
  <svg {...base(p)}><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 2 .7 2.9a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.9.3 1.9.6 2.9.7a2 2 0 011.7 2z" /></svg>
)
export const IconMail = (p: IconProps) => (
  <svg {...base(p)}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 6L22 7" /></svg>
)
export const IconCalendar = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
)
export const IconChat = (p: IconProps) => (
  <svg {...base(p)}><path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" /></svg>
)
export const IconPackage = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2zM12 11v9M4.5 6.5L12 11l7.5-4.5" /></svg>
)
export const IconSpinner = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
    <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
)
export const IconStore = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 9l1.5-5h15L21 9M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0M4 11v9a1 1 0 001 1h14a1 1 0 001-1v-9M9 21v-6h6v6" /></svg>
)
export const IconUsers = (p: IconProps) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0" /><path d="M16 4.6a3.5 3.5 0 010 6.8M17.5 14.6a6.5 6.5 0 014 5.4" /></svg>
)
export const IconLock = (p: IconProps) => (
  <svg {...base(p)}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>
)
export const IconShare = (p: IconProps) => (
  <svg {...base(p)}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
)
export const IconCompare = (p: IconProps) => (
  <svg {...base(p)}><path d="M7 3v18M7 21l-4-4M7 21l4-4M17 21V3M17 3l-4 4M17 3l4 4" /></svg>
)