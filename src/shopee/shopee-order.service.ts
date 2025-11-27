import { Injectable, Logger } from '@nestjs/common';
import { ShopeeConfigService } from './shopee.config';
import { ShopeeHttpService } from './shopee-http.service';
import { ShopeeAuthService } from './shopee-auth.service';
import { GetOrdersDto } from './dto/get-orders.dto';

@Injectable()
export class ShopeeOrderService {
  private readonly logger = new Logger(ShopeeOrderService.name);

  constructor(
    private configService: ShopeeConfigService,
    private httpService: ShopeeHttpService,
    private authService: ShopeeAuthService,
  ) {}

  /**
   * Lấy danh sách đơn hàng
   * API: /api/v2/order/get_order_list
   */
  async getOrderList(options: GetOrdersDto = {}): Promise<any> {
    const ts = Math.floor(Date.now() / 1000);
    const accessToken = this.configService.accessToken;

    // Kiểm tra access token
    if (!accessToken) {
      this.logger.error('❌ Không có access token trong .env');
      return null;
    }

    // Default parameters
    const {
      days,
      status = 'ALL',
      pageSize = 20,
      cursor = '',
      timeFrom,
      timeTo,
    } = options;

    // Tính toán time range
    const now = Math.floor(Date.now() / 1000);
    const defaultTimeFrom = now - (days ? days * 24 * 60 * 60 : 7 * 24 * 60 * 60); // 7 ngày mặc định
    const finalTimeFrom = timeFrom || defaultTimeFrom;
    const finalTimeTo = timeTo || now;

    const path = '/api/v2/order/get_order_list';
    const sign = this.httpService.createSignatureWithAccessToken(
      this.configService.partnerId,
      path,
      ts,
      accessToken,
      this.configService.shopId,
      this.configService.apiKey,
    );

    // Thêm các tham số vào query params
    const queryParams: Record<string, any> = {
      partner_id: this.configService.partnerId.toString(),
      timestamp: ts.toString(),
      access_token: accessToken,
      shop_id: this.configService.shopId.toString(),
      sign: sign,
      time_range_field: 'create_time',
      time_from: finalTimeFrom.toString(),
      time_to: finalTimeTo.toString(),
      page_size: pageSize.toString(),
    };

    // Chỉ thêm cursor nếu có
    if (cursor) {
      queryParams.cursor = cursor;
    }

    // Chỉ thêm order_status nếu không phải ALL
    if (status && status !== 'ALL') {
      queryParams.order_status = status;
    }

    try {
      const content = await this.httpService.getRequestWithAccessToken(path, queryParams);

      // Parse response
      if (content.error) {
        // Nếu token hết hạn hoặc không hợp lệ, refresh và thử lại
        if (
          content.error === 'error_auth' ||
          content.error === 'error_access_token' ||
          content.error === 'invalid_acceess_token'
        ) {
          this.logger.log('🔄 Access token hết hạn hoặc không hợp lệ, đang refresh...');
          const refreshResult = await this.authService.refreshAccessToken();

          if (refreshResult.access_token) {
            this.logger.log('✅ Refresh token thành công, thử lại...');
            // Cập nhật access token trong query params
            queryParams.access_token = refreshResult.access_token;
            queryParams.sign = this.httpService.createSignatureWithAccessToken(
              this.configService.partnerId,
              path,
              ts,
              refreshResult.access_token,
              this.configService.shopId,
              this.configService.apiKey,
            );
            // Thử lại request
            const retryContent = await this.httpService.getRequestWithAccessToken(path, queryParams);
            if (retryContent.error) {
              this.logger.error(`Error: ${retryContent.error} - ${retryContent.message}`);
              return null;
            }
            return retryContent.response || retryContent;
          }
        }

        this.logger.error(`Error: ${content.error} - ${content.message}`);
        return null;
      }

      return content.response || content;
    } catch (error) {
      this.logger.error('Request error:', error);
      return null;
    }
  }

