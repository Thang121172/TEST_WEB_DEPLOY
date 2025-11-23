# 🚀 Hướng Dẫn Deploy Từng Bước: Vercel + Render

**Repository của bạn**: https://github.com/Thang121172/WEB_DACN

---

## 📋 Bước 1: Chuẩn bị Repository

### 1.1. Đảm bảo code đã push lên GitHub

```bash
# Kiểm tra xem có thay đổi chưa commit không
git status

# Nếu có thay đổi, commit và push
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 1.2. Kiểm tra các file quan trọng

Đảm bảo các file sau tồn tại:
- ✅ `backend/render.yaml` (cho Render)
- ✅ `backend/core/settings/prod.py` (settings production)
- ✅ `frontend/vite.config.ts` (config Vite)
- ✅ `frontend/package.json` (dependencies)

---

## 📋 Bước 2: Deploy Backend lên Render

### 2.1. Đăng ký/Đăng nhập Render

1. Truy cập: **https://render.com**
2. Click **Get Started for Free**
3. Chọn **Sign up with GitHub**
4. Authorize Render để truy cập GitHub

### 2.2. Tạo PostgreSQL Database

1. Trong Dashboard, click **New +** → **PostgreSQL**
2. Điền thông tin:
   - **Name**: `fastfood-db`
   - **Database**: `fastfood_db` (hoặc để mặc định)
   - **User**: `fastfood_user` (hoặc để mặc định)
   - **Region**: Chọn **Singapore** (gần Việt Nam nhất)
   - **PostgreSQL Version**: `15` (hoặc mới nhất)
   - **Plan**: **Free**
3. Click **Create Database**
4. ⚠️ **QUAN TRỌNG**: Đợi database khởi động xong (khoảng 1-2 phút)
5. Vào database vừa tạo, copy **Internal Database URL** (sẽ dùng ở bước sau)

### 2.3. Deploy Backend Service

#### Cách A: Sử dụng Render Blueprint (Tự động - Khuyến nghị)

1. Trong Dashboard, click **New +** → **Blueprint**
2. Connect repository: Chọn **Thang121172/WEB_DACN**
3. Render sẽ tự động detect file `backend/render.yaml`
4. Click **Apply** để deploy
5. ⚠️ **Lưu ý**: Nếu có lỗi, xem phần Troubleshooting bên dưới

#### Cách B: Deploy thủ công

1. Trong Dashboard, click **New +** → **Web Service**
2. Connect repository: Chọn **Thang121172/WEB_DACN**
3. Điền thông tin:
   - **Name**: `fastfood-backend`
   - **Region**: **Singapore**
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: **Python 3**
   - **Build Command**:
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --noinput
     ```
   - **Start Command**:
     ```bash
     gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
     ```
   - **Plan**: **Free**

4. **Environment Variables** (click **Advanced** → **Add Environment Variable**):
   ```
   DJANGO_SETTINGS_MODULE = core.settings.prod
   SECRET_KEY = <tạo một key mạnh - xem hướng dẫn bên dưới>
   DATABASE_URL = <paste Internal Database URL từ bước 2.2>
   ALLOWED_HOSTS = fastfood-backend.onrender.com
   CORS_ORIGINS = https://your-frontend.vercel.app
   DEBUG = False
   ```

   **Cách tạo SECRET_KEY mạnh:**
   ```bash
   # Trên máy local, chạy:
   python -c "import secrets; print(secrets.token_urlsafe(50))"
   ```
   Copy kết quả và paste vào `SECRET_KEY`

5. Click **Create Web Service**

### 2.4. Chờ Backend deploy xong

1. Render sẽ tự động build và deploy
2. Quá trình này mất khoảng **5-10 phút**
3. Khi thấy status **Live** (màu xanh) = thành công
4. Copy URL backend: `https://fastfood-backend.onrender.com`

### 2.5. Chạy Migrations

1. Vào Backend service vừa tạo
2. Click tab **Shell** (ở trên cùng)
3. Chạy lệnh:
   ```bash
   python manage.py migrate
   ```
4. Nếu thành công, bạn sẽ thấy:
   ```
   Operations to perform:
     Apply all migrations: ...
   Running migrations:
     ...
   ```

