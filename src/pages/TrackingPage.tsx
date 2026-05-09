import React, { useState } from "react";
import { Search, Loader2, Package, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface OrderData {
  id: string;
  customer_name: string;
  status: string;
  created_at: string;
  items: any[];
}

export default function TrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const response = await fetch(`/api/orders/${orderId.trim()}`);
      const data = await response.json();
      if (response.ok) {
        setOrder(data);
      } else {
        setError(data.error || "Không tìm thấy đơn hàng");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <div className="w-3 h-3 rounded-full bg-amber-400" />;
      case "Processing":
        return <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />;
      case "Completed":
        return <div className="w-3 h-3 rounded-full bg-emerald-500" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-slate-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Pending": return "PENDING";
      case "Processing": return "PROCESSING";
      case "Completed": return "COMPLETED";
      default: return status.toUpperCase();
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-4 uppercase">Track Your Order</h1>
        <p className="text-slate-500 text-lg font-medium italic">Tra cứu trạng thái đơn hàng thời gian thực.</p>
      </div>

      <form onSubmit={handleSearch} className="relative mb-16 px-4 sm:px-0">
        <div className="flex bg-white p-2 rounded-2xl shadow-2xl shadow-slate-200 border border-slate-200">
          <input 
            type="text" 
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            placeholder="Mã đơn hàng (Ví dụ: ORD-X0Y1Z2)"
            className="flex-1 pl-6 py-4 outline-none text-xl font-bold font-mono tracking-tight text-slate-900 placeholder:text-slate-200"
          />
          <button 
            disabled={loading}
            className="bg-slate-900 text-white px-10 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            Search
          </button>
        </div>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-5 rounded-2xl bg-red-50 text-red-600 border border-red-100 font-bold text-sm uppercase tracking-wider mx-4 sm:mx-0"
          >
            <AlertCircle size={20} />
            {error}
          </motion.div>
        )}

        {order && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden mx-4 sm:mx-0"
          >
            <div className="bg-slate-900 px-10 py-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Order Reference</p>
                <h3 className="text-4xl font-black font-mono tracking-tighter">{order.id}</h3>
                <p className="text-slate-400 text-xs font-medium">PH Premium Service</p>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 min-w-[200px] text-center md:text-right">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Live Status</p>
                <div className="flex items-center justify-center md:justify-end gap-3 font-mono font-bold text-2xl tracking-tighter">
                  {getStatusIcon(order.status)}
                  {getStatusText(order.status)}
                </div>
              </div>
            </div>

            <div className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Customer Details</h4>
                    <div className="space-y-1">
                      <p className="text-xl font-bold text-slate-900">{order.customer_name}</p>
                      <p className="text-sm font-medium text-slate-500">{order.customer_contact}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Timestamp</h4>
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(order.created_at).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Job Files ({order.items.length})</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col gap-2 group cursor-zoom-in">
                        <div className="aspect-square overflow-hidden rounded-lg shadow-inner bg-white">
                          <img src={item.file_path} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Preview" />
                        </div>
                        <p className="text-[9px] text-slate-400 line-clamp-1 italic text-center">{item.item_note || "No notes"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
