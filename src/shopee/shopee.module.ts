import { Module } from '@nestjs/common';
import { ShopeeConfigService } from './shopee.config';
import { ShopeeHttpService } from './shopee-http.service';
import { ShopeeAuthService } from './shopee-auth.service';
import { ShopeeOrderService } from './shopee-order.service';
import { ShopeeController } from './shopee.controller';
import { ShopeeScheduler } from './shopee.scheduler';

@Module({
  providers: [
    ShopeeConfigService,
    ShopeeHttpService,
    ShopeeAuthService,
    ShopeeOrderService,
    ShopeeScheduler,
  ],
  controllers: [ShopeeController],
  exports: [ShopeeAuthService, ShopeeOrderService],
})
export class ShopeeModule {}

