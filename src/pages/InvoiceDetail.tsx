import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  useInvoice,
  useInvoices,
  useCreateInvoice,
  useUpdateInvoice,
  useNextInvoiceNumber,
} from "@/hooks/useInvoices";
import { useCompanies, useCompany } from "@/hooks/useCompanies";
import { useTheme } from "@/hooks/useTheme";
import { useBranding } from "@/hooks/useBranding";
import { useEffectiveInvoiceLayout } from "@/hooks/useInvoiceLayout";
import { useToast } from "@/hooks/use-toast";
import { ThemedInvoiceDocument } from "@/components/invoice/ThemedInvoiceDocument";
import { defaultTheme } from "@/types/theme";

import {
  InvoiceFormHeader,
  InvoiceDetailsCard,
  LineItemsSection,
  PaymentsSection,
  InvoiceSummaryCard,
  invoiceFormSchema,
  lineItemSchema,
  type LocalItem,
  type LocalInstallment,
  type InvoiceStatus,
} from "@/components/invoice";

const TODAY = new Date().toISOString().split("T")[0];

function createEmptyItem(): LocalItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    qty: 1,
    unitPrice: 0,
    amount: 0,
  };
}

/** Parse any date-ish value into "YYYY-MM-DD" for <input type="date"> */
function toDateInputValue(value: unknown): string {
  if (!value) return "";
  const str = String(value);
  // Direct extraction – works for "2026-03-03", "2026-03-03T00:00:00.000Z", etc.
  const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  // Fallback: Date constructor
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
  } catch {
    // ignore
  }
  return "";
}

function toNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ——————————————————————————————————————————————
// Main Page
// ——————————————————————————————————————————————
export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = !id || id === "new";

  const { data: existingInvoice, isLoading: invoiceLoading } = useInvoice(
    isNew ? undefined : id
  );
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const { data: nextInvoiceNumber } = useNextInvoiceNumber();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  // Track whether we already populated the form from the fetched invoice
  const [populated, setPopulated] = useState(false);

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(isNew ? TODAY : "");
  const [vatRate, setVatRate] = useState(0);
  const [items, setItems] = useState<LocalItem[]>([
    createEmptyItem(),
  ]);
  const [installments, setInstallments] = useState<LocalInstallment[]>([]);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [statusOverride, setStatusOverride] = useState<InvoiceStatus | "auto">("auto");
  const [amountInWords, setAmountInWords] = useState("");

  // ── Derived calculations (use raw items, don't create new objects) ──
  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + toNumber(it.qty, 1) * toNumber(it.unitPrice, 0), 0),
    [items]
  );
  const vatAmount = (subtotal * vatRate) / 100;
  const totalAmount = subtotal + vatAmount;
  const paidAmount = useMemo(
    () => installments.reduce((sum, inst) => sum + toNumber(inst.amount, 0), 0),
    [installments]
  );
  const dueAmount = totalAmount - paidAmount;
  const autoStatus: InvoiceStatus =
    paidAmount >= totalAmount && totalAmount > 0
      ? "paid"
      : paidAmount > 0
      ? "partial"
      : "unpaid";
  const status: InvoiceStatus = statusOverride === "auto" ? autoStatus : statusOverride;

  // ── Populate new invoice number ──
  useEffect(() => {
    if (isNew && nextInvoiceNumber) setInvoiceNumber(nextInvoiceNumber);
  }, [isNew, nextInvoiceNumber]);

  // ── Reset form when switching between invoices/routes ──
  useEffect(() => {
    setPopulated(false);
    setErrors({});
    setCompanyId("");
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setClientAddress("");
    setNotes("");
    setVatRate(0);
    setItems([createEmptyItem()]);
    setInstallments([]);

    if (isNew) {
      setInvoiceDate(TODAY);
      return;
    }

    setInvoiceNumber("");
    setInvoiceDate("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  // ── Set invoice number for new invoices separately ──
  useEffect(() => {
    if (isNew && nextInvoiceNumber) {
      setInvoiceNumber(nextInvoiceNumber);
    }
  }, [isNew, nextInvoiceNumber]);

  // ── Populate form from existing invoice (only for the matching route id) ──
  useEffect(() => {
    if (!existingInvoice || populated || existingInvoice.id !== id) return;

    setInvoiceNumber(existingInvoice.invoice_number);
    setCompanyId(existingInvoice.company_id);
    setClientName(existingInvoice.client_name);
    setClientEmail(existingInvoice.client_email || "");
    setClientPhone(existingInvoice.client_phone || "");
    setClientAddress(existingInvoice.client_address || "");
    setNotes(existingInvoice.notes || "");

    setInvoiceDate(
      toDateInputValue(existingInvoice.invoice_date) ||
        toDateInputValue(existingInvoice.created_at) ||
        TODAY
    );

    setVatRate(toNumber(existingInvoice.vat_rate, 0));

    setItems(
      existingInvoice.items?.length
        ? existingInvoice.items.map((it) => {
            const qty = toNumber(it.qty, 0);
            const unitPrice = toNumber(it.unit_price, 0);
            return {
              id: it.id,
              title: it.title,
              qty,
              unitPrice,
              amount: qty * unitPrice,
            };
          })
        : [createEmptyItem()]
    );

    if (existingInvoice.installments?.length) {
      setInstallments(
        existingInvoice.installments.map((inst) => ({
          id: inst.id,
          amount: toNumber(inst.amount, 0),
          paid_date: inst.paid_date,
          payment_method: inst.payment_method || "Bank Transfer",
        }))
      );
    }

    setPopulated(true);
  }, [existingInvoice, populated, id]);

  // ── Handlers ──
  const handleFieldChange = useCallback((field: string, value: string) => {
    const map: Record<string, (v: string) => void> = {
      invoiceNumber: setInvoiceNumber,
      companyId: setCompanyId,
      clientName: setClientName,
      clientEmail: setClientEmail,
      clientPhone: setClientPhone,
      clientAddress: setClientAddress,
      invoiceDate: setInvoiceDate,
      notes: setNotes,
    };
    map[field]?.(value);
    setErrors((e) => ({ ...e, [field]: undefined }));
  }, []);

  const handleAddItem = useCallback(() => {
    setItems((prev) => [...prev, createEmptyItem()]);
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== itemId) : prev));
  }, []);

  const handleUpdateItem = useCallback(
    (itemId: string, field: keyof LocalItem, value: string | number) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;

          // Clone — do NOT normalize, so local string state in child is not disturbed
          const updated = { ...item };

          if (field === "title") {
            updated.title = String(value);
          } else if (field === "qty") {
            updated.qty = Math.max(0, Math.trunc(toNumber(value, 0)));
          } else if (field === "unitPrice") {
            updated.unitPrice = Math.max(0, toNumber(value, 0));
          } else if (field === "amount") {
            updated.amount = Math.max(0, toNumber(value, 0));
            return updated;
          }

          // Recalculate amount
          updated.amount = updated.qty * updated.unitPrice;
          return updated;
        })
      );
    },
    []
  );

  const handleAddInstallment = useCallback(() => {
    setInstallments((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        amount: 0,
        paid_date: TODAY,
        payment_method: "Bank Transfer",
      },
    ]);
  }, []);

  const handleRemoveInstallment = useCallback((instId: string) => {
    setInstallments((prev) => prev.filter((i) => i.id !== instId));
  }, []);

  const handleUpdateInstallment = useCallback(
    (instId: string, field: keyof LocalInstallment, value: string | number) => {
      setInstallments((prev) =>
        prev.map((inst) => {
          if (inst.id !== instId) return inst;
          if (field === "amount") {
            return { ...inst, amount: Math.max(0, toNumber(value, 0)) };
          }
          return { ...inst, [field]: value };
        })
      );
    },
    []
  );

  // ── Save ──
  const handleSave = async () => {
    const newErrors: Record<string, string | undefined> = {};

    const formResult = invoiceFormSchema.safeParse({
      invoiceNumber,
      companyId,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      invoiceDate,
      vatRate,
      notes,
    });
    if (!formResult.success) {
      formResult.error.issues.forEach((issue) => {
        newErrors[issue.path[0] as string] = issue.message;
      });
    }

    // Validate items — use normalized values for validation
    items.forEach((item, idx) => {
      const normalized = {
        id: item.id,
        title: item.title,
        qty: toNumber(item.qty, 0),
        unitPrice: Math.max(0, toNumber(item.unitPrice, 0)),
        amount: toNumber(item.qty, 0) * Math.max(0, toNumber(item.unitPrice, 0)),
      };
      const res = lineItemSchema.safeParse(normalized);
      if (!res.success) {
        res.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          newErrors[`items.${idx}.${field}`] = issue.message;
        });
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "Validation error",
        description: "Please fix the highlighted fields.",
        variant: "destructive",
      });
      return;
    }

    setErrors({});

    const payload = {
      company_id: companyId,
      invoice_number: invoiceNumber,
      client_name: clientName,
      client_email: clientEmail || undefined,
      client_phone: clientPhone || undefined,
      client_address: clientAddress || undefined,
      notes: notes || undefined,
      invoice_date: invoiceDate,
      subtotal,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      status,
      items: items
        .filter((i) => i.title.trim())
        .map((i) => ({
          title: i.title,
          qty: toNumber(i.qty, 0),
          unit_price: toNumber(i.unitPrice, 0),
          amount: toNumber(i.qty, 0) * toNumber(i.unitPrice, 0),
        })),
      installments: installments.map((inst) => ({
        amount: toNumber(inst.amount, 0),
        paid_date: inst.paid_date,
        payment_method: inst.payment_method || "Bank Transfer",
      })),
    };

    try {
      if (isNew) {
        await createInvoice.mutateAsync(payload);
      } else {
        await updateInvoice.mutateAsync({ id: id!, ...payload });
      }
      navigate("/invoices");
    } catch {
      // Error handled in hooks
    }
  };

  // ── Loading / not found ──
  const isLoading = invoiceLoading || companiesLoading;
  const isSaving = createInvoice.isPending || updateInvoice.isPending;

  // ── Live preview data ──
  const { data: selectedCompany } = useCompany(companyId || undefined);
  const { data: theme } = useTheme();
  const { data: branding } = useBranding();
  const { layout: invoiceLayout } = useEffectiveInvoiceLayout(companyId || undefined);
  const activeTheme = theme || defaultTheme;

  const previewInvoice = useMemo(
    () => ({
      id: id || "preview",
      invoice_number: invoiceNumber || "DRAFT",
      client_name: clientName || "Client Name",
      client_email: clientEmail,
      client_phone: clientPhone,
      client_address: clientAddress,
      invoice_date: invoiceDate || TODAY,
      status,
      subtotal,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      notes,
    }),
    [id, invoiceNumber, clientName, clientEmail, clientPhone, clientAddress, invoiceDate, status, subtotal, vatAmount, totalAmount, paidAmount, dueAmount, notes]
  );

  const previewItems = useMemo(
    () =>
      items
        .filter((i) => i.title.trim() || i.qty > 0 || i.unitPrice > 0)
        .map((i) => ({
          id: i.id,
          title: i.title || "Item",
          qty: toNumber(i.qty, 0),
          unit_price: toNumber(i.unitPrice, 0),
          amount: toNumber(i.qty, 0) * toNumber(i.unitPrice, 0),
        })),
    [items]
  );

  const previewInstallments = useMemo(
    () =>
      installments.map((inst) => ({
        id: inst.id,
        amount: toNumber(inst.amount, 0),
        paid_date: inst.paid_date,
        payment_method: inst.payment_method,
      })),
    [installments]
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!isNew && !existingInvoice && !invoiceLoading) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground">
            Invoice not found
          </h2>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/invoices")}
          >
            Back to Invoices
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto">
        <InvoiceFormHeader
          isNew={isNew}
          invoiceNumber={invoiceNumber}
          status={status}
          isSaving={isSaving}
          onBack={() => navigate("/invoices")}
          onSave={handleSave}
        />

        <div className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-7 space-y-6">
            <InvoiceDetailsCard
              invoiceNumber={invoiceNumber}
              companyId={companyId}
              invoiceDate={invoiceDate}
              clientName={clientName}
              clientEmail={clientEmail}
              clientPhone={clientPhone}
              clientAddress={clientAddress}
              notes={notes}
              companies={companies}
              errors={errors}
              onChange={handleFieldChange}
            />

            <LineItemsSection
              items={items}
              errors={errors}
              onAdd={handleAddItem}
              onUpdate={handleUpdateItem}
              onRemove={handleRemoveItem}
            />

            <InvoiceSummaryCard
              subtotal={subtotal}
              vatRate={vatRate}
              vatAmount={vatAmount}
              totalAmount={totalAmount}
              paidAmount={paidAmount}
              dueAmount={dueAmount}
              onVatRateChange={setVatRate}
            />

            <PaymentsSection
              installments={installments}
              onAdd={handleAddInstallment}
              onUpdate={handleUpdateInstallment}
              onRemove={handleRemoveInstallment}
            />
          </div>

          <div className="xl:col-span-5">
            <div className="xl:sticky xl:top-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Live Preview
                </h3>
              </div>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-border max-h-[calc(100vh-8rem)] overflow-auto">
                <div style={{ zoom: 0.55 }}>
                  <ThemedInvoiceDocument
                    invoice={previewInvoice}
                    items={previewItems}
                    installments={previewInstallments}
                    company={selectedCompany}
                    theme={activeTheme}
                    branding={branding}
                    layout={invoiceLayout}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
