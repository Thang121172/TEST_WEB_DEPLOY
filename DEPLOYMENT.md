# 🚀 Hướng Dẫn Triển Khai FastFood App Online

Tài liệu này hướng dẫn các cách triển khai ứng dụng FastFood lên môi trường production để nhiều người có thể truy cập.

## 📋 Mục Lục

1. [Phương án 1: Render.com (Dễ nhất - Khuyến nghị cho người mới)](#phương-án-1-rendercom)
2. [Phương án 2: VPS với Docker (Linh hoạt nhất)](#phương-án-2-vps-với-docker)
3. [Phương án 3: Railway.app](#phương-án-3-railwayapp)
4. [Phương án 4: DigitalOcean App Platform](#phương-án-4-digitalocean-app-platform)
5. [Cấu hình Domain & SSL](#cấu-hình-domain--ssl)

---

## Phương án 1: Render.com

### ✅ Ưu điểm:
- Miễn phí cho PostgreSQL và Web Service (có giới hạn)
- Tự động SSL/HTTPS
- Dễ deploy, không cần cấu hình server
- Tự động rebuild khi push code

### 📝 Các bước:

#### 1. Chuẩn bị Repository
```bash
# Đảm bảo code đã được push lên GitHub/GitLab
git add .
git commit -m "Prepare for deployment"
git push origin main
```

#### 2. Tạo tài khoản Render
- Truy cập: https://render.com
- Đăng ký bằng GitHub/GitLab

#### 3. Tạo PostgreSQL Database
1. Vào Dashboard → **New +** → **PostgreSQL**
2. Đặt tên: `fastfood-db`
3. Chọn plan: **Free** (hoặc Starter nếu cần)
4. Chọn region gần bạn nhất
5. Click **Create Database**
6. Lưu lại **Internal Database URL** và **External Database URL**

#### 4. Deploy Backend
1. Vào Dashboard → **New +** → **Web Service**
2. Connect repository của bạn
3. Cấu hình:
   - **Name**: `fastfood-backend`
   - **Environment**: `Python 3`
   - **Build Command**: 
     ```bash
     cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput
     ```
   - **Start Command**: 
     ```bash
     cd backend && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
     ```
   - **Instance Type**: Free (hoặc Starter)

4. **Environment Variables**:
   ```
   DJANGO_SETTINGS_MODULE=core.settings.prod
   SECRET_KEY=<tạo một secret key mạnh>
   DATABASE_URL=<Internal Database URL từ bước 3>
   ALLOWED_HOSTS=<tên-service>.onrender.com
   CORS_ORIGINS=https://<tên-frontend-service>.onrender.com
   DEBUG=False
   REDIS_HOST=<nếu dùng Redis>
   CELERY_BROKER_URL=redis://<redis-url>
   ```

5. Click **Create Web Service**

#### 5. Deploy Frontend
1. Vào Dashboard → **New +** → **Static Site**
2. Connect repository
3. Cấu hình:
   - **Name**: `fastfood-frontend`
   - **Build Command**: 
     ```bash
     cd frontend && npm install && npm run build
     ```
   - **Publish Directory**: `frontend/dist`
   - **Environment Variables**:
     ```
     VITE_API_BASE=https://<tên-backend-service>.onrender.com/api
     ```

4. Click **Create Static Site**

#### 6. Chạy Migrations
1. Vào Dashboard → **New +** → **Background Worker**
2. Cấu hình:
   - **Name**: `fastfood-migrate`
   - **Environment**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && python manage.py migrate`
   - **Environment Variables**: Giống như Backend

3. Chạy worker này một lần để migrate database

#### 7. Tạo Superuser
1. Vào Backend service → **Shell**
2. Chạy:
   ```bash
   cd backend
   python manage.py createsuperuser
   ```

### 🔗 URLs sau khi deploy:
- Backend: `https://fastfood-backend.onrender.com`
- Frontend: `https://fastfood-frontend.onrender.com`
- Admin: `https://fastfood-backend.onrender.com/admin/`

---

## Phương án 2: VPS với Docker

### ✅ Ưu điểm:
- Kiểm soát hoàn toàn
- Hiệu năng tốt
- Chi phí hợp lý ($5-10/tháng)
- Có thể scale dễ dàng

### 📝 Yêu cầu:
- VPS (Ubuntu 20.04/22.04) - khuyến nghị: DigitalOcean, Vultr, Linode
- Domain name (tùy chọn, có thể dùng IP)
- SSH access

### Các bước:

#### 1. Chuẩn bị VPS
```bash
# SSH vào VPS
ssh root@your-server-ip

# Cập nhật hệ thống
apt update && apt upgrade -y

# Cài đặt Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y

# Cài đặt Nginx
apt install nginx certbot python3-certbot-nginx -y
```

#### 2. Clone Repository
```bash
# Cài đặt Git
apt install git -y

# Clone repo
cd /opt
git clone <your-repo-url> fastfood
cd fastfood
```

#### 3. Cấu hình Environment
```bash
# Copy file .env.example
cp .env.production.example .env

# Chỉnh sửa .env với thông tin production
nano .env
```

Các biến quan trọng:
```env
DJANGO_SETTINGS_MODULE=core.settings.prod
SECRET_KEY=<tạo secret key mạnh>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
DEBUG=False
POSTGRES_PASSWORD=<mật khẩu mạnh>
```

#### 4. Deploy với Docker Compose
```bash
# Sử dụng docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d --build

# Chạy migrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Tạo superuser
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# Collect static files
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

#### 5. Cấu hình Nginx
```bash
# Copy file nginx.conf
cp nginx.conf /etc/nginx/sites-available/fastfood
ln -s /etc/nginx/sites-available/fastfood /etc/nginx/sites-enabled/

# Chỉnh sửa domain trong nginx.conf
nano /etc/nginx/sites-available/fastfood

# Test và reload Nginx
nginx -t
systemctl reload nginx
```

#### 6. Cài đặt SSL với Let's Encrypt
```bash
# Nếu có domain
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot sẽ tự động cấu hình SSL và auto-renewal
```

#### 7. Firewall
```bash
# Cấu hình UFW
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 🔄 Cập nhật ứng dụng:
```bash
cd /opt/fastfood
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

---

## Phương án 3: Railway.app

### ✅ Ưu điểm:
- Dễ deploy, tương tự Render
- Hỗ trợ Docker tốt
- Pricing linh hoạt

### 📝 Các bước:

1. Truy cập: https://railway.app
2. Đăng nhập bằng GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Thêm PostgreSQL service
5. Thêm các biến môi trường cần thiết
6. Railway sẽ tự động detect và deploy

---

## Phương án 4: DigitalOcean App Platform

### ✅ Ưu điểm:
- Tích hợp tốt với DigitalOcean
- Auto-scaling
- Managed database

### 📝 Các bước:

1. Truy cập: https://cloud.digitalocean.com/apps
2. **Create App** → Connect GitHub
3. Cấu hình:
   - Backend: Python service
   - Frontend: Static site
   - Database: Managed PostgreSQL
4. Deploy

---

## Cấu hình Domain & SSL

### Nếu dùng VPS:

1. **Trỏ DNS**:
   - A record: `@` → IP VPS
   - A record: `www` → IP VPS

2. **SSL tự động** với Let's Encrypt (đã hướng dẫn ở trên)

### Nếu dùng Render/Railway:

1. Vào service settings
2. Thêm custom domain
3. Trỏ DNS theo hướng dẫn của platform
4. SSL sẽ được tự động cấu hình

---

## 🔒 Bảo Mật Production

### Checklist:

- [ ] `DEBUG=False` trong production
- [ ] `SECRET_KEY` mạnh và bảo mật
- [ ] `ALLOWED_HOSTS` chỉ chứa domain của bạn
- [ ] `CORS_ORIGINS` chỉ chứa frontend URL
- [ ] SSL/HTTPS enabled
- [ ] Database password mạnh
- [ ] Firewall cấu hình đúng
- [ ] Backup database định kỳ
- [ ] Log monitoring

---

## 📊 Monitoring & Logs

### Render:
- Xem logs trong Dashboard → Logs

### VPS:
```bash
# Xem logs backend
docker compose -f docker-compose.prod.yml logs -f backend

# Xem logs frontend
docker compose -f docker-compose.prod.yml logs -f frontend

# Xem logs nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🆘 Troubleshooting

### Lỗi 502 Bad Gateway:
- Kiểm tra backend có đang chạy không
- Kiểm tra logs: `docker compose logs backend`

### Lỗi CORS:
- Kiểm tra `CORS_ORIGINS` trong environment variables
- Đảm bảo frontend URL đúng

### Database connection error:
- Kiểm tra `DATABASE_URL` hoặc database credentials
- Kiểm tra firewall có chặn port database không

### Static files không load:
- Chạy `collectstatic`
- Kiểm tra `STATIC_ROOT` và `STATIC_URL` trong settings

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. Logs của service
2. Environment variables
3. Network/firewall settings
4. Database connection

---

**Chúc bạn deploy thành công! 🎉**

