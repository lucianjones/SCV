'use client'

import { startTransition, useOptimistic, useState } from 'react'
import type { AttendanceIntent } from '~/lib/website/attendance-intent'

type Props = {
  /** The household's saved answer, if any. */
  current: AttendanceIntent | null
  /** Saves the answer on the server. Resolves with `ok: false` when it could not be saved. */
  action: (formData: FormData) => Promise<{ ok: boolean }>
  labels: {
    planOnAttending: string
    planYes: string
    planMaybe: string
    planNo: string
    planNote: string
    planSaved: string
    planError: string
    planAnswerYes: string
    planAnswerMaybe: string
    planAnswerNo: string
    planChange: string
    planCancel: string
  }
}

/**
 * The casual "do you plan on attending?" question. Until a guest answers it shows Yes / Maybe /
 * No buttons. Once answered, the buttons are replaced by a note of what they chose and a button to
 * change it. The note appears the moment a choice is pressed (optimistically) while the answer
 * saves in the background, and the question comes back if saving fails.
 */
export function VineyardAttendanceQuestion({ current, action, labels }: Readonly<Props>) {
  const [confirmed, setConfirmed] = useState<AttendanceIntent | null>(current)
  const [selected, setSelected] = useOptimistic<AttendanceIntent | null, AttendanceIntent>(
    confirmed,
    (_previous, next) => next
  )
  const [changing, setChanging] = useState(false)
  // Optimistic too: an ordinary state update inside the form action is held back until the save
  // finishes, which would leave the buttons showing while it is in flight.
  const [showingChoices, setShowingChoices] = useOptimistic<boolean, boolean>(
    changing,
    (_previous, next) => next
  )
  const [status, setStatus] = useState<'saved' | 'error' | null>(null)

  const choices = [
    { value: 'yes', label: labels.planYes },
    { value: 'maybe', label: labels.planMaybe },
    { value: 'no', label: labels.planNo },
  ] as const

  const answerNotes: Record<AttendanceIntent, string> = {
    yes: labels.planAnswerYes,
    maybe: labels.planAnswerMaybe,
    no: labels.planAnswerNo,
  }

  async function submit(formData: FormData) {
    const intent = formData.get('intent') as AttendanceIntent
    setStatus(null)
    setShowingChoices(false)
    setSelected(intent)

    let ok = false
    try {
      ok = (await action(formData)).ok
    } catch {
      ok = false
    }

    startTransition(() => {
      if (ok) setConfirmed(intent)
      setChanging(false)
      setStatus(ok ? 'saved' : 'error')
    })
  }

  const showQuestion = selected === null || showingChoices

  return (
    <div className='flex flex-col items-center gap-3'>
      {showQuestion ? (
        <form action={submit} className='flex flex-col items-center gap-3'>
          <span className='text-sm'>{labels.planOnAttending}</span>
          <div className='flex gap-3'>
            {choices.map((choice) => (
              <button
                key={choice.value}
                type='submit'
                name='intent'
                value={choice.value}
                className='min-w-24 rounded-[3px] border border-foreground/40 px-6 py-2.5 text-center font-bold text-foreground text-sm transition-colors hover:bg-foreground/10'
              >
                {choice.label}
              </button>
            ))}
          </div>
          {selected !== null && (
            <button
              type='button'
              onClick={() => setChanging(false)}
              className='text-sm underline underline-offset-4'
            >
              {labels.planCancel}
            </button>
          )}
        </form>
      ) : (
        <>
          <p className='text-sm'>{selected ? answerNotes[selected] : null}</p>
          <button
            type='button'
            onClick={() => {
              setStatus(null)
              setChanging(true)
            }}
            className='rounded-[3px] border border-foreground/40 px-6 py-2.5 font-bold text-foreground text-sm transition-colors hover:bg-foreground/10'
          >
            {labels.planChange}
          </button>
        </>
      )}
      <p className='max-w-sm text-balance text-xs leading-5'>{labels.planNote}</p>
      <p role='status' className='min-h-5 text-sm'>
        {status === 'saved' ? labels.planSaved : status === 'error' ? labels.planError : ''}
      </p>
    </div>
  )
}
