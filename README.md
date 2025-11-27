# Shopee CHANDO API Integration - NestJS

Tích hợp API Shopee để quản lý đơn hàng cho shop CHANDO - Phiên bản NestJS.

## Cài đặt

1. **Cài đặt dependencies:**
```bash
cd nestjs
npm install
```

2. **Tạo file `.env` từ template:**
```bash
cp .env.example .env
```

3. **Cập nhật thông tin trong file `.env`:**
```env
SHOP_ID=1306398160
PARTNER_ID=2013772
API_KEY=your_api_key_here
API_HOST=partner.shopeemobile.com
REDIRECT_URL=https://chando-himalaya.vn/
ACCESS_TOKEN=
REFRESH_TOKEN=
AUTH_CODE=
PORT=3000
```

## Chạy ứng dụng

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

Ứng dụng sẽ chạy tại: `http://localhost:3000/api`

## Quy trình sử dụng API

Xem file `API_WORKFLOW.md` để biết thứ tự chạy các API và workflow đầy đủ.

**Tóm tắt:**
1. **Lần đầu:** `GET /api/shopee/auth/url` → Authorize → `POST /api/shopee/auth/token`
2. **Hàng ngày:** Chỉ cần sử dụng Orders API
3. **Tự động:** Scheduler refresh token mỗi 2 giờ

---

## API Endpoints

### Authentication

#### 1. Tạo Authorization URL
```http
GET /api/shopee/auth/url
```

**Response:**
```json
{
  "success": true,
  "url": "https://partner.shopeemobile.com/api/v2/shop/auth_partner?...",
  "message": "Mở URL này trong trình duyệt để authorize"
}
```

#### 2. Lấy Token từ Code
```http
POST /api/shopee/auth/token
Content-Type: application/json

{
  "code": "your_authorization_code"
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "...",
  "refresh_token": "...",
  "message": "Lấy token thành công"
}
```

#### 3. Refresh Token
```http
POST /api/shopee/auth/refresh
```

**Response:**
```json
{
  "success": true,
  "access_token": "...",
  "refresh_token": "...",
  "expire_in": 14400,
  "message": "Refresh token thành công"
}
```

### Orders

#### 1. Lấy danh sách đơn hàng
```http
GET /api/shopee/orders?days=7&status=READY_TO_SHIP&pageSize=20
```

**Query Parameters:**
- `days` (optional): Số ngày (1-365), mặc định 7
- `status` (optional): Trạng thái đơn hàng (ALL, UNPAID, READY_TO_SHIP, PROCESSED, SHIPPED, COMPLETED, CANCELLED, IN_CANCEL)
- `pageSize` (optional): Số lượng đơn hàng mỗi trang (1-100), mặc định 20
- `cursor` (optional): Cursor cho pagination
- `timeFrom` (optional): Timestamp bắt đầu
- `timeTo` (optional): Timestamp kết thúc

**Response:**
```json
{
  "success": true,
  "data": {
    "order_list": [...],
    "more": false
  }
}
```

#### 2. Lấy chi tiết đơn hàng (theo order_sn)
```http
GET /api/shopee/orders/:orderSn
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_list": [...]
  }
}
```

#### 3. Lấy chi tiết nhiều đơn hàng
```http
POST /api/shopee/orders/detail
Content-Type: application/json

{
  "orderSnList": ["251127TGW7Q7TP", "251127TGSHEM1W"]
}
```

hoặc

```json
{
  "orderSnList": "251127TGW7Q7TP"
}
```

## Auto Refresh Token

Ứng dụng tự động refresh token mỗi 2 giờ thông qua NestJS Scheduler. Không cần cấu hình thêm.

## Cấu trúc Project

```
nestjs/
├── src/
│   ├── shopee/
│   │   ├── dto/
│   │   │   └── get-orders.dto.ts
│   │   ├── shopee.config.ts          # Config service
│   │   ├── shopee-http.service.ts    # HTTP utilities
│   │   ├── shopee-auth.service.ts    # Authentication
│   │   ├── shopee-order.service.ts   # Order operations
│   │   ├── shopee.controller.ts      # REST API endpoints
│   │   ├── shopee.scheduler.ts       # Auto refresh token
│   │   └── shopee.module.ts          # Module definition
│   ├── app.module.ts
│   └── main.ts
├── .env.example
├── package.json
└── tsconfig.json
```

## Lưu ý

- File `.env` chứa thông tin nhạy cảm, không commit lên git
- Access token hết hạn sau 4 giờ
- Refresh token hết hạn sau 30 ngày (nếu không refresh)
- Authorization code chỉ dùng được 1 lần
- Auto refresh token chạy mỗi 2 giờ tự động

## So sánh với phiên bản Node.js thuần

### Ưu điểm của NestJS:
- ✅ REST API endpoints thay vì CLI scripts
- ✅ TypeScript với type safety
- ✅ Dependency Injection
- ✅ Auto refresh token với Scheduler (không cần cronjob)
- ✅ DTOs cho validation
- ✅ Modular architecture
- ✅ Dễ test và maintain

### Migration từ Node.js:
- `login.js` → `GET /api/shopee/auth/url`
- `get_access_refresh_token.js` → `POST /api/shopee/auth/token` và `POST /api/shopee/auth/refresh`
- `getOrders.js` → `GET /api/shopee/orders` và `GET /api/shopee/orders/:orderSn`
- `refresh_token_cron.js` → `ShopeeScheduler` (tự động chạy)

