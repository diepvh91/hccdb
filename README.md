# Trợ lý ảo AI - HCC

Hệ thống trợ lý ảo AI hỗ trợ tra cứu thủ tục hành chính, sử dụng Google Gemini API.

## Yêu cầu

- Node.js 18+
- Google API Key (Gemini + Cloud Text-to-Speech)

## Cài đặt

```bash
npm install
```

## Cấu hình API Key

### Bước 1: Tạo Google API Key

1. Truy cập [Google AI Studio](https://aistudio.google.com/apikey)
2. Đăng nhập bằng tài khoản Google
3. Nhấn **"Create API Key"**
4. Chọn project hoặc tạo project mới
5. Copy API Key vừa tạo

### Bước 2: Bật Google Cloud Text-to-Speech API

API Key cần được bật thêm dịch vụ Text-to-Speech để trợ lý có thể phát giọng nói:

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project tương ứng với API Key ở Bước 1
3. Vào **APIs & Services > Library**
4. Tìm **"Cloud Text-to-Speech API"**
5. Nhấn **"Enable"**

### Bước 3: Cấu hình cho môi trường local

Tạo file `.env.local` trong thư mục gốc:

```env
GEMINI_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=development

TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_turso_token
```

Thay `your_api_key_here` bằng API Key từ Bước 1.

### Bước 4: Cấu hình cho Vercel (production)

1. Truy cập [Vercel Dashboard](https://vercel.com/) > chọn project
2. Vào **Settings > Environment Variables**
3. Thêm hoặc cập nhật biến:

| Tên biến | Giá trị |
|---|---|
| `GEMINI_API_KEY` | API Key từ Bước 1 |
| `TURSO_DATABASE_URL` | URL database Turso |
| `TURSO_AUTH_TOKEN` | Auth token Turso |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob (nếu dùng upload file) |

4. Nhấn **Save**
5. Vào tab **Deployments** > nhấn **Redeploy** để áp dụng key mới

## Thay đổi API Key khi hết hạn hoặc bị lỗi

Nếu gặp lỗi `401`, `403`, hoặc `API key not valid`, làm theo các bước sau:

### Local

1. Mở file `.env.local`
2. Thay giá trị `GEMINI_API_KEY` bằng key mới
3. Khởi động lại server: `npm run dev`

### Vercel (production)

1. Vào **Vercel Dashboard > Settings > Environment Variables**
2. Tìm `GEMINI_API_KEY` > nhấn **Edit**
3. Dán API Key mới > **Save**
4. Vào **Deployments** > **Redeploy** (chọn bản deploy mới nhất)

## Chạy ứng dụng

```bash
# Development
npm run dev

# Build production
npm run build
```

## Cập nhật tài liệu thủ tục hành chính

File tài liệu nằm tại `public/data/knowledge_base.md`. Để cập nhật:

1. Thay nội dung file `public/data/knowledge_base.md` bằng tài liệu mới
2. Build lại: `npm run build`
3. Deploy lên Vercel: `vercel --prod`

## Cấu trúc dự án

```
├── api/index.ts           # Vercel serverless API
├── server.ts              # Express dev server
├── src/
│   ├── App.tsx            # Giao diện chính (React)
│   ├── services/
│   │   └── gemini.ts      # Gemini API (chat + TTS)
│   └── main.tsx           # Entry point
├── public/
│   └── data/
│       └── knowledge_base.md  # Tài liệu thủ tục hành chính
├── .env.local             # Biến môi trường (local, không commit)
└── vercel.json            # Cấu hình Vercel
```
