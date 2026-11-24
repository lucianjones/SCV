'use client'

import { useTranslations } from 'next-intl'
import { useFormStatus } from 'react-dom'

import { Button } from '~/components/ui/button'

export function HouseholdSubmitButton({ variant }: Readonly<{ variant?: 'vineyard' }>) {
  const { pending } = useFormStatus()
  const tCommon = useTranslations('common')
  const tHousehold = useTranslations('household')

  if (variant === 'vineyard') {
    return (
      <button
        type='submit'
        disabled={pending}
        className='min-w-48 rounded-[3px] bg-foreground px-8 py-2.5 font-bold text-background text-sm hover:opacity-90 disabled:opacity-50'
      >
        {pending ? tCommon('saving') : tHousehold('saveDetails')}
      </button>
    )
  }

  return (
    <Button type='submit' disabled={pending}>
      {pending ? tCommon('saving') : tHousehold('saveDetails')}
    </Button>
  )
}
