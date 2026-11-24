import type { ReactNode } from 'react'
import type { WeddingPageData } from '~/server/domains/website/website.types'
import {
  type VineyardLocation,
  VineyardNavbar,
  vineyardShortNames,
} from '~/templates/vineyard/components/navbar'

/** Persistent header (couple names + nav) wrapped around Vineyard's inner pages. */
export function VineyardSiteShell({
  weddingData,
  path,
  current,
  children,
}: Readonly<{
  weddingData: WeddingPageData
  path: string
  current: VineyardLocation
  children: ReactNode
}>) {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <VineyardNavbar
        coupleShortNames={vineyardShortNames(weddingData)}
        path={path}
        sections={weddingData.sections}
        isRsvpEnabled={weddingData.website.isRsvpEnabled}
        current={current}
      />
      {children}
    </div>
  )
}
