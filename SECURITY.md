# Bảo mật API - Shopee CHANDO API

## ⚠️ QUAN TRỌNG: API hiện tại đã được bảo vệ bằng API Key

### Trước đây (Không an toàn):
- ❌ API public, ai cũng có thể truy cập
- ❌ Không có authentication
- ❌ Có thể bị lạm dụng

### Bây giờ (Đã bảo mật):
- ✅ API được bảo vệ bằng API Key
- ✅ Chỉ người có API Key mới có thể truy cập
- ✅ Có thể cấu hình CORS để giới hạn origin

---

## Cách sử dụng API Key:

### 1. Cấu hình API Key trong `.env`:

```env
API_SECRET_KEY=your-secret-api-key-here
```

**Tạo API Key mạnh:**
```bash
# Linux/Mac
openssl rand -hex 32

# Hoặc dùng Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Gửi API Key khi gọi API:

**Cách 1: Qua Header (Khuyến nghị):**
```bash
curl -H "x-api-key: your-secret-api-key-here" \
  http://localhost:3000/api/shopee/orders
```

**Cách 2: Qua Query Parameter:**
```bash
curl "http://localhost:3000/api/shopee/orders?api_key=your-secret-api-key-here"
```

**Với JavaScript/TypeScript:**
```javascript
fetch('http://localhost:3000/api/shopee/orders', {
  headers: {
    'x-api-key': 'your-secret-api-key-here'
  }
})
```

**Với Postman:**
- Thêm header: `x-api-key: your-secret-api-key-here`

---

## Cấu hình CORS (Tùy chọn):

Để giới hạn các domain được phép gọi API:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

Hoặc cho phép tất cả (development):
```env
ALLOWED_ORIGINS=*
```

---

## Development Mode:

Nếu **KHÔNG** set `API_SECRET_KEY` trong `.env`:
- API sẽ cho phép tất cả requests (không kiểm tra API Key)
- ⚠️ **CHỈ dùng cho development, KHÔNG dùng cho production!**

---

## Production Checklist:

- [ ] Đã set `API_SECRET_KEY` trong `.env` (chuỗi ngẫu nhiên mạnh)
- [ ] Đã cấu hình `ALLOWED_ORIGINS` (không dùng `*`)
- [ ] Đã test API với API Key
- [ ] Đã bảo mật file `.env` (không commit lên git)
- [ ] Đã cấu hình firewall/security groups trên server
- [ ] Đã enable HTTPS (SSL/TLS)

---

## Lỗi thường gặp:

### 401 Unauthorized - API Key is required
**Nguyên nhân:** Không gửi API Key
**Giải pháp:** Thêm header `x-api-key` hoặc query parameter `api_key`

### 401 Unauthorized - Invalid API Key
**Nguyên nhân:** API Key không đúng
**Giải pháp:** Kiểm tra lại API Key trong `.env` và request

---

## Best Practices:

1. **Tạo API Key mạnh:**
   - Độ dài tối thiểu 32 ký tự
   - Sử dụng ký tự ngẫu nhiên (hex, base64)
   - Không dùng từ điển hoặc thông tin cá nhân

2. **Bảo mật API Key:**
   - Không commit API Key lên git
   - Không log API Key trong console
   - Sử dụng environment variables
   - Rotate API Key định kỳ

3. **Giới hạn quyền truy cập:**
   - Sử dụng CORS để giới hạn origin
   - Có thể thêm rate limiting
   - Có thể thêm IP whitelist

4. **Monitoring:**
   - Log các request không hợp lệ
   - Monitor số lượng requests
   - Alert khi có suspicious activity

---

## Nâng cấp bảo mật (Tùy chọn):

### 1. Thêm Rate Limiting:

```bash
npm install @nestjs/throttler
```

### 2. Thêm IP Whitelist:

Tạo guard mới để kiểm tra IP

### 3. Thêm JWT Authentication:

Thay vì API Key, sử dụng JWT tokens

### 4. Thêm Role-Based Access Control (RBAC):

Phân quyền chi tiết hơn

---

## Kết luận:

✅ **API đã được bảo vệ bằng API Key**
✅ **Chỉ người có API Key mới có thể truy cập**
✅ **Có thể cấu hình CORS để giới hạn origin**

⚠️ **Nhớ set `API_SECRET_KEY` trong `.env` khi deploy lên production!**

