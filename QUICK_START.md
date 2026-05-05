# ⚡ QUICK START - Bắt đầu nhanh

## 📌 3 bước để chạy ứng dụng

### 1️⃣ Chuẩn bị (5 phút)

**Tải Node.js**: https://nodejs.org/ (bấm nút LTS)

**Tạo file `.env.local`** trong thư mục project:
```
GEMINI_API_KEY=YOUR_API_KEY_HERE
PORT=3000
NODE_ENV=development
```

> Lấy API key từ: https://ai.google.dev/aistudio/apikeys (nếu đã có)

### 2️⃣ Cài đặt (2-5 phút)

Mở **Command Prompt** (Windows) hoặc **Terminal** (Mac/Linux):

```bash
cd "d:\Claude code\HCC"
npm install
```

### 3️⃣ Chạy (1 phút)

```bash
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

---

## ✅ Test nhanh

- [ ] Trang load được?
- [ ] Chat hoạt động?
- [ ] Có thể upload file?
- [ ] Microphone hoạt động?

Nếu tất cả OK → Sẵn sàng deploy! 🚀

---

## 🚀 Deploy lên Vercel

**5 bước**:

1. Tạo GitHub account: https://github.com/signup
2. Upload code lên GitHub (dùng GitHub Desktop)
3. Tạo Vercel account: https://vercel.com
4. Import GitHub project vào Vercel
5. Thêm `GEMINI_API_KEY` vào Environment Variables

→ Xem chi tiết: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 📚 Các file hướng dẫn

| File | Mô tả |
|------|--------|
| [README.md](README.md) | Tổng quan dự án |
| [TEST_GUIDE.md](TEST_GUIDE.md) | Test từng tính năng |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Deploy lên Vercel/Docker |
| [SECURITY.md](SECURITY.md) | Giữ API key an toàn |
| [QUICK_START.md](QUICK_START.md) | File này 🎯 |

---

## 🆘 Nếu gặp lỗi

### Lỗi: "npm: command not found"
→ Chưa cài Node.js, tải từ nodejs.org

### Lỗi: "GEMINI_API_KEY not configured"
→ Kiểm tra file `.env.local` có API key không

### Lỗi khác
→ Xem [TEST_GUIDE.md](TEST_GUIDE.md) phần "Khắc phục lỗi"

---

## 🎯 Checklist trước deploy

- [ ] npm install ✅
- [ ] npm run dev ✅
- [ ] Tất cả tính năng test OK ✅
- [ ] npm run build ✅
- [ ] npm run lint (0 lỗi) ✅
- [ ] Code push lên GitHub ✅
- [ ] GEMINI_API_KEY thêm vào Vercel ✅

---

**Xong! Bạn chỉ cần 3 bước để bắt đầu. Bất kỳ câu hỏi?** 📞
