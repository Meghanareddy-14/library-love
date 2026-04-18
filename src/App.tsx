import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";

import AdminOverview from "./pages/admin/AdminOverview.tsx";
import AdminBooks from "./pages/admin/AdminBooks.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminLoans from "./pages/admin/AdminLoans.tsx";

import StudentDashboard from "./pages/student/StudentDashboard.tsx";
import StudentBrowse from "./pages/student/StudentBrowse.tsx";
import StudentLoans from "./pages/student/StudentLoans.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminOverview /></ProtectedRoute>} />
            <Route path="/admin/books" element={<ProtectedRoute requireRole="admin"><AdminBooks /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireRole="admin"><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/loans" element={<ProtectedRoute requireRole="admin"><AdminLoans /></ProtectedRoute>} />

            <Route path="/student" element={<ProtectedRoute requireRole="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/browse" element={<ProtectedRoute requireRole="student"><StudentBrowse /></ProtectedRoute>} />
            <Route path="/student/loans" element={<ProtectedRoute requireRole="student"><StudentLoans /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
