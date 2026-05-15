import { InvoiceQRCode } from "@/components/InvoiceQRCode";
import { ThemeSettings, defaultTheme } from "@/types/theme";
import { BrandSettings, defaultBranding } from "@/types/branding";
import { numberToWords } from "@/lib/numberToWords";
import { getInvoiceFooterDetails } from "@/lib/invoiceFooter";

const getOrdinal = (n: number): string => {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

interface InvoiceItemData {
  id: string;
  title: string;
  amount: number;
  qty?: number;
  unit_price?: number;
}

interface InstallmentData {
  id: string;
  amount: number;
  paid_date: string;
  payment_method?: string;
}

interface CompanyData {
  name: string;
  tagline?: string | null;
  logo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  website?: string | null;
  thank_you_text?: string | null;
  show_qr_code?: boolean | null;
  footer_alignment?: string | null;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  invoice_date: string;
  status: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  notes?: string | null;
}

interface ThemedInvoiceDocumentProps {
  invoice: InvoiceData;
  items: InvoiceItemData[];
  installments: InstallmentData[];
  company?: CompanyData | null;
  theme: ThemeSettings;
  branding?: BrandSettings | null;
  pdfMode?: boolean;
}

/**
 * Modern-minimal sans-serif invoice document.
 * One template — used for on-screen preview, print and PDF.
 * Layout is plain block flow: the browser/print engine paginates
 * the item table naturally; signature + address + QR live in a
 * single break-inside:avoid block so they always land on the last page.
 */
export const ThemedInvoiceDocument = ({
  invoice,
  items,
  installments,
  company,
  theme,
  branding,
}: ThemedInvoiceDocumentProps) => {
  const t = theme || defaultTheme;
  const b = branding || defaultBranding;

  const formatCurrency = (amount: number) =>
    `Tk ${new Intl.NumberFormat("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const statusStyle: Record<string, { bg: string; fg: string }> = {
    paid: { bg: "#ecfdf5", fg: "#047857" },
    partial: { bg: "#fffbeb", fg: "#b45309" },
    unpaid: { bg: "#fef2f2", fg: "#b91c1c" },
  };
  const sb = statusStyle[invoice.status] || statusStyle.unpaid;

  const headerLogo = company?.logo_url || b.company_logo;
  const headerName = company?.name || b.company_name || "Company Name";
  const headerTagline = company?.tagline || b.tagline;

  const {
    addressLine1,
    addressLine2,
    footerEmail,
    footerPhone,
    footerThankYou,
    footerWebsite,
    showQR,
  } = getInvoiceFooterDetails(company, branding);

  const isPaidInFull = invoice.due_amount <= 0.001;
  const wordsAmount = isPaidInFull ? invoice.total_amount : invoice.due_amount;

  return (
    <div
      className="invoice-document"
      style={{
        backgroundColor: "#ffffff",
        color: "#0f172a",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: "11pt",
        lineHeight: 1.5,
        padding: "16mm 14mm",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "14mm",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {headerLogo ? (
            <img
              src={headerLogo}
              alt={headerName}
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "9999px",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "9999px",
                backgroundColor: t.primary_color,
                color: "#ffffff",
                fontSize: "22px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {headerName?.charAt(0) || "C"}
            </div>
          )}
          <div>
            <div style={{ fontSize: "16pt", fontWeight: 700, letterSpacing: "-0.01em" }}>
              {headerName}
            </div>
            {headerTagline && (
              <div style={{ fontSize: "9pt", color: "#64748b", marginTop: "2px" }}>
                {headerTagline}
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "26pt",
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#0f172a",
              lineHeight: 1,
            }}
          >
            INVOICE
          </div>
          <div
            style={{
              fontSize: "10pt",
              color: "#64748b",
              marginTop: "6px",
              letterSpacing: "0.04em",
            }}
          >
            {invoice.invoice_number}
          </div>
          <div style={{ marginTop: "8px" }}>
            <span
              style={{
                display: "inline-block",
                backgroundColor: sb.bg,
                color: sb.fg,
                fontSize: "8.5pt",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "9999px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {invoice.status}
            </span>
          </div>
        </div>
      </header>

      {/* META: Bill To + Date */}
      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "20mm",
          marginBottom: "12mm",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "8pt",
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "6px",
            }}
          >
            Billed to
          </div>
          <div style={{ fontSize: "12pt", fontWeight: 600, color: "#0f172a" }}>
            {invoice.client_name}
          </div>
          {invoice.client_email && (
            <div style={{ fontSize: "9.5pt", color: "#475569", marginTop: "2px" }}>
              {invoice.client_email}
            </div>
          )}
          {invoice.client_phone && (
            <div style={{ fontSize: "9.5pt", color: "#475569" }}>
              {invoice.client_phone}
            </div>
          )}
          {invoice.client_address && (
            <div style={{ fontSize: "9.5pt", color: "#475569" }}>
              {invoice.client_address}
            </div>
          )}
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "8pt",
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "6px",
            }}
          >
            Invoice date
          </div>
          <div style={{ fontSize: "11pt", fontWeight: 600, color: "#0f172a" }}>
            {formatDate(invoice.invoice_date)}
          </div>
        </div>
      </section>

      {/* ITEM TABLE */}
      <table
        className="invoice-items"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "8mm",
        }}
      >
        <colgroup>
          <col style={{ width: "54%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "18%" }} />
        </colgroup>
        <thead>
          <tr>
            {["Description", "Qty", "Unit Price", "Amount"].map((h, i) => (
              <th
                key={h}
                style={{
                  textAlign: i >= 2 ? "right" : i === 1 ? "center" : "left",
                  padding: "10px 4px",
                  fontSize: "8pt",
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="invoice-row">
              <td
                style={{
                  padding: "12px 4px",
                  fontSize: "10.5pt",
                  color: "#0f172a",
                  fontWeight: 500,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {item.title || "—"}
              </td>
              <td
                style={{
                  padding: "12px 4px",
                  fontSize: "10.5pt",
                  color: "#475569",
                  textAlign: "center",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {item.qty || 1}
              </td>
              <td
                style={{
                  padding: "12px 4px",
                  fontSize: "10.5pt",
                  color: "#475569",
                  textAlign: "right",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {formatCurrency(item.unit_price || item.amount)}
              </td>
              <td
                style={{
                  padding: "12px 4px",
                  fontSize: "10.5pt",
                  color: "#0f172a",
                  textAlign: "right",
                  fontWeight: 600,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {formatCurrency(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALS */}
      <section
        className="invoice-totals invoice-keep-together"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "10mm",
        }}
      >
        <div style={{ width: "62%" }}>
          {[
            { label: "Subtotal", value: invoice.subtotal, muted: true },
            { label: "Tax", value: invoice.vat_amount, muted: true },
            { label: "Total", value: invoice.total_amount, bold: true },
            {
              label: "Total Paid",
              value: invoice.paid_amount,
              color: "#16a34a",
            },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                fontSize: "10.5pt",
                color: row.color || (row.muted ? "#64748b" : "#0f172a"),
                fontWeight: row.bold ? 700 : row.color ? 600 : 400,
              }}
            >
              <span>{row.label}</span>
              <span>{formatCurrency(row.value)}</span>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "8px",
              padding: "12px 14px",
              backgroundColor: isPaidInFull ? "#dcfce7" : "#0f172a",
              color: isPaidInFull ? "#166534" : "#ffffff",
              borderRadius: "6px",
              fontSize: "12pt",
              fontWeight: 700,
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          >
            <span>{isPaidInFull ? "Paid in Full" : "Balance Due"}</span>
            <span>{formatCurrency(invoice.due_amount)}</span>
          </div>

          <div
            style={{
              marginTop: "8px",
              fontSize: "9pt",
              color: "#64748b",
              wordBreak: "break-word",
            }}
          >
            <span style={{ fontWeight: 600 }}>In Word: </span>
            {numberToWords(wordsAmount)} Taka Only
          </div>
        </div>
      </section>

      {/* NOTES */}
      {invoice.notes && (
        <section
          className="invoice-keep-together"
          style={{
            marginBottom: "8mm",
            padding: "12px 14px",
            backgroundColor: "#f8fafc",
            borderRadius: "6px",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        >
          <div
            style={{
              fontSize: "8pt",
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "6px",
            }}
          >
            Notes
          </div>
          <div
            style={{
              fontSize: "10pt",
              color: "#334155",
              whiteSpace: "pre-wrap",
            }}
          >
            {invoice.notes}
          </div>
        </section>
      )}

      {/* PAYMENT HISTORY */}
      {installments.length > 0 && (
        <section
          className="invoice-keep-together"
          style={{ marginBottom: "10mm" }}
        >
          <div
            style={{
              fontSize: "8pt",
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "8px",
            }}
          >
            Payment History
          </div>
          <div>
            {installments.map((pay, idx) => (
              <div
                key={pay.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom:
                    idx === installments.length - 1 ? "none" : "1px solid #f1f5f9",
                  fontSize: "10pt",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: "#0f172a", fontWeight: 600 }}>
                    {getOrdinal(idx + 1)} Payment
                  </span>
                  <span style={{ color: "#94a3b8" }}>·</span>
                  <span style={{ color: "#475569" }}>{formatDate(pay.paid_date)}</span>
                  <span
                    style={{
                      backgroundColor: "#f1f5f9",
                      color: "#475569",
                      fontSize: "8pt",
                      fontWeight: 500,
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      textTransform: "capitalize",
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  >
                    {pay.payment_method || "Bank Transfer"}
                  </span>
                </div>
                <div style={{ color: "#16a34a", fontWeight: 700 }}>
                  {formatCurrency(pay.amount)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FOOTER BLOCK — signatures + thank-you + address + QR.
          Single break-inside:avoid block guarantees it lands on the
          last page only. */}
      <footer
        data-pdf-footer
        className="invoice-footer-block invoice-keep-together"
        style={{ marginTop: "auto", paddingTop: "12mm" }}
      >
        {/* Signatures */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10mm",
            marginBottom: "10mm",
          }}
        >
          {[
            { label: "Received by", sig: b.signature_received_by },
            { label: "Prepared by", sig: b.signature_prepared_by },
            { label: "Authorize by", sig: b.signature_authorize_by },
          ].map((item) => (
            <div key={item.label} style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  height: "55px",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  marginBottom: "2px",
                  position: "relative",
                  zIndex: 1,
                  overflow: "visible",
                }}
              >
                {item.sig && (
                  <img
                    src={item.sig}
                    alt={item.label}
                    style={{
                      height: "55px",
                      maxWidth: "85%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  borderTop: "1px solid #475569",
                  paddingTop: "8px",
                  fontSize: "9pt",
                  color: "#64748b",
                  letterSpacing: "0.02em",
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Thank-you */}
        <div
          style={{
            textAlign: "center",
            fontSize: "10pt",
            color: "#475569",
            marginBottom: "8mm",
          }}
        >
          {footerThankYou}
        </div>

        {/* Address + QR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "10mm",
            paddingTop: "6mm",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: "8.5pt", color: "#64748b", lineHeight: 1.6 }}>
            {addressLine1 && <div>{addressLine1}</div>}
            {addressLine2 && <div>{addressLine2}</div>}
            {(footerPhone || footerEmail) && (
              <div>
                {[footerPhone, footerEmail].filter(Boolean).join(" · ")}
              </div>
            )}
            {footerWebsite && (
              <div style={{ color: t.primary_color }}>{footerWebsite}</div>
            )}
          </div>

          {showQR && (
            <div style={{ textAlign: "center" }}>
              <InvoiceQRCode invoiceId={invoice.id} size={64} showLabel={false} />
              <div style={{ fontSize: "7pt", color: "#94a3b8", marginTop: "3px" }}>
                Scan for details
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
