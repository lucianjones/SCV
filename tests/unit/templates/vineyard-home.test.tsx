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
  it('does not list any events on the home page', () => {
    renderHome([
      event('ceremony', 'Ceremony'),
      event('dinner', 'Welcome Dinner'),
      event('brunch', 'Farewell Brunch'),
    ])

    for (const name of ['Ceremony', 'Welcome Dinner', 'Farewell Brunch']) {
      expect(screen.queryByRole('heading', { name })).toBeNull()
    }
    expect(screen.queryByText('September 25, 2027')).toBeNull()
  })

  it('still shows the couple, place-and-date header and RSVP link', () => {
    renderHome([event('ceremony', 'Ceremony')])

    expect(screen.getByText('Joanna Ryan')).toBeInTheDocument()
    expect(screen.getByText('Lucian Jones')).toBeInTheDocument()
    expect(screen.getByText('September 25')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'RSVP' }).length).toBeGreaterThan(0)
  })
})