### 2.6. Tạo Superuser (Admin)

1. Vẫn trong **Shell** của Backend service
2. Chạy lệnh:
   ```bash
   python manage.py createsuperuser
   ```
3. Nhập thông tin:
   - Username: `admin` (hoặc tên bạn muốn)
   - Email: `admin@example.com` (hoặc email của bạn)
   - Password: Nhập mật khẩu mạnh (lưu lại để đăng nhập admin sau)

### 2.7. (Tùy chọn) Seed Demo Data

1. Vẫn trong **Shell**
2. Chạy lệnh:
   ```bash
   python manage.py seed_demo
   ```
3. Đợi vài phút để tạo dữ liệu mẫu

### 2.8. Test Backend

1. Mở trình duyệt, truy cập: `https://fastfood-backend.onrender.com/admin/`
2. Đăng nhập với superuser vừa tạo
3. Nếu vào được admin panel = Backend hoạt động tốt! ✅

---

## 📋 Bước 3: Deploy Frontend lên Vercel

### 3.1. Đăng ký/Đăng nhập Vercel

1. Truy cập: **https://vercel.com**
2. Click **Sign Up**
3. Chọn **Continue with GitHub**
4. Authorize Vercel để truy cập GitHub

### 3.2. Tạo Project mới

1. Trong Dashboard, click **Add New...** → **Project**
2. Tìm repository: **Thang121172/WEB_DACN**
3. Click **Import** bên cạnh repository

### 3.3. Cấu hình Project

1. **Project Name**: `fastfood-frontend` (hoặc tên bạn muốn)
2. **Framework Preset**: Chọn **Vite** (hoặc để Vercel tự detect)
3. **Root Directory**: Click **Edit** → Chọn `frontend`
4. **Build and Output Settings**:
   - **Build Command**: `npm run build` (hoặc để mặc định)
   - **Output Directory**: `dist` (hoặc để mặc định)
   - **Install Command**: `npm install` (hoặc để mặc định)

### 3.4. Thêm Environment Variables

1. Scroll xuống phần **Environment Variables**
2. Click **Add** để thêm biến môi trường:
   ```
   Name: VITE_API_BASE
   Value: https://fastfood-backend.onrender.com/api
   ```
   ⚠️ **QUAN TRỌNG**: Thay `fastfood-backend` bằng tên backend service thực tế của bạn trên Render

3. Click **Add** để lưu

### 3.5. Deploy

1. Click **Deploy** (góc dưới bên phải)
2. Vercel sẽ tự động:
   - Install dependencies
   - Build project
   - Deploy lên CDN
3. Quá trình này mất khoảng **2-5 phút**
4. Khi thấy **Congratulations!** = thành công! ✅

### 3.6. Lấy URL Frontend

1. Sau khi deploy xong, bạn sẽ thấy URL frontend
2. URL có dạng: `https://fastfood-frontend.vercel.app`
3. Copy URL này để dùng ở bước tiếp theo

---

## 📋 Bước 4: Cập nhật CORS trong Backend

### 4.1. Quay lại Render

1. Vào Backend service trên Render
2. Click tab **Environment**
3. Tìm biến `CORS_ORIGINS`
4. Click **Edit** (hoặc **Add** nếu chưa có)
5. Cập nhật giá trị:
   ```
   https://fastfood-frontend.vercel.app
   ```
   ⚠️ Thay `fastfood-frontend` bằng tên frontend thực tế của bạn trên Vercel

6. Click **Save Changes**
7. Render sẽ tự động **redeploy** backend (mất 2-3 phút)

---

## 📋 Bước 5: (Tùy chọn) Setup Uptime Robot để tránh Backend sleep

### 5.1. Đăng ký Uptime Robot

1. Truy cập: **https://uptimerobot.com**
2. Click **Sign Up** (miễn phí)
3. Điền thông tin và xác nhận email

### 5.2. Tạo Monitor

1. Sau khi đăng nhập, click **Add New Monitor**
2. Điền thông tin:
   - **Monitor Type**: **HTTP(s)**
   - **Friendly Name**: `FastFood Backend`
   - **URL**: `https://fastfood-backend.onrender.com/health/` (hoặc `/api/`)
   - **Monitoring Interval**: **5 minutes**
