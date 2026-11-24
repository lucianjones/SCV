import 'server-only'

import { render } from '@react-email/render'
import { Resend } from 'resend'

import { OrganizationInvitationEmail } from '~/emails/organization-invitation-email'
import { OtpEmail } from '~/emails/otp-email'
import { ResetPasswordEmail } from '~/emails/reset-password-email'
import { env } from '~/env'

const OTP_SUBJECTS = {
  'sign-in': 'Your sign-in code',
  'email-verification': 'Verify your email',
  'forget-password': 'Reset your password',
  'change-email': 'Confirm your new email',
} as const

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(env.RESEND_API_KEY)
  }
  return _resend
}

export async function sendOtpEmail({
  to,
  otp,
  type,
}: {
  to: string
  otp: string
  type: keyof typeof OTP_SUBJECTS
}) {
  const templateType = type === 'change-email' ? 'email-verification' : type

  const html = await render(<OtpEmail otp={otp} type={templateType} />)

  // Resend returns `{ error }` instead of throwing on API failures. Throw so a rejected send
  // is at least logged by Better Auth instead of leaving the user waiting for a code that
  // was never sent.
  const { error } = await getResend().emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: OTP_SUBJECTS[type],
    html,
  })

  if (error) {
    throw new Error(`Failed to send ${type} OTP email: ${error.message}`)
  }
}

export async function sendResetPasswordEmail({
  to,
  url,
  userName,
}: {
  to: string
  url: string
  userName?: string
}) {
  const html = await render(<ResetPasswordEmail url={url} userName={userName} />)

  await getResend().emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: 'Reset your password',
    html,
  })
}

export async function sendOrganizationInvitationEmail({
  to,
  inviteUrl,
  organizationName,
  invitedByName,
  memberRole,
}: {
  to: string
  inviteUrl: string
  organizationName: string
  invitedByName?: string
  memberRole: string
}) {
  const html = await render(
    <OrganizationInvitationEmail
      inviteUrl={inviteUrl}
      invitedByName={invitedByName}
      organizationName={organizationName}
      memberRole={memberRole}
    />
  )

  await getResend().emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: `You've been invited to join ${organizationName} on OSWP`,
    html,
  })
}

export type TemplatedEmail = {
  to: string
  variables: Record<string, string | number>
}

export type TemplatedEmailBatchResult = {
  sent: number
  failures: Array<{ index: number; message: string }>
}

const RESEND_BATCH_LIMIT = 100

/**
 * Sends one Resend-template email per recipient using the batch API (up to 100 per request).
 * Sender and subject come from the template. Each chunk carries an idempotency key derived from
 * `idempotencyKey`, so re-sending an identical batch within Resend's 24h window is a no-op.
 * Failures are reported per email (by index in `emails`) instead of throwing.
 */
export async function sendTemplatedEmailBatch(
  templateId: string,
  emails: TemplatedEmail[],
  idempotencyKey: string
): Promise<TemplatedEmailBatchResult> {
  let sent = 0
  const failures: TemplatedEmailBatchResult['failures'] = []

  for (let start = 0; start < emails.length; start += RESEND_BATCH_LIMIT) {
    const chunk = emails.slice(start, start + RESEND_BATCH_LIMIT)
    const { error, data } = await getResend().batch.send(
      chunk.map((email) => ({
        to: email.to,
        template: { id: templateId, variables: email.variables },
      })),
      { batchValidation: 'permissive', idempotencyKey: `${idempotencyKey}-${start}` }
    )

    if (error || !data) {
      const message = error?.message ?? 'Resend did not accept the batch'
      for (let offset = 0; offset < chunk.length; offset++) {
        failures.push({ index: start + offset, message })
      }
      continue
    }

    const failedHere = data.errors ?? []
    for (const failure of failedHere) {
      failures.push({ index: start + failure.index, message: failure.message })
    }
    sent += chunk.length - failedHere.length
  }

  return { sent, failures }
}
