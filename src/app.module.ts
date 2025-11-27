import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ShopeeModule } from './shopee/shopee.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
      expandVariables: true,
    }),
    ScheduleModule.forRoot(),
    ShopeeModule,
  ],
})
export class AppModule {}

