# Quy trình sử dụng API - Shopee CHANDO API

## Thứ tự chạy các API

### Bước 1: Lấy Authorization URL (Lần đầu tiên hoặc khi refresh token hết hạn)

**Endpoint:** `GET /api/shopee/auth/url`

**Mục đích:** Lấy URL để authorize với Shopee và nhận authorization code

**Request:**
```bash
curl -H "x-api-key: your-api-key" \
  http://localhost:3000/api/shopee/auth/url
```

**Response:**
```json
{
  "success": true,
  "url": "https://partner.shopeemobile.com/api/v2/shop/auth_partner?...",
  "message": "Mở URL này trong trình duyệt để authorize"
}
```

**Bước tiếp theo:**
1. Mở URL trong trình duyệt
2. Đăng nhập và authorize
3. Lấy `code` từ redirect URL: `https://chando-himalaya.vn/?code=...&shop_id=...`

---

### Bước 2: Lấy Token từ Authorization Code

**Endpoint:** `POST /api/shopee/auth/token`

**Mục đích:** Đổi authorization code thành access token và refresh token

**Request:**
```bash
curl -X POST \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"code": "your-authorization-code"}' \
  http://localhost:3000/api/shopee/auth/token
```

**Response:**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
  "message": "Lấy token thành công"
}
```

**Lưu ý:**
- Tokens đã được tự động lưu vào file `.env`
- Authorization code chỉ dùng được 1 lần
- Không cần gọi API này nữa nếu đã có refresh token

---

### Bước 3: Sử dụng API Orders (Sau khi đã có tokens)

#### 3.1. Lấy danh sách đơn hàng

**Endpoint:** `GET /api/shopee/orders`

**Mục đích:** Lấy danh sách đơn hàng từ Shopee

**Request:**
```bash
# Lấy đơn hàng 7 ngày gần nhất
curl -H "x-api-key: your-api-key" \
  "http://localhost:3000/api/shopee/orders?days=7&pageSize=20"

# Lấy đơn hàng với chi tiết đầy đủ
curl -H "x-api-key: your-api-key" \
  "http://localhost:3000/api/shopee/orders?days=7&pageSize=20&includeDetails=true"

# Lấy đơn hàng theo trạng thái
curl -H "x-api-key: your-api-key" \
  "http://localhost:3000/api/shopee/orders?status=READY_TO_SHIP&pageSize=20"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_list": [
      {
        "order_sn": "251127THPK8T4E",
        "booking_sn": ""
      }
    ],
    "more": true,
    "next_cursor": "5"
  }
}
```

---

#### 3.2. Lấy chi tiết một đơn hàng

**Endpoint:** `GET /api/shopee/orders/:orderSn`

**Mục đích:** Lấy thông tin chi tiết của một đơn hàng cụ thể

**Request:**
```bash
curl -H "x-api-key: your-api-key" \
  http://localhost:3000/api/shopee/orders/251127THPK8T4E
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_list": [
      {
        "order_sn": "251127THPK8T4E",
        "buyer_username": "nguyenthitruclinh998",
        "item_list": [...],
        "estimated_shipping_fee": 64700,
        "order_status": "UNPAID",
        ...
      }
    ]
  }
}
```

---

#### 3.3. Lấy chi tiết nhiều đơn hàng

**Endpoint:** `POST /api/shopee/orders/detail`

**Mục đích:** Lấy thông tin chi tiết của nhiều đơn hàng cùng lúc

**Request:**
```bash
curl -X POST \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"orderSnList": ["251127THPK8T4E", "251127THJ66DG4"]}' \
  http://localhost:3000/api/shopee/orders/detail
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_list": [
      {
        "order_sn": "251127THPK8T4E",
        ...
      },
      {
        "order_sn": "251127THJ66DG4",
        ...
      }
    ]
  }
}
```

---

### Bước 4: Refresh Token (Khi cần hoặc tự động)

**Endpoint:** `POST /api/shopee/auth/refresh`

**Mục đích:** Lấy access token mới bằng refresh token

**Khi nào cần:**
- Access token hết hạn (sau 4 giờ)
- Hoặc tự động refresh mỗi 2 giờ (đã có scheduler)

**Request:**
```bash
curl -X POST \
  -H "x-api-key: your-api-key" \
  http://localhost:3000/api/shopee/auth/refresh
