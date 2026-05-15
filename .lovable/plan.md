## PDF Audit Findings (INV-2026-008_5.pdf)

**Issues observed:**
1. **Page 1 wasted whitespace** — break occurs after "RT" row leaving ~25% empty bottom space; page 2 then carries only 2 rows + totals + signatures.
2. **Page 2 mostly blank** — ~50% of page is unused below the QR/footer block.
3. **Signature column mapping** — order is `Received by | Prepared by | Authorize by`. CEO Saddam sits over "Prepared by" (middle) and Proprietor Al-Amin over "Authorize by" (right). Conventionally CEO should authorize. Needs confirmation/swap.
4. **"Tax" label** — should read "VAT" per BD locale.
5. **Print vs PDF parity** — need to confirm browser print output matches PDF (margins, signature size, footer flow) using the new Compare Preview screen.

What looks fine: ৳ currency rendering, header logo, BILL TO block, totals colors (Total Paid green, Balance red bar), In Word line, Payment History styling, universal address, QR code.

---

## Plan

### 1. Tighten PDF pagination (whitespace fix)
- In `src/lib/generateInvoicePdfFromDom.ts`:
  - Reduce `PAGE_BREAK_SAFETY_MM` from 3 → 1.5 so more rows fit per page.
  - Lower `minSliceHeightPx` floor and prefer the **largest** valid breakpoint within the page rather than the last-seen one (current logic already picks the largest within range, but `[data-pdf-footer]` atomic block may be forcing an early break — verify by logging atomic ranges and shrink the footer's `keep-together` scope to only signatures + thank-you, letting the address/QR flow independently).
- In `ThemedInvoiceDocument.tsx`:
  - Mark only the **signatures + Thank-you** as `invoice-keep-together`, NOT the entire footer (address/QR can sit on next page or below).
  - Reduce row vertical padding by 1px in pdfMode so 1–2 more rows fit per page.

### 2. Signature mapping audit
- Confirm the order in `ThemedInvoiceDocument.tsx`. Current source: column 1 Received, column 2 Prepared (CEO signature), column 3 Authorize (Proprietor signature).
- If business expects **CEO = Authorize**, swap columns 2 and 3 so:
  `Received by (empty) | Prepared by (Proprietor) | Authorize by (CEO)`.
- Pull confirmation from user (will ask before swapping).

### 3. Rename "Tax" → "VAT"
- Update label in `ThemedInvoiceDocument.tsx` totals section. Apply to web, print, and pdfMode.

### 4. Print vs PDF alignment audit
- Open `/invoices/:id/preview` (Compare Preview added in last build) and visually compare:
  - Header logo size/position
  - Table column widths and row spacing
  - Totals box width and color bars
  - Signature row spacing & image height (currently 59px)
  - Footer address/QR alignment
- Fix any divergence by ensuring both paths use identical CSS (no `pdfMode`-only style overrides for visible elements except print-safe colors).

---

## Technical details

| File | Change |
|------|--------|
| `src/lib/generateInvoicePdfFromDom.ts` | `PAGE_BREAK_SAFETY_MM = 1.5`; verify atomic-range logic |
| `src/components/invoice/ThemedInvoiceDocument.tsx` | Narrow `invoice-keep-together` scope; row padding −1px in pdfMode; rename Tax→VAT; (optional) swap signature columns 2↔3 |
| `src/index.css` | Confirm `@media print` margins match PDF (10mm all sides) |

No backend or DB changes. Frontend-only edit. After deploy: `cd /var/www/smelitehajj-invoice && sudo bash migration/scripts/deploy.sh`.

### Confirmation needed before implementing
- **Signature swap**: should CEO Saddam Hossain be moved to "Authorize by" (right column) and Proprietor Al-Amin to "Prepared by" (middle)? Or keep as-is?
