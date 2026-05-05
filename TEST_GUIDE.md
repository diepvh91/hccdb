# 🧪 HƯỚNG DẪN TEST TRƯỚC KHI DEPLOY

## Bước 1: Chuẩn bị môi trường local

### 1.1 Cài đặt Node.js (Nếu chưa có)
1. Truy cập: https://nodejs.org/
2. Download **LTS** version (18.x hoặc 20.x)
3. Cài đặt bằng installer
4. Mở Command Prompt, kiểm tra:
```bash
node --version
npm --version
```

### 1.2 Tạo file .env.local
1. Tạo file `d:\Claude code\HCC\.env.local`
2. Thêm nội dung:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3000
NODE_ENV=development
```
**Lưu ý**: Thay `your_actual_gemini_api_key_here` với API key thực tế!

---

## Bước 2: Cài đặt dependencies

Mở Command Prompt, chạy lệnh:
```bash
cd "d:\Claude code\HCC"
npm install
```

Chờ khoảng 2-5 phút để tải dependencies...

---

## Bước 3: Chạy ứng dụng local

### Bước 3a: Chạy Development Server
```bash
npm run dev
```

Bạn sẽ thấy:
```
✅ vite v6.x.x  ready in xxx ms

➜  Local:   http://localhost:3000
```

### Bước 3b: Mở trình duyệt
1. Nhập địa chỉ: `http://localhost:3000`
2. Ứng dụng sẽ load

---

## Bước 4: Test các tính năng

### ✅ Test Admin Dashboard
1. **Tạo đơn vị mới**:
   - Click "Thêm đơn vị mới"
   - Điền:
     - Subdomain: `test-unit`
     - Tên đơn vị: `Đơn vị test`
     - Tiêu đề: `Test title`
   - Click "Lưu đơn vị"
   - Kiểm tra: Đơn vị mới xuất hiện trong danh sách ✅

2. **Upload file**:
   - Click chỉnh sửa đơn vị
   - Click "Chọn ảnh" → Chọn file ảnh (< 30MB)
   - Xem preview ✅

3. **Chỉnh sửa đơn vị**:
   - Thay đổi thông tin
   - Click "Lưu"
   - Kiểm tra lưu thành công ✅

### ✅ Test Chat Interface
1. Chọn một đơn vị từ danh sách chính
2. **Kiểm tra chat**:
   - Nhập tin nhắn: "Xin chào"
   - Bấm Enter
   - Kiểm tra AI trả lời ✅

3. **Kiểm tra microphone**:
   - Click nút 🎤 (mic icon)
   - Nói một cái gì đó
   - Kiểm tra text input được điền ✅

4. **Kiểm tra text-to-speech**:
   - Chat với AI
   - AI sẽ tự động phát âm
   - Kiểm tra âm thanh phát ra ✅

---

## Bước 5: Kiểm tra hiệu suất

### 5.1 Test Database
Mở Command Prompt (folder project):
```bash
npm run lint
```
Kiểm tra:
- Không có lỗi TypeScript ✅
- Không có warning ✅

### 5.2 Test Build
```bash
npm run build
```

Kiểm tra:
- ✅ Build thành công (không có lỗi)
- ✅ Folder `dist/` được tạo ra
- ✅ Có file `dist/index.html`

### 5.3 Test Preview
```bash
npm run preview
```

Mở `http://localhost:4173` để xem ứng dụng production version:
- ✅ Giao diện hiển thị đúng
- ✅ Tất cả chức năng hoạt động

---

## Bước 6: Kiểm tra database

1. Tìm file `database.db` trong thư mục project
2. Kiểm tra kích thước (nên < 100MB)
3. Xóa file này nếu muốn reset dữ liệu

---

## 📋 Checklist trước Deploy

Kiểm tra tất cả những điều này trước khi deploy lên Vercel:

- [ ] ✅ Chạy `npm install` thành công
- [ ] ✅ Chạy `npm run dev` thành công
- [ ] ✅ Admin Dashboard load được
- [ ] ✅ Tạo đơn vị mới thành công
- [ ] ✅ Chat hoạt động
- [ ] ✅ Upload file không bị lỗi
- [ ] ✅ Chạy `npm run build` thành công
- [ ] ✅ Chạy `npm run lint` không có lỗi
- [ ] ✅ Đã commit code lên GitHub

---

## 🚨 Nếu có lỗi?

### Lỗi: "npm: command not found"
**Giải pháp**: Chưa cài Node.js, tải từ https://nodejs.org/

### Lỗi: "GEMINI_API_KEY is not configured"
**Giải pháp**: Kiểm tra file `.env.local` đã được tạo và có API key chưa

### Lỗi: "Port 3000 already in use"
**Giải pháp**: 
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# macOS/Linux
lsof -i :3000
kill -9 [PID_NUMBER]
```

### Lỗi: "Can't find module"
**Giải pháp**: Chạy lại `npm install`

---

## 📞 Khi test xong

Nếu tất cả test passed ✅, bạn sẵn sàng deploy!

Xem file `DEPLOYMENT_GUIDE.md` để hướng dẫn deploy lên Vercel.

**Chúc test thành công! 🎉**
