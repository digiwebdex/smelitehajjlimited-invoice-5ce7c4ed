import { createRoot } from "react-dom/client";
import { ThemedInvoiceDocument } from "@/components/invoice/ThemedInvoiceDocument";
import { generateInvoicePdfFromDom } from "@/lib/generateInvoicePdfFromDom";
import { ThemeSettings } from "@/types/theme";
import { BrandSettings } from "@/types/branding";
import { InvoiceLayout } from "@/types/invoiceLayout";

interface RenderArgs {
  invoice: any;
  items: any[];
  installments: any[];
  company: any;
  theme: ThemeSettings;
  branding: BrandSettings | null | undefined;
  layout?: InvoiceLayout;
  filename: string;
}

export async function renderInvoicePdfBlob(args: Omit<RenderArgs, "filename">): Promise<Blob> {
  const { invoice, items, installments, company, theme, branding, layout } = args;
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = "210mm";
  host.style.minHeight = "297mm";
  host.style.background = "#ffffff";
  host.style.zIndex = "-1";
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(
    <div className="invoice-print-area" style={{ width: "210mm", minHeight: "297mm" }}>
      <ThemedInvoiceDocument
        invoice={invoice}
        items={items}
        installments={installments}
        company={company}
        theme={theme}
        branding={branding}
        layout={layout}
        pdfMode
      />
    </div>
  );

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 150));

  try {
    const blob = await generateInvoicePdfFromDom(
      host.firstElementChild as HTMLElement,
      "invoice.pdf",
      { output: "blob" }
    );
    return blob as Blob;
  } finally {
    root.unmount();
    document.body.removeChild(host);
  }
}

/**
 * Render ThemedInvoiceDocument into an offscreen container, capture it
 * as PDF identical to the on-screen view, then clean up.
 */
export async function renderAndDownloadInvoicePdf(args: RenderArgs): Promise<void> {
  const { invoice, items, installments, company, theme, branding, layout, filename } = args;

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  // Render at real A4 dimensions so PDF output matches browser print.
  host.style.width = "210mm";
  host.style.minHeight = "297mm";
  host.style.background = "#ffffff";
  host.style.zIndex = "-1";
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(
    <div className="invoice-print-area" style={{ width: "210mm", minHeight: "297mm" }}>
      <ThemedInvoiceDocument
        invoice={invoice}
        items={items}
        installments={installments}
        company={company}
        theme={theme}
        branding={branding}
        layout={layout}
        pdfMode
      />
    </div>
  );

  // Wait two frames + a tick so styles & images settle
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 150));

  try {
    await generateInvoicePdfFromDom(host.firstElementChild as HTMLElement, filename);
  } finally {
    root.unmount();
    document.body.removeChild(host);
  }
}
