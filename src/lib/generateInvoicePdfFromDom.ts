import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Standard A4 page margins (mm) — must match @media print in index.css
const MARGIN_TOP_MM = 10;
const MARGIN_BOTTOM_MM = 10;
const MARGIN_LEFT_MM = 10;
const MARGIN_RIGHT_MM = 10;
const PAGE_BREAK_SAFETY_MM = 3;

/**
 * Find safe Y positions (in px) where the page can be split without cutting
 * elements (rows, footer block, headings, images, etc.) in half.
 */
const getBreakpointsFromDom = (element: HTMLElement, pixelsPerMm: number): number[] => {
  const rootRect = element.getBoundingClientRect();
  const selectors = [
    "tbody tr",
    "[data-pdf-footer]",
    "img",
    "h1, h2, h3, h4, h5, h6",
    "p",
    "table",
    "thead",
    "tbody",
    "section",
    "article",
    "div",
  ];

  // Atomic blocks that must NEVER be split across pages. We collect their
  // [top, bottom] ranges and exclude any breakpoint candidate strictly
  // inside them — the only valid splits are at their top or bottom edges.
  const atomicNodes = element.querySelectorAll<HTMLElement>(
    "[data-pdf-footer], .invoice-keep-together"
  );
  const atomicRanges: Array<[number, number]> = [];
  atomicNodes.forEach((node) => {
    const rect = node.getBoundingClientRect();
    if (rect.height <= 0) return;
    const top = rect.top - rootRect.top;
    const bottom = rect.bottom - rootRect.top;
    atomicRanges.push([top, bottom]);
  });

  const isInsideAtomic = (pos: number) =>
    atomicRanges.some(([top, bottom]) => pos > top + 0.5 && pos < bottom - 0.5);

  const nodes = element.querySelectorAll<HTMLElement>(selectors.join(", "));
  const positions = new Set<number>([0]);

  nodes.forEach((node) => {
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return;

    const rect = node.getBoundingClientRect();
    const top = rect.top - rootRect.top;
    const bottom = rect.bottom - rootRect.top;
    if (rect.height <= 0) return;

    const topMm = Math.max(0, Math.round(top * pixelsPerMm) / pixelsPerMm);
    const bottomMm = Math.max(0, Math.round(bottom * pixelsPerMm) / pixelsPerMm);

    if (!isInsideAtomic(topMm)) positions.add(topMm);
    if (!isInsideAtomic(bottomMm)) positions.add(bottomMm);
  });

  return Array.from(positions).sort((a, b) => a - b);
};

const chooseSliceHeightPx = (
  sourceY: number,
  maxSliceHeightPx: number,
  totalHeightPx: number,
  breakpointsPx: number[],
  minSliceHeightPx: number
) => {
  const remaining = totalHeightPx - sourceY;
  if (remaining <= maxSliceHeightPx) return remaining;

  const maxTarget = sourceY + maxSliceHeightPx;
  const minTarget = sourceY + minSliceHeightPx;

  let bestBreakpoint: number | null = null;
  for (const point of breakpointsPx) {
    if (point <= minTarget) continue;
    if (point > maxTarget) break;
    bestBreakpoint = point;
  }

  if (bestBreakpoint && bestBreakpoint > sourceY) {
    return bestBreakpoint - sourceY;
  }

  return maxSliceHeightPx;
};

/**
 * Capture an element as a multi-page A4 PDF that mirrors the on-screen /
 * print layout exactly. The footer flows naturally after the table, just
 * like in browser print — no special bottom pinning.
 */
export async function generateInvoicePdfFromDom(
  element: HTMLElement,
  filename: string,
  options: { output?: "save" | "blob" } = {}
): Promise<Blob | void> {
  const output = options.output ?? "save";
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const contentWidthMm = pdfWidth - MARGIN_LEFT_MM - MARGIN_RIGHT_MM;
  const contentHeightMm = pdfHeight - MARGIN_TOP_MM - MARGIN_BOTTOM_MM;
  const usableContentHeightMm = contentHeightMm - PAGE_BREAK_SAFETY_MM;

  const pixelsPerMm = canvas.width / contentWidthMm;
  const totalHeightMm = canvas.height / pixelsPerMm;

  // Single page case
  if (totalHeightMm <= contentHeightMm + 2) {
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.98),
      "JPEG",
      MARGIN_LEFT_MM,
      MARGIN_TOP_MM,
      contentWidthMm,
      totalHeightMm,
      undefined,
      "FAST"
    );
    pdf.save(filename);
    return;
  }

  // Multi-page: slice respecting natural element boundaries
  const breakpointsMm = getBreakpointsFromDom(element, pixelsPerMm);
  const breakpointsPx = breakpointsMm.map((p) => Math.round(p * pixelsPerMm));
  const pageHeightPx = Math.floor(usableContentHeightMm * pixelsPerMm);
  const minSliceHeightPx = Math.floor(Math.max(25, 18 * pixelsPerMm));

  let sourceY = 0;
  let isFirst = true;

  while (sourceY < canvas.height) {
    const sliceHeightPx = chooseSliceHeightPx(
      sourceY,
      pageHeightPx,
      canvas.height,
      breakpointsPx,
      minSliceHeightPx
    );

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;
    const ctx = pageCanvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      pageCanvas.width,
      pageCanvas.height
    );

    if (!isFirst) pdf.addPage();
    pdf.addImage(
      pageCanvas.toDataURL("image/jpeg", 0.98),
      "JPEG",
      MARGIN_LEFT_MM,
      MARGIN_TOP_MM,
      contentWidthMm,
      sliceHeightPx / pixelsPerMm,
      undefined,
      "FAST"
    );

    sourceY += sliceHeightPx;
    isFirst = false;
  }

  pdf.save(filename);
}