```

**Response:**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
  "expire_in": 14400,
  "message": "Refresh token thành công"
}
```

**Lưu ý:**
- Tokens đã được tự động cập nhật vào file `.env`
- Không cần gọi API này thủ công nếu scheduler đang chạy

---

## Quy trình đầy đủ

### Lần đầu tiên setup:

```
1. GET /api/shopee/auth/url
   ↓
2. Mở URL và authorize → Lấy code
   ↓
3. POST /api/shopee/auth/token (với code)
   ↓
4. Tokens được lưu vào .env
   ↓
5. Sử dụng API Orders
```

### Sau khi đã có tokens:

```
1. Sử dụng API Orders trực tiếp
   (Tokens được tự động refresh nếu hết hạn)
   ↓
2. Scheduler tự động refresh token mỗi 2 giờ
   (Không cần can thiệp thủ công)
```

### Khi refresh token hết hạn (sau 30 ngày không refresh):

```
1. GET /api/shopee/auth/url
   ↓
2. Mở URL và authorize → Lấy code mới
   ↓
3. POST /api/shopee/auth/token (với code mới)
   ↓
4. Tiếp tục sử dụng API Orders
```

---

## Ví dụ workflow hoàn chỉnh

### Scenario 1: Setup lần đầu

```bash
# Bước 1: Lấy authorization URL
curl -H "x-api-key: your-api-key" \
  http://localhost:3000/api/shopee/auth/url

# Bước 2: Mở URL trong browser, authorize, lấy code
# Code: 767666426c76755973517a57634d6e70

# Bước 3: Lấy tokens
curl -X POST \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"code": "767666426c76755973517a57634d6e70"}' \
  http://localhost:3000/api/shopee/auth/token

# Bước 4: Sử dụng API Orders
curl -H "x-api-key: your-api-key" \
  "http://localhost:3000/api/shopee/orders?days=7&includeDetails=true"
```

### Scenario 2: Sử dụng hàng ngày

```bash
# Chỉ cần gọi API Orders, tokens được tự động quản lý
curl -H "x-api-key: your-api-key" \
  "http://localhost:3000/api/shopee/orders?days=1&status=READY_TO_SHIP"

# Lấy chi tiết đơn hàng cụ thể
curl -H "x-api-key: your-api-key" \
  http://localhost:3000/api/shopee/orders/251127THPK8T4E
```

---

## Lưu ý quan trọng

1. **API Key:** Tất cả requests đều cần header `x-api-key`
2. **Tokens:** Được tự động quản lý, không cần can thiệp thủ công
3. **Auto Refresh:** Scheduler tự động refresh token mỗi 2 giờ
4. **Error Handling:** API tự động retry khi token hết hạn
5. **Authorization Code:** Chỉ dùng được 1 lần, hết hạn sau vài phút

---

## Troubleshooting

### Lỗi: "API Key is required"
→ Thêm header `x-api-key` vào request

### Lỗi: "Invalid API Key"
→ Kiểm tra API Key trong `.env` và request

### Lỗi: "invalid_code - The code is expired or used"
→ Authorization code đã hết hạn hoặc đã dùng. Lấy code mới từ Bước 1

### Lỗi: "invalid_acceess_token"
→ Access token hết hạn. API sẽ tự động refresh và retry

### Lỗi: "Không có refresh token"
→ Cần setup lại từ Bước 1 (lấy authorization code mới)

---

## Tóm tắt thứ tự

1. **Lần đầu:** `GET /auth/url` → Authorize → `POST /auth/token` → Sử dụng Orders
2. **Hàng ngày:** Chỉ cần sử dụng Orders API
3. **Khi cần:** `POST /auth/refresh` (hoặc để scheduler tự động)
4. **Khi refresh token hết hạn:** Làm lại từ Bước 1

🎉 **Đơn giản và tự động!**

