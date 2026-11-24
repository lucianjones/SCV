import { defaultInvitesForEvents, pickCeremonyEvent } from '~/lib/events/ceremony'

describe('pickCeremonyEvent', () => {
  it('prefers an event named Ceremony, then Wedding Day, then any ceremony-like name', () => {
    const garden = { id: 'garden', name: 'Garden Ceremony' }
    const weddingDay = { id: 'wd', name: 'Wedding Day' }
    const ceremony = { id: 'c', name: ' ceremony ' }

    expect(pickCeremonyEvent([garden, weddingDay, ceremony])).toBe(ceremony)
    expect(pickCeremonyEvent([garden, weddingDay])).toBe(weddingDay)
    expect(pickCeremonyEvent([{ id: 'x', name: 'Dinner' }, garden])).toBe(garden)
    expect(pickCeremonyEvent([{ id: 'x', name: 'Dinner' }])).toBeUndefined()
  })
})

describe('defaultInvitesForEvents', () => {
  it('invites to the ceremony only', () => {
    expect(
      defaultInvitesForEvents([
        { id: 'dinner', name: 'Welcome Dinner' },
        { id: 'ceremony', name: 'Ceremony' },
        { id: 'brunch', name: 'Brunch' },
      ])
    ).toEqual({ dinner: 'Not Invited', ceremony: 'Invited', brunch: 'Not Invited' })
  })

  it('invites to nothing when there is no ceremony event', () => {
    expect(defaultInvitesForEvents([{ id: 'dinner', name: 'Dinner' }])).toEqual({
      dinner: 'Not Invited',
    })
  })
})
