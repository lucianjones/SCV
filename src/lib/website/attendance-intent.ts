/**
 * Casual "do you plan on attending?" answers from the save-the-date page. This is an intent
 * signal, not an RSVP: each answer maps onto the household's likelihoodOfAttending scale
 * (1 = Unlikely, 2 = Not Sure, 3 = Maybe, 4 = Likely, 5 = Very Likely).
 */
export type AttendanceIntent = 'yes' | 'maybe' | 'no'

export const ATTENDANCE_INTENT_LIKELIHOOD: Record<AttendanceIntent, number> = {
  yes: 5,
  maybe: 3,
  no: 1,
}

export const isAttendanceIntent = (value: unknown): value is AttendanceIntent =>
  value === 'yes' || value === 'maybe' || value === 'no'

/** Reverse lookup so the page can show the current answer (other stored values show none). */
export const attendanceIntentFromLikelihood = (
  likelihood: number | null | undefined
): AttendanceIntent | null => {
  if (likelihood === 5) return 'yes'
  if (likelihood === 3) return 'maybe'
  if (likelihood === 1) return 'no'
  return null
}
