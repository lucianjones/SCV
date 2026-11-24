import Link from 'next/link'
import { AddToCalendarButtons } from '~/components/website/add-to-calendar-buttons'
import type { SaveTheDateCalendarLinks } from '~/lib/website/calendar'

const script = 'font-[family-name:var(--tpl-script-font)]'
const solidButton =
  'inline-block min-w-48 rounded-[3px] bg-foreground px-8 py-2.5 text-center font-bold text-background text-sm hover:opacity-90'
const outlineButton =
  'inline-block min-w-48 rounded-[3px] border border-foreground/40 px-8 py-2.5 text-center font-bold text-foreground text-sm hover:bg-foreground/10'

type Props = {
  websiteSubUrl: string
  brideFirstName: string
  groomFirstName: string
  formattedDate: string | null
  location: string | null
  guestNames: string[]
  calendarLinks: SaveTheDateCalendarLinks | null
  /** Editable Save the Date copy from the website builder, when set. */
  copy?: { eyebrow?: string; message?: string; footnote?: string }
  showUpdatedNotice: boolean
  /** The casual "do you plan on attending?" question (separate from the formal RSVP). */
  attendance: {
    current: 'yes' | 'maybe' | 'no' | null
    status: 'saved' | 'error' | null
    action: (formData: FormData) => Promise<void>
  }
  labels: {
    saveTheDate: string
    date: string
    location: string
    addToCalendar: string
    invitedHousehold: string
    toBeAnnounced: string
    formalInvitationNote: string
    updateDetails: string
    viewWebsite: string
    detailsUpdated: string
    planOnAttending: string
    planYes: string
    planMaybe: string
    planNo: string
    planNote: string
    planSaved: string
    planError: string
  }
}

/** Vineyard's household save-the-date card: a soft grey card with calligraphy names. */
export function VineyardHouseholdSaveTheDate({
  websiteSubUrl,
  brideFirstName,
  groomFirstName,
  formattedDate,
  location,
  guestNames,
  calendarLinks,
  copy,
  showUpdatedNotice,
  attendance,
  labels,
}: Readonly<Props>) {
  const choices = [
    { value: 'yes', label: labels.planYes },
    { value: 'maybe', label: labels.planMaybe },
    { value: 'no', label: labels.planNo },
  ] as const
  return (
    <article className='flex w-full flex-col items-center gap-8 rounded-2xl bg-foreground/[0.07] px-6 py-14 text-center sm:px-14'>
      {showUpdatedNotice && (
        <p className='rounded-[3px] bg-foreground/10 px-4 py-2 text-sm'>{labels.detailsUpdated}</p>
      )}

      <p className='text-sm'>{copy?.eyebrow ?? labels.saveTheDate}</p>
      <h1 className={`${script} text-5xl text-foreground leading-tight sm:text-6xl`}>
        {brideFirstName} &amp; {groomFirstName}
      </h1>

      <div className='flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-24'>
        <div className='flex flex-col items-center gap-2'>
          <span className='text-sm'>{labels.date}</span>
          <span className={`${script} text-balance text-3xl text-foreground`}>
            {formattedDate ?? labels.toBeAnnounced}
          </span>
        </div>
        <div className='flex flex-col items-center gap-2'>
          <span className='text-sm'>{labels.location}</span>
          <span className={`${script} text-balance text-3xl text-foreground`}>
            {location ?? labels.toBeAnnounced}
          </span>
        </div>
      </div>

      {calendarLinks ? (
        <div className='flex flex-col items-center gap-3'>
          <span className='text-sm'>{labels.addToCalendar}</span>
          <AddToCalendarButtons {...calendarLinks} variant='vineyard' />
        </div>
      ) : null}

      <div className='flex flex-col items-center gap-2'>
        <span className='text-sm'>{labels.invitedHousehold}</span>
        <ul className={`${script} space-y-1 text-2xl text-foreground`}>
          {guestNames.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>

      <form action={attendance.action} className='flex flex-col items-center gap-3'>
        <span className='text-sm'>{labels.planOnAttending}</span>
        <div className='flex gap-3'>
          {choices.map((choice) => (
            <button
              key={choice.value}
              type='submit'
              name='intent'
              value={choice.value}
              aria-pressed={attendance.current === choice.value}
              className={`min-w-24 rounded-[3px] px-6 py-2.5 text-center font-bold text-sm ${
                attendance.current === choice.value
                  ? 'bg-foreground text-background'
                  : 'border border-foreground/40 text-foreground hover:bg-foreground/10'
              }`}
            >
              {choice.label}
            </button>
          ))}
        </div>
        <p className='max-w-sm text-balance text-xs leading-5'>{labels.planNote}</p>
        {attendance.status === 'saved' && <p className='text-sm'>{labels.planSaved}</p>}
        {attendance.status === 'error' && <p className='text-sm'>{labels.planError}</p>}
      </form>

      {copy?.message ? (
        <p className='max-w-md whitespace-pre-line text-balance text-sm leading-6'>
          {copy.message}
        </p>
      ) : null}
      <p className='max-w-md text-balance text-sm leading-6'>
        {copy?.footnote ?? labels.formalInvitationNote}
      </p>

      <div className='flex flex-col items-center gap-3 sm:flex-row'>
        <Link href={`/w/${websiteSubUrl}/save-the-date/update`} className={solidButton}>
          {labels.updateDetails}
        </Link>
        <Link href={`/w/${websiteSubUrl}`} className={outlineButton}>
          {labels.viewWebsite}
        </Link>
      </div>
    </article>
  )
}
