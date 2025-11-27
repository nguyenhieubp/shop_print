import { Injectable, Logger } from '@nestjs/common';
import { ShopeeConfigService } from './shopee.config';
import { ShopeeHttpService } from './shopee-http.service';

@Injectable()
export class ShopeeAuthService {
  private readonly logger = new Logger(ShopeeAuthService.name);

  constructor(
    private configService: ShopeeConfigService,
    private httpService: ShopeeHttpService,
  ) {}

  /**
   * Tạo authorization URL
   */
  generateAuthUrl(): string {
    const ts = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/auth_partner';
    const sign = this.httpService.createSignature(
      this.configService.partnerId,
      path,
      ts,
      this.configService.apiKey,
    );

    const host = `https://${this.configService.apiHost}`;
    const url = `${host}${path}?partner_id=${this.configService.partnerId}&redirect=${encodeURIComponent(this.configService.redirectUrl)}&timestamp=${ts}&sign=${sign}`;

    return url;
  }

  /**
   * Lấy access_token và refresh_token từ authorization code (chỉ dùng 1 lần)
   * API: /api/v2/auth/token/get
   */
  async getTokenFromCode(code: string): Promise<{
    access_token: string | null;
    refresh_token: string | null;
  }> {
    const ts = Math.floor(Date.now() / 1000);
    const body = {
      code: code,
      shop_id: this.configService.shopId,
      partner_id: this.configService.partnerId,
    };

    const path = '/api/v2/auth/token/get';
    const sign = this.httpService.createSignature(
      this.configService.partnerId,
      path,
      ts,
      this.configService.apiKey,
    );

    const queryParams = {
      partner_id: this.configService.partnerId.toString(),
      timestamp: ts.toString(),
      sign: sign,
    };

    try {
      const content = await this.httpService.postRequest(path, body, queryParams);

      // Parse response
      if (content.error) {
        this.logger.error(`Error: ${content.error} - ${content.message}`);
        return { access_token: null, refresh_token: null };
      }

      // Response có thể ở trong "response" hoặc ở root level
      let access_token: string | null, refresh_token: string | null;
      if (content.response) {
        access_token = content.response.access_token;
        refresh_token = content.response.refresh_token;
      } else {
        access_token = content.access_token;
        refresh_token = content.refresh_token;
      }

      // Cập nhật tokens vào .env
      if (access_token && refresh_token) {
        await this.configService.updateTokens(access_token, refresh_token);
      }

      return { access_token, refresh_token };
    } catch (error) {
      this.logger.error('Request error:', error);
      return { access_token: null, refresh_token: null };
    }
  }

  /**
   * Lấy access_token mới bằng refresh_token (khi access_token hết hạn)
   * API: /api/v2/auth/access_token/get
   */
  async refreshAccessToken(refreshToken?: string): Promise<{
    access_token: string | null;
    refresh_token: string | null;
    expire_in: number | null;
  }> {
    const token = refreshToken || this.configService.refreshToken;

    if (!token) {
      this.logger.error('Không có refresh token');
      return { access_token: null, refresh_token: null, expire_in: null };
    }

    const ts = Math.floor(Date.now() / 1000);
    const body = {
      refresh_token: token,
      shop_id: this.configService.shopId,
      partner_id: this.configService.partnerId,
    };

    const path = '/api/v2/auth/access_token/get';
    const sign = this.httpService.createSignature(
      this.configService.partnerId,
      path,
      ts,
      this.configService.apiKey,
    );

    const queryParams = {
      partner_id: this.configService.partnerId.toString(),
      timestamp: ts.toString(),
      sign: sign,
    };

    try {
      const content = await this.httpService.postRequest(path, body, queryParams);

      // Parse response
      if (content.error) {
        const error_code = content.error || '';
        const error_msg = content.message || '';
        this.logger.error(`Error: ${error_code} - ${error_msg}`);
        
        // Kiểm tra nếu refresh token hết hạn
        if (error_code === 'error_auth' || error_code === 'invalid_refresh_token' || error_msg.includes('refresh')) {
          this.logger.error('⚠️  Refresh token đã hết hạn (sau 30 ngày không refresh)');
          this.logger.error('⚠️  Cần đăng nhập lại để lấy authorization code mới');
          this.logger.error('⚠️  Sử dụng: GET /api/shopee/auth/url để lấy URL đăng nhập');
        }
        
        return { access_token: null, refresh_token: null, expire_in: null };
      }

      // Response thành công
      const new_access_token = content.access_token;
      const new_refresh_token = content.refresh_token;
      const expire_in = content.expire_in; // Thời gian hết hạn (seconds)

      // Cập nhật tokens vào .env
      if (new_access_token && new_refresh_token) {
        await this.configService.updateTokens(new_access_token, new_refresh_token);
        this.logger.log('✅ Đã cập nhật tokens vào file .env');
      }

      return {
        access_token: new_access_token,
        refresh_token: new_refresh_token,
        expire_in,
      };
    } catch (error) {
      this.logger.error('Request error:', error);
      return { access_token: null, refresh_token: null, expire_in: null };
    }
  }
}

