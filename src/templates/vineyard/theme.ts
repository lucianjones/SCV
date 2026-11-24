import type { CSSProperties } from 'react'
import { classicSerif, voyageScript } from '~/templates/fonts'
import type { TemplateTheme } from '~/templates/types'

/**
 * Vineyard theme — a quiet, airy palette: soft warm-white backdrop, charcoal ink,
 * a sage-olive accent, serif body copy and flowing calligraphy for names and dates.
 */
const cssVars: CSSProperties = {
  '--background': '0.9780 0.0040 90',
  '--foreground': '0.3600 0.0100 60',
  '--primary': '0.5400 0.0900 120',
  '--primary-foreground': '0.9900 0.0030 90',
  '--muted-foreground': '0.5400 0.0100 60',
  '--border': '0.9000 0.0100 90',
  '--tpl-heading-font': 'var(--tpl-classic-serif)',
  '--tpl-body-font': 'var(--tpl-classic-serif)',
  '--tpl-script-font': 'var(--tpl-voyage-script)',
} as CSSProperties

export const vineyardTheme: TemplateTheme = {
  fontClassName: `${classicSerif.variable} ${voyageScript.variable}`,
  rootClassName: 'bg-background text-foreground font-[family-name:var(--tpl-body-font)]',
  cssVars,
}
