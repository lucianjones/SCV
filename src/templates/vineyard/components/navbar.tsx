import Link from 'next/link'
import { SECTION_CATALOG } from '~/server/domains/website-section/website-section.catalog'
import type { WebsiteSection } from '~/server/domains/website-section/website-section.types'

type VineyardNavbarProps = {
  coupleShortNames: string
  path: string
  sections: WebsiteSection[]
  isRsvpEnabled: boolean
}

/** Anchor ids rendered by the shared section layout, keyed by section type. */
const SECTION_ANCHORS: Record<string, string> = {
  OUR_STORY: 'our-story',
  TIMELINE: 'our-story',
  DESTINATION: 'destination',
  EXPERIENCES: 'experiences',
  WEDDING_PARTY: 'wedding-party',
  TRAVEL: 'travel',
  FAQ: 'faq',
  REGISTRY: 'registry',
}

function getLinks(sections: WebsiteSection[], path: string, isRsvpEnabled: boolean) {
  const seen = new Set<string>()
  const links = [{ title: 'Home', href: path }]
  for (const section of sections) {
    const anchor = SECTION_ANCHORS[section.type]
    if (!anchor || seen.has(anchor)) continue
    seen.add(anchor)
    const label = SECTION_CATALOG.find((entry) => entry.type === section.type)?.label ?? anchor
    links.push({ title: label, href: `${path}#${anchor}` })
  }
  if (isRsvpEnabled) links.push({ title: 'RSVP', href: `${path}/rsvp` })
  return links
}

export function VineyardNavbar({
  coupleShortNames,
  path,
  sections,
  isRsvpEnabled,
}: Readonly<VineyardNavbarProps>) {
  const links = getLinks(sections, path, isRsvpEnabled)
  return (
    <header className='flex flex-col items-center gap-5 px-6 pt-3 pb-4 text-center'>
      <Link
        href={path}
        className='font-[family-name:var(--tpl-script-font)] text-3xl text-foreground/80'
      >
        {coupleShortNames}
      </Link>
      <nav aria-label='Wedding website'>
        <ul className='flex flex-wrap justify-center gap-x-5 gap-y-2 text-base'>
          {links.map((link, index) => (
            <li
              key={link.href}
              className={
                index === 0 ? 'border-foreground/70 border-b-2 pb-0.5' : 'pb-0.5 hover:underline'
              }
            >
              <Link href={link.href}>{link.title}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
