// Kleine Strich-Icons (24er Raster), farblich über currentColor.

const PATHS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  menu: 'M4 6h16M4 12h16M4 18h16',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  chevronLeft: 'M15 6l-6 6 6 6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5 9-11',
  alert: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  palette: 'M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8zM7.5 11h.01M10 7h.01M14.5 7h.01',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  board: 'M4 4h5v16H4zM10 4h5v10h-5zM16 4h4v7h-4z',
  table: 'M3 5h18v14H3zM3 10h18M9 5v14',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  sidebar: 'M3 5h18v14H3zM9 5v14',
  maximize: 'M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5M8 14h3',
  calc: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
  duell: 'M4 6h9v6H8l-4 3zM20 12h-3M11 15v3h5l4 3V12h-3',
  cards: 'M7 4h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM3 8v11a1 1 0 0 0 1 1h12M10 9h6M10 12h4',
  clipboard: 'M9 4h6v3H9zM9 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3M8 12l2 2 4-4M8 17h8',
  chat: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
  timer: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 2M10 2h4',
  mindmap: 'M9.5 12a2.5 2.5 0 1 0 5.0 0 2.5 2.5 0 1 0-5.0 0 M2.7 5.5a1.8 1.8 0 1 0 3.6 0 1.8 1.8 0 1 0-3.6 0 M17.7 5.5a1.8 1.8 0 1 0 3.6 0 1.8 1.8 0 1 0-3.6 0 M2.7 18.5a1.8 1.8 0 1 0 3.6 0 1.8 1.8 0 1 0-3.6 0 M17.7 18.5a1.8 1.8 0 1 0 3.6 0 1.8 1.8 0 1 0-3.6 0 M10.2 10.3L5.9 6.8M13.8 10.3l4.3-3.5M10.2 13.7l-4.3 3.5M13.8 13.7l4.3 3.5',
  pen: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4M14 20h6',
  form: 'M5 3h14v18H5zM8 7h8M8 11h8M8 15h5',
  sort: 'M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true} role={label ? 'img' : undefined}
      aria-label={label} focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
