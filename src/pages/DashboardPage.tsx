import React, { useState, useEffect } from "react";
import { Clock, MessageSquare, ExternalLink, Filter, RotateCcw, CheckCircle, Package, Timer } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Order {
  id: string;
  customer_name: string;
  customer_contact: string;
  notes: string;
  status: 'Pending' | 'Processing' | 'Completed';
  created_at: string;
  items: any[];
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Processing' | 'Completed'>('All');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/orders");
      const data = await resp.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const resp = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (resp.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as any } : o));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => filter === 'All' || o.status === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Live Orders Queue</h1>
          <p className="text-slate-500 italic text-sm">Quản lý các đơn hàng theo thời gian thực (FIFO)</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchOrders}
            className="p-2.5 rounded-xl text-slate-500 hover:bg-white hover:text-indigo-600 transition-all shadow-sm border border-slate-200 bg-white"
          >
            <RotateCcw size={18} />
          </button>
          <div className="flex bg-slate-200 p-1 rounded-xl gap-1">
            {['All', 'Pending', 'Processing', 'Completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f === 'All' ? 'Tất cả' : f === 'Pending' ? 'Chờ duyệt' : f === 'Processing' ? 'Đang làm' : 'Xong'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order) => (
              <motion.div
                layout
                key={order.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-white rounded-2xl border-2 ${
                  order.status === 'Pending' 
                    ? 'border-indigo-500 ring-4 ring-indigo-50/50' 
                    : order.status === 'Processing'
                    ? 'border-blue-500/50 bg-blue-50/10'
                    : 'border-slate-200 grayscale opacity-70'
                } overflow-hidden shadow-sm flex flex-col transition-all`}
              >
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded ${
                          order.status === 'Pending' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {order.status === 'Pending' ? 'Next Priority' : order.status}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">#{order.id}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{order.customer_name}</h3>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        {order.customer_contact} • {order.items.length} Images
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-slate-400 mb-1">
                        <Clock size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-900 leading-relaxed italic flex gap-3">
                      <p>"{order.notes}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={item.file_path} className="h-full w-full object-cover" alt="Job" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                          <p className="text-[9px] text-white text-center leading-tight">{item.item_note || "No notes"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex gap-2">
                    {['Pending', 'Processing', 'Completed'].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(order.id, s)}
                        disabled={order.status === s}
                        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
                          order.status === s 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'
                        }`}
                      >
                        {s === 'Pending' ? 'Queue' : s === 'Processing' ? 'Start' : 'Finish'}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <a 
                      href={order.items[0]?.file_path} 
                      target="_blank" 
                      className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                      title="View first item"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
          <Package size={64} strokeWidth={1} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">No orders in queue</p>
        </div>
      )}
    </div>
  );
}
