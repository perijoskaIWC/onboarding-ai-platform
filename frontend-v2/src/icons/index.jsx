const ICONS = {
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 1-1 1.7v.5"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></>,
  chevronRight: <path d="m9 6 6 6-6 6"/>,
  chevronLeft: <path d="m15 6-6 6 6 6"/>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,
  chevronUp: <path d="m6 15 6-6 6 6"/>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  filter: <path d="M3 5h18l-7 9v6l-4-2v-4z"/>,
  sort: <><path d="M7 4v16m-3-3 3 3 3-3M17 20V4m-3 3 3-3 3 3"/></>,
  more: <><circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18" cy="12" r="1.2" fill="currentColor"/></>,
  edit: <><path d="M4 20h4l11-11-4-4L4 16z"/><path d="M14 6l4 4"/></>,
  trash: <><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/></>,
  archive: <><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8"/><path d="M10 12h4"/></>,
  upload: <><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></>,
  download: <><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></>,
  check: <path d="m5 12 5 5L20 7"/>,
  x: <><path d="M6 6 18 18"/><path d="M18 6 6 18"/></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
  play: <path d="M6 4v16l14-8z"/>,
  sparkle: <><path d="M12 3l2.2 5.5L20 10l-5.8 2.2L12 18l-2.2-5.8L4 10l5.8-1.5z"/><path d="M19 17l.8 1.7L21.5 19l-1.7.8L19 21l-.8-1.7L16.5 19l1.7-.5z"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></>,
  users: <><circle cx="9" cy="8" r="3.5"/><path d="M2 20c.8-3.4 3.5-5 7-5s6.2 1.6 7 5"/><circle cx="17" cy="9" r="3"/><path d="M22 18c-.5-2.5-2.2-3.5-4.5-3.7"/></>,
  shield: <><path d="M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6z"/></>,
  cog: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
  doc: <><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/></>,
  docs: <><rect x="7" y="3" width="13" height="16" rx="2"/><path d="M4 7v13a2 2 0 0 0 2 2h11"/></>,
  folder: <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
  book: <><path d="M4 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H4z"/><path d="M20 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></>,
  chart: <><path d="M4 20V8M10 20V4M16 20v-8M22 20H2"/></>,
  trend: <><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></>,
  flag: <><path d="M5 3v18M5 4h12l-2 4 2 4H5"/></>,
  bookmark: <path d="M6 3h12v18l-6-4-6 4z"/>,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z"/>,
  chat: <path d="M21 12a8 8 0 1 1-3.5-6.6L21 4l-.8 3.6A8 8 0 0 1 21 12z"/>,
  send: <><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></>,
  paperclip: <path d="M21 11 12 20a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8"/>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11 7"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7L13 17"/></>,
  star: <path d="m12 2 3 7 7 .6-5.3 4.6L18 21l-6-3.6L6 21l1.3-6.8L2 9.6 9 9z"/>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  bulb: <><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a6 6 0 0 0-4 10c1 1 1 2 1 3v3h6v-3c0-1 0-2 1-3a6 6 0 0 0-4-10z"/></>,
  microsoft: <g fill="currentColor" stroke="none"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></g>,
  layers: <><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 17 9 5 9-5"/></>,
  flame: <path d="M12 2c2 4-2 5 0 9 1 2 4 3 4 6a6 6 0 0 1-12 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4 1-5 4-14z"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
  refresh: <><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></>,
  external: <><path d="M14 3h7v7"/><path d="M21 3 10 14"/><path d="M5 5v14h14v-6"/></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
  grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></>,
  alert: <><path d="M12 3 2 21h20z"/><path d="M12 9v5"/><circle cx="12" cy="18" r=".5" fill="currentColor"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".7" fill="currentColor"/></>,
  target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>,
  trophy: <><path d="M8 21h8M12 17v4M5 4h14v3a7 7 0 0 1-14 0z"/><path d="M5 6H3v2a3 3 0 0 0 3 3M19 6h2v2a3 3 0 0 1-3 3"/></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  arrowLeft: <><path d="M19 12H5M11 18l-6-6 6-6"/></>,
  expand: <><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></>,
  collapse: <><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></>,
  highlight: <><path d="M3 21h18"/><path d="m8 17 9-9-4-4-9 9z"/><path d="m14 5 4 4"/></>,
}

export default function Icon({ name, size = 18, className = '', style = {} }) {
  const paths = ICONS[name]
  if (!paths) return null
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {paths}
    </svg>
  )
}
