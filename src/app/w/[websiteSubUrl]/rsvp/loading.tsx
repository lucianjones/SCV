/**
 * The RSVP page is rendered inside the couple's template, which this boundary cannot know,
 * so show nothing rather than a generic skeleton that flashes before the themed page.
 */
export default function RsvpLoading() {
  return <div role='status' aria-busy='true' className='min-h-screen' />
}
