import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { VineyardAttendanceQuestion } from '~/templates/vineyard/components/attendance-question'

const labels = {
  planOnAttending: 'Do you plan on attending?',
  planYes: 'Yes',
  planMaybe: 'Maybe',
  planNo: 'No',
  planNote: 'This is just to help us plan.',
  planSaved: 'Thanks! We have noted your answer.',
  planError: 'We could not save your answer.',
  planAnswerYes: 'You told us you plan on attending.',
  planAnswerMaybe: 'You told us you might attend.',
  planAnswerNo: "You told us you can't make it.",
  planChange: 'Change my answer',
  planCancel: 'Cancel',
}

const deferred = () => {
  let resolve!: (value: { ok: boolean }) => void
  const promise = new Promise<{ ok: boolean }>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('VineyardAttendanceQuestion', () => {
  it('asks the question with three plain buttons when there is no answer yet', () => {
    render(<VineyardAttendanceQuestion current={null} action={jest.fn()} labels={labels} />)

    expect(screen.getByText('Do you plan on attending?')).toBeInTheDocument()
    for (const name of ['Yes', 'Maybe', 'No']) {
      const button = screen.getByRole('button', { name })
      expect(button).toBeInTheDocument()
      expect(button).not.toHaveAttribute('aria-pressed')
    }
    expect(screen.queryByRole('button', { name: 'Change my answer' })).toBeNull()
  })

  it('shows the saved answer as a note with a change button instead of the choices', () => {
    render(<VineyardAttendanceQuestion current='maybe' action={jest.fn()} labels={labels} />)

    expect(screen.getByText('You told us you might attend.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change my answer' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Yes' })).toBeNull()
    expect(screen.queryByText('Do you plan on attending?')).toBeNull()
  })

  it('hides the buttons and shows the note immediately, before the save finishes', async () => {
    const pending = deferred()
    const action = jest.fn().mockReturnValue(pending.promise)
    render(<VineyardAttendanceQuestion current={null} action={action} labels={labels} />)

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))

    await waitFor(() =>
      expect(screen.getByText('You told us you plan on attending.')).toBeInTheDocument()
    )
    expect(screen.queryByRole('button', { name: 'Maybe' })).toBeNull()
    expect(screen.queryByText('Thanks! We have noted your answer.')).toBeNull()
    const sent = action.mock.calls[0]?.[0] as FormData
    expect(sent.get('intent')).toBe('yes')

    await act(async () => {
      pending.resolve({ ok: true })
    })
    expect(await screen.findByText('Thanks! We have noted your answer.')).toBeInTheDocument()
    expect(screen.getByText('You told us you plan on attending.')).toBeInTheDocument()
  })

  it('lets the guest change their answer, and cancel without changing it', async () => {
    const action = jest.fn().mockResolvedValue({ ok: true })
    render(<VineyardAttendanceQuestion current='yes' action={action} labels={labels} />)

    fireEvent.click(screen.getByRole('button', { name: 'Change my answer' }))
    expect(screen.getByRole('button', { name: 'Maybe' })).toBeInTheDocument()
    expect(screen.queryByText('You told us you plan on attending.')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('You told us you plan on attending.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Maybe' })).toBeNull()
    expect(action).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Change my answer' }))
    fireEvent.click(screen.getByRole('button', { name: 'No' }))

    expect(await screen.findByText("You told us you can't make it.")).toBeInTheDocument()
    expect((action.mock.calls[0]?.[0] as FormData).get('intent')).toBe('no')
  })

  it('brings the question back with an error when saving fails', async () => {
    const pending = deferred()
    render(
      <VineyardAttendanceQuestion
        current={null}
        action={jest.fn().mockReturnValue(pending.promise)}
        labels={labels}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    await screen.findByText('You told us you plan on attending.')

    await act(async () => {
      pending.resolve({ ok: false })
    })

    expect(await screen.findByText('We could not save your answer.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument()
    expect(screen.queryByText('You told us you plan on attending.')).toBeNull()
  })

  it('returns to the previous answer when changing it fails to save', async () => {
    const pending = deferred()
    render(
      <VineyardAttendanceQuestion
        current='yes'
        action={jest.fn().mockReturnValue(pending.promise)}
        labels={labels}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Change my answer' }))
    fireEvent.click(await screen.findByRole('button', { name: 'No' }))
    await screen.findByText("You told us you can't make it.")

    await act(async () => {
      pending.resolve({ ok: false })
    })

    expect(await screen.findByText('You told us you plan on attending.')).toBeInTheDocument()
    expect(screen.getByText('We could not save your answer.')).toBeInTheDocument()
  })

  it('collapses to the note immediately even when the same answer is chosen again', async () => {
    const pending = deferred()
    render(
      <VineyardAttendanceQuestion
        current='yes'
        action={jest.fn().mockReturnValue(pending.promise)}
        labels={labels}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Change my answer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))

    expect(await screen.findByText('You told us you plan on attending.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Maybe' })).toBeNull()

    await act(async () => {
      pending.resolve({ ok: true })
    })
    expect(await screen.findByText('Thanks! We have noted your answer.')).toBeInTheDocument()
  })
})
