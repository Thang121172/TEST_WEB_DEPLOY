# 🆓 Hướng Dẫn Deploy Miễn Phí Hoàn Toàn

## ⚠️ Lưu ý quan trọng về "Miễn phí"

Hầu hết các platform "miễn phí" đều có **giới hạn** về tài nguyên và tính năng. Dưới đây là các phương án **thực sự miễn phí** và giới hạn của chúng:

---

## ✅ Phương án 1: Render.com (Khuyến nghị nhất)

### 🎁 Miễn phí gì:
- ✅ **Web Service**: Miễn phí vĩnh viễn
- ✅ **PostgreSQL Database**: Miễn phí vĩnh viễn
- ✅ **Static Site**: Miễn phí vĩnh viễn
- ✅ **SSL/HTTPS**: Miễn phí tự động
- ✅ **Custom Domain**: Miễn phí

### ⚠️ Giới hạn:
- **Web Service**: 
  - Sleep sau 15 phút không có traffic (wake up mất ~30 giây)
  - 750 giờ/tháng (đủ cho 1 service chạy 24/7)
  - RAM: 512MB
  - CPU: 0.1 CPU share
- **Database**:
  - 1GB storage
  - 90 ngày không dùng sẽ bị xóa (có email cảnh báo)
- **Static Site**: 
  - Không giới hạn
  - CDN toàn cầu

### 💡 Có phù hợp không?
- ✅ **CÓ** - Phù hợp cho:
  - Dự án học tập, portfolio
  - Demo, prototype
  - Ứng dụng nhỏ với traffic thấp
- ❌ **KHÔNG** - Nếu cần:
  - Ứng dụng production lớn
  - Không chấp nhận sleep/wake up delay
  - Database > 1GB

### 📝 Cách deploy:
Xem file `DEPLOY_FROM_GITHUB.md` - Phương án 1

---

## ✅ Phương án 2: Vercel (Frontend) + Render (Backend)

### 🎁 Miễn phí gì:
- ✅ **Vercel Frontend**: 
  - Miễn phí vĩnh viễn
  - Không sleep
  - CDN toàn cầu
  - SSL tự động
- ✅ **Render Backend**: Như trên

### ⚠️ Giới hạn:
- **Vercel**:
  - 100GB bandwidth/tháng
  - Build time: 6000 phút/tháng
  - Serverless functions: 100GB-hours/tháng

### 💡 Có phù hợp không?
- ✅ **RẤT PHÙ HỢP** - Kết hợp tốt nhất:
  - Frontend không sleep (Vercel)
  - Backend có thể sleep (Render) - không sao vì frontend vẫn load nhanh

### 📝 Cách deploy:

#### Frontend trên Vercel:
1. Truy cập: https://vercel.com
2. Đăng nhập bằng GitHub
3. **Add New Project** → Chọn repo `Thang121172/WEB_DACN`
4. Cấu hình:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_API_BASE=https://your-backend.onrender.com/api
     ```
5. Click **Deploy**

#### Backend trên Render:
Làm theo hướng dẫn trong `DEPLOY_FROM_GITHUB.md`

---

## ✅ Phương án 3: Netlify (Frontend) + Render (Backend)

### 🎁 Miễn phí gì:
- ✅ **Netlify Frontend**:
  - 100GB bandwidth/tháng
  - 300 build minutes/tháng
  - Không sleep
  - SSL tự động

### ⚠️ Giới hạn:
- Build time: 300 phút/tháng (ít hơn Vercel)

### 💡 Có phù hợp không?
- ✅ **PHÙ HỢP** - Tương tự Vercel nhưng ít build time hơn

---

## ❌ Các platform KHÔNG còn miễn phí:

### Railway.app
- ❌ **Đã bỏ free tier từ tháng 3/2023**
- 💰 Phải trả phí từ $5/tháng

### Heroku
- ❌ **Đã bỏ free tier từ tháng 11/2022**
- 💰 Phải trả phí từ $7/tháng

### DigitalOcean App Platform
- ❌ **Không có free tier**
- 💰 Phải trả phí từ $5/tháng

---

## 🎯 Đề xuất tốt nhất cho bạn:

### **Combo: Vercel (Frontend) + Render (Backend)**

**Lý do:**
1. ✅ **Hoàn toàn miễn phí** - Không cần trả phí gì
2. ✅ **Frontend không sleep** - Trải nghiệm người dùng tốt
3. ✅ **Backend có thể sleep** - Không sao, wake up nhanh
4. ✅ **SSL tự động** - Bảo mật tốt
5. ✅ **Deploy dễ dàng** - Từ GitHub tự động

**Giới hạn:**
- Backend sleep sau 15 phút không dùng (wake up ~30s)
- Database 1GB (đủ cho dự án nhỏ/trung bình)
- Frontend 100GB bandwidth/tháng (rất nhiều)

---

## 📋 So sánh nhanh:

| Platform | Free? | Sleep? | Database Free? | Phù hợp cho |
|----------|-------|--------|----------------|-------------|
| **Render** | ✅ | ⚠️ Có | ✅ 1GB | Backend + DB |
| **Vercel** | ✅ | ❌ Không | ❌ Không | Frontend |
| **Netlify** | ✅ | ❌ Không | ❌ Không | Frontend |
| **Railway** | ❌ | - | - | Phải trả phí |
| **Heroku** | ❌ | - | - | Phải trả phí |

---

## 🚀 Hướng dẫn deploy combo miễn phí:

### Bước 1: Deploy Backend lên Render
1. Đọc `DEPLOY_FROM_GITHUB.md` - Phương án 1
2. Deploy backend + database lên Render
3. Lưu lại URL backend: `https://fastfood-backend.onrender.com`

### Bước 2: Deploy Frontend lên Vercel
1. Truy cập: https://vercel.com
2. Đăng nhập bằng GitHub
3. **Add New Project**
4. Chọn repository: `Thang121172/WEB_DACN`
5. Cấu hình:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```
6. **Environment Variables**:
   ```
   VITE_API_BASE=https://fastfood-backend.onrender.com/api
   ```
7. Click **Deploy**

### Bước 3: Cập nhật CORS trong Backend
Vào Render → Backend service → Environment Variables:
```
CORS_ORIGINS=https://your-frontend.vercel.app
```

### ✅ Xong! Bạn có:
- Frontend: `https://your-frontend.vercel.app` (không sleep)
- Backend: `https://fastfood-backend.onrender.com` (có thể sleep)
- Database: PostgreSQL trên Render (1GB free)

---

## 💡 Tips để tránh Backend sleep:

1. **Dùng Uptime Robot** (miễn phí):
   - Đăng ký: https://uptimerobot.com
   - Tạo monitor ping backend mỗi 5 phút
   - Backend sẽ không bao giờ sleep

2. **Dùng cron-job.org** (miễn phí):
   - Tạo cron job ping backend mỗi 10 phút
   - Tương tự Uptime Robot

---

## 📊 Tổng kết:

### ✅ **HOÀN TOÀN MIỄN PHÍ** với:
- **Render.com** (Backend + Database)
- **Vercel** hoặc **Netlify** (Frontend)
- **Uptime Robot** (Giữ backend không sleep)

### 💰 **Tổng chi phí: $0/tháng**

### ⚠️ **Giới hạn:**
- Backend có thể chậm khi wake up (nếu không dùng Uptime Robot)
- Database 1GB (đủ cho dự án nhỏ/trung bình)
- Frontend 100GB bandwidth/tháng (rất nhiều)

---

**Kết luận: Bạn có thể deploy hoàn toàn miễn phí với Render + Vercel! 🎉**

