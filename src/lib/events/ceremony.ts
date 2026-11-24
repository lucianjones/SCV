import { RSVP_STATUS } from '~/lib/constants/rsvp'

/**
 * The ceremony is the event named "Ceremony" (what onboarding creates), else "Wedding Day", else
 * the earliest event whose name mentions a ceremony (e.g. "Garden Ceremony"). Pass events in
 * creation order so "earliest" is well defined.
 */
export const pickCeremonyEvent = <T extends { name: string }>(events: T[]): T | undefined =>
  events.find((event) => event.name.trim().toLowerCase() === 'ceremony') ??
  events.find((event) => event.name.trim().toLowerCase() === 'wedding day') ??
  events.find((event) => event.name.toLowerCase().includes('ceremony'))

/**
 * Default invitation status per event for a new guest: invited to the ceremony, not invited to
 * anything else. Returns `eventId -> rsvp`.
 */
export const defaultInvitesForEvents = (
  events: Array<{ id: string; name: string }>
): Record<string, string> => {
  const ceremony = pickCeremonyEvent(events)
  return Object.fromEntries(
    events.map((event) => [
      event.id,
      event.id === ceremony?.id ? RSVP_STATUS.INVITED : RSVP_STATUS.NOT_INVITED,
    ])
  )
}
