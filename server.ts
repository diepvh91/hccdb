import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@libsql/client";
import { put, del } from "@vercel/blob";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

// Validate required environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY chua duoc cau hinh!");
  console.error("Vui long tao file .env.local hoac .env voi:");
  console.error("   GEMINI_API_KEY=your_actual_api_key");
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";

console.log(`Khoi dong server: ${NODE_ENV} mode, Port ${PORT}`);

// Turso (libSQL) database client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize database schema
async function initDatabase() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subdomain TEXT UNIQUE,
      name TEXT,
      title TEXT,
      description TEXT,
      image_url TEXT,
      video_url TEXT,
      pdf_url TEXT,
      training_text TEXT,
      is_deployed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default unit if empty
  const result = await db.execute("SELECT COUNT(*) as count FROM units");
  const count = result.rows[0].count as number;

  if (count === 0) {
    await db.execute({
      sql: `INSERT INTO units (subdomain, name, title, description, image_url, video_url, pdf_url, training_text, is_deployed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "test",
        "Đơn vị Mẫu",
        "Hệ thống Trợ lý ảo AI",
        "Mô tả đơn vị mẫu",
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1000",
        "https://assets.mixkit.co/videos/preview/mixkit-woman-smiling-at-the-camera-3132-large.mp4",
        "",
        "Bạn là trợ lý ảo mẫu. Hãy trả lời thân thiện.",
        1,
      ],
    });
    console.log("Da tao don vi mau mac dinh.");
  }
}

async function startServer() {
  await initDatabase();

  const app = express();

  app.use(express.json({ limit: "200mb" }));
  app.use(express.urlencoded({ limit: "200mb", extended: true }));

  // Error handler for body-parser
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.type === "entity.too.large") {
      console.error("Loi: Tep tai len qua lon:", err.message);
      return res.status(413).json({ error: "Tep tai len qua lon. Gioi han he thong la 200MB." });
    }
    next(err);
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Loi khong xac dinh:", err);
    res.status(500).json({ error: "Co loi xay ra tren may chu. Vui long thu lai sau." });
  });

  // ========================
  // API Routes - Units
  // ========================

  app.get("/api/units", async (req, res) => {
    try {
      const result = await db.execute("SELECT * FROM units ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (error) {
      console.error("Get units error:", error);
      res.status(500).json({ error: "Loi khi lay danh sach don vi" });
    }
  });

  app.get("/api/units/:subdomain", async (req, res) => {
    try {
      const result = await db.execute({
        sql: "SELECT * FROM units WHERE subdomain = ?",
        args: [String(req.params.subdomain)],
      });
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Unit not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Get unit error:", error);
      res.status(500).json({ error: "Loi khi lay don vi" });
    }
  });

  app.post("/api/units", async (req, res) => {
    const { subdomain, name, title, description, image_url, video_url, pdf_url, training_text } = req.body;
    console.log("--- CREATE UNIT REQUEST ---");
    console.log(`Subdomain: ${subdomain}`);
    console.log(`Name: ${name}`);
    console.log(`Training Text Length: ${(training_text || "").length}`);

    try {
      const result = await db.execute({
        sql: `INSERT INTO units (subdomain, name, title, description, image_url, video_url, pdf_url, training_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          subdomain || "",
          name || "",
          title || "",
          description || "",
          image_url || "",
          video_url || "",
          pdf_url || "",
          training_text || "",
        ],
      });
      console.log(`Unit created successfully with ID: ${result.lastInsertRowid}`);
      res.json({ id: Number(result.lastInsertRowid) });
    } catch (e: any) {
      console.error("Create unit error:", e);
      if (e.message?.includes("UNIQUE constraint failed") || e.code === "SQLITE_CONSTRAINT") {
        return res.status(400).json({ error: "Subdomain da ton tai" });
      }
      res.status(500).json({ error: "Loi khi tao don vi" });
    }
  });

  app.put("/api/units/:id", async (req, res) => {
    const { name, title, description, image_url, video_url, pdf_url, training_text, is_deployed } = req.body;
    console.log("--- UPDATE UNIT REQUEST ---");
    console.log(`ID: ${req.params.id}`);
    console.log(`Name: ${name}`);
    console.log(`Training Text Length: ${training_text?.length || 0}`);

    try {
      await db.execute({
        sql: `UPDATE units SET name = ?, title = ?, description = ?, image_url = ?, video_url = ?, pdf_url = ?, training_text = ?, is_deployed = ? WHERE id = ?`,
        args: [name || "", title || "", description || "", image_url || "", video_url || "", pdf_url || "", training_text || "", is_deployed ? 1 : 0, req.params.id],
      });
      res.json({ success: true });
    } catch (e) {
      console.error("Update unit error:", e);
      res.status(500).json({ error: "Loi khi cap nhat don vi" });
    }
  });

  app.delete("/api/units/:id", async (req, res) => {
    try {
      // Get unit first to delete associated blobs
      const unitResult = await db.execute({
        sql: "SELECT image_url, video_url, pdf_url FROM units WHERE id = ?",
        args: [req.params.id],
      });

      if (unitResult.rows.length > 0) {
        const unit = unitResult.rows[0] as any;
        // Delete blobs from Vercel Blob storage
        const deletePromises: Promise<void>[] = [];
        if (unit.image_url?.includes("vercel-blob.com")) {
          deletePromises.push(del(unit.image_url).then(() => {}).catch(() => {}));
        }
        if (unit.video_url?.includes("vercel-blob.com")) {
          deletePromises.push(del(unit.video_url).then(() => {}).catch(() => {}));
        }
        if (unit.pdf_url?.includes("vercel-blob.com")) {
          deletePromises.push(del(unit.pdf_url).then(() => {}).catch(() => {}));
        }
        await Promise.all(deletePromises);
      }

      await db.execute({
        sql: "DELETE FROM units WHERE id = ?",
        args: [req.params.id],
      });
      res.json({ success: true });
    } catch (e) {
      console.error("Delete unit error:", e);
      res.status(500).json({ error: "Loi khi xoa don vi" });
    }
  });

  // ========================
  // API Routes - File Upload
  // ========================

  app.post("/api/upload", async (req, res) => {
    try {
      const { fileData, fileName, contentType, field } = req.body;

      if (!fileData || !fileName || !contentType) {
        return res.status(400).json({ error: "Thieu thong tin tep" });
      }

      // Check file size (limit 30MB)
      const sizeInBytes = (fileData.length * 3) / 4; // Approximate base64 decoded size
      if (sizeInBytes > 30 * 1024 * 1024) {
        return res.status(400).json({ error: "Tep qua lon. Vui long chon tep nho hon 30MB." });
      }

      // Convert base64 to Buffer for Vercel Blob
      const buffer = Buffer.from(fileData, "base64");

      const blob = await put(fileName, buffer, {
        contentType,
        access: "public",
      });

      console.log(`Uploaded ${field}: ${blob.url}`);
      res.json({ url: blob.url });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Loi khi tai tep len" });
    }
  });

  // Vite middleware for development
  if (NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server chay thanh cong: http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Loi khoi dong server:", error);
  process.exit(1);
});
