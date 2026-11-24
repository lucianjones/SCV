import { attendanceIntentFromLikelihood, isAttendanceIntent } from '~/lib/website/attendance-intent'

describe('attendance intent', () => {
  it('shows the current answer only for the values the save-the-date question writes', () => {
    expect(attendanceIntentFromLikelihood(5)).toBe('yes')
    expect(attendanceIntentFromLikelihood(3)).toBe('maybe')
    expect(attendanceIntentFromLikelihood(1)).toBe('no')
    // Values the couple may have set by hand do not pre-select an answer.
    expect(attendanceIntentFromLikelihood(2)).toBeNull()
    expect(attendanceIntentFromLikelihood(4)).toBeNull()
    expect(attendanceIntentFromLikelihood(null)).toBeNull()
  })

  it('accepts only yes, maybe and no', () => {
    expect(isAttendanceIntent('yes')).toBe(true)
    expect(isAttendanceIntent('maybe')).toBe(true)
    expect(isAttendanceIntent('no')).toBe(true)
    expect(isAttendanceIntent('probably')).toBe(false)
    expect(isAttendanceIntent(undefined)).toBe(false)
  })
})
