'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { PhoneInput } from '~/components/ui/phone-input'
import { HouseholdSubmitButton } from '~/components/website/household-invite/household-submit-button'
import type { HouseholdInviteData } from '~/server/application/household-invite/household-invite.service'

type HouseholdDetailsFormProps = {
  inviteData: HouseholdInviteData
  action: (formData: FormData) => Promise<void>
  errorMessage?: string | null
  inviteHref: string
  /** Template-specific styling (Vineyard: soft cards, flat dark buttons, template fonts). */
  variant?: 'vineyard'
}

const valueOrEmpty = (value: string | null) => value ?? ''

export function HouseholdDetailsForm({
  inviteData,
  action,
  errorMessage,
  inviteHref,
  variant,
}: Readonly<HouseholdDetailsFormProps>) {
  const vineyard = variant === 'vineyard'
  const sectionHeadingClass = vineyard
    ? 'font-[family-name:var(--tpl-body-font)] text-base font-bold'
    : 'font-mono text-muted-foreground text-xs uppercase tracking-[0.22em]'
  const fieldsetClass = vineyard
    ? 'rounded-2xl border-0 bg-foreground/[0.07] p-6'
    : 'border border-border p-5'
  const legendClass = vineyard
    ? 'float-left mb-2 w-full px-0 font-[family-name:var(--tpl-script-font)] text-3xl'
    : 'px-2 font-serif text-lg'
  const inputClass = vineyard
    ? 'rounded-[3px] border-foreground/25 bg-white font-[family-name:var(--tpl-body-font)]'
    : undefined
  const labelClass = vineyard ? 'font-[family-name:var(--tpl-body-font)] text-sm' : undefined
  const t = useTranslations('household')
  const [phones, setPhones] = useState<Record<number, string>>(() =>
    Object.fromEntries(inviteData.guests.map((guest) => [guest.id, valueOrEmpty(guest.phone)]))
  )

  return (
    <form action={action} className='mt-10 space-y-10'>
      {errorMessage ? (
        <p className='border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm'>
          {errorMessage}
        </p>
      ) : null}

      <section className='space-y-5'>
        <h2 className={sectionHeadingClass}>{t('members')}</h2>

        <div className='space-y-6'>
          {inviteData.guests.map((guest) => (
            <fieldset key={guest.id} className={fieldsetClass}>
              <input type='hidden' name='guestId' value={guest.id} />
              <legend className={legendClass}>
                {[guest.firstName, guest.lastName].filter(Boolean).join(' ')}
              </legend>

              <div className='clear-both mt-4 grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor={`guest-${guest.id}-firstName`}>{t('firstName')}</Label>
                  <Input
                    className={inputClass}
                    id={`guest-${guest.id}-firstName`}
                    name={`guest-${guest.id}-firstName`}
                    defaultValue={guest.firstName}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`guest-${guest.id}-lastName`}>{t('lastName')}</Label>
                  <Input
                    className={inputClass}
                    id={`guest-${guest.id}-lastName`}
                    name={`guest-${guest.id}-lastName`}
                    defaultValue={guest.lastName}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`guest-${guest.id}-email`}>{t('email')}</Label>
                  <Input
                    className={inputClass}
                    id={`guest-${guest.id}-email`}
                    name={`guest-${guest.id}-email`}
                    type='email'
                    defaultValue={valueOrEmpty(guest.email)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`guest-${guest.id}-phone`}>{t('phone')}</Label>
                  <input
                    type='hidden'
                    name={`guest-${guest.id}-phone`}
                    value={phones[guest.id] ?? ''}
                  />
                  <PhoneInput
                    id={`guest-${guest.id}-phone`}
                    value={phones[guest.id] || undefined}
                    onChange={(nextValue) =>
                      setPhones((current) => ({ ...current, [guest.id]: nextValue ?? '' }))
                    }
                    className={
                      vineyard ? 'w-full rounded-[3px] border-foreground/25 bg-white' : 'w-full'
                    }
                  />
                </div>
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className='space-y-5'>
        <h2 className={sectionHeadingClass}>{t('mailingAddress')}</h2>

        <div className='grid gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='address1' className={labelClass}>
              {t('streetAddress')}
            </Label>
            <Input
              className={inputClass}
              id='address1'
              name='address1'
              defaultValue={valueOrEmpty(inviteData.household.address1)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='address2' className={labelClass}>
              {t('aptSuite')}
            </Label>
            <Input
              className={inputClass}
              id='address2'
              name='address2'
              defaultValue={valueOrEmpty(inviteData.household.address2)}
            />
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='city' className={labelClass}>
                {t('city')}
              </Label>
              <Input
                className={inputClass}
                id='city'
                name='city'
                defaultValue={valueOrEmpty(inviteData.household.city)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='state' className={labelClass}>
                {t('stateProvince')}
              </Label>
              <Input
                className={inputClass}
                id='state'
                name='state'
                defaultValue={valueOrEmpty(inviteData.household.state)}
              />
            </div>
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='zipCode' className={labelClass}>
                {t('postalCode')}
              </Label>
              <Input
                className={inputClass}
                id='zipCode'
                name='zipCode'
                defaultValue={valueOrEmpty(inviteData.household.zipCode)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='country' className={labelClass}>
                {t('country')}
              </Label>
              <Input
                className={inputClass}
                id='country'
                name='country'
                defaultValue={valueOrEmpty(inviteData.household.country)}
              />
            </div>
          </div>
        </div>
      </section>

      <p className='max-w-xl text-muted-foreground text-sm leading-6'>{t('privacyNote')}</p>

      <div className='flex flex-wrap items-center gap-3'>
        <HouseholdSubmitButton variant={variant} />
        {vineyard ? (
          <Link
            href={inviteHref}
            className='min-w-48 rounded-[3px] border border-foreground/40 px-8 py-2.5 text-center font-bold text-foreground text-sm hover:bg-foreground/10'
          >
            {t('backToSaveTheDate')}
          </Link>
        ) : (
          <Button asChild type='button' variant='outline'>
            <Link href={inviteHref}>{t('backToSaveTheDate')}</Link>
          </Button>
        )}
      </div>
    </form>
  )
}
