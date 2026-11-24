import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

import { websiteService } from '~/server/domains/website'
import { resolveTemplate, TemplateThemeProvider } from '~/templates'

export default async function WeddingWebsiteLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ websiteSubUrl: string }>
}>) {
  const { websiteSubUrl } = await params
  const locale = await getLocale()
  const messages = await getMessages()

  // Theme everything under this layout, including the route-level loading fallbacks, with the
  // couple's template. Loading states render inside this layout but outside the page, so without
  // this they flash the app's default guest background before the themed page appears.
  // The template id is public (it only picks colours and fonts); if it can't be resolved the
  // pages simply theme themselves as before.
  let template: ReturnType<typeof resolveTemplate> | null = null
  try {
    const website = await websiteService.getBySubUrl(websiteSubUrl)
    if (website) template = resolveTemplate(website.templateId)
  } catch {
    template = null
  }

  const content = (
    // Guest-facing pages keep the original styling; see globals.css.
    <div data-guest-surface className='contents'>
      {children}
    </div>
  )

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {template ? (
        <TemplateThemeProvider template={template}>{content}</TemplateThemeProvider>
      ) : (
        content
      )}
    </NextIntlClientProvider>
  )
}
