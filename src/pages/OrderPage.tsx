import React, { useState, useRef } from "react";
import { Upload, X, Send, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FileWithNote {
  file: File;
  note: string;
  preview: string;
}

export default function OrderPage() {
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [files, setFiles] = useState<FileWithNote[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        note: "",
        preview: URL.createObjectURL(file as Blob)
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const updateFileNote = (index: number, note: string) => {
    setFiles(prev => {
      const updated = [...prev];
      updated[index].note = note;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return alert("Vui lòng chọn ít nhất một file thiết kế!");

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("customerName", customerName);
    formData.append("customerContact", customerContact);
    formData.append("notes", orderNotes);
    
    const itemNotes = files.map(f => f.note);
    formData.append("itemNotes", JSON.stringify(itemNotes));

    files.forEach(f => {
      formData.append("files", f.file);
    });

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setSubmittedOrderId(data.orderId);
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Đã có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedOrderId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 rounded-full bg-emerald-50 p-8 text-emerald-500 shadow-sm border border-emerald-100"
        >
          <CheckCircle2 size={72} />
        </motion.div>
        <h2 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">Đặt hàng thành công!</h2>
        <p className="mb-10 text-slate-500 text-lg">Mã đơn hàng của bạn là: <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{submittedOrderId}</span></p>
        <button 
          onClick={() => window.location.reload()}
          className="rounded-xl bg-slate-900 px-10 py-4 font-bold text-white hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          Tạo đơn hàng mới
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12 border-l-4 border-indigo-600 pl-6">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2 uppercase">Gửi Yêu Cầu In Ấn</h1>
        <p className="text-lg text-slate-500 font-medium">Quy trình tiếp nhận đơn hàng chuyên nghiệp. <span className="text-indigo-600">PH Printing Lab</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold">01</div>
                <h3 className="text-xl font-bold text-slate-900">Thông tin khách hàng</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Họ và Tên</label>
                  <input 
                    required
                    type="text" 
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Số điện thoại / Zalo</label>
                  <input 
                    required
                    type="text" 
                    value={customerContact}
                    onChange={e => setCustomerContact(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                    placeholder="09xx xxx xxx"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold">02</div>
                <h3 className="text-xl font-bold text-slate-900">Tệp tin thiết kế</h3>
              </div>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group cursor-pointer border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center hover:border-indigo-500 hover:bg-indigo-50/30 transition-all"
              >
                <div className="mb-4 rounded-xl bg-slate-100 p-5 text-slate-400 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-md transition-all">
                  <Upload size={32} />
                </div>
                <p className="text-slate-900 font-bold text-lg">Kéo thả file vào đây</p>
                <p className="text-sm text-slate-400 mt-1">Hoặc nhấp để chọn tệp từ máy tính</p>
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>

              <div className="mt-8 grid grid-cols-1 gap-4">
                <AnimatePresence>
                  {files.map((file, index) => (
                    <motion.div 
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      className="flex items-start gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-100 relative group"
                    >
                      <div className="relative shrink-0">
                        <img src={file.preview} alt="Preview" className="w-24 h-24 object-cover rounded-xl shadow-md border-2 border-white" />
                        <div className="absolute -top-2 -left-2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                          {file.file.name.split('.').pop()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm font-bold truncate text-slate-900 mb-2">{file.file.name}</p>
                        <div className="relative">
                          <textarea 
                            placeholder="Mô tả chi tiết (Kích thước, số lượng...)"
                            value={file.note}
                            onChange={e => updateFileNote(index, e.target.value)}
                            className="w-full text-sm bg-white border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-sm"
                            rows={2}
                          />
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <X size={20} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 sticky top-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold">03</div>
                <h3 className="text-xl font-bold text-slate-900">Hoàn tất đơn</h3>
              </div>
              
              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ghi chú chung</label>
                <textarea 
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[120px] placeholder:text-slate-300 shadow-inner"
                  placeholder="Yêu cầu giao hàng, địa chỉ hoặc lưu ý khác cho xưởng..."
                />
              </div>

              <button 
                disabled={isSubmitting}
                className="w-full group flex items-center justify-center gap-3 rounded-xl bg-indigo-600 px-8 py-5 text-xl font-bold text-white shadow-2xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-3 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>GỬI ĐƠN HÀNG</span>
                    <Send size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
              
              <p className="mt-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Đảm bảo file in đạt chất lượng tốt nhất
              </p>
            </section>
          </div>
        </div>
      </form>
    </div>
  );
}
