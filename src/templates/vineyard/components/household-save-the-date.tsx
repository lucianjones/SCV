import Link from 'next/link'
import { AddToCalendarButtons } from '~/components/website/add-to-calendar-buttons'
import type { AttendanceIntent } from '~/lib/website/attendance-intent'
import type { SaveTheDateCalendarLinks } from '~/lib/website/calendar'
import { VineyardAttendanceQuestion } from '~/templates/vineyard/components/attendance-question'

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
    current: AttendanceIntent | null
    action: (formData: FormData) => Promise<{ ok: boolean }>
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

      <VineyardAttendanceQuestion
        current={attendance.current}
        action={attendance.action}
        labels={labels}
      />

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
