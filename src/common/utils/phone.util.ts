/// Canonicalises an Indonesian mobile number to the `08…` form the existing data
/// already uses.
///
/// BUG-2026-004: the mobile registration form renders a fixed "+62" prefix and
/// submits only the digits the customer typed, so a member registered through the
/// app was stored as `81234567891` while every seeded member used
/// `081234567NNN`. Because `member.phone_number` is UNIQUE, the same real number
/// could be inserted twice in two different shapes, and any lookup or walk-in
/// customer dedup by phone would silently miss.
///
/// Normalising on write is the fix: every path that persists a phone number must
/// run it through here, so the column only ever holds one shape.
///
/// Accepts `81…`, `081…`, `62…`, `+62…` and any separators (spaces, dashes,
/// parentheses). Returns null for null/empty/non-numeric input.
///
/// | input                | output          |
/// |----------------------|-----------------|
/// | `81234567891`        | `081234567891`  |
/// | `081234567891`       | `081234567891`  |
/// | `6281234567891`      | `081234567891`  |
/// | `+62 812-3456-7891`  | `081234567891`  |
export function normalisePhone(raw?: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  // Strip the Indonesian country code, then any leading zeros, then re-add the
  // single leading 0 the canonical form uses.
  if (digits.startsWith('62')) digits = digits.slice(2);
  digits = digits.replace(/^0+/, '');
  if (!digits) return null;
  return `0${digits}`;
}
