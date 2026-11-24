'use client'

import { Mail } from 'lucide-react'
import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { api } from '~/trpc/react'

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`

/**
 * Emails every household invited to the ceremony that has an email address, using the Resend
 * save-the-date template and each household's own link. Opens a confirmation first so a stray
 * click can't send anything.
 */
export function SendSaveTheDates() {
  const [open, setOpen] = useState(false)

  const preview = api.householdInvite.previewSaveTheDateEmails.useQuery(undefined, {
    enabled: open,
    retry: false,
    refetchOnWindowFocus: false,
  })
  const send = api.householdInvite.sendSaveTheDateEmails.useMutation()

  const close = (nextOpen: boolean) => {
    // Don't let the dialog be dismissed mid-send.
    if (!nextOpen && send.isPending) return
    setOpen(nextOpen)
    if (!nextOpen) send.reset()
  }

  const result = send.data
  const recipientCount = preview.data?.recipientCount ?? 0

  return (
    <>
      <Button variant='outline' onClick={() => setOpen(true)}>
        <Mail className='mr-2 h-4 w-4' aria-hidden='true' />
        Send Save the Dates
      </Button>

      <AlertDialog open={open} onOpenChange={close}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {result ? 'Save the dates sent' : 'Send save the date emails?'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className='space-y-2 text-sm'>
                {result ? (
                  <>
                    <p>
                      {plural(result.sent, 'email', 'emails')} sent
                      {result.failed > 0 ? `, ${result.failed} failed` : ''}.
                    </p>
                    {result.errors.length > 0 && (
                      <ul className='list-disc pl-5 text-destructive'>
                        {result.errors.map((message) => (
                          <li key={message}>{message}</li>
                        ))}
                      </ul>
                    )}
                    {result.skippedNoEmail > 0 && (
                      <p>
                        {plural(result.skippedNoEmail, 'household', 'households')} skipped because
                        no one in them has an email address.
                      </p>
                    )}
                  </>
                ) : preview.isLoading ? (
                  <p>Checking who is invited…</p>
                ) : preview.error ? (
                  <p className='text-destructive'>{preview.error.message}</p>
                ) : (
                  <>
                    <p>
                      This emails {plural(recipientCount, 'household', 'households')} invited to “
                      {preview.data?.ceremonyEventName}” that{' '}
                      {recipientCount === 1 ? 'has' : 'have'} an email address, each with their own
                      save-the-date link.
                    </p>
                    {(preview.data?.skippedNoEmailCount ?? 0) > 0 && (
                      <p>
                        {plural(preview.data?.skippedNoEmailCount ?? 0, 'household', 'households')}{' '}
                        will be skipped because no one in them has an email address.
                      </p>
                    )}
                    <p>
                      One email is sent per household, to its primary contact when they have one.
                    </p>
                    {send.error && <p className='text-destructive'>{send.error.message}</p>}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={send.isPending}>
              {result ? 'Done' : 'Cancel'}
            </AlertDialogCancel>
            {!result && (
              <Button
                onClick={() => send.mutate()}
                disabled={
                  send.isPending ||
                  preview.isLoading ||
                  Boolean(preview.error) ||
                  recipientCount === 0
                }
              >
                {send.isPending
                  ? 'Sending…'
                  : `Send to ${plural(recipientCount, 'household', 'households')}`}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
