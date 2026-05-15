import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import CompanyBranding from "./pages/CompanyBranding";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
 import InvoiceView from "./pages/InvoiceView";
 import InvoicePreviewCompare from "./pages/InvoicePreviewCompare";
 import PublicInvoiceView from "./pages/PublicInvoiceView";
 import Login from "./pages/Login";
  import ResetPassword from "./pages/ResetPassword";
 import AdminPanel from "./pages/AdminPanel";
 import ThemeSettings from "./pages/ThemeSettings";
 import BrandingSettings from "./pages/BrandingSettings";
 import InvoiceLayoutSettings from "./pages/InvoiceLayoutSettings";
 import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />
             <Route path="/reset-password" element={<ResetPassword />} />
             <Route path="/view/:id" element={<PublicInvoiceView />} />
            
             {/* Admin routes */}
             <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
             <Route path="/admin/theme" element={<ProtectedRoute requireAdmin><ThemeSettings /></ProtectedRoute>} />
             <Route path="/admin/branding" element={<ProtectedRoute requireAdmin><BrandingSettings /></ProtectedRoute>} />
             <Route path="/admin/invoice-layout" element={<ProtectedRoute requireAdmin><InvoiceLayoutSettings /></ProtectedRoute>} />
             
             {/* Protected routes */}
             <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
             <Route path="/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
             <Route path="/companies/:id" element={<ProtectedRoute><CompanyDetail /></ProtectedRoute>} />
             <Route path="/companies/:id/branding" element={<ProtectedRoute><CompanyBranding /></ProtectedRoute>} />
             <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
             <Route path="/invoices/new" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
             <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceView /></ProtectedRoute>} />
             <Route path="/invoices/:id/preview" element={<ProtectedRoute><InvoicePreviewCompare /></ProtectedRoute>} />
             <Route path="/invoices/:id/edit" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
