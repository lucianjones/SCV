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
  }
}

/**
 * The casual "do you plan on attending?" question. The chosen button highlights the moment it is
 * pressed (optimistically) while the answer saves in the background, and reverts if saving fails.
 */
export function VineyardAttendanceQuestion({ current, action, labels }: Readonly<Props>) {
  const [confirmed, setConfirmed] = useState<AttendanceIntent | null>(current)
  const [selected, setSelected] = useOptimistic<AttendanceIntent | null, AttendanceIntent>(
    confirmed,
    (_previous, next) => next
  )
  const [status, setStatus] = useState<'saved' | 'error' | null>(null)

  const choices = [
    { value: 'yes', label: labels.planYes },
    { value: 'maybe', label: labels.planMaybe },
    { value: 'no', label: labels.planNo },
  ] as const

  async function submit(formData: FormData) {
    const intent = formData.get('intent') as AttendanceIntent
    setStatus(null)
    setSelected(intent)

    let ok = false
    try {
      ok = (await action(formData)).ok
    } catch {
      ok = false
    }

    startTransition(() => {
      if (ok) setConfirmed(intent)
      setStatus(ok ? 'saved' : 'error')
    })
  }

  return (
    <form action={submit} className='flex flex-col items-center gap-3'>
      <span className='text-sm'>{labels.planOnAttending}</span>
      <div className='flex gap-3'>
        {choices.map((choice) => (
          <button
            key={choice.value}
            type='submit'
            name='intent'
            value={choice.value}
            aria-pressed={selected === choice.value}
            className={`min-w-24 rounded-[3px] px-6 py-2.5 text-center font-bold text-sm transition-colors ${
              selected === choice.value
                ? 'bg-foreground text-background'
                : 'border border-foreground/40 text-foreground hover:bg-foreground/10'
            }`}
          >
            {choice.label}
          </button>
        ))}
      </div>
      <p className='max-w-sm text-balance text-xs leading-5'>{labels.planNote}</p>
      <p role='status' className='min-h-5 text-sm'>
        {status === 'saved' ? labels.planSaved : status === 'error' ? labels.planError : ''}
      </p>
    </form>
  )
}