3. Click **Create Monitor**

### 5.3. Kết quả

- Uptime Robot sẽ ping backend mỗi 5 phút
- Backend sẽ **không bao giờ sleep** ✅

---

## 📋 Bước 6: Test toàn bộ ứng dụng

### 6.1. Test Frontend

1. Truy cập URL frontend: `https://fastfood-frontend.vercel.app`
2. Kiểm tra:
   - ✅ Trang load được
   - ✅ Có thể đăng ký/đăng nhập
   - ✅ Có thể xem menu
   - ✅ Có thể thêm vào giỏ hàng

### 6.2. Test Backend API

1. Truy cập: `https://fastfood-backend.onrender.com/api/`
2. Hoặc test API docs: `https://fastfood-backend.onrender.com/swagger/`
3. Kiểm tra:
   - ✅ API trả về dữ liệu
   - ✅ Không có lỗi CORS

### 6.3. Test Admin Panel

1. Truy cập: `https://fastfood-backend.onrender.com/admin/`
2. Đăng nhập với superuser
3. Kiểm tra:
   - ✅ Vào được admin panel
   - ✅ Có thể quản lý dữ liệu

---

## 🎉 Hoàn thành!

### URLs của bạn:

- **Frontend**: `https://fastfood-frontend.vercel.app`
- **Backend API**: `https://fastfood-backend.onrender.com`
- **Admin Panel**: `https://fastfood-backend.onrender.com/admin/`
- **API Docs**: `https://fastfood-backend.onrender.com/swagger/`

### Tổng chi phí: **$0/tháng** 🆓

---

## 🆘 Troubleshooting

### Lỗi: "Module not found: core.wsgi"

**Nguyên nhân**: Root Directory không đúng

**Giải pháp**:
1. Vào Backend service trên Render
2. Click **Settings** → **Build & Deploy**
3. Đảm bảo **Root Directory** là `backend`
4. Hoặc sửa Build/Start commands:
   - Build: `cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - Start: `cd backend && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`

### Lỗi: "Database connection failed"

**Nguyên nhân**: DATABASE_URL sai hoặc database chưa sẵn sàng

**Giải pháp**:
1. Kiểm tra DATABASE_URL trong Environment Variables
2. Đảm bảo database đã khởi động xong (status = Available)
3. Thử copy lại Internal Database URL từ database service

### Lỗi: "CORS error" trên Frontend

**Nguyên nhân**: CORS_ORIGINS chưa đúng

**Giải pháp**:
1. Vào Backend service → Environment
2. Kiểm tra CORS_ORIGINS có đúng URL frontend không
3. Đảm bảo có `https://` ở đầu
4. Save và đợi redeploy

### Lỗi: Frontend không kết nối được Backend

**Nguyên nhân**: VITE_API_BASE sai

**Giải pháp**:
1. Vào Frontend project trên Vercel
2. Settings → Environment Variables
3. Kiểm tra VITE_API_BASE có đúng URL backend không
4. Redeploy frontend (Settings → Deployments → Redeploy)

### Backend bị sleep

**Nguyên nhân**: Không có traffic trong 15 phút

**Giải pháp**:
1. Setup Uptime Robot (xem Bước 5)
2. Hoặc chấp nhận delay ~30 giây khi wake up

---

## 📝 Checklist cuối cùng:

- [ ] Backend deploy thành công trên Render
- [ ] Database tạo và kết nối được
- [ ] Migrations chạy thành công
- [ ] Superuser tạo thành công
- [ ] Frontend deploy thành công trên Vercel
- [ ] CORS_ORIGINS đã cập nhật đúng
- [ ] VITE_API_BASE đã set đúng
- [ ] Test frontend hoạt động
- [ ] Test backend API hoạt động
- [ ] Test admin panel hoạt động
- [ ] (Tùy chọn) Uptime Robot đã setup

---

**Chúc bạn deploy thành công! 🎉**

Nếu gặp vấn đề, hãy xem phần Troubleshooting hoặc kiểm tra logs trong Render/Vercel dashboard.

