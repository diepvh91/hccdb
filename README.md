# 🤖 AI HCC - Hệ Thống Trợ Lý Ảo Thông Minh

Ứng dụng **AI Assistant** hoàn chỉnh với giao diện đẹp, khả năng chat thông minh, nhận diện giọng nói, và text-to-speech.

## 🌟 Tính năng chính

✅ **Admin Dashboard**: Quản lý nhiều đơn vị khác nhau  
✅ **Chat AI thông minh**: Trả lời dựa trên nội dung huấn luyện  
✅ **Nhận diện giọng nói**: Nói để chat (Voice-to-Text)  
✅ **Phát âm tự động**: AI tự phát âm câu trả lời (Text-to-Speech)  
✅ **Upload tài liệu**: Hỗ trợ ảnh, video, PDF  
✅ **Responsive Design**: Chạy tốt trên mobile & desktop  

---

## 📚 Hướng dẫn nhanh

### 🚀 Chạy ứng dụng cục bộ (Local)

1. **Cài Node.js** → https://nodejs.org/ (tải LTS version)

2. **Tạo file .env.local**:
```bash
GEMINI_API_KEY=your_actual_api_key_here
PORT=3000
NODE_ENV=development
```

3. **Cài dependencies**:
```bash
npm install
```

4. **Chạy ứng dụng**:
```bash
npm run dev
```

5. **Mở trình duyệt**: http://localhost:3000

### 📝 Xem hướng dẫn chi tiết

- **🧪 Test locally**: Xem file [TEST_GUIDE.md](TEST_GUIDE.md)
- **🚀 Deploy lên Vercel**: Xem file [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 🏗️ Cấu trúc dự án

```
HCC/
├── src/                    # Code React
│   ├── App.tsx            # Component chính
│   ├── main.tsx           # Entry point
│   ├── index.css          # Style
│   └── services/
│       └── gemini.ts      # Gọi Gemini API
├── server.ts              # Backend Express
├── index.html             # HTML template
├── vite.config.ts         # Cấu hình Vite
├── tsconfig.json          # Cấu hình TypeScript
├── package.json           # Dependencies
├── Dockerfile             # Cấu hình Docker
├── docker-compose.yml     # Docker Compose
├── vercel.json            # Cấu hình Vercel
├── .env.example           # Template environment
├── .env.local             # Environment thực tế
└── database.db            # SQLite database
```

---

## 📋 Các lệnh hữu ích

```bash
# Cài dependencies
npm install

# Chạy dev server
npm run dev

# Build production
npm run build

# Xem preview build
npm run preview

# Kiểm tra lỗi TypeScript
npm run lint

# Clean build files
npm run clean
```

---

## 🔒 Bảo mật

- **API Key**: Lưu trong `.env.local`, KHÔNG commit lên GitHub
- **Database**: Tự động backup khi deploy
- **SSL/HTTPS**: Vercel tự động bảo mật

---

## 💻 Stack công nghệ

- **Frontend**: React 19, Tailwind CSS, Lucide Icons, Motion
- **Backend**: Express.js, SQLite
- **AI**: Google Gemini API (2.5 Flash)
- **Hosting**: Vercel (frontend), Docker (backend riêng)
- **Build**: Vite, TypeScript

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:

1. Kiểm tra file `TEST_GUIDE.md` xem có giải pháp không
2. Xem logs: Mở DevTools (F12) → Console tab
3. Kiểm tra API key có đúng không
4. Restart server: Bấm Ctrl+C, chạy lại `npm run dev`

---

## 📜 License

Apache 2.0 License

---

**Chúc bạn thành công! 🚀**
