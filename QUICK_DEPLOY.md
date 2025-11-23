# ⚡ Hướng Dẫn Deploy Nhanh

## 🎯 Phương án nhanh nhất: Render.com (Miễn phí)

### Bước 1: Chuẩn bị
```bash
# Đảm bảo code đã push lên GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

**Repository của bạn**: https://github.com/Thang121172/WEB_DACN

### Bước 2: Deploy Backend
1. Vào https://render.com → Đăng ký/Đăng nhập
2. **New +** → **PostgreSQL** → Tạo database
3. **New +** → **Web Service** → Connect GitHub repo
4. Cấu hình:
   - **Name**: `fastfood-backend`
   - **Build Command**: `cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Start Command**: `cd backend && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
   - **Environment Variables**:
     ```
     DJANGO_SETTINGS_MODULE=core.settings.prod
     SECRET_KEY=<tạo một key ngẫu nhiên>
     DATABASE_URL=<từ PostgreSQL service>
     ALLOWED_HOSTS=<tên-service>.onrender.com
     CORS_ORIGINS=https://<tên-frontend>.onrender.com
     DEBUG=False
     ```
5. Click **Create**

### Bước 3: Deploy Frontend
1. **New +** → **Static Site** → Connect GitHub
2. Cấu hình:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Environment Variables**:
     ```
     VITE_API_BASE=https://<tên-backend>.onrender.com/api
     ```
3. Click **Create**

### Bước 4: Chạy Migrations
1. Vào Backend service → **Shell**
2. Chạy: `cd backend && python manage.py migrate`
3. Tạo superuser: `python manage.py createsuperuser`

### ✅ Xong! Truy cập:
- Frontend: `https://<tên-frontend>.onrender.com`
- Backend: `https://<tên-backend>.onrender.com`
- Admin: `https://<tên-backend>.onrender.com/admin/`

---

## 🖥️ Phương án VPS (Kiểm soát hoàn toàn)

### Yêu cầu:
- VPS Ubuntu 20.04+ (DigitalOcean, Vultr, Linode - $5-10/tháng)
- Domain name (tùy chọn)

### Các bước:

```bash
# 1. SSH vào VPS
ssh root@your-server-ip

# 2. Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y

# 3. Clone repo
cd /opt
git clone <your-repo-url> fastfood
cd fastfood

# 4. Tạo file .env
cp .env.production.example .env
nano .env  # Điền thông tin

# 5. Deploy
chmod +x deploy.sh
./deploy.sh

# 6. Cài đặt Nginx & SSL
apt install nginx certbot python3-certbot-nginx -y
cp nginx.conf /etc/nginx/sites-available/fastfood
# Chỉnh sửa domain trong nginx.conf
nano /etc/nginx/sites-available/fastfood
ln -s /etc/nginx/sites-available/fastfood /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 7. Cài SSL
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 📝 Checklist trước khi deploy:

- [ ] Code đã được test kỹ
- [ ] `SECRET_KEY` mạnh và bảo mật
- [ ] `DEBUG=False` trong production
- [ ] `ALLOWED_HOSTS` đúng domain
- [ ] `CORS_ORIGINS` đúng frontend URL
- [ ] Database password mạnh
- [ ] Backup database định kỳ

---

## 🔗 Tài liệu chi tiết:

Xem file `DEPLOYMENT.md` để biết hướng dẫn đầy đủ cho tất cả các phương án.

