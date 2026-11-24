import Image from 'next/image'
import Link from 'next/link'
import { formatDateStandard } from '~/app/utils/helpers'
import type { DestinationSectionContent } from '~/server/domains/website-section/website-section.types'
import { ClassicCoupleGallery } from '~/templates/classic/components/media'
import { ClassicSections } from '~/templates/classic/components/sections'
import type { TemplateSurfaceProps } from '~/templates/types'
import { VineyardNavbar } from '~/templates/vineyard/components/navbar'

const script = 'font-[family-name:var(--tpl-script-font)]'

function fullName(first: string | null, last: string | null) {
  return [first, last].filter(Boolean).join(' ')
}

/** Turns the "09.25.2027" number format into "September 25" and "2027". */
function splitDate(numberFormat: string | undefined) {
  const match = numberFormat?.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!match) return { monthDay: 'Date To Be Announced', year: '' }
  const [, month, day, year] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return {
    monthDay: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }),
    year: year ?? '',
  }
}

/** Splits "Sulzfeld, Baden-Württemberg, Germany" into a headline and a caption. */
function splitLocation(location: string | undefined) {
  if (!location) return null
  const index = location.indexOf(',')
  if (index === -1) return { place: location, region: '' }
  return { place: location.slice(0, index).trim(), region: location.slice(index + 1).trim() }
}

export function VineyardHome({ weddingData, path, introText }: Readonly<TemplateSurfaceProps>) {
  const { website } = weddingData
  const destination = weddingData.sections.find((section) => section.type === 'DESTINATION')
  const location = splitLocation((destination?.content as DestinationSectionContent)?.location)
  const { monthDay, year } = splitDate(weddingData.date?.numberFormat)
  const shortNames = [weddingData.brideFirstName, weddingData.groomFirstName]
    .filter(Boolean)
    .join(' & ')

  return (
    <main className='flex flex-col items-center pb-24 text-center'>
      <VineyardNavbar
        coupleShortNames={shortNames}
        path={path}
        sections={weddingData.sections}
        isRsvpEnabled={website.isRsvpEnabled}
      />

      {website.headerImageUrl && (
        <div className='relative aspect-[2/1] w-full overflow-hidden sm:aspect-[7/2]'>
          <Image
            src={website.headerImageUrl}
            fill
            priority
            sizes='100vw'
            className='object-cover object-center'
            alt='Wedding header'
          />
        </div>
      )}

      <section className='flex flex-col items-center gap-6 px-6 py-20'>
        <h1 className={`${script} text-4xl text-foreground sm:text-5xl`}>
          {fullName(weddingData.brideFirstName, weddingData.brideLastName)}
        </h1>
        <span className='text-sm'>and</span>
        <h1 className={`${script} text-4xl text-foreground sm:text-5xl`}>
          {fullName(weddingData.groomFirstName, weddingData.groomLastName)}
        </h1>
      </section>

      <section className='flex flex-col items-center gap-12 px-6 pb-20 sm:flex-row sm:gap-32'>
        {location && (
          <div className='flex flex-col items-center gap-3'>
            <span className={`${script} text-[2.125rem] text-foreground`}>{location.place}</span>
            {location.region && <span className='text-sm'>{location.region}</span>}
          </div>
        )}
        <div className='flex flex-col items-center gap-3'>
          <span className={`${script} text-[2.125rem] text-foreground`}>{monthDay}</span>
          {year && <span className='text-sm'>{year}</span>}
        </div>
      </section>

      {website.isRsvpEnabled && (
        <Link
          href={`${path}/rsvp`}
          className='mb-16 inline-block min-w-52 rounded-[3px] bg-foreground px-10 py-2.5 font-bold text-background text-xs uppercase tracking-wider hover:opacity-90'
        >
          RSVP
        </Link>
      )}

      {introText ? (
        <section className='mb-16 max-w-2xl text-balance px-6 text-lg leading-8'>
          <p>{introText}</p>
        </section>
      ) : null}

      {website.coverPhotoUrl && (
        <div className='relative mb-16 h-80 w-full px-10'>
          <Image
            src={website.coverPhotoUrl}
            fill
            sizes='(max-width: 768px) 100vw, 80vw'
            className='object-contain'
            alt='Website Cover Photo'
          />
        </div>
      )}

      <div className='mb-16 w-full'>
        <ClassicCoupleGallery urls={website.coupleImageUrls} />
      </div>

      {weddingData.events.map((event) => (
        <div key={event.id} className='mb-12 flex flex-col gap-2'>
          <h3 className={`${script} text-4xl text-foreground`}>{event.name}</h3>
          {!!event.date && <span className='text-lg'>{formatDateStandard(event.date)}</span>}
          {!!event.startTime && (
            <span className='text-lg'>
              {event.startTime}
              {!!event.endTime && ` - ${event.endTime}`}
            </span>
          )}
        </div>
      ))}

      <div className='flex flex-col items-center gap-20 tracking-widest'>
        <ClassicSections sections={weddingData.sections} />
      </div>
    </main>
  )
}
