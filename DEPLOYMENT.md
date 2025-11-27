# Hướng dẫn Deploy Shopee CHANDO API - NestJS

## Tự động Refresh Token

Ứng dụng NestJS đã có **Scheduler tự động refresh token mỗi 2 giờ**, không cần setup cronjob hay task scheduler nữa!

### Cơ chế hoạt động:

1. **NestJS Scheduler** (`@nestjs/schedule`) tự động chạy task mỗi 2 giờ
2. Tự động refresh access token và refresh token
3. Tự động cập nhật vào file `.env`
4. **Không cần can thiệp thủ công**

### File liên quan:

- `src/shopee/shopee.scheduler.ts` - Scheduler tự động refresh token
- `src/app.module.ts` - Đã import `ScheduleModule.forRoot()`

---

## Deploy lên Server

### Yêu cầu:

- Node.js >= 18
- PM2 hoặc process manager khác để giữ ứng dụng chạy liên tục

### Các bước deploy:

#### 1. Build ứng dụng:

```bash
cd nestjs
npm install
npm run build
```

#### 2. Cấu hình file `.env`:

```bash
cp .env.example .env
# Cập nhật các thông tin trong .env
```

#### 3. Chạy với PM2 (Khuyến nghị):

```bash
# Cài đặt PM2 (nếu chưa có)
npm install -g pm2

# Chạy ứng dụng
pm2 start dist/main.js --name shopee-api

# Lưu cấu hình PM2
pm2 save
pm2 startup

# Xem logs
pm2 logs shopee-api

# Xem status
pm2 status
```

#### 4. Hoặc chạy với systemd (Linux):

Tạo file `/etc/systemd/system/shopee-api.service`:

```ini
[Unit]
Description=Shopee CHANDO API
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/nestjs
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/shopee-api.log
StandardError=append:/var/log/shopee-api-error.log

[Install]
WantedBy=multi-user.target
```

Kích hoạt service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable shopee-api
sudo systemctl start shopee-api
sudo systemctl status shopee-api
```

#### 5. Hoặc chạy với Docker:

Tạo file `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

Build và chạy:

```bash
docker build -t shopee-api .
docker run -d --name shopee-api -p 3000:3000 --env-file .env shopee-api
```

---

## Kiểm tra Auto Refresh Token

### Xem logs:

```bash
# PM2
pm2 logs shopee-api

# systemd
sudo journalctl -u shopee-api -f

# Docker
docker logs -f shopee-api
```

### Log mẫu khi refresh token:

```
[Nest] 1234  - 11/27/2025, 10:00:00 AM   LOG [ShopeeScheduler] 🔄 Đang refresh access_token...
[Nest] 1234  - 11/27/2025, 10:00:01 AM   LOG [ShopeeScheduler] ✅ Refresh thành công!
[Nest] 1234  - 11/27/2025, 10:00:01 AM   LOG [ShopeeScheduler] Access Token: eyJhbGciOiJIUzI1NiJ9...
[Nest] 1234  - 11/27/2025, 10:00:01 AM   LOG [ShopeeAuthService] ✅ Đã cập nhật tokens vào file .env
```

---

## Lưu ý quan trọng:

### ✅ Đã có sẵn:

- ✅ Auto refresh token mỗi 2 giờ (không cần cronjob)
- ✅ Tự động cập nhật file `.env`
- ✅ Tự động retry khi token hết hạn trong API calls

### ⚠️ Cần đảm bảo:

1. **Ứng dụng phải chạy liên tục** (dùng PM2, systemd, hoặc Docker)
2. **File `.env` phải có quyền ghi** để cập nhật tokens
3. **REFRESH_TOKEN ban đầu phải hợp lệ** (lấy từ authorization code lần đầu)

### 🔄 Quy trình hoạt động:

1. **Lần đầu tiên:**
   - Lấy authorization code từ Shopee
   - Dùng code để lấy access_token và refresh_token
   - Lưu vào `.env`

2. **Sau đó:**
   - Scheduler tự động refresh mỗi 2 giờ
   - Tokens được cập nhật tự động
   - **Không cần can thiệp thủ công**

3. **Khi gọi API:**
   - Nếu token hết hạn, tự động refresh và retry
   - Không cần lo lắng về token expiration

---

## So sánh với phiên bản Node.js thuần:

| Tính năng | Node.js (cũ) | NestJS (mới) |
|-----------|--------------|--------------|
| Auto refresh token | Cần cronjob/task scheduler | ✅ Tự động (Scheduler) |
| Cập nhật .env | Manual hoặc script | ✅ Tự động |
| Chạy liên tục | Cần PM2/systemd | Cần PM2/systemd |
| REST API | ❌ Không có | ✅ Có sẵn |
| TypeScript | ❌ Không | ✅ Có |

---

## Troubleshooting:

### Scheduler không chạy:

1. Kiểm tra `ScheduleModule.forRoot()` đã được import trong `app.module.ts`
2. Kiểm tra `ShopeeScheduler` đã được thêm vào providers trong `shopee.module.ts`
3. Xem logs để biết lỗi cụ thể

### Token không được cập nhật:

1. Kiểm tra quyền ghi file `.env`
2. Kiểm tra đường dẫn file `.env` đúng
3. Xem logs của `ShopeeAuthService`

### Ứng dụng bị restart:

- Sử dụng PM2 với `--restart` hoặc systemd với `Restart=always`
- Đảm bảo ứng dụng không crash

---

## Kết luận:

**Không cần setup cronjob hay task scheduler nữa!** 

Chỉ cần:
1. Deploy ứng dụng NestJS
2. Đảm bảo ứng dụng chạy liên tục (PM2/systemd/Docker)
3. Scheduler sẽ tự động refresh token mỗi 2 giờ

🎉 **Đơn giản hơn nhiều so với phiên bản Node.js thuần!**

