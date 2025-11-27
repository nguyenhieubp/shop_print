import { Controller, Get, Post, Query, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { ShopeeAuthService } from './shopee-auth.service';
import { ShopeeOrderService } from './shopee-order.service';
import { GetOrdersDto } from './dto/get-orders.dto';

@ApiTags('Shopee')
@Controller('shopee')
export class ShopeeController {
  constructor(
    private authService: ShopeeAuthService,
    private orderService: ShopeeOrderService,
  ) {}

  /**
   * GET /api/shopee/auth/url
   * Tạo authorization URL
   */
  @ApiTags('Authentication')
  @ApiOperation({ summary: 'Tạo authorization URL', description: 'Lấy URL để authorize với Shopee và lấy authorization code' })
  @ApiResponse({ status: 200, description: 'Trả về authorization URL' })
  @Get('auth/url')
  getAuthUrl() {
    const url = this.authService.generateAuthUrl();
    return {
      success: true,
      url,
      message: 'Mở URL này trong trình duyệt để authorize',
    };
  }

  /**
   * POST /api/shopee/auth/token
   * Lấy token từ authorization code
   */
  @ApiTags('Authentication')
  @ApiOperation({ summary: 'Lấy token từ authorization code', description: 'Đổi authorization code thành access token và refresh token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Authorization code từ redirect URL sau khi authorize',
          example: '767666426c76755973517a57634d6e70',
        },
      },
      required: ['code'],
    },
  })
  @ApiResponse({ status: 200, description: 'Lấy token thành công' })
  @ApiResponse({ status: 400, description: 'Code is required' })
  @Post('auth/token')
  async getToken(@Body('code') code: string) {
    if (!code) {
      return {
        success: false,
        message: 'Code is required',
      };
    }

    const result = await this.authService.getTokenFromCode(code);

    if (result.access_token) {
      return {
        success: true,
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        message: 'Lấy token thành công',
      };
    } else {
      return {
        success: false,
        message: 'Không thể lấy token từ code',
      };
    }
  }

  /**
   * POST /api/shopee/auth/refresh
   * Refresh access token
   */
  @ApiTags('Authentication')
  @ApiOperation({ summary: 'Refresh access token', description: 'Lấy access token mới bằng refresh token' })
  @ApiResponse({ status: 200, description: 'Refresh token thành công' })
  @ApiResponse({ status: 401, description: 'Không thể refresh token' })
  @Post('auth/refresh')
  async refreshToken() {
    const result = await this.authService.refreshAccessToken();

    if (result.access_token) {
      return {
        success: true,
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expire_in: result.expire_in,
        message: 'Refresh token thành công',
      };
    } else {
      return {
        success: false,
        message: 'Không thể refresh token',
      };
    }
  }

  /**
   * GET /api/shopee/orders
   * Lấy danh sách đơn hàng
   */
  @ApiTags('Orders')
  @ApiOperation({ 
    summary: 'Lấy danh sách đơn hàng', 
    description: 'Lấy danh sách đơn hàng từ Shopee với các filter tùy chọn. Thêm includeDetails=true để lấy chi tiết đầy đủ.' 
  })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Số ngày (1-365), mặc định 7' })
  @ApiQuery({ name: 'status', required: false, enum: ['ALL', 'UNPAID', 'READY_TO_SHIP', 'PROCESSED', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'IN_CANCEL'], description: 'Trạng thái đơn hàng' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Số lượng đơn hàng mỗi trang (1-100), mặc định 20' })
  @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Cursor cho pagination' })
  @ApiQuery({ name: 'includeDetails', required: false, type: Boolean, description: 'Lấy chi tiết đầy đủ đơn hàng (sản phẩm, giá, v.v.)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách đơn hàng thành công' })
  @Get('orders')
  async getOrders(@Query() query: GetOrdersDto) {
    // Nếu có includeDetails=true, lấy kèm chi tiết
    if (query.includeDetails) {
      const result = await this.orderService.getOrderListWithDetails(query);

      if (result) {
        return {
          success: true,
          data: result,
        };
      } else {
        return {
          success: false,
          message: 'Không thể lấy danh sách đơn hàng',
        };
      }
    }

    const result = await this.orderService.getOrderList(query);

    if (result) {
      if (result.error) {
        return {
          success: false,
          error: result.error,
          message: result.message || 'Unknown error',
        };
      } else {
        return {
          success: true,
          data: result,
        };
      }
    } else {
      return {
        success: false,
        message: 'Không thể lấy danh sách đơn hàng',
      };
    }
  }

  /**
   * GET /api/shopee/orders/:orderSn
   * Lấy chi tiết đơn hàng
   */
  @ApiTags('Orders')
  @ApiOperation({ summary: 'Lấy chi tiết đơn hàng', description: 'Lấy thông tin chi tiết của một đơn hàng theo order_sn' })
  @ApiParam({ name: 'orderSn', description: 'Order SN của đơn hàng', example: '251127THPK8T4E' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết đơn hàng thành công' })
  @Get('orders/:orderSn')
  async getOrderDetail(@Param('orderSn') orderSn: string) {
    const result = await this.orderService.getOrderDetail(orderSn);

    if (result) {
      if (result.error) {
        return {
          success: false,
          error: result.error,
          message: result.message || 'Unknown error',
        };
      } else {
        return {
          success: true,
          data: result,
        };
      }
    } else {
      return {
        success: false,
        message: 'Không thể lấy chi tiết đơn hàng',
      };
    }
  }

  /**
   * POST /api/shopee/orders/detail
   * Lấy chi tiết nhiều đơn hàng
   */
  @ApiTags('Orders')
  @ApiOperation({ summary: 'Lấy chi tiết nhiều đơn hàng', description: 'Lấy thông tin chi tiết của nhiều đơn hàng cùng lúc' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderSnList: {
          oneOf: [
            { type: 'string', description: 'Một order SN', example: '251127THPK8T4E' },
            { type: 'array', items: { type: 'string' }, description: 'Mảng các order SN', example: ['251127THPK8T4E', '251127THJ66DG4'] },
          ],
        },
      },
      required: ['orderSnList'],
    },
  })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết đơn hàng thành công' })
  @ApiResponse({ status: 400, description: 'orderSnList is required' })
  @Post('orders/detail')
  async getOrdersDetail(@Body('orderSnList') orderSnList: string | string[]) {
    if (!orderSnList) {
      return {
        success: false,
        message: 'orderSnList is required',
      };
    }

    const result = await this.orderService.getOrderDetail(orderSnList);

    if (result) {
      if (result.error) {
        return {
          success: false,
          error: result.error,
          message: result.message || 'Unknown error',
        };
      } else {
        return {
          success: true,
          data: result,
        };
      }
    } else {
      return {
        success: false,
        message: 'Không thể lấy chi tiết đơn hàng',
      };
    }
  }
}

