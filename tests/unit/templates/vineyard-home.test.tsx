import { render, screen } from '@testing-library/react'

import { VineyardHome } from '~/templates/vineyard/components/home'

const event = (id: string, name: string, date: Date | null = new Date('2027-09-25')) => ({
  id,
  name,
  date,
  startTime: null,
  endTime: null,
  venue: null,
  attire: null,
  description: null,
  weddingId: 'wedding-1',
  collectRsvp: false,
  questions: [],
})

const renderHome = (events: ReturnType<typeof event>[]) =>
  render(
    <VineyardHome
      path='/w/site'
      weddingData={
        {
          groomFirstName: 'Lucian',
          groomLastName: 'Jones',
          brideFirstName: 'Joanna',
          brideLastName: 'Ryan',
          date: { standardFormat: 'Saturday, Sep 25, 2027', numberFormat: '09.25.2027' },
          website: {
            isRsvpEnabled: true,
            headerImageUrl: null,
            coverPhotoUrl: null,
            coupleImageUrls: [],
          },
          sections: [],
          events,
        } as never
      }
    />
  )

describe('VineyardHome events', () => {
  it('does not repeat the ceremony and its date below the RSVP button', () => {
    renderHome([event('ceremony', 'Ceremony')])

    expect(screen.queryByRole('heading', { name: 'Ceremony' })).toBeNull()
    expect(screen.queryByText('September 25, 2027')).toBeNull()
  })

  it('still lists the other events', () => {
    renderHome([event('ceremony', 'Ceremony'), event('dinner', 'Welcome Dinner')])

    expect(screen.queryByRole('heading', { name: 'Ceremony' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Welcome Dinner' })).toBeInTheDocument()
    // Only the dinner's date is listed, which also proves the date format asserted above is real.
    expect(screen.getAllByText('September 25, 2027')).toHaveLength(1)
  })
})
