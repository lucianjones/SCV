'use client'

import { useState } from 'react'

import { SelfInviteLinkManager } from '~/components/guest-list/self-invite-link-manager'
import { SendSaveTheDates } from '~/components/guest-list/send-save-the-dates'
import { Button } from '~/components/ui/button'

export function InviteLinkPanel() {
  const [open, setOpen] = useState(false)

  return (
    <div className='flex flex-col items-end gap-3'>
      <div className='flex flex-wrap items-center justify-end gap-2'>
        <SendSaveTheDates />
        <Button
          variant='outline'
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls='invite-link-panel'
        >
          Invite Link
        </Button>
      </div>
      {open && (
        <div
          id='invite-link-panel'
          className='w-full rounded-lg border border-border bg-muted/20 p-4'
        >
          <p className='mb-3 font-mono text-[0.58rem] text-foreground/60 uppercase tracking-widest'>
            Guest Self-Invite Link
          </p>
          <p className='mb-3 text-muted-foreground text-sm'>
            Share this link so guests can add their own contact details to your list.
          </p>
          <SelfInviteLinkManager />
        </div>
      )}
    </div>
  )
}
