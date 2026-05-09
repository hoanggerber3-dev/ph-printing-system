import express from "express";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

// Khởi tạo Prisma Client (để ngoài để tái sử dụng kết nối)
const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// Cấu hình Multer lưu tạm file vào bộ nhớ (Memory Storage) để upload lên Blob
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- CÁC ĐƯỜNG DẪN API (ROUTES) ---

// 1. Gửi đơn hàng mới (Dùng cho khách hàng)
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

    // Tải hình ảnh lên Vercel Blob
    const uploadedFiles = await Promise.all(
      files.map(async (file, index) => {
        let filePath = "";
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          const blob = await put(`orders/${orderId}/${Date.now()}-${file.originalname}`, file.buffer, {
            access: 'public',
          });
          filePath = blob.url;
        } else {
          // Fallback đường dẫn giả lập nếu chưa có Token (chỉ dùng khi test)
          filePath = `https://placehold.co/600x400?text=${encodeURIComponent(file.originalname)}`;
        }

        return {
          file_path: filePath,
          item_note: parsedItemNotes[index] || ""
        };
      })
    );

    // Lưu dữ liệu vào Database Neon (PostgreSQL)
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
  } catch (error: any) {
    console.error("Lỗi tạo đơn hàng:", error);
    res.status(500).json({ error: "Không thể gửi đơn hàng. Vui lòng kiểm tra lại kết nối Database." });
  }
});

// 2. Tra cứu đơn hàng (Dùng cho khách hàng theo dõi tình trạng)
app.get("/api/orders/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ error: "Không tìm thấy mã đơn hàng này." });
    }

    res.json(order);
  } catch (error) {
    console.error("Lỗi tra cứu:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi tra cứu dữ liệu." });
  }
});

// 3. Lấy toàn bộ đơn hàng (Dùng cho trang Dashboard Admin)
app.get("/api/admin/orders", async (req: any, res: any) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { created_at: 'desc' },
      include: { items: true }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Không thể lấy dữ liệu Admin." });
  }
});

// 4. Cập nhật trạng thái đơn hàng (Dùng cho Admin duyệt đơn)
app.patch("/api/admin/orders/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await prisma.order.update({
      where: { id: id },
      data: { status }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi cập nhật trạng thái đơn." });
  }
});
// 5. Xóa đơn hàng (Chỉ dành cho Admin)
app.delete("/api/admin/orders/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // Xóa tất cả các items liên quan trước (do ràng buộc database)
    await prisma.orderItem.deleteMany({
      where: { order_id: id }
    });

    // Sau đó xóa đơn hàng
    await prisma.order.delete({
      where: { id: id }
    });

    res.json({ success: true, message: "Đã xóa đơn hàng thành công." });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Lỗi khi xóa đơn hàng." });
  }
});
// --- DÒNG QUAN TRỌNG NHẤT ĐỂ CHẠY TRÊN VERCEL ---
export default app;
