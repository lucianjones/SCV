/**
 * Guest CSV Import - Schema, Types & Parsing
 *
 * Contains all data definitions for the CSV import feature so the dialog
 * component stays focused on UI orchestration only.
 */

import Papa from 'papaparse'
import { z } from 'zod'

import { optionalPhoneSchemaNotNull } from '~/lib/phone/phone-validator'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const CSV_AGE_GROUPS = ['ADULT', 'CHILD', 'TEEN', 'INFANT'] as const

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === '' ? undefined : v))

/** Values in the `primary` column that mark a guest as their household's primary contact. */
const PRIMARY_TRUE_VALUES = new Set(['yes', 'y', 'true', '1', 'x', 'primary'])

const optionalHousehold = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? v.trim() : undefined))

const optionalPrimary = z
  .string()
  .optional()
  .transform((v) => (v && PRIMARY_TRUE_VALUES.has(v.trim().toLowerCase()) ? true : undefined))

export const guestCsvRowSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: optionalString.pipe(z.string().email('Invalid email').optional()),
  phone: optionalString.pipe(optionalPhoneSchemaNotNull),
  ageGroup: z
    .string()
    .optional()
    .transform((v) => {
      const upper = (v ?? '').toUpperCase()
      return CSV_AGE_GROUPS.includes(upper as (typeof CSV_AGE_GROUPS)[number]) ? upper : 'ADULT'
    })
    .pipe(z.enum(CSV_AGE_GROUPS)),
  address1: optionalString,
  address2: optionalString,
  city: optionalString,
  state: optionalString,
  zipCode: optionalString,
  country: optionalString,
  notes: optionalString,
  /** Guests sharing the same household value are imported into one household. */
  household: optionalHousehold,
  /** Marks the household's primary contact (yes/true/1/x). Defaults to the first row. */
  primary: optionalPrimary,
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GuestCsvRowInput = z.input<typeof guestCsvRowSchema>
export type GuestCsvRowOutput = z.output<typeof guestCsvRowSchema>

export type ParsedCsvRow = {
  rowNumber: number
  raw: GuestCsvRowInput
} & ({ valid: true; data: GuestCsvRowOutput } | { valid: false; errors: string[] })

export type ValidParsedCsvRow = ParsedCsvRow & { valid: true; data: GuestCsvRowOutput }

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

const TEMPLATE_HEADERS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'ageGroup',
  'address1',
  'address2',
  'city',
  'state',
  'zipCode',
  'country',
  'notes',
  'household',
  'primary',
]

// Rows that share a household value are imported together; blank household = their own household.
const TEMPLATE_CSV =
  TEMPLATE_HEADERS.join(',') +
  '\nJohn,Smith,john@example.com,+12025550123,ADULT,123 Main St,,New York,NY,10001,USA,,Smith,yes' +
  '\nJane,Smith,,,,,,,,,,,Smith,' +
  '\nAlex,Doe,,,,,,,,,,,,\n'

export function downloadGuestCsvTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'guest-import-template.csv'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

// ---------------------------------------------------------------------------
// Household grouping
// ---------------------------------------------------------------------------

/** Case/space-insensitive key so "Smith", "smith " and "SMITH" are the same household. */
const householdKey = (value: string | undefined): string | null => {
  const key = value?.trim().replace(/\s+/g, ' ').toLowerCase()
  return key || null
}

/**
 * Applies household rules to parsed rows: a household may have at most one row marked primary.
 * Households that break that rule have all their rows flagged so nothing is half-imported.
 */
export function applyHouseholdRules(rows: ParsedCsvRow[]): ParsedCsvRow[] {
  const primaryCounts = new Map<string, number>()
  for (const row of rows) {
    if (!row.valid) continue
    const key = householdKey(row.data.household)
    if (key && row.data.primary) primaryCounts.set(key, (primaryCounts.get(key) ?? 0) + 1)
  }

  return rows.map((row) => {
    if (!row.valid) return row
    const key = householdKey(row.data.household)
    if (!key || (primaryCounts.get(key) ?? 0) <= 1) return row
    return {
      rowNumber: row.rowNumber,
      raw: row.raw,
      valid: false as const,
      errors: [`Household "${row.data.household}" has more than one primary contact`],
    }
  })
}

type HouseholdField = 'address1' | 'address2' | 'city' | 'state' | 'zipCode' | 'country' | 'notes'
const HOUSEHOLD_FIELDS: HouseholdField[] = [
  'address1',
  'address2',
  'city',
  'state',
  'zipCode',
  'country',
  'notes',
]

export type CsvHouseholdPayload = Partial<Record<HouseholdField, string>> & {
  guestParty: Array<{
    firstName: string
    lastName: string
    email?: string
    phone?: string
    ageGroup: GuestCsvRowOutput['ageGroup']
    isPrimaryContact: boolean
    tagIds: string[]
    invites: Record<string, string>
  }>
}

/** Groups valid rows into households, in the order each household first appears in the file. */
export function groupRowsIntoHouseholds(rows: ValidParsedCsvRow[]): ValidParsedCsvRow[][] {
  const groups: ValidParsedCsvRow[][] = []
  const byKey = new Map<string, ValidParsedCsvRow[]>()
  for (const row of rows) {
    const key = householdKey(row.data.household)
    if (!key) {
      groups.push([row])
      continue
    }
    const existing = byKey.get(key)
    if (existing) {
      existing.push(row)
    } else {
      const group = [row]
      byKey.set(key, group)
      groups.push(group)
    }
  }
  return groups
}

/**
 * Builds the bulk-create payload: one household per group, the address and notes taken from the
 * first row in the group that has them, and exactly one primary contact (the row marked primary,
 * else the first row).
 */
export function buildHouseholdPayloads(
  rows: ValidParsedCsvRow[],
  invites: Record<string, string>
): CsvHouseholdPayload[] {
  return groupRowsIntoHouseholds(rows).map((group) => {
    const marked = group.findIndex((row) => row.data.primary)
    const primaryIndex = marked === -1 ? 0 : marked

    const household: CsvHouseholdPayload = {
      guestParty: group.map(({ data }, index) => ({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        ageGroup: data.ageGroup,
        isPrimaryContact: index === primaryIndex,
        tagIds: [],
        invites,
      })),
    }
    for (const field of HOUSEHOLD_FIELDS) {
      household[field] = group.map((row) => row.data[field]).find(Boolean)
    }
    return household
  })
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Accept "Household"/"Primary" in any case; other headers keep their exact (camelCase) names. */
const normalizeHeader = (header: string): string => {
  const trimmed = header.trim()
  const lower = trimmed.toLowerCase()
  if (lower === 'household') return 'household'
  if (lower === 'primary') return 'primary'
  return trimmed
}

const MAX_CSV_ROWS = 500

export function parseCsvFile(file: File): Promise<ParsedCsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<GuestCsvRowInput>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: ({ data }) => {
        if (data.length > MAX_CSV_ROWS) {
          reject(new Error(`CSV exceeds the ${MAX_CSV_ROWS}-row limit (found ${data.length} rows)`))
          return
        }
        const rows = data.map((raw, index) => {
          const result = guestCsvRowSchema.safeParse(raw)
          if (result.success) {
            return { rowNumber: index + 2, raw, valid: true as const, data: result.data }
          }
          return {
            rowNumber: index + 2,
            raw,
            valid: false as const,
            errors: result.error.issues.map((i) => i.message),
          }
        })
        resolve(applyHouseholdRules(rows))
      },
      error: (err) => {
        reject(err)
      },
    })
  })
}
