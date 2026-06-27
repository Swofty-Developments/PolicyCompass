import type { ReactNode } from 'react'

// Line-art glyphs for section headings. Stroke colour comes from `.secname svg`.
export const Icons: Record<string, ReactNode> = {
  problem: (
    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><line x1="16" y1="16" x2="21" y2="21" /></svg>
  ),
  offer: (
    <svg viewBox="0 0 24 24"><path d="M4 20h16" /><path d="M7 20V9l5-4 5 4v11" /><path d="M10 20v-5h4v5" /></svg>
  ),
  intent: (
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><line x1="12" y1="1" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="23" /></svg>
  ),
  analysts: (
    <svg viewBox="0 0 24 24"><path d="M12 3v18" /><path d="M5 7h14" /><path d="M5 7l-3 6h6z" /><path d="M19 7l-3 6h6z" /></svg>
  ),
}
