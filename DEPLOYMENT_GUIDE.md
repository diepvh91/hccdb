# 📚 HƯỚNG DẪN DEPLOY TRÊN VERCEL

## 🎯 Tổng quan
Ứng dụng của bạn sẽ được deploy trên **Vercel** - một nền tảng hosting MIỄN PHÍ cho ứng dụng web.

---

## 📋 CHUẨN BỊ TRƯỚC KHI DEPLOY

### Bước 1: Tạo tài khoản GitHub (Nếu chưa có)
1. Truy cập: https://github.com/signup
2. Điền email, password, username
3. Xác nhận email

### Bước 2: Tạo Repository GitHub
1. Đăng nhập GitHub: https://github.com/login
2. Click nút **"+"** → **"New repository"**
3. Đặt tên: `ai-assistant-hcc` (hoặc tên bất kỳ)
4. Chọn **Public** (để Vercel có thể truy cập)
5. Bỏ tích "Add a README file"
6. Click **"Create repository"**

### Bước 3: Upload code lên GitHub

**Dùng GitHub Desktop (Dễ nhất)**:
1. Tải GitHub Desktop: https://desktop.github.com/
2. Mở GitHub Desktop → Click "Clone a Repository"
3. Tìm repository vừa tạo
4. Chọn thư mục: `d:\Claude code\HCC`
5. Click Clone
6. Mở folder → Copy toàn bộ code từ dự án vào
7. GitHub Desktop sẽ tự detect thay đổi
8. Viết message: `Initial commit`
9. Click **"Commit to main"**
10. Click **"Publish branch"**

**HOẶC dùng Command Line (Nếu quen)**:
```bash
cd "d:\Claude code\HCC"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-assistant-hcc.git
git push -u origin main
```

---

## 🚀 DEPLOY LÊN VERCEL

### Bước 1: Tạo tài khoản Vercel
1. Truy cập: https://vercel.com/signup
2. Click **"Continue with GitHub"**
3. Authorize Vercel để truy cập GitHub

### Bước 2: Import Project
1. Trên trang Vercel → Click **"Add New..."** → **"Project"**
2. Tìm repository `ai-assistant-hcc`
3. Click **"Import"**

### Bước 3: Cấu hình Environment Variables
1. Dùng form "Environment Variables"
2. Thêm biến:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Dán API key của bạn (từ AI Studio)
3. Chọn **"Production"**
4. Click **"Add"**

### Bước 4: Deploy
1. Click **"Deploy"**
2. Chờ ~5 phút (lần đầu lâu hơn)
3. Khi thấy ✅ "Congratulations!", deploy thành công!
4. Click **"Visit"** để xem ứng dụng

---

## ✅ KIỂM TRA SAU DEPLOY

1. Truy cập URL được cung cấp (ví dụ: `https://ai-assistant-hcc.vercel.app`)
2. Kiểm tra các chức năng:
   - ✅ Admin Dashboard có load được không?
   - ✅ Có thể tạo đơn vị mới không?
   - ✅ Chat có hoạt động không?
   - ✅ Có thể upload file không?

---

## 🚨 KHẮC PHỤC LỖI THƯỜNG GẶP

### ❌ Lỗi: "GEMINI_API_KEY is not configured"
**Nguyên nhân**: Quên thêm environment variable
**Giải pháp**:
1. Vào Vercel Dashboard
2. Project → Settings → Environment Variables
3. Thêm `GEMINI_API_KEY`
4. Redeploy (Click Deploy button)

### ❌ Lỗi: "Build failed"
**Nguyên nhân**: Code có lỗi hoặc dependencies không cài đặt
**Giải pháp**:
1. Chạy `npm install` trên máy local
2. Chạy `npm run lint` để kiểm tra lỗi
3. Fix lỗi nếu có
4. Commit và push lên GitHub
5. Vercel sẽ tự deploy lại

### ❌ Lỗi: "Database locked"
**Nguyên nhân**: SQLite không support well trên Vercel
**Giải pháp**: Sẽ migrate sang PostgreSQL sau (tạm thời không cần lo)

---

## 📱 CẬP NHẬT KHI CÓ THAY ĐỔI CODE

Muốn update ứng dụng trên Vercel:
1. Sửa code local
2. Commit: `git commit -am "Update message"`
3. Push: `git push`
4. Vercel tự động deploy lại ✅

---

## 🖥️ DEPLOY TRÊN HOST RIÊNG (Docker)

Khi muốn chạy trên VPS Linode / DigitalOcean:

### Chuẩn bị:
1. Thuê VPS (Ubuntu 20.04+)
2. Cài Docker: `curl -fsSL https://get.docker.com | sh`
3. Cài Docker Compose: `apt-get install docker-compose`

### Deploy:
```bash
# SSH vào VPS
ssh root@your_vps_ip

# Clone code
git clone https://github.com/YOUR_USERNAME/ai-assistant-hcc.git
cd ai-assistant-hcc

# Tạo .env file
cat > .env << EOF
GEMINI_API_KEY=your_actual_key_here
NODE_ENV=production
PORT=3000
EOF

# Chạy Docker
docker-compose up -d

# Xem logs
docker-compose logs -f
```

### Cấu hình Domain:
1. Mua domain (GoDaddy, Namecheap, ...)
2. DNS pointing đến VPS IP
3. Cài SSL (Let's Encrypt):
```bash
apt-get install certbot nginx-certbot
certbot certonly --standalone -d your-domain.com
```

---

## 📞 CẦN GIÚP?

- **Vercel Support**: https://vercel.com/support
- **Docker Guide**: https://docs.docker.com/
- **GitHub Guide**: https://docs.github.com/

**Chúc bạn deploy thành công! 🎉**
