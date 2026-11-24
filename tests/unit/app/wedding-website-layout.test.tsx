import { render, screen } from '@testing-library/react'
import WeddingWebsiteLayout from '~/app/w/[websiteSubUrl]/layout'

jest.mock('next-intl', () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('next-intl/server', () => ({
  getLocale: jest.fn().mockResolvedValue('en'),
  getMessages: jest.fn().mockResolvedValue({}),
}))

jest.mock('~/components/locale-toggle', () => ({
  LocaleToggle: () => <button type='button'>Language</button>,
}))

const mockGetBySubUrl = jest.fn()
jest.mock('~/server/domains/website', () => ({
  websiteService: { getBySubUrl: (...args: unknown[]) => mockGetBySubUrl(...args) },
}))

const params = Promise.resolve({ websiteSubUrl: 'harry-and-hermione' })

beforeEach(() => {
  mockGetBySubUrl.mockReset()
})

it('does not show the unfinished locale toggle on wedding websites', async () => {
  mockGetBySubUrl.mockResolvedValue(null)
  render(await WeddingWebsiteLayout({ children: <div>Wedding website</div>, params }))

  expect(screen.getByText('Wedding website')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Language' })).toBeNull()
})

it("wraps children in the couple's template so loading fallbacks share its background", async () => {
  mockGetBySubUrl.mockResolvedValue({ templateId: 'vineyard' })
  const { container } = render(
    await WeddingWebsiteLayout({ children: <div>Loading fallback</div>, params })
  )

  const themed = container.querySelector('[data-wedding-template="vineyard"]')
  expect(themed).not.toBeNull()
  expect(themed).toContainElement(screen.getByText('Loading fallback'))
  expect(themed?.className).toContain('bg-background')
})

it('still renders the page when the website cannot be resolved', async () => {
  mockGetBySubUrl.mockRejectedValue(new Error('db down'))
  const { container } = render(
    await WeddingWebsiteLayout({ children: <div>Wedding website</div>, params })
  )

  expect(screen.getByText('Wedding website')).toBeInTheDocument()
  expect(container.querySelector('[data-wedding-template]')).toBeNull()
})
