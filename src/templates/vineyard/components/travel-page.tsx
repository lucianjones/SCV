import { Bus, Car, Hotel, Plane, TrainFront } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ComponentType } from 'react'
import type { WeddingPageData } from '~/server/domains/website/website.types'
import type {
  TravelSectionContent,
  TravelServiceIcon,
} from '~/server/domains/website-section/website-section.types'
import { splitParagraphs } from '~/templates/shared/prose'
import { VineyardSiteShell } from '~/templates/vineyard/components/site-shell'

const script = 'font-[family-name:var(--tpl-script-font)]'

const ICONS: Record<
  TravelServiceIcon,
  ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  plane: Plane,
  car: Car,
  train: TrainFront,
  bus: Bus,
  hotel: Hotel,
}

export function VineyardTravelPage({
  weddingData,
  path,
}: Readonly<{ weddingData: WeddingPageData; path: string }>) {
  const section = weddingData.sections.find((entry) => entry.type === 'TRAVEL')
  const content = section?.content as TravelSectionContent | undefined
  const services = content?.services ?? []
  const stays = content?.stays ?? []
  const intro = splitParagraphs(content?.body ?? '')

  return (
    <VineyardSiteShell weddingData={weddingData} path={path} current='travel'>
      <main className='mx-auto flex max-w-3xl flex-col items-center gap-20 px-6 pt-24 pb-28 text-center'>
        {intro.length > 0 && (
          <div className='space-y-4 text-sm leading-6'>
            {intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}

        {services.map((service) => {
          const Icon = service.icon ? ICONS[service.icon] : null
          return (
            <section
              key={`${service.label ?? ''}-${service.title}`}
              className='flex flex-col items-center gap-4'
            >
              {Icon && <Icon className='h-11 w-11 text-foreground/80' strokeWidth={0.75} />}
              {service.label && <span className='mt-2 text-sm'>{service.label}</span>}
              <h2 className={`${script} text-[2.25rem] text-foreground leading-tight`}>
                {service.title}
              </h2>
              <p className='max-w-2xl text-balance text-sm leading-6'>{service.description}</p>
            </section>
          )
        })}

        {stays.map((stay) => (
          <section key={stay.name} className='flex flex-col items-center gap-4'>
            {stay.imageUrl && (
              <div className='relative h-48 w-full max-w-md overflow-hidden'>
                <Image
                  src={stay.imageUrl}
                  fill
                  sizes='(max-width: 768px) 100vw, 28rem'
                  className='object-cover'
                  alt={stay.name}
                />
              </div>
            )}
            <h2 className={`${script} text-[2.25rem] text-foreground leading-tight`}>
              {stay.name}
            </h2>
            {stay.description && (
              <p className='max-w-2xl text-balance text-sm leading-6'>{stay.description}</p>
            )}
            {stay.url && (
              <Link
                href={stay.url}
                target='_blank'
                rel='noreferrer'
                className='text-sm underline underline-offset-4'
              >
                {stay.buttonLabel || 'View stay'}
              </Link>
            )}
          </section>
        ))}

        {services.length === 0 && stays.length === 0 && intro.length === 0 && (
          <p className='text-sm'>Travel details are coming soon.</p>
        )}
      </main>
    </VineyardSiteShell>
  )
}
