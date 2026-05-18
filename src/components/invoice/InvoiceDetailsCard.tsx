import { FileText, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Company {
  id: string;
  name: string;
}

export interface PastClient {
  key: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface Props {
  invoiceNumber: string;
  companyId: string;
  invoiceDate: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  notes: string;
  companies: Company[];
  pastClients?: PastClient[];
  errors: Record<string, string | undefined>;
  onChange: (field: string, value: string) => void;
  onSelectPastClient?: (client: PastClient) => void;
}

export function InvoiceDetailsCard({
  invoiceNumber,
  companyId,
  invoiceDate,
  clientName,
  clientEmail,
  clientPhone,
  clientAddress,
  notes,
  companies,
  pastClients = [],
  errors,
  onChange,
  onSelectPastClient,
}: Props) {
  return (
    <div className="card-elevated p-5 space-y-5">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <FileText className="h-5 w-5 text-accent" />
        Invoice Details
      </h2>

      {/* Invoice meta */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="invoiceNumber">Invoice #</Label>
          <Input
            id="invoiceNumber"
            value={invoiceNumber}
            onChange={(e) => onChange("invoiceNumber", e.target.value)}
            className={errors.invoiceNumber ? "border-destructive" : ""}
          />
          {errors.invoiceNumber && (
            <p className="text-xs text-destructive">{errors.invoiceNumber}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="company">Company *</Label>
          <Select value={companyId} onValueChange={(v) => onChange("companyId", v)}>
            <SelectTrigger className={errors.companyId ? "border-destructive" : ""}>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.companyId && (
            <p className="text-xs text-destructive">{errors.companyId}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invoiceDate">Invoice Date</Label>
          <Input
            id="invoiceDate"
            type="date"
            value={invoiceDate}
            onChange={(e) => onChange("invoiceDate", e.target.value)}
            className={errors.invoiceDate ? "border-destructive" : ""}
          />
          {errors.invoiceDate && (
            <p className="text-xs text-destructive">{errors.invoiceDate}</p>
          )}
        </div>
      </div>

      {/* Client info */}
      <h3 className="text-sm font-medium text-foreground pt-4 border-t border-border flex items-center gap-2">
        <Users className="h-4 w-4 text-accent" />
        Client Information
      </h3>

      {pastClients.length > 0 && onSelectPastClient && (
        <div className="space-y-1.5">
          <Label>Select Customer (or type manually below)</Label>
          <Select
            value=""
            onValueChange={(v) => {
              const c = pastClients.find((p) => p.key === v);
              if (c) onSelectPastClient(c);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select existing customer..." />
            </SelectTrigger>
            <SelectContent>
              {pastClients.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.name}
                  {c.phone ? ` — ${c.phone}` : c.email ? ` — ${c.email}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="clientName">Customer Name *</Label>
          <Input
            id="clientName"
            value={clientName}
            onChange={(e) => onChange("clientName", e.target.value)}
            placeholder="Enter client name"
            className={errors.clientName ? "border-destructive" : ""}
          />
          {errors.clientName && (
            <p className="text-xs text-destructive">{errors.clientName}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="clientEmail">Customer Email</Label>
          <Input
            id="clientEmail"
            type="email"
            value={clientEmail}
            onChange={(e) => onChange("clientEmail", e.target.value)}
            placeholder="Email"
            className={errors.clientEmail ? "border-destructive" : ""}
          />
          {errors.clientEmail && (
            <p className="text-xs text-destructive">{errors.clientEmail}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="clientPhone">Customer Phone</Label>
          <Input
            id="clientPhone"
            value={clientPhone}
            onChange={(e) => onChange("clientPhone", e.target.value)}
            placeholder="Phone"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="clientAddress">Customer Address</Label>
          <Input
            id="clientAddress"
            value={clientAddress}
            onChange={(e) => onChange("clientAddress", e.target.value)}
            placeholder="Enter address"
          />
        </div>
      </div>

      {/* Notes section */}
      <h3 className="text-sm font-medium text-foreground pt-4 border-t border-border">
        Notes / Payment Terms
      </h3>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onChange("notes", e.target.value)}
          placeholder="Add any notes or payment terms for this invoice..."
          rows={3}
          className={errors.notes ? "border-destructive" : ""}
        />
        {errors.notes && (
          <p className="text-xs text-destructive">{errors.notes}</p>
        )}
      </div>
    </div>
  );
}
