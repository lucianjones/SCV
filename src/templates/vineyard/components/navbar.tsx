import Link from 'next/link'
import type { WeddingPageData } from '~/server/domains/website/website.types'
import { SECTION_CATALOG } from '~/server/domains/website-section/website-section.catalog'
import type { WebsiteSection } from '~/server/domains/website-section/website-section.types'

/** Which nav item is highlighted. Section anchors on the home page use their anchor id. */
export type VineyardLocation = 'home' | 'travel' | 'rsvp'

type VineyardNavbarProps = {
  coupleShortNames: string
  path: string
  sections: WebsiteSection[]
  isRsvpEnabled: boolean
  current?: VineyardLocation
}

/**
 * Anchor ids rendered by the shared section layout, keyed by section type. DESTINATION is
 * intentionally absent: it still shows on the home page but has no nav tab for now.
 */
const SECTION_ANCHORS: Record<string, string> = {
  OUR_STORY: 'our-story',
  TIMELINE: 'our-story',
  EXPERIENCES: 'experiences',
  WEDDING_PARTY: 'wedding-party',
  FAQ: 'faq',
  REGISTRY: 'registry',
}

export function vineyardShortNames(weddingData: WeddingPageData): string {
  return [weddingData.brideFirstName, weddingData.groomFirstName].filter(Boolean).join(' & ')
}

function getLinks(sections: WebsiteSection[], path: string, isRsvpEnabled: boolean) {
  const seen = new Set<string>()
  const links: Array<{ key: string; title: string; href: string }> = [
    { key: 'home', title: 'Home', href: path },
  ]
  for (const section of sections) {
    if (section.type === 'TRAVEL') {
      // Travel has its own page.
      if (!seen.has('travel')) {
        seen.add('travel')
        links.push({ key: 'travel', title: 'Travel', href: `${path}/travel` })
      }
      continue
    }
    const anchor = SECTION_ANCHORS[section.type]
    if (!anchor || seen.has(anchor)) continue
    seen.add(anchor)
    const label = SECTION_CATALOG.find((entry) => entry.type === section.type)?.label ?? anchor
    links.push({ key: anchor, title: label, href: `${path}#${anchor}` })
  }
  if (isRsvpEnabled) links.push({ key: 'rsvp', title: 'RSVP', href: `${path}/rsvp` })
  return links
}

export function VineyardNavbar({
  coupleShortNames,
  path,
  sections,
  isRsvpEnabled,
  current = 'home',
}: Readonly<VineyardNavbarProps>) {
  const links = getLinks(sections, path, isRsvpEnabled)
  return (
    <header className='flex flex-col items-center gap-5 px-6 pt-3 pb-4 text-center'>
      <Link
        href={path}
        className='font-[family-name:var(--tpl-script-font)] text-[1.75rem] text-foreground'
      >
        {coupleShortNames}
      </Link>
      <nav aria-label='Wedding website'>
        <ul className='flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm'>
          {links.map((link) => (
            <li
              key={link.key}
              className={
                link.key === current
                  ? 'border-foreground/70 border-b-2 pb-0.5'
                  : 'pb-0.5 hover:underline'
              }
            >
              <Link href={link.href} aria-current={link.key === current ? 'page' : undefined}>
                {link.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
