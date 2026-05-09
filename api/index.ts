import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

// Khởi tạo Prisma (Nên để ngoài để tận dụng kết nối lại)
const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// Cấu hình Multer để nhận file qua bộ nhớ đệm
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- CÁC ĐƯỜNG DẪN API ---

// 1. Tạo đơn hàng mới
app.post("/api/orders", upload.array("files"), async (req: any, res: any) => {
  try {
    const { customerName, customerContact, notes, itemNotes } = req.body;
    const orderId = "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const files = (req.files as any[]) || [];
    
    let parsedItemNotes: string[] = [];
    try {
      parsedItemNotes = typeof itemNotes === 'string' ? JSON.parse(itemNotes) : (itemNotes || []);
    } catch (e) {
      parsedItemNotes = [];
    }

    // Tải ảnh lên Vercel Blob
    const uploadedFiles = await Promise.all(
      files.map(async (file, index) => {
        let filePath = "";
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          const blob = await put(`orders/${orderId}/${Date.now()}-${file.originalname}`, file.buffer, {
            access: 'public',
          });
          filePath = blob.url;
        } else {
          // Local fallback (chỉ dùng cho dev)
          filePath = `/uploads/${file.originalname}`;
        }

        return {
          file_path: filePath,
          item_note: parsedItemNotes[index] || ""
        };
      })
    );

    // Lưu vào Database Neon
    const order = await prisma.order.create({
      data: {
        id: orderId,
        customer_name: customerName,
        customer_contact: customerContact,
        notes: notes,
        items: {
          create: uploadedFiles
        }
      }
    });

    res.status(201).json({ orderId: order.id, success: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi kết nối Database hoặc Blob." });
  }
});

// 2. Lấy danh sách đơn hàng (Cho Admin)
app.get("/api/admin/orders", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { created_at: 'desc' }, // Đơn mới lên đầu
      include: { items: true }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Không thể lấy danh sách đơn hàng." });
  }
});

// 3. Cập nhật trạng thái đơn hàng
app.patch("/api/admin/orders/:id", async (req, res) => {
  try {
    const { status } = req.body;
    await prisma.order.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Lỗi cập nhật." });
  }
});

// --- DÒNG QUAN TRỌNG NHẤT ĐỂ CHẠY TRÊN VERCEL ---
// Xóa app.listen() và thay bằng export này:
export default app;
