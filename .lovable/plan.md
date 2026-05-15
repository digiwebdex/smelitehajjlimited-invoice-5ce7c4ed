## Invoice Document CMS

A form-based editor where admins control every visual aspect of the invoice template (header / body / footer), with global defaults and per-company overrides.

### 1. Data model (one migration)

New table `invoice_layout_settings` (single global row) + new JSONB column `invoice_layout` on `companies` (per-company override; `null` = inherit global).

Settings stored as JSONB so we can add/remove fields without future migrations:

```text
{
  typography: { fontFamily, baseFontSize, headingScale, lineHeight },
  header:     { paddingY, paddingX, showLogo, logoSize, showTagline,
                titleSize, titleColor, alignment, showInvoiceMeta },
  body:       { sectionGap, tableFontSize, rowPaddingY, rowPaddingX,
                showSlNo, showQty, showUnitPrice, showAmount,
                colLabels: { description, qty, unitPrice, amount },
                showSubtotal, showVat, showTotal, showInWords, showNotes },
  footer:     { paddingY, showThankYou, showAddress, showQR, qrSize,
                showSignatures, signatureGap, signatureLabels: {...},
                fontSize }
}
```

Effective settings = `globalLayout` deep-merged with `company.invoice_layout`.

### 2. Backend (VPS Express API)

Two endpoints (mirroring `/api/branding`):
- `GET/PUT /api/invoice-layout` — global
- `GET/PUT /api/companies/:id/invoice-layout` — per-company override (PUT with `null` clears override)

### 3. Frontend

**Hook** `src/hooks/useInvoiceLayout.ts` — fetches global + (optional) company layout, returns merged result with `defaultLayout` fallback.

**Admin page** `src/pages/InvoiceLayoutSettings.tsx` (route `/admin/invoice-layout`):
- Tabs: Typography · Header · Body · Footer
- Controls: Sliders (sizes/padding), Switches (show/hide), Inputs (labels), Color pickers
- Right pane: live `ThemedInvoiceDocument` preview using sample data
- "Scope" selector at top: Global · Per-company (dropdown)
- Save / Reset / Clear-override buttons

**Apply to invoice** — `ThemedInvoiceDocument.tsx` reads merged layout via `useInvoiceLayout(invoice.company_id)` and applies values as inline CSS vars / conditional rendering. PDF generator (`generateInvoicePdfFromDom.ts`) already snapshots the DOM, so no PDF changes needed.

**Sidebar** — add "Invoice Layout" link under Admin Panel.

### 4. Files

New:
- `migration/database/migrations/2026xxxx_invoice_layout.sql` (also append to `schema.sql`)
- `src/types/invoiceLayout.ts` (defaults + types)
- `src/hooks/useInvoiceLayout.ts`
- `src/pages/InvoiceLayoutSettings.tsx`
- `src/components/admin/LayoutControlPanel.tsx`
- Backend route additions in `migration/backend/server.js`

Modified:
- `src/App.tsx` (route)
- `src/components/layout/AppSidebar.tsx` (link)
- `src/components/invoice/ThemedInvoiceDocument.tsx` (consume layout)

### 5. Out of scope (this iteration)
Drag-and-drop reordering, adding arbitrary new sections/columns beyond the predefined set, click-to-edit canvas. These can come later on top of this foundation.