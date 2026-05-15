import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import {
  InvoiceLayout,
  defaultInvoiceLayout,
  mergeLayout,
} from "@/types/invoiceLayout";

// --- Global layout ---
export const useGlobalInvoiceLayout = () => {
  return useQuery({
    queryKey: ["invoice-layout", "global"],
    queryFn: async (): Promise<InvoiceLayout> => {
      const { data, error } = await api.get<{ layout: Partial<InvoiceLayout> }>(
        "/invoice-layout"
      );
      if (error || !data) return defaultInvoiceLayout;
      return mergeLayout(defaultInvoiceLayout, data.layout);
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateGlobalInvoiceLayout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (layout: InvoiceLayout) => {
      const { data, error } = await api.put("/invoice-layout", { layout });
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice-layout"] });
    },
  });
};

// --- Per-company override ---
export const useCompanyInvoiceLayout = (companyId?: string | null) => {
  return useQuery({
    queryKey: ["invoice-layout", "company", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<Partial<InvoiceLayout> | null> => {
      const { data, error } = await api.get<{ layout: Partial<InvoiceLayout> | null }>(
        `/companies/${companyId}/invoice-layout`
      );
      if (error || !data) return null;
      return data.layout ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateCompanyInvoiceLayout = (companyId?: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (layout: Partial<InvoiceLayout> | null) => {
      if (!companyId) throw new Error("companyId required");
      const { data, error } = await api.put(
        `/companies/${companyId}/invoice-layout`,
        { layout }
      );
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice-layout", "company", companyId] });
    },
  });
};

// --- Resolved layout for an invoice (global + company override merged) ---
export const useEffectiveInvoiceLayout = (companyId?: string | null) => {
  const globalQ = useGlobalInvoiceLayout();
  const companyQ = useCompanyInvoiceLayout(companyId);
  const base = globalQ.data || defaultInvoiceLayout;
  const layout = mergeLayout(base, companyQ.data || null);
  return {
    layout,
    isLoading: globalQ.isLoading || (!!companyId && companyQ.isLoading),
  };
};
