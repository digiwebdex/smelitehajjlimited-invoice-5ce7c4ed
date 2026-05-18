import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatCurrency, type InvoiceStatus } from "./types";
import { numberToWords } from "@/lib/numberToWords";

interface Props {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: InvoiceStatus;
  statusOverride: InvoiceStatus | "auto";
  amountInWords: string;
  onVatRateChange: (rate: number) => void;
  onStatusOverrideChange: (s: InvoiceStatus | "auto") => void;
  onAmountInWordsChange: (v: string) => void;
}

export function InvoiceSummaryCard({
  subtotal,
  vatRate,
  vatAmount,
  totalAmount,
  paidAmount,
  dueAmount,
  status,
  statusOverride,
  amountInWords,
  onVatRateChange,
  onStatusOverrideChange,
  onAmountInWordsChange,
}: Props) {
  const autoWords = `${numberToWords(totalAmount)} Taka Only`;

  return (
    <div className="card-elevated p-5 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Summary</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium tabular-nums text-black">{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="vatRate" className="text-muted-foreground">
            Tax %
          </Label>
          <Input
            id="vatRate"
            type="number"
            inputMode="decimal"
            value={vatRate || ""}
            onChange={(e) => onVatRateChange(parseFloat(e.target.value) || 0)}
            className="w-16 h-8 text-sm text-right tabular-nums"
            placeholder="0"
            min={0}
            max={100}
          />
          <span className="ml-auto font-medium tabular-nums text-black">
            {formatCurrency(vatAmount)}
          </span>
        </div>

        <div className="flex justify-between border-t border-border pt-3">
          <span className="font-semibold text-black">Total</span>
          <span className="font-bold text-lg tabular-nums text-black">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        <div className="flex justify-between text-success">
          <span>Paid</span>
          <span className="font-semibold tabular-nums">{formatCurrency(paidAmount)}</span>
        </div>

        <div
          className={cn(
            "flex justify-between p-3 rounded-lg font-semibold",
            dueAmount > 0
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          )}
        >
          <span>{dueAmount > 0 ? "Due" : "Fully Paid"}</span>
          <span className="tabular-nums">{formatCurrency(dueAmount)}</span>
        </div>

        {/* Status dropdown */}
        <div className="pt-3 border-t border-border space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            value={statusOverride}
            onValueChange={(v) => onStatusOverrideChange(v as InvoiceStatus | "auto")}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto ({status})</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Amount in Words */}
        <div className="pt-3 border-t border-border space-y-1.5">
          <Label htmlFor="amountInWords">Amount in Words</Label>
          <Input
            id="amountInWords"
            value={amountInWords}
            onChange={(e) => onAmountInWordsChange(e.target.value)}
            placeholder={autoWords}
          />
          <p className="text-xs text-muted-foreground">
            Auto-generated if empty: {autoWords}
          </p>
        </div>
      </div>
    </div>
  );
}
