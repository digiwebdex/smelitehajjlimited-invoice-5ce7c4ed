// Invoice Layout CMS — controls every visual aspect of the invoice document.
// Stored as JSONB. `null` per-company override means inherit global.

export interface InvoiceLayout {
  typography: {
    fontFamily: string;
    baseFontSize: number;        // pt
    headingScale: number;        // multiplier for INVOICE title
    lineHeight: number;
  };
  header: {
    paddingTop: number;          // mm
    paddingX: number;            // mm
    marginBottom: number;        // mm
    showLogo: boolean;
    logoSize: number;            // px
    showTagline: boolean;
    titleText: string;           // e.g. "INVOICE"
    titleSize: number;           // pt
    titleColor: string;
    showInvoiceNumber: boolean;
    showStatusBadge: boolean;
    companyNameSize: number;     // pt
  };
  body: {
    sectionGap: number;          // mm
    showBilledTo: boolean;
    showInvoiceDate: boolean;
    tableFontSize: number;       // pt
    tableHeaderSize: number;     // pt
    rowPaddingY: number;         // px
    rowPaddingX: number;         // px
    showSlNo: boolean;
    showQty: boolean;
    showUnitPrice: boolean;
    showAmount: boolean;
    colLabels: {
      description: string;
      qty: string;
      unitPrice: string;
      amount: string;
    };
    colWidths: { description: number; qty: number; unitPrice: number; amount: number }; // %
    showSubtotal: boolean;
    showVat: boolean;
    vatLabel: string;
    showTotal: boolean;
    showPaid: boolean;
    showBalance: boolean;
    showInWords: boolean;
    showNotes: boolean;
    showPaymentHistory: boolean;
  };
  footer: {
    paddingTop: number;          // mm
    fontSize: number;            // pt
    showThankYou: boolean;
    showAddress: boolean;
    showContact: boolean;
    showWebsite: boolean;
    showQR: boolean;
    qrSize: number;              // px
    showSignatures: boolean;
    signatureGap: number;        // mm
    signatureHeight: number;     // px
    signatureLabels: {
      received: string;
      prepared: string;
      authorize: string;
    };
  };
}

export const defaultInvoiceLayout: InvoiceLayout = {
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    baseFontSize: 11,
    headingScale: 1,
    lineHeight: 1.5,
  },
  header: {
    paddingTop: 16,
    paddingX: 14,
    marginBottom: 14,
    showLogo: true,
    logoSize: 56,
    showTagline: true,
    titleText: "INVOICE",
    titleSize: 26,
    titleColor: "#0f172a",
    showInvoiceNumber: true,
    showStatusBadge: true,
    companyNameSize: 16,
  },
  body: {
    sectionGap: 12,
    showBilledTo: true,
    showInvoiceDate: true,
    tableFontSize: 10.5,
    tableHeaderSize: 8,
    rowPaddingY: 9,
    rowPaddingX: 4,
    showSlNo: false,
    showQty: true,
    showUnitPrice: true,
    showAmount: true,
    colLabels: {
      description: "Description",
      qty: "Qty",
      unitPrice: "Unit Price",
      amount: "Amount",
    },
    colWidths: { description: 54, qty: 10, unitPrice: 18, amount: 18 },
    showSubtotal: true,
    showVat: true,
    vatLabel: "VAT",
    showTotal: true,
    showPaid: true,
    showBalance: true,
    showInWords: true,
    showNotes: true,
    showPaymentHistory: true,
  },
  footer: {
    paddingTop: 6,
    fontSize: 8.5,
    showThankYou: true,
    showAddress: true,
    showContact: true,
    showWebsite: true,
    showQR: true,
    qrSize: 64,
    showSignatures: true,
    signatureGap: 10,
    signatureHeight: 59,
    signatureLabels: {
      received: "Received by",
      prepared: "Prepared by",
      authorize: "Authorize by",
    },
  },
};

// Deep merge an override on top of a base layout. Override values can be partial.
export function mergeLayout(
  base: InvoiceLayout,
  override?: Partial<InvoiceLayout> | null
): InvoiceLayout {
  if (!override) return base;
  return {
    typography: { ...base.typography, ...(override.typography || {}) },
    header: { ...base.header, ...(override.header || {}) },
    body: {
      ...base.body,
      ...(override.body || {}),
      colLabels: { ...base.body.colLabels, ...(override.body?.colLabels || {}) },
      colWidths: { ...base.body.colWidths, ...(override.body?.colWidths || {}) },
    },
    footer: {
      ...base.footer,
      ...(override.footer || {}),
      signatureLabels: {
        ...base.footer.signatureLabels,
        ...(override.footer?.signatureLabels || {}),
      },
    },
  };
}
