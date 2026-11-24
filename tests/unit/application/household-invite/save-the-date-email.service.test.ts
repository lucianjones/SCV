jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

import type { HouseholdInviteService } from '~/server/application/household-invite/household-invite.service'
import { SaveTheDateEmailService } from '~/server/application/household-invite/save-the-date-email.service'

const authz = {
  userId: 'user-123',
  activeOrganization: { organizationId: 'org-123', role: 'owner' },
}

type GuestRow = { email: string | null; isPrimaryContact: boolean }

const household = (id: string, guests: GuestRow[]) => ({ id, guests })

const createService = (
  households: ReturnType<typeof household>[],
  options: { templateId?: string | undefined; configured?: boolean; events?: unknown[] } = {}
) => {
  const db = {
    event: {
      findMany: jest
        .fn()
        .mockResolvedValue(options.events ?? [{ id: 'event-ceremony', name: 'Ceremony' }]),
    },
    household: { findMany: jest.fn().mockResolvedValue(households) },
  }
  const inviteService = {
    ensureInviteLinks: jest.fn(async (_weddingId: string, ids: string[]) => {
      return new Map(ids.map((id) => [id, `https://example.com/w/site/save-the-date/${id}`]))
    }),
  }
  const sendBatch = jest.fn().mockResolvedValue({ sent: 0, failures: [] })
  sendBatch.mockImplementation(async (_templateId: string, emails: unknown[]) => ({
    sent: emails.length,
    failures: [],
  }))
  const service = new SaveTheDateEmailService(
    db as never,
    inviteService as unknown as HouseholdInviteService,
    {
      getTemplateId: () => ('templateId' in options ? options.templateId : 'tmpl_std'),
      isEmailConfigured: () => options.configured ?? true,
      sendBatch,
    }
  )
  return { service, db, inviteService, sendBatch }
}

describe('SaveTheDateEmailService', () => {
  it('only considers households with a guest invited to the ceremony', async () => {
    const { service, db } = createService([])

    await service.preview(authz as never, 'wedding-1')

    expect(db.household.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          weddingId: 'wedding-1',
          guests: {
            some: {
              invitations: { some: { eventId: 'event-ceremony', rsvp: { not: 'Not Invited' } } },
            },
          },
        },
      })
    )
  })

  it('emails the primary contact, falls back to the first guest with an email, and skips households without one', async () => {
    const { service, sendBatch, inviteService } = createService([
      household('h-primary', [
        { email: 'first@example.com', isPrimaryContact: false },
        { email: ' primary@example.com ', isPrimaryContact: true },
      ]),
      household('h-fallback', [
        { email: null, isPrimaryContact: true },
        { email: 'second@example.com', isPrimaryContact: false },
      ]),
      household('h-none', [
        { email: null, isPrimaryContact: true },
        { email: '  ', isPrimaryContact: false },
      ]),
    ])

    const result = await service.send(authz as never, 'wedding-1', {
      baseUrl: 'https://example.com',
    })

    expect(result).toEqual({ sent: 2, failed: 0, skippedNoEmail: 1, errors: [] })
    expect(inviteService.ensureInviteLinks).toHaveBeenCalledWith(
      'wedding-1',
      ['h-primary', 'h-fallback'],
      'https://example.com'
    )
    expect(sendBatch).toHaveBeenCalledWith(
      'tmpl_std',
      [
        {
          to: 'primary@example.com',
          variables: { SAVE_THE_DATE_URL: 'https://example.com/w/site/save-the-date/h-primary' },
        },
        {
          to: 'second@example.com',
          variables: { SAVE_THE_DATE_URL: 'https://example.com/w/site/save-the-date/h-fallback' },
        },
      ],
      expect.stringMatching(/^std-[0-9a-f]{64}$/)
    )
  })

  it('uses the same idempotency key for identical sends so double clicks do not email twice', async () => {
    const households = [household('h-1', [{ email: 'a@example.com', isPrimaryContact: true }])]
    const first = createService(households)
    const second = createService(households)

    await first.service.send(authz as never, 'wedding-1', { baseUrl: 'https://example.com' })
    await second.service.send(authz as never, 'wedding-1', { baseUrl: 'https://example.com' })

    expect(first.sendBatch.mock.calls[0]?.[2]).toBe(second.sendBatch.mock.calls[0]?.[2])
  })

  it('reports failures with distinct messages', async () => {
    const { service, sendBatch } = createService([
      household('h-1', [{ email: 'a@example.com', isPrimaryContact: true }]),
      household('h-2', [{ email: 'b@example.com', isPrimaryContact: true }]),
    ])
    sendBatch.mockResolvedValue({
      sent: 1,
      failures: [{ index: 1, message: 'Invalid `to` field' }],
    })

    await expect(
      service.send(authz as never, 'wedding-1', { baseUrl: 'https://example.com' })
    ).resolves.toEqual({ sent: 1, failed: 1, skippedNoEmail: 0, errors: ['Invalid `to` field'] })
  })

  it('refuses to send when the Resend template is not configured', async () => {
    const { service, sendBatch } = createService([], { templateId: undefined })

    await expect(
      service.send(authz as never, 'wedding-1', { baseUrl: 'https://example.com' })
    ).rejects.toHaveProperty('code', 'PRECONDITION_FAILED')
    expect(sendBatch).not.toHaveBeenCalled()
  })

  it('refuses to send when there is no Ceremony event', async () => {
    const { service } = createService([], { events: [] })

    await expect(service.preview(authz as never, 'wedding-1')).rejects.toHaveProperty(
      'code',
      'PRECONDITION_FAILED'
    )
  })

  it('falls back to the Wedding Day event when there is no Ceremony event', async () => {
    const { service, db } = createService([], {
      events: [{ id: 'event-wd', name: 'Wedding Day' }],
    })

    const preview = await service.preview(authz as never, 'wedding-1')

    expect(preview.ceremonyEventName).toBe('Wedding Day')
    expect(db.household.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          guests: {
            some: {
              invitations: { some: { eventId: 'event-wd', rsvp: { not: 'Not Invited' } } },
            },
          },
        }),
      })
    )
  })

  it('recognises ceremony events with a longer name, preferring exact matches', async () => {
    const { service, db } = createService([], {
      events: [
        { id: 'event-dinner', name: 'Rehearsal Dinner' },
        { id: 'event-garden', name: 'Garden Ceremony' },
      ],
    })

    const preview = await service.preview(authz as never, 'wedding-1')

    expect(preview.ceremonyEventName).toBe('Garden Ceremony')
    expect(db.household.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          guests: {
            some: {
              invitations: { some: { eventId: 'event-garden', rsvp: { not: 'Not Invited' } } },
            },
          },
        }),
      })
    )
  })

  it('sends nothing when no household qualifies', async () => {
    const { service, sendBatch } = createService([])

    await expect(
      service.send(authz as never, 'wedding-1', { baseUrl: 'https://example.com' })
    ).resolves.toEqual({ sent: 0, failed: 0, skippedNoEmail: 0, errors: [] })
    expect(sendBatch).not.toHaveBeenCalled()
  })
})
