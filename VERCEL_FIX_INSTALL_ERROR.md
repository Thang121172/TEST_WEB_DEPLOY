# Fix Lỗi: Command "cd frontend && npm install" exited with 1

## 🔍 Nguyên Nhân

Lỗi này thường do **conflict giữa Root Directory và Build Command**:

- Nếu **Root Directory = `frontend`** → Đã ở trong folder frontend rồi
- Command `cd frontend && npm install` sẽ **cd vào `frontend/frontend`** → Không tìm thấy!

## ✅ Cách Fix

### Option 1: Root Directory = `frontend` (Khuyên dùng)

**Cấu hình trong Vercel Settings:**

1. **Root Directory:** `frontend`
2. **Build Command:** `npm install && npm run build` (bỏ `cd frontend`)
3. **Install Command:** `npm install` (bỏ `cd frontend`)
4. **Output Directory:** `dist` (bỏ `frontend/`)

**Lý do:**
- Khi Root Directory = `frontend`, Vercel đã tự động chuyển vào folder `frontend`
- Không cần `cd frontend` nữa
- Output Directory chỉ cần `dist` (từ root của frontend folder)

### Option 2: Root Directory = `.` (root project)

**Cấu hình trong Vercel Settings:**

1. **Root Directory:** `.` (hoặc để trống)
2. **Build Command:** `cd frontend && npm install && npm run build`
3. **Install Command:** `cd frontend && npm install`
4. **Output Directory:** `frontend/dist`

## 🎯 Cấu Hình Đúng (Option 1 - Khuyên dùng)

### Framework Settings:
```
Framework Preset: Vite
Build Command: npm install && npm run build
Output Directory: dist
Install Command: npm install
```

### Root Directory:
```
Root Directory: frontend
```

## 🔧 Cách Thực Hiện

### Bước 1: Update Root Directory
1. Vào **Settings** → **General** → **Build and Deployment**
2. Tìm phần **"Root Directory"**
3. Điền: `frontend`
4. Click **"Save"**

### Bước 2: Update Build Command
1. Vào **Framework Settings**
2. **Build Command:** 
   - ❌ Bỏ: `cd frontend && npm install && npm run build`
   - ✅ Dùng: `npm install && npm run build`
   - Bật toggle "Override"

3. **Output Directory:**
   - ❌ Bỏ: `frontend/dist`
   - ✅ Dùng: `dist`
   - Bật toggle "Override"

4. **Install Command:**
   - ❌ Bỏ: `cd frontend && npm install`
   - ✅ Dùng: `npm install`
   - Bật toggle "Override"

5. Click **"Save"**

### Bước 3: Redeploy
1. Vào **Deployments**
2. Click **"Redeploy"**
3. Chờ build hoàn tất

## 📝 Tóm Tắt Cấu Hình

```
Root Directory: frontend
Framework Preset: Vite
Build Command: npm install && npm run build
Output Directory: dist
Install Command: npm install
```

**Logic:**
- Root Directory = `frontend` → Vercel làm việc trong folder `frontend/`
- Build Command không cần `cd frontend` nữa
- Output Directory = `dist` (từ `frontend/dist`)

## ✅ Verify

Sau khi cấu hình, build sẽ:
1. ✅ Vào folder `frontend/` (tự động)
2. ✅ Chạy `npm install` (trong frontend)
3. ✅ Chạy `npm run build` (tạo `frontend/dist/`)
4. ✅ Vercel lấy output từ `dist/`

