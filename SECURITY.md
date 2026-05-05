# 🔒 HƯỚNG DẪN BẢO MẬT

## ⚠️ Quan trọng: API Key của bạn

**GEMINI_API_KEY** là chìa khóa quý giá của bạn. Ai có key này có thể:
- ✅ Dùng API tính phí của bạn
- ✅ Gửi request không giới hạn
- ✅ Chi phí tăng vọt

**MỤC TIÊU**: Giữ key an toàn, KHÔNG share hoặc commit lên GitHub

---

## 📋 Checklist Bảo Mật

### 1️⃣ Giữ .env.local an toàn
✅ **Cần làm**:
- Tạo file `.env.local` trong thư mục project
- Thêm API key vào đây
- KHÔNG share file này

❌ **KHÔNG được làm**:
- Commit `.env.local` lên GitHub
- Gửi `.env.local` qua email
- Share key với người khác

### 2️⃣ Khi deploy lên Vercel
✅ **Cần làm**:
- Thêm GEMINI_API_KEY vào Vercel Environment Variables
- Không đẩy `.env.local` lên GitHub (đã có .gitignore)
- Kiểm tra .gitignore có `.env.local` không

❌ **KHÔNG được làm**:
- Viết API key trực tiếp trong code
- Commit `.env` lên GitHub

### 3️⃣ Nếu key bị leak (vô tình share)
1. **Ngay lập tức**: Xóa key cũ
   - Vào https://ai.google.dev/aistudio/apikeys
   - Delete key bị leak
   
2. **Tạo key mới**:
   - Generate key mới
   - Update Vercel Environment Variables
   - Test lại ứng dụng

---

## 🔐 Cách an toàn nhất

### Khi share project với người khác:
1. **Thêm file này**: `.env.example`
   ```
   # Google Gemini API Key
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   NODE_ENV=development
   ```

2. **Cấp hướng dẫn**: 
   "Tạo file `.env.local`, copy nội dung từ `.env.example`, thay `your_gemini_api_key_here` với key thực tế"

3. **Vercel**: Chỉ admin có quyền xem environment variables

---

## 📊 Giám sát chi phí

### Kiểm tra chi phí Gemini:
1. Vào https://console.cloud.google.com
2. Chọn project
3. Xem "Billing" tab
4. Kiểm tra usage hàng tháng

### Đặt ngân sách:
1. Google Cloud Console → Budgets & Alerts
2. Set limit: ví dụ $50/tháng
3. Sẽ nhận cảnh báo khi sắp hết ngân sách

---

## ⚡ Best Practices

| ✅ Làm | ❌ Không làm |
|-----|---------|
| Lưu key trong .env.local | Viết key trong code |
| Rotate key định kỳ | Share key qua email |
| Dùng Environment Variables | Commit .env lên GitHub |
| Giám sát chi phí | Bỏ qua logs |
| Enable API restrictions | Để key quá hạn |

---

## 🛡️ Nếu xảy ra sự cố

**Lỗi 1**: "401 Unauthorized" 
→ API key sai hoặc hết hạn
→ Tạo key mới trên https://ai.google.dev

**Lỗi 2**: "429 Too Many Requests"
→ Gửi quá nhiều request
→ Đặt rate limit hoặc upgrade plan

**Lỗi 3**: "Key leaked trên GitHub"
1. Xóa key cũ
2. Generate key mới
3. Update Vercel
4. Commit ".env.local" vào .gitignore

---

## 🎓 Học thêm

- [Google Cloud Security](https://cloud.google.com/docs/authentication)
- [Best Practices for API Keys](https://cloud.google.com/docs/authentication/api-keys)
- [12 Factor App - Config](https://12factor.net/config)

**Ghi nhớ: Bảo mật là ưu tiên hàng đầu! 🔒**
