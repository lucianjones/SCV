import { createHash } from 'node:crypto'
// biome-ignore lint/style/noRestrictedImports: Application service owns a cross-domain public flow.
import type { PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'

import type { TemplatedEmail, TemplatedEmailBatchResult } from '~/lib/email'
import { pickCeremonyEvent } from '~/lib/events/ceremony'
import { logger } from '~/lib/observability/logger'
import type { HouseholdInviteService } from '~/server/application/household-invite/household-invite.service'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'

type SaveTheDateEmailDb = Pick<PrismaClient, 'event' | 'household'>

type SendBatch = (
  templateId: string,
  emails: TemplatedEmail[],
  idempotencyKey: string
) => Promise<TemplatedEmailBatchResult>

export type SaveTheDateEmailPreview = {
  /** Households that will receive an email. */
  recipientCount: number
  /** Households invited to the ceremony that have no email address on any guest. */
  skippedNoEmailCount: number
  ceremonyEventName: string
}

export type SaveTheDateEmailResult = {
  sent: number
  failed: number
  skippedNoEmail: number
  /** Distinct failure messages (max 3) to help diagnose a bad template or sender. */
  errors: string[]
}

const VARIABLE_NAME = 'SAVE_THE_DATE_URL'

type Recipient = { householdId: string; email: string }

/**
 * The address a household's save the date goes to: the primary contact's email when they have
 * one, otherwise the first household member who has an email.
 */
export const chooseHouseholdEmail = (
  guests: Array<{ email: string | null; isPrimaryContact: boolean }>
): string | null => {
  const withEmail = guests.filter((guest) => guest.email?.trim())
  const chosen = withEmail.find((guest) => guest.isPrimaryContact) ?? withEmail[0]
  return chosen?.email?.trim() || null
}

/**
 * Sends the Resend save-the-date template to every household that is invited to the ceremony and
 * has an email address, with that household's own save-the-date link as SAVE_THE_DATE_URL.
 *
 * One email goes to each household: the primary contact's email when they have one, otherwise the
 * first household member who has an email.
 */
export class SaveTheDateEmailService {
  constructor(
    private db: SaveTheDateEmailDb,
    private inviteService: HouseholdInviteService,
    private deps: {
      getTemplateId: () => string | undefined
      isEmailConfigured: () => boolean
      sendBatch: SendBatch
    }
  ) {}

  async preview(ctx: AuthzContext, weddingId: string): Promise<SaveTheDateEmailPreview> {
    requirePermission(ctx, { guest_invitation: ['send'] })
    const { recipients, skippedNoEmail, ceremonyEventName } = await this.findRecipients(weddingId)
    return {
      recipientCount: recipients.length,
      skippedNoEmailCount: skippedNoEmail,
      ceremonyEventName,
    }
  }

  async send(
    ctx: AuthzContext,
    weddingId: string,
    input: { baseUrl: string }
  ): Promise<SaveTheDateEmailResult> {
    requirePermission(ctx, { guest_invitation: ['send'] })

    const templateId = this.deps.getTemplateId()
    if (!this.deps.isEmailConfigured() || !templateId) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message:
          'Save-the-date emails are not set up. Add RESEND_API_KEY and RESEND_SAVE_THE_DATE_TEMPLATE_ID to your environment.',
      })
    }

    const { recipients, skippedNoEmail } = await this.findRecipients(weddingId)
    if (recipients.length === 0) {
      return { sent: 0, failed: 0, skippedNoEmail, errors: [] }
    }

    const urls = await this.inviteService.ensureInviteLinks(
      weddingId,
      recipients.map((recipient) => recipient.householdId),
      input.baseUrl
    )

    const emails: TemplatedEmail[] = []
    const keyParts: string[] = []
    for (const recipient of recipients) {
      const url = urls.get(recipient.householdId)
      if (!url) continue
      emails.push({ to: recipient.email, variables: { [VARIABLE_NAME]: url } })
      keyParts.push(`${recipient.householdId}|${recipient.email}|${url}`)
    }

    // The same recipients and links produce the same key, so an accidental double click (or a
    // retry) within Resend's 24h idempotency window will not email anyone twice.
    const idempotencyKey = `std-${createHash('sha256')
      .update([weddingId, templateId, ...keyParts.sort()].join('\n'))
      .digest('hex')}`

    const { sent, failures } = await this.deps.sendBatch(templateId, emails, idempotencyKey)

    if (failures.length > 0) {
      logger.error('Some save-the-date emails failed to send', {
        component: 'save-the-date-email',
        wedding_id: weddingId,
        failed: failures.length,
      })
    }

    return {
      sent,
      failed: failures.length,
      skippedNoEmail,
      errors: [...new Set(failures.map((failure) => failure.message))].slice(0, 3),
    }
  }

  /**
   * Emails one household its save-the-date link, regardless of whether it is invited to the
   * ceremony (the couple chose to send it). Re-sending is allowed; only an identical request within
   * the same minute is de-duplicated, so a double click does not send twice.
   */
  async sendToHousehold(
    ctx: AuthzContext,
    weddingId: string,
    input: { householdId: string; baseUrl: string }
  ): Promise<{ email: string }> {
    requirePermission(ctx, { guest_invitation: ['send'] })

    const templateId = this.deps.getTemplateId()
    if (!this.deps.isEmailConfigured() || !templateId) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message:
          'Save-the-date emails are not set up. Add RESEND_API_KEY and RESEND_SAVE_THE_DATE_TEMPLATE_ID to your environment.',
      })
    }

    const household = await this.db.household.findFirst({
      where: { id: input.householdId, weddingId },
      select: {
        id: true,
        guests: {
          orderBy: { id: 'asc' },
          select: { email: true, isPrimaryContact: true },
        },
      },
    })
    if (!household) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Household not found' })
    }

    const email = chooseHouseholdEmail(household.guests)
    if (!email) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No one in this household has an email address.',
      })
    }

    const urls = await this.inviteService.ensureInviteLinks(
      weddingId,
      [household.id],
      input.baseUrl
    )
    const url = urls.get(household.id)
    if (!url) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Household not found' })
    }

    const minute = Math.floor(Date.now() / 60_000)
    const idempotencyKey = `std-one-${createHash('sha256')
      .update([weddingId, templateId, household.id, email, url, minute].join('\n'))
      .digest('hex')}`

    const { failures } = await this.deps.sendBatch(
      templateId,
      [{ to: email, variables: { [VARIABLE_NAME]: url } }],
      idempotencyKey
    )
    if (failures.length > 0) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `The email could not be sent: ${failures[0]?.message ?? 'unknown error'}`,
      })
    }

    return { email }
  }

  private async findRecipients(weddingId: string): Promise<{
    recipients: Recipient[]
    skippedNoEmail: number
    ceremonyEventName: string
  }> {
    const events = await this.db.event.findMany({
      where: { weddingId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true },
    })
    const ceremony = pickCeremonyEvent(events)
    if (!ceremony) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Add a "Ceremony" event and invite guests to it before sending save the dates.',
      })
    }

    const households = await this.db.household.findMany({
      where: {
        weddingId,
        guests: {
          some: {
            invitations: { some: { eventId: ceremony.id, rsvp: { not: 'Not Invited' } } },
          },
        },
      },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        guests: {
          orderBy: { id: 'asc' },
          select: { email: true, isPrimaryContact: true },
        },
      },
    })

    const recipients: Recipient[] = []
    let skippedNoEmail = 0
    for (const household of households) {
      const email = chooseHouseholdEmail(household.guests)
      if (email) recipients.push({ householdId: household.id, email })
      else skippedNoEmail += 1
    }

    return { recipients, skippedNoEmail, ceremonyEventName: ceremony.name }
  }
}
