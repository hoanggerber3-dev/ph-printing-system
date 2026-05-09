import express from "express";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- API ROUTES ---

// 1. Gửi đơn hàng mới
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

    const uploadedFiles = await Promise.all(
      files.map(async (file, index) => {
        let filePath = "";
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          const blob = await put(`orders/${orderId}/${Date.now()}-${file.originalname}`, file.buffer, {
            access: 'public',
          });
          filePath = blob.url;
        } else {
          filePath = `https://placehold.co/600x400?text=${encodeURIComponent(file.originalname)}`;
        }

        return {
          file_path: filePath,
          item_note: parsedItemNotes[index] || ""
        };
      })
    );

    const order = await prisma.order.create({
      data: {
        id: orderId,
        customer_name: customerName,
        customer_contact: customerContact,
        notes: notes,
        items: { create: uploadedFiles }
      }
    });

    res.status(201).json({ orderId: order.id, success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Lỗi hệ thống khi tạo đơn." });
  }
});

// 2. Tra cứu đơn hàng (Sửa lỗi 404 tra cứu)
app.get("/api/orders/:id", async (req: any, res: any) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    });
    if (!order) return res.status(404).json({ error: "Không tìm thấy đơn hàng." });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Lỗi tra cứu." });
  }
});

// 3. Lấy danh sách đơn hàng cho Admin
app.get("/api/admin/orders", async (req: any, res: any) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { created_at: 'desc' },
      include: { items: true }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Lỗi lấy dữ liệu admin." });
  }
});

// 4. Cập nhật trạng thái (QUEUE, START, FINISH)
app.patch("/api/admin/orders/:id", async (req: any, res: any) => {
  try {
    const { status } = req.body;
    await prisma.order.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Lỗi cập nhật trạng thái." });
  }
});

// 5. CHỨC NĂNG XÓA ĐƠN HÀNG (Mới cập nhật)
app.delete("/api/admin/orders/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    // Xóa ảnh liên quan trước
    await prisma.orderItem.deleteMany({ where: { order_id: id } });
    // Xóa đơn hàng chính
    await prisma.order.delete({ where: { id: id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi xóa đơn hàng." });
  }
});

export default app;
