import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ThemedInvoiceDocument } from "@/components/invoice/ThemedInvoiceDocument";
import { cn } from "@/lib/utils";

type ThemedInvoiceDocumentProps = Parameters<typeof ThemedInvoiceDocument>[0];

interface InvoiceA4PreviewProps extends ThemedInvoiceDocumentProps {
  className?: string;
  sheetClassName?: string;
}

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

export function InvoiceA4Preview({
  className,
  sheetClassName,
  ...documentProps
}: InvoiceA4PreviewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [sheetHeight, setSheetHeight] = useState(A4_HEIGHT_PX);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateScale = () => {
      const availableWidth = Math.max(320, viewport.clientWidth - 2);
      setScale(Math.min(1, availableWidth / A4_WIDTH_PX));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const measure = () => {
      const nextHeight = sheetRef.current?.scrollHeight || A4_HEIGHT_PX;
      setSheetHeight(Math.max(A4_HEIGHT_PX, nextHeight));
    };

    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  });

  return (
    <div ref={viewportRef} className={cn("overflow-auto", className)}>
      <div
        className="mx-auto"
        style={{
          width: `${A4_WIDTH_PX * scale}px`,
          height: `${sheetHeight * scale}px`,
        }}
      >
        <div
          ref={sheetRef}
          className={cn("invoice-print-area bg-white shadow-lg", sheetClassName)}
          style={{
            width: A4_WIDTH_PX,
            minHeight: A4_HEIGHT_PX,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          } as CSSProperties}
        >
          <ThemedInvoiceDocument {...documentProps} />
        </div>
      </div>
    </div>
  );
}
