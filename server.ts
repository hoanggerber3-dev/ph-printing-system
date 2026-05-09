import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Prisma
const prisma = new PrismaClient();

// Storage configuration - Use memory storage for cloud uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Local upload dir as fallback for dev
const uploadDir = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Create new order (With Vercel Blob + Prisma)
  app.post("/api/orders", upload.array("files"), async (req: express.Request, res: express.Response) => {
    try {
      const { customerName, customerContact, notes, itemNotes } = req.body;
      const orderId = "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
      const files = (req.files as Express.Multer.File[]) || [];
      
      let parsedItemNotes: string[] = [];
      try {
        parsedItemNotes = typeof itemNotes === 'string' ? JSON.parse(itemNotes) : (itemNotes || []);
      } catch (e) {
        parsedItemNotes = [];
      }

      // 1. Upload files to Cloud (Vercel Blob) or Local
      const uploadedFiles = await Promise.all(
        files.map(async (file, index) => {
          let filePath = "";
          
          if (process.env.BLOB_READ_WRITE_TOKEN) {
            // Upload to Vercel Blob
            const blob = await put(`orders/${orderId}/${Date.now()}-${file.originalname}`, file.buffer, {
              access: 'public',
            });
            filePath = blob.url;
          } else {
            // Fallback to local file system if no token
            const filename = `${Date.now()}-${file.originalname}`;
            const localPath = path.join(uploadDir, filename);
            fs.writeFileSync(localPath, file.buffer);
            filePath = `/uploads/${filename}`;
          }

          return {
            file_path: filePath,
            item_note: parsedItemNotes[index] || ""
          };
        })
      );

      // 2. Save to Database (Prisma)
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
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order. Check your DATABASE_URL and BLOB_READ_WRITE_TOKEN." });
    }
  });

  // Track order
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { items: true }
      });
      if (!order) return res.status(404).json({ error: "Order not found" });
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // Admin: List all orders
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const orders = await prisma.order.findMany({
        orderBy: { created_at: 'asc' },
        include: { items: true }
      });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin orders" });
    }
  });

  // Admin: Update status
  app.patch("/api/admin/orders/:id", async (req, res) => {
    try {
      const { status } = req.body;
      await prisma.order.update({
        where: { id: req.params.id },
        data: { status }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use("/uploads", express.static(uploadDir));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Handle static uploads in dev mode
  app.use("/uploads", express.static(uploadDir));

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