  /**
   * Lấy chi tiết đơn hàng
   * API: /api/v2/order/get_order_detail (GET)
   */
  async getOrderDetail(orderSnList: string | string[]): Promise<any> {
    const ts = Math.floor(Date.now() / 1000);
    const accessToken = this.configService.accessToken;

    // order_sn_list phải là array
    const orderSnArray = Array.isArray(orderSnList) ? orderSnList : [orderSnList];

    const path = '/api/v2/order/get_order_detail';
    const sign = this.httpService.createSignatureWithAccessToken(
      this.configService.partnerId,
      path,
      ts,
      accessToken,
      this.configService.shopId,
      this.configService.apiKey,
    );

    // GET request - truyền order_sn_list qua query params
    const orderSnString = orderSnArray.join(',');

    // Thêm response_optional_fields để lấy thêm thông tin
    const responseOptionalFields = [
      'buyer_user_id',
      'buyer_username',
      'estimated_shipping_fee',
      'recipient_address',
      'actual_shipping_cost',
      'goods_to_declare',
      'note',
      'note_update_time',
      'item_list',
      'pay_time',
      'dropshipper',
      'dropshipper_phone',
      'split_up',
      'buyer_cancel_reason',
      'cancel_by',
      'cancel_reason',
      'actual_shipping_cost_confirmed',
      'buyer_cpf_id',
      'fulfillment_flag',
      'pickup_done_time',
      'package_list',
      'invoice_data',
      'checkout_shipping_carrier',
      'reverse_shipping_fee',
      'order_chargeable_weight_gram',
    ].join(',');

    const queryParams: Record<string, any> = {
      partner_id: this.configService.partnerId.toString(),
      timestamp: ts.toString(),
      access_token: accessToken,
      shop_id: this.configService.shopId.toString(),
      sign: sign,
      order_sn_list: orderSnString,
      response_optional_fields: responseOptionalFields,
    };

    try {
      const content = await this.httpService.getRequestWithAccessToken(path, queryParams);

      // Parse response
      if (content.error) {
        // Nếu token hết hạn hoặc không hợp lệ, refresh và thử lại
        if (
          content.error === 'error_auth' ||
          content.error === 'error_access_token' ||
          content.error === 'invalid_acceess_token'
        ) {
          this.logger.log('🔄 Access token hết hạn hoặc không hợp lệ, đang refresh...');
          const refreshResult = await this.authService.refreshAccessToken();

          if (refreshResult.access_token) {
            this.logger.log('✅ Refresh token thành công, thử lại...');
            // Cập nhật access token trong query params
            queryParams.access_token = refreshResult.access_token;
            queryParams.sign = this.httpService.createSignatureWithAccessToken(
              this.configService.partnerId,
              path,
              ts,
              refreshResult.access_token,
              this.configService.shopId,
              this.configService.apiKey,
            );
            // Thử lại request
            const retryContent = await this.httpService.getRequestWithAccessToken(path, queryParams);
            if (retryContent.error) {
              this.logger.error(`Error: ${retryContent.error} - ${retryContent.message}`);
              return null;
            }
            return retryContent.response || retryContent;
          }
        }

        this.logger.error(`Error: ${content.error} - ${content.message}`);
        return null;
      }

      return content.response || content;
    } catch (error) {
      this.logger.error('Request error:', error);
      return null;
    }
  }

  /**
   * Lấy danh sách đơn hàng kèm chi tiết
   */
  async getOrderListWithDetails(options: GetOrdersDto = {}): Promise<any> {
    // Lấy danh sách đơn hàng
    const orderList = await this.getOrderList(options);

    if (!orderList || !orderList.order_list || orderList.order_list.length === 0) {
      return orderList;
    }

    // Lấy chi tiết từng đơn hàng
    const orderSnList = orderList.order_list.map((order: any) => order.order_sn).filter((sn: string) => sn);
    
    // Lấy chi tiết từng đơn một (để tránh lỗi nếu có nhiều đơn)
    const orderDetails: any[] = [];
    
    for (const orderSn of orderSnList) {
      try {
        const detail = await this.getOrderDetail(orderSn);
        if (detail && detail.order_list && detail.order_list.length > 0) {
          orderDetails.push(detail.order_list[0]);
        }
      } catch (error) {
        this.logger.error(`Lỗi khi lấy chi tiết đơn hàng ${orderSn}:`, error);
      }
    }

    return {
      ...orderList,
      order_list: orderDetails,
    };
  }
}

