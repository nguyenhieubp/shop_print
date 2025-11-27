import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ShopeeAuthService } from './shopee-auth.service';

@Injectable()
export class ShopeeScheduler {
  private readonly logger = new Logger(ShopeeScheduler.name);

  constructor(private authService: ShopeeAuthService) { }

  /**
   * Auto refresh token mỗi 1 giờ 50 phút (110 phút)
   */
  @Interval(110 * 60 * 1000) // 110 phút = 1 giờ 50 phút (milliseconds)
  async handleTokenRefresh() {
    this.logger.warn('🔄 Đang refresh access_token...');
    this.logger.warn('Time update: ' + new Date().toISOString());

    const result = await this.authService.refreshAccessToken();

    if (result.access_token) {
      this.logger.warn('✅ Refresh thành công!');
      this.logger.warn(`Access Token: ${result.access_token}`);
      this.logger.warn(`Refresh Token: ${result.refresh_token}`);
      this.logger.warn(
        `Expire In: ${result.expire_in} seconds (${Math.floor(result.expire_in / 3600)} hours)`,
      );
      this.logger.warn('💡 Refresh token đã được gia hạn - sẽ không hết hạn nếu scheduler chạy đều đặn');
    } else {
      this.logger.error('❌ Refresh thất bại!');
      this.logger.error('⚠️  Có thể refresh token đã hết hạn (sau 30 ngày không refresh)');
      this.logger.error('⚠️  Cần đăng nhập lại để lấy code mới: GET /api/shopee/auth/url');
    }
  }
}

