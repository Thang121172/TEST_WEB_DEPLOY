# 🚀 Hướng Dẫn Deploy Từ GitHub Repository

**Repository của bạn**: https://github.com/Thang121172/WEB_DACN

## 📋 Phương án 1: Render.com (Khuyến nghị - Miễn phí)

### Bước 1: Đăng ký Render
1. Truy cập: https://render.com
2. Đăng ký/Đăng nhập bằng GitHub
3. Kết nối repository: **Thang121172/WEB_DACN**

### Bước 2: Deploy Backend

#### Cách A: Sử dụng Render Blueprint (Tự động)
1. Vào Dashboard → **New +** → **Blueprint**
2. Connect repository: `Thang121172/WEB_DACN`
3. Render sẽ tự động detect file `backend/render.yaml`
4. Click **Apply** để deploy tự động

#### Cách B: Deploy thủ công
1. **New +** → **PostgreSQL**
   - Name: `fastfood-db`
   - Plan: Free
   - Region: Singapore (gần Việt Nam nhất)
   - Click **Create Database**
   - Lưu lại **Internal Database URL**

2. **New +** → **Web Service**
   - Connect repository: `Thang121172/WEB_DACN`
   - Name: `fastfood-backend`
   - Environment: **Python 3**
   - Region: Singapore
   - Branch: `main`
   - Root Directory: `backend`
   - Build Command:
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --noinput
     ```
   - Start Command:
     ```bash
     gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
     ```
   - Plan: Free

3. **Environment Variables**:
   ```
   DJANGO_SETTINGS_MODULE=core.settings.prod
   SECRET_KEY=<tạo một key mạnh, ví dụ: python -c "import secrets; print(secrets.token_urlsafe(50))">
   DATABASE_URL=<Internal Database URL từ PostgreSQL service>
   ALLOWED_HOSTS=fastfood-backend.onrender.com
   CORS_ORIGINS=https://fastfood-frontend.onrender.com
   DEBUG=False
   ```

4. Click **Create Web Service**

### Bước 3: Deploy Frontend

1. **New +** → **Static Site**
   - Connect repository: `Thang121172/WEB_DACN`
   - Name: `fastfood-frontend`
   - Branch: `main`
   - Root Directory: `frontend`
   - Build Command:
     ```bash
     npm install && npm run build
     ```
   - Publish Directory: `dist`
   - Environment Variables:
     ```
     VITE_API_BASE=https://fastfood-backend.onrender.com/api
     ```

2. Click **Create Static Site**

### Bước 4: Chạy Migrations & Tạo Superuser

1. Vào Backend service → **Shell**
2. Chạy migrations:
   ```bash
   python manage.py migrate
   ```
3. Tạo superuser:
   ```bash
   python manage.py createsuperuser
   ```
4. (Tùy chọn) Seed demo data:
   ```bash
   python manage.py seed_demo
   ```

### ✅ URLs sau khi deploy:
- **Backend**: `https://fastfood-backend.onrender.com`
- **Frontend**: `https://fastfood-frontend.onrender.com`
- **Admin**: `https://fastfood-backend.onrender.com/admin/`
- **API Docs**: `https://fastfood-backend.onrender.com/swagger/`

---

## 📋 Phương án 2: Railway.app

### Bước 1: Đăng ký Railway
1. Truy cập: https://railway.app
2. Đăng nhập bằng GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Chọn repository: `Thang121172/WEB_DACN`

### Bước 2: Thêm Services

1. **Add PostgreSQL**:
   - Railway tự động tạo database
   - Lưu lại connection string

2. **Add Backend Service**:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - Start Command: `gunicorn core.wsgi:application`
   - Environment Variables:
     ```
     DJANGO_SETTINGS_MODULE=core.settings.prod
     SECRET_KEY=<tạo key mạnh>
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     ALLOWED_HOSTS=${{Railway.PUBLIC_DOMAIN}}
     CORS_ORIGINS=${{Railway.PUBLIC_DOMAIN}}
     DEBUG=False
     ```

3. **Add Frontend Service**:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s dist`
   - Environment Variables:
     ```
     VITE_API_BASE=${{Backend.PUBLIC_DOMAIN}}/api
     ```

---

## 📋 Phương án 3: VPS với Docker

### Bước 1: Chuẩn bị VPS
```bash
# SSH vào VPS
ssh root@your-server-ip

# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y
```

### Bước 2: Clone Repository
```bash
cd /opt
git clone https://github.com/Thang121172/WEB_DACN.git fastfood
cd fastfood
```

### Bước 3: Cấu hình Environment
```bash
# Copy file env mẫu
cp env.production.example .env

# Chỉnh sửa .env
nano .env
```

### Bước 4: Deploy
```bash
# Chạy script deploy
chmod +x deploy.sh
./deploy.sh
```

---

## 🔧 Cập nhật Repository

Sau khi deploy, nếu cần cập nhật:

```bash
# Trên máy local
git add .
git commit -m "Update code"
git push origin main

# Render/Railway sẽ tự động rebuild
# VPS: SSH vào và chạy git pull + ./deploy.sh
```

---

## 📝 Checklist trước khi deploy:

- [x] Code đã push lên GitHub: https://github.com/Thang121172/WEB_DACN
- [ ] `SECRET_KEY` mạnh và bảo mật
- [ ] `DEBUG=False` trong production
- [ ] `ALLOWED_HOSTS` đúng domain
- [ ] `CORS_ORIGINS` đúng frontend URL
- [ ] Database password mạnh
- [ ] Test local trước khi deploy

---

## 🆘 Troubleshooting

### Lỗi "Module not found: core.wsgi"
- Đảm bảo Root Directory là `backend` trong Render/Railway
- Hoặc dùng `cd backend &&` trong build/start commands

### Lỗi Database connection
- Kiểm tra `DATABASE_URL` đúng format
- Kiểm tra firewall không chặn port database

### Frontend không kết nối được Backend
- Kiểm tra `VITE_API_BASE` đúng backend URL
- Kiểm tra CORS settings trong backend

---

**Chúc bạn deploy thành công! 🎉**

