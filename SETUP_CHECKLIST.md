# ✅ SETUP CHECKLIST - Kiểm tra chuẩn bị

Dùng checklist này để đảm bảo tất cả đã sẵn sàng trước deploy.

---

## 📋 Phase 1: Chuẩn bị local (Local Preparation)

- [ ] **Node.js đã cài?**
  - Mở Command Prompt: `node --version` (phải ≥ 18.0.0)
  
- [ ] **API Key đã có?**
  - Lấy từ https://ai.google.dev/aistudio/apikeys
  - Có key dạng: `AIzaSy...`

- [ ] **Project folder đúng chưa?**
  - Path: `d:\Claude code\HCC`
  - Có file: `server.ts`, `src/`, `package.json`

- [ ] **File .env.local đã tạo?**
  - Vị trí: `d:\Claude code\HCC\.env.local`
  - Nội dung:
    ```
    GEMINI_API_KEY=your_actual_key
    PORT=3000
    NODE_ENV=development
    ```

---

## 📋 Phase 2: Chạy Local (Run Locally)

- [ ] **npm install thành công?**
  - Chạy: `npm install`
  - Kết quả: Folder `node_modules/` được tạo
  - Không có lỗi (warning OK)

- [ ] **npm run dev chạy OK?**
  - Thấy dòng: "Local: http://localhost:3000"
  - Không có lỗi

- [ ] **Website load được?**
  - Mở: http://localhost:3000
  - Thấy giao diện Admin Dashboard

---

## 📋 Phase 3: Test Tính Năng (Test Features)

- [ ] **Admin Dashboard hoạt động?**
  - [ ] Thấy danh sách đơn vị
  - [ ] Nút "Thêm đơn vị mới" hoạt động
  - [ ] Có thể tạo đơn vị mới

- [ ] **Chat hoạt động?**
  - [ ] Chọn đơn vị
  - [ ] Nhập tin nhắn
  - [ ] AI trả lời (check console nếu có lỗi)

- [ ] **Upload file?**
  - [ ] Chỉnh sửa đơn vị
  - [ ] Upload ảnh < 30MB
  - [ ] Upload video < 30MB
  - [ ] Upload PDF < 30MB

- [ ] **Microphone hoạt động?**
  - [ ] Click nút mic (🎤)
  - [ ] Cho phép access microphone
  - [ ] Nói gì đó
  - [ ] Text được điền vào input

- [ ] **Text-to-speech hoạt động?**
  - [ ] Chat với AI
  - [ ] Nghe thấy âm thanh AI trả lời
  - [ ] Có nút mute/volume control

---

## 📋 Phase 4: Build & Lint (Quality Check)

- [ ] **npm run lint thành công?**
  - Chạy: `npm run lint`
  - Kết quả: 0 lỗi (có thể có warning)

- [ ] **npm run build thành công?**
  - Chạy: `npm run build`
  - Folder `dist/` được tạo
  - File `dist/index.html` tồn tại
  - Kích thước < 10MB

- [ ] **npm run preview hoạt động?**
  - Chạy: `npm run preview`
  - Mở: http://localhost:4173
  - Website load đúng

---

## 📋 Phase 5: Git & GitHub (Preparation for Deployment)

- [ ] **Git đã cài?**
  - Mở Command Prompt: `git --version`
  - Hoặc cài GitHub Desktop: https://desktop.github.com/

- [ ] **GitHub account đã tạo?**
  - https://github.com/signup
  - Email verified

- [ ] **Repository đã tạo?**
  - Tên: `ai-assistant-hcc` (hoặc tên bất kỳ)
  - Privacy: **Public**
  - URL: `https://github.com/YOUR_USERNAME/ai-assistant-hcc`

- [ ] **Code đã push lên GitHub?**
  - Dùng GitHub Desktop hoặc CLI
  - Thấy code trên GitHub website

- [ ] **File `.env.local` KHÔNG trong Git?**
  - Mở `https://github.com/YOUR_USERNAME/ai-assistant-hcc`
  - KHÔNG thấy file `.env.local`
  - (File `.gitignore` đã chặn nó)

---

## 📋 Phase 6: Vercel Setup (Ready to Deploy)

- [ ] **Vercel account đã tạo?**
  - https://vercel.com/signup
  - Authorize GitHub

- [ ] **Project imported vào Vercel?**
  - Import repository từ GitHub
  - Vercel tìm thấy project

- [ ] **Environment variable đã thêm?**
  - Vào Settings → Environment Variables
  - Thêm: `GEMINI_API_KEY=your_actual_key`
  - Select: **Production**

- [ ] **Deploy thành công?**
  - Click "Deploy" button
  - Thấy: ✅ "Congratulations"
  - Có URL dạng: `https://ai-assistant-hcc.vercel.app`

---

## 📋 Phase 7: Production Test (Final Check)

- [ ] **Website load từ Vercel?**
  - Mở URL từ Vercel
  - Giao diện hiển thị đúng

- [ ] **Admin Dashboard hoạt động trên Vercel?**
  - Tạo đơn vị mới
  - Upload file
  - Kiểm tra dữ liệu lưu được

- [ ] **Chat hoạt động trên Vercel?**
  - Chat với AI
  - Nghe thấy phát âm

- [ ] **Không có lỗi 404 hoặc 500?**
  - Mở DevTools (F12)
  - Console tab: Không có lỗi đỏ

---

## 📋 Phase 8: Production Monitoring (Ongoing)

- [ ] **Theo dõi chi phí Gemini**
  - Lên https://console.cloud.google.com
  - Kiểm tra Billing hàng tuần

- [ ] **Backup database**
  - Nếu dùng Docker, backup folder `/data/`
  - Nếu dùng Vercel, cần migrate sang PostgreSQL

- [ ] **Kiểm tra logs**
  - Vercel: Deployment tab → Logs
  - Docker: `docker logs container_name`

---

## 🎉 XÀ HOÀN TOÀN!

Nếu tất cả checkbox ✅, bạn đã:
- ✅ Setup local xong
- ✅ Test tất cả tính năng
- ✅ Build & deploy thành công
- ✅ Sẵn sàng production

### Tiếp theo là gì?

1. **Monitor ứng dụng** - Kiểm tra hàng tuần
2. **Backup dữ liệu** - Tự động backup database
3. **Update code** - Thêm tính năng mới khi cần
4. **Scale lên** - Migrate sang PostgreSQL nếu dữ liệu lớn

---

**Chúc mừng bạn! 🎉 Ứng dụng đã sẵn sàng sản xuất!**

Có câu hỏi? Xem lại các file hướng dẫn:
- [README.md](README.md)
- [QUICK_START.md](QUICK_START.md)
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- [TEST_GUIDE.md](TEST_GUIDE.md)
- [SECURITY.md](SECURITY.md)
