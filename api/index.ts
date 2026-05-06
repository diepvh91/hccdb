import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@libsql/client";
import { put, del } from "@vercel/blob";
import bcrypt from "bcryptjs";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const adminResult = await db.execute("SELECT COUNT(*) as count FROM admins");
  if ((adminResult.rows[0].count as number) === 0) {
    const hashedPassword = await bcrypt.hash("123456Aa@", 10);
    await db.execute({
      sql: "INSERT INTO admins (username, password) VALUES (?, ?)",
      args: ["admin", hashedPassword],
    });
    console.log("Da tao tai khoan admin mac dinh.");
  }

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

let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureDb();

  const method = req.method;
  const url = new URL(req.url || "", `https://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    if (pathname === "/api/units" && method === "GET") {
      const result = await db.execute("SELECT * FROM units ORDER BY created_at DESC");
      return res.status(200).json(result.rows);
    }

    if (pathname.match(/^\/api\/units\/([^/]+)$/) && method === "GET") {
      const subdomain = pathname.split("/")[3];
      const result = await db.execute({
        sql: "SELECT * FROM units WHERE subdomain = ?",
        args: [subdomain],
      });
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Unit not found" });
      }
      return res.status(200).json(result.rows[0]);
    }

    if (pathname === "/api/units" && method === "POST") {
      const { subdomain, name, title, description, image_url, video_url, pdf_url, training_text } = req.body;
      const result = await db.execute({
        sql: `INSERT INTO units (subdomain, name, title, description, image_url, video_url, pdf_url, training_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [subdomain || "", name || "", title || "", description || "", image_url || "", video_url || "", pdf_url || "", training_text || ""],
      });
      return res.status(201).json({ id: Number(result.lastInsertRowid) });
    }

    if (pathname.match(/^\/api\/units\/(\d+)$/) && method === "PUT") {
      const id = pathname.split("/")[3];
      const { name, title, description, image_url, video_url, pdf_url, training_text, is_deployed } = req.body;
      await db.execute({
        sql: `UPDATE units SET name = ?, title = ?, description = ?, image_url = ?, video_url = ?, pdf_url = ?, training_text = ?, is_deployed = ? WHERE id = ?`,
        args: [name || "", title || "", description || "", image_url || "", video_url || "", pdf_url || "", training_text || "", is_deployed ? 1 : 0, id],
      });
      return res.status(200).json({ success: true });
    }

    if (pathname.match(/^\/api\/units\/(\d+)$/) && method === "DELETE") {
      const id = pathname.split("/")[3];
      const unitResult = await db.execute({
        sql: "SELECT image_url, video_url, pdf_url FROM units WHERE id = ?",
        args: [id],
      });

      if (unitResult.rows.length > 0) {
        const unit = unitResult.rows[0] as any;
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

      await db.execute({ sql: "DELETE FROM units WHERE id = ?", args: [id] });
      return res.status(200).json({ success: true });
    }

    if (pathname === "/api/upload" && method === "POST") {
      const { fileData, fileName, contentType, field } = req.body;
      if (!fileData || !fileName || !contentType) {
        return res.status(400).json({ error: "Thieu thong tin tep" });
      }
      const sizeInBytes = (fileData.length * 3) / 4;
      if (sizeInBytes > 30 * 1024 * 1024) {
        return res.status(400).json({ error: "Tep qua lon. Vui long chon tep nho hon 30MB." });
      }
      try {
        const buffer = Buffer.from(fileData, "base64");
        console.log(`Upload: ${fileName}, size: ${buffer.length} bytes`);
        const blob = await put(fileName, buffer, { contentType, access: "public" });
        return res.status(200).json({ url: blob.url });
      } catch (blobError: any) {
        console.error("Blob upload error:", blobError.message, blobError.stack);
        return res.status(500).json({ error: "Loi upload: " + blobError.message });
      }
    }

    // Login
    if (pathname === "/api/admins/login" && method === "POST") {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return res.status(400).json({ error: "Thieu ten dang nhap hoac mat khau" });
      }
      try {
        const result = await db.execute({ sql: "SELECT * FROM admins WHERE username = ?", args: [username] });
        if (result.rows.length === 0) {
          return res.status(401).json({ error: "Ten dang nhap hoac mat khau khong dung" });
        }
        const admin = result.rows[0] as any;
        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) {
          return res.status(401).json({ error: "Ten dang nhap hoac mat khau khong dung" });
        }
        return res.status(200).json({ id: admin.id, username: admin.username });
      } catch (e: any) {
        console.error("Admin login error:", e);
        return res.status(500).json({ error: "Loi khi dang nhap" });
      }
    }

    // List admins
    if (pathname === "/api/admins" && method === "GET") {
      try {
        const result = await db.execute("SELECT id, username, created_at FROM admins ORDER BY created_at DESC");
        return res.status(200).json(result.rows);
      } catch (e) {
        return res.status(500).json({ error: "Loi khi lay danh sach admin" });
      }
    }

    // Create admin
    if (pathname === "/api/admins" && method === "POST") {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return res.status(400).json({ error: "Thieu ten dang nhap hoac mat khau" });
      }
      try {
        const hashed = await bcrypt.hash(password, 10);
        const result = await db.execute({ sql: "INSERT INTO admins (username, password) VALUES (?, ?)", args: [username, hashed] });
        return res.status(201).json({ id: Number(result.lastInsertRowid), username });
      } catch (e: any) {
        if (e.message?.includes("UNIQUE constraint failed")) {
          return res.status(400).json({ error: "Ten dang nhap da ton tai" });
        }
        return res.status(500).json({ error: "Loi khi tao tai khoan" });
      }
    }

    // Update admin password
    const adminMatch = pathname.match(/^\/api\/admins\/(\d+)$/);
    if (adminMatch && method === "PUT") {
      const { password } = req.body || {};
      if (!password) {
        return res.status(400).json({ error: "Thieu mat khau moi" });
      }
      try {
        const hashed = await bcrypt.hash(password, 10);
        await db.execute({ sql: "UPDATE admins SET password = ? WHERE id = ?", args: [hashed, adminMatch[1]] });
        return res.status(200).json({ success: true });
      } catch (e) {
        return res.status(500).json({ error: "Loi khi cap nhat tai khoan" });
      }
    }

    // Delete admin
    if (adminMatch && method === "DELETE") {
      try {
        const countResult = await db.execute("SELECT COUNT(*) as count FROM admins");
        if ((countResult.rows[0].count as number) <= 1) {
          return res.status(400).json({ error: "Khong the xoa tai khoan cuoi cung" });
        }
        await db.execute({ sql: "DELETE FROM admins WHERE id = ?", args: [adminMatch[1]] });
        return res.status(200).json({ success: true });
      } catch (e) {
        return res.status(500).json({ error: "Loi khi xoa tai khoan" });
      }
    }

    return res.status(404).json({ error: "Not found" });
  } catch (e: any) {
    console.error("API error:", e);
    if (e.message?.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Subdomain da ton tai" });
    }
    // Return actual error message for debugging
    const errorMsg = e.message || String(e);
    console.error("Full error:", JSON.stringify(e));
    return res.status(500).json({ error: "Co loi xay ra tren may chu: " + errorMsg });
  }
}