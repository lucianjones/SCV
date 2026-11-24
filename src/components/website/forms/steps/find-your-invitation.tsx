'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { StepFormProps } from '~/app/utils/shared-types'
import { useRsvpForm, useUpdateRsvpForm } from '~/components/contexts/rsvp-form-context'
import { api } from '~/trpc/react'

export default function FindYourInvitationForm({
  goNext,
  variant,
}: StepFormProps & { variant?: 'vineyard' }) {
  const t = useTranslations('rsvp')
  const tCommon = useTranslations('common')
  const { weddingData } = useRsvpForm()
  const updateRsvpForm = useUpdateRsvpForm()
  const [name, setName] = useState<string>('')
  const [showError, setShowError] = useState<boolean>(false)
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false)

  const subUrl = weddingData.website?.subUrl ?? ''

  const { refetch, isFetching } = api.household.findBySearchPublic.useQuery(
    { subUrl, searchText: name },
    {
      enabled: false,
      retry: false,
    }
  )

  const handleOnSearch = () => {
    // the method to conditionally execute client db queries?
    void refetch().then((res) => {
      // Only advance when the search actually returned households. Guarding on
      // presence (not just length) keeps an errored or empty response on this
      // step showing the retry hint, instead of dropping the guest onto a blank
      // confirm screen with no names to pick.
      if (res.error || !res.data || res.data.length === 0) {
        // A blocked search is not "name not found": don't tell a guest they are not on the list.
        setIsRateLimited(res.error?.data?.code === 'TOO_MANY_REQUESTS')
        setShowError(true)
      } else {
        updateRsvpForm({ matchedHouseholds: res.data })
        goNext?.()
      }
    })
  }

  if (variant === 'vineyard') {
    return (
      <div className='flex flex-col items-center gap-5 rounded-2xl bg-foreground/[0.07] px-6 py-14 text-center sm:px-16'>
        <p className='max-w-md text-balance text-sm leading-6'>{t('vineyardIntro')}</p>
        <div className='flex w-full max-w-xs flex-col gap-1.5 text-left'>
          <input
            placeholder={t('fullNamePlaceholder')}
            className='rounded-[3px] border border-foreground/25 bg-white px-3 py-2.5 text-foreground text-sm placeholder:text-foreground/50'
            onChange={(e) => {
              setShowError(false)
              setIsRateLimited(false)
              setName(e.target.value)
            }}
            value={name}
          />
          <span className='text-[0.65rem] leading-4'>{t('vineyardExample')}</span>
        </div>
        {showError && (
          <p className='max-w-sm text-xs'>{isRateLimited ? t('tooManyRequests') : t('notFound')}</p>
        )}
        <button
          className={`min-w-40 rounded-[3px] px-8 py-2.5 font-bold text-background text-sm ${name.length === 0 || isFetching ? 'cursor-not-allowed bg-foreground/50' : 'bg-foreground hover:opacity-90'}`}
          type='button'
          disabled={name.length === 0}
          onClick={handleOnSearch}
        >
          {isFetching ? tCommon('searching') : t('continue')}
        </button>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-5'>
      <h2 className='text-2xl tracking-widest'>
        {t('weddingTitle', {
          brideFirstName: weddingData.brideFirstName ?? '',
          groomFirstName: weddingData.groomFirstName ?? '',
        })}
      </h2>
      <p className='mb-3 font-thin'>{t('groupNote')}</p>
      <input
        placeholder={t('fullNamePlaceholder')}
        className='border border-gray-400 bg-white p-3 text-black placeholder:text-gray-500'
        onChange={(e) => {
          setShowError(false)
          setIsRateLimited(false)
          setName(e.target.value)
        }}
        value={name}
      />
      {showError && (
        <p className='text-xs'>{isRateLimited ? t('tooManyRequests') : t('notFound')}</p>
      )}
      <button
        className={`mt-3 py-3 text-white text-xl tracking-wide ${name.length === 0 || isFetching ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
        type='button'
        disabled={name.length === 0}
        onClick={handleOnSearch}
      >
        {isFetching ? tCommon('searching') : t('findInvitation')}
      </button>
    </div>
  )
}
