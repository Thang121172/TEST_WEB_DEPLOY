# Hướng Dẫn Deploy Web trên Vercel

## 📋 Tổng Quan

Vercel là nền tảng phù hợp để deploy **frontend** (React + Vite). Backend Django cần deploy riêng trên nền tảng khác như Render, Railway, hoặc Heroku.

## 🚀 Các Bước Deploy

### Bước 1: Tạo File Cấu Hình Vercel

Đã tạo file `vercel.json` ở root project với cấu hình phù hợp.

### Bước 2: Cấu Hình Project trên Vercel Dashboard

#### Cách 1: Deploy qua Vercel Dashboard (Khuyên dùng)

1. **Đăng nhập Vercel**
   - Truy cập: https://vercel.com
   - Đăng nhập bằng GitHub account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Chọn repository: `Thang121172/TEST_WEB_DEPLOY`
   - Click "Import"

3. **Cấu Hình Build Settings**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (hoặc `npm ci && npm run build`)
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Environment Variables** (Nếu cần)
   - Click "Environment Variables"
   - Thêm các biến môi trường nếu frontend cần:
     ```
     VITE_API_URL=https://your-backend-url.com
     ```

5. **Deploy**
   - Click "Deploy"
   - Chờ build và deploy hoàn tất

#### Cách 2: Deploy bằng Vercel CLI

```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Đăng nhập
vercel login

# Deploy
vercel

# Deploy production
vercel --prod
```

### Bước 3: Cấu Hình Custom Domain (Tùy chọn)

1. Vào project trên Vercel Dashboard
2. Click "Settings" → "Domains"
3. Thêm domain của bạn
4. Cấu hình DNS theo hướng dẫn

## ⚙️ Cấu Hình Chi Tiết

### File `vercel.json` đã được tạo:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Giải thích:**
- `buildCommand`: Lệnh build project (chuyển vào thư mục frontend, install dependencies và build)
- `outputDirectory`: Thư mục chứa files sau khi build (frontend/dist)
- `rewrites`: Rewrite tất cả routes về `/index.html` để React Router hoạt động (xử lý client-side routing)

### Cấu Hình Build trên Vercel Dashboard:

**QUAN TRỌNG:** Nếu deploy lại, cần cấu hình như sau:

1. Vào **Settings** → **General** trong Vercel Dashboard
2. Tìm phần **Build & Development Settings**
3. Cấu hình:
   ```
   Framework Preset: Vite
   Root Directory: (để trống hoặc để là .)
   Build Command: cd frontend && npm install && npm run build
   Output Directory: frontend/dist
   Install Command: cd frontend && npm install
   ```
4. Hoặc đơn giản hơn, chỉ cần set:
   ```
   Root Directory: frontend
   Framework Preset: Vite
   ```
   (Vercel sẽ tự động detect các setting còn lại)

## 🔧 Xử Lý Lỗi 404

Nếu gặp lỗi 404 khi truy cập routes:

1. **Kiểm tra Rewrites trong `vercel.json`** - Đã có sẵn
2. **Kiểm tra React Router** - Đảm bảo sử dụng `BrowserRouter`
3. **Kiểm tra Build Output** - Đảm bảo file `index.html` có trong `dist/`

## 🔄 Auto Deploy

- **Tự động deploy** khi push code lên branch `main`
- **Preview deployments** cho mỗi pull request
- **Instant rollback** nếu có lỗi

## 📝 Lưu Ý Quan Trọng

### Frontend (Deploy trên Vercel):
- ✅ React + Vite
- ✅ Static files
- ✅ Client-side routing

### Backend (Cần deploy riêng):
- ⚠️ Django REST API
- ⚠️ Cần server-side runtime
- 💡 Khuyến nghị: Deploy trên Render, Railway, hoặc Heroku

## 🌐 Cấu Hình API Backend

Sau khi deploy backend, cập nhật URL API trong frontend:

```typescript
// frontend/src/services/http.ts hoặc config
const API_URL = import.meta.env.VITE_API_URL || 'https://your-backend.railway.app';
```

## 📚 Tài Liệu Tham Khảo

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [React Router Deployment](https://reactrouter.com/en/main/start/deploying)

## 🆘 Troubleshooting

### Lỗi Build:
- Kiểm tra `frontend/package.json` có đầy đủ dependencies
- Chạy `npm install` trước khi build
- Kiểm tra log build trên Vercel Dashboard

### Lỗi 404:
- Kiểm tra file `vercel.json` có rewrites đúng
- Kiểm tra `dist/index.html` được tạo sau build
- Clear cache và deploy lại

### Lỗi API Connection:
- Kiểm tra CORS settings trên backend
- Kiểm tra environment variables
- Kiểm tra network requests trong browser console

