'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { Event } from '~/app/utils/shared-types'
import {
  buildHouseholdPayloads,
  downloadGuestCsvTemplate,
  groupRowsIntoHouseholds,
  type ParsedCsvRow,
  parseCsvFile,
  type ValidParsedCsvRow,
} from '~/components/guest-list/guest-csv-import.schema'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { FileDropzone } from '~/components/ui/file-dropzone'
import { defaultInvitesForEvents } from '~/lib/events/ceremony'
import { api } from '~/trpc/react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 'upload' | 'preview'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type PreviewTableProps = { rows: ParsedCsvRow[] }

function PreviewTable({ rows }: PreviewTableProps) {
  return (
    <div className='max-h-80 overflow-auto rounded-md border'>
      <table className='w-full text-sm'>
        <thead className='sticky top-0 bg-muted'>
          <tr>
            {['#', 'First Name', 'Last Name', 'Email', 'Household', 'Primary', 'Status'].map(
              (h) => (
                <th key={h} className='px-3 py-2 text-left font-medium text-muted-foreground'>
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.rowNumber}
              className={
                row.valid ? 'border-border border-t' : 'border-border border-t bg-destructive/5'
              }
            >
              <td className='px-3 py-2 text-muted-foreground'>{row.rowNumber}</td>
              <td className='px-3 py-2'>{row.raw.firstName || '—'}</td>
              <td className='px-3 py-2'>{row.raw.lastName || '—'}</td>
              <td className='px-3 py-2 text-muted-foreground'>{row.raw.email || '—'}</td>
              <td className='px-3 py-2 text-muted-foreground'>{row.raw.household || '—'}</td>
              <td className='px-3 py-2 text-muted-foreground'>
                {row.valid && row.data.primary ? 'Yes' : '—'}
              </td>
              <td className='px-3 py-2'>
                {row.valid ? (
                  <span className='font-medium text-success text-xs'>Valid</span>
                ) : (
                  <span className='font-medium text-destructive text-xs'>
                    {row.errors.join('; ')}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------

type CsvUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: Event[]
}

export function CsvUploadDialog({ open, onOpenChange, events }: CsvUploadDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([])
  const [fileName, setFileName] = useState('')
  const [isParsing, setIsParsing] = useState(false)

  const validRows = parsedRows.filter((r): r is ValidParsedCsvRow => r.valid)
  const householdCount = groupRowsIntoHouseholds(validRows).length
  const invalidCount = parsedRows.length - validRows.length

  // Reset dialog state when it closes
  useEffect(() => {
    if (!open) {
      setStep('upload')
      setParsedRows([])
      setFileName('')
      setIsParsing(false)
    }
  }, [open])

  const bulkCreateMutation = api.household.bulkCreate.useMutation({
    onSuccess: ({ created, failed }) => {
      // `created` and `failed` count households, since a row group is created as one household.
      const households = `${created} household${created === 1 ? '' : 's'}`
      if (failed > 0) {
        toast.warning(`Imported ${households}, ${failed} skipped due to errors.`)
      } else {
        toast.success(
          `Successfully imported ${validRows.length} guest${validRows.length === 1 ? '' : 's'} in ${households}!`
        )
      }
      router.refresh()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import guests. Please try again.')
    },
  })

  const handleClose = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name)
    setIsParsing(true)
    try {
      const rows = await parseCsvFile(file)
      setParsedRows(rows)
      setStep('preview')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse CSV file'
      toast.error(message)
    } finally {
      setIsParsing(false)
    }
  }, [])

  const handleImport = () => {
    if (validRows.length === 0) return
    // New guests are invited to the ceremony by default and not invited to other events.
    const invites = defaultInvitesForEvents(events)
    const households = buildHouseholdPayloads(validRows, invites)
    bulkCreateMutation.mutate({ households })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-3xl'>
        {step === 'upload' ? (
          <>
            <DialogHeader>
              <DialogTitle>Import Guests from CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file to bulk-add guests. Each row becomes its own household, unless
                rows share a value in the <code>household</code> column, in which case they are
                imported together.
                <span className='block'>
                  Mark one guest per household in the <code>primary</code> column (yes); otherwise
                  the first guest listed is the primary contact.
                </span>
                <span className='block'>
                  Phone must be E.164 format (for example: +12025550123).
                </span>
              </DialogDescription>
            </DialogHeader>

            <FileDropzone
              onFile={handleFile}
              accept={{ 'text/csv': ['.csv'] }}
              label='Drag & drop a CSV file, or click to browse'
              sublabel='.csv files only'
              disabled={isParsing}
            />

            <DialogFooter className='mt-2 flex-row items-center justify-between sm:justify-between'>
              <Button variant='ghost' size='sm' type='button' onClick={downloadGuestCsvTemplate}>
                Download Template
              </Button>
              <Button variant='outline' type='button' onClick={handleClose}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Preview Import</DialogTitle>
              <DialogDescription>
                {fileName} &mdash; {validRows.length} valid row{validRows.length !== 1 ? 's' : ''}{' '}
                in {householdCount} household{householdCount !== 1 ? 's' : ''}
                {invalidCount > 0 && (
                  <span className='text-destructive'>
                    {' '}
                    &middot; {invalidCount} row{invalidCount !== 1 ? 's' : ''} with errors (will be
                    skipped)
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <PreviewTable rows={parsedRows} />

            <DialogFooter className='mt-2 flex-row items-center justify-between sm:justify-between'>
              <Button
                variant='ghost'
                size='sm'
                type='button'
                onClick={() => setStep('upload')}
                disabled={bulkCreateMutation.isPending}
              >
                Back
              </Button>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  type='button'
                  onClick={handleClose}
                  disabled={bulkCreateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type='button'
                  onClick={handleImport}
                  disabled={validRows.length === 0 || bulkCreateMutation.isPending}
                >
                  {bulkCreateMutation.isPending
                    ? 'Importing…'
                    : `Import ${validRows.length} Guest${validRows.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
