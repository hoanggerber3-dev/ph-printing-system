import React, { useState } from "react";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

export default function AdminLoginPage({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      localStorage.setItem("admin_auth", "true");
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden"
      >
        <div className="bg-slate-900 p-10 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Admin Access</h2>
          <p className="text-slate-400 text-sm mt-2">Vui lòng nhập mật khẩu quản trị</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Password</label>
            <input 
              autoFocus
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-6 py-4 rounded-xl bg-slate-50 border-2 outline-none transition-all text-xl text-center font-mono ${
                error ? 'border-red-500 bg-red-50' : 'border-slate-100 focus:border-indigo-500'
              }`}
            />
          </div>

          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95"
          >
            <span>Xác nhận</span>
            <ArrowRight size={20} />
          </button>

          <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold uppercase">
            <ShieldCheck size={14} />
            Secure PH Management
          </div>
        </form>
      </motion.div>
    </div>
  );
}
