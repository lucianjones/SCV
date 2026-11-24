import type { CSSProperties } from 'react'
import { vineyardScript, vineyardSerif } from '~/templates/fonts'
import type { TemplateTheme } from '~/templates/types'

/**
 * Vineyard theme — a quiet, airy palette: light-grey backdrop, grey ink,
 * a sage-olive accent, Libre Baskerville body copy and Pinyon Script calligraphy for names and dates.
 */
const cssVars: CSSProperties = {
  '--background': '0.9642 0 0' /* rgb(243, 243, 243) */,
  '--foreground': '0.4239 0 0' /* rgb(78, 78, 78) */,
  '--primary': '0.5400 0.0900 120',
  '--primary-foreground': '0.9900 0.0030 90',
  '--muted-foreground': '0.5400 0 0',
  '--border': '0.8800 0 0',
  '--tpl-heading-font': 'var(--tpl-vineyard-serif)',
  '--tpl-body-font': 'var(--tpl-vineyard-serif)',
  '--tpl-script-font': 'var(--tpl-vineyard-script)',
} as CSSProperties

export const vineyardTheme: TemplateTheme = {
  fontClassName: `${vineyardSerif.variable} ${vineyardScript.variable}`,
  rootClassName: 'bg-background text-foreground font-[family-name:var(--tpl-body-font)]',
  cssVars,
}
