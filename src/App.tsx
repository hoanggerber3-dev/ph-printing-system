/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import OrderPage from "./pages/OrderPage";
import TrackingPage from "./pages/TrackingPage";
import DashboardPage from "./pages/DashboardPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import { Layout as LayoutIcon, ChevronRight, User, Settings, LogOut } from "lucide-react";

// --- CUSTOMER LAYOUT ---
function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 text-xl font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-white shadow-sm italic font-black">
              PH
            </span>
            <span>Premium System</span>
          </Link>
          <div className="flex items-center gap-8 text-sm font-bold uppercase tracking-wider">
            <Link to="/" className="text-slate-500 hover:text-slate-900 transition-colors">Đặt hàng</Link>
            <Link to="/tracking" className="text-slate-500 hover:text-slate-900 transition-colors">Tra cứu</Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

// --- ADMIN LAYOUT ---
function AdminLayout({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-3 text-xl font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-indigo-500 text-white shadow-sm italic font-black">
              PH
            </span>
            <span>Admin Panel</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-4 mt-6">Main Business</div>
          <Link to="/dashboard" className="flex items-center justify-between px-4 py-3 bg-indigo-600/10 text-indigo-400 rounded-xl font-bold border border-indigo-500/20">
            <span className="flex items-center gap-3"><LayoutIcon size={18} /> Orders Queue</span>
            <ChevronRight size={14} />
          </Link>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-4 mt-10">Account</div>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl font-bold transition-all">
            <LogOut size={18} /> Logout
          </button>
        </nav>

        <div className="p-6 mt-auto">
          <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              SQLite Online
            </div>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Workspace / Priority Queue</h2>
          <div className="flex items-center gap-3">
             <div className="text-right">
                <p className="text-xs font-bold text-slate-900">System Admin</p>
                <p className="text-[10px] text-slate-400">PH Printing Lab</p>
             </div>
             <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold">
               AD
             </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth === "true") setIsAdminAuthenticated(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    setIsAdminAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        {/* SHOP ROUTES GROUP */}
        <Route path="/" element={<CustomerLayout><OrderPage /></CustomerLayout>} />
        <Route path="/tracking" element={<CustomerLayout><TrackingPage /></CustomerLayout>} />
        
        {/* ADMIN ROUTES GROUP */}
        <Route 
          path="/dashboard" 
          element={
            isAdminAuthenticated ? (
              <AdminLayout onLogout={handleLogout}><DashboardPage /></AdminLayout>
            ) : (
              <AdminLoginPage onLogin={() => setIsAdminAuthenticated(true)} />
            )
          } 
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
