import { IsOptional, IsString, IsNumber, IsEnum, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum OrderStatus {
  ALL = 'ALL',
  UNPAID = 'UNPAID',
  READY_TO_SHIP = 'READY_TO_SHIP',
  PROCESSED = 'PROCESSED',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  IN_CANCEL = 'IN_CANCEL',
}

export class GetOrdersDto {
  @ApiPropertyOptional({ description: 'Số ngày (1-365), mặc định 7', example: 7, minimum: 1, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  days?: number;

  @ApiPropertyOptional({ description: 'Trạng thái đơn hàng', enum: OrderStatus, example: OrderStatus.ALL })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Số lượng đơn hàng mỗi trang (1-100), mặc định 20', example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ description: 'Cursor cho pagination', example: '5' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Timestamp bắt đầu (Unix timestamp)', example: 1764213165 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  timeFrom?: number;

  @ApiPropertyOptional({ description: 'Timestamp kết thúc (Unix timestamp)', example: 1764213165 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  timeTo?: number;

  @ApiPropertyOptional({ description: 'Lấy chi tiết đầy đủ đơn hàng (sản phẩm, giá, v.v.)', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDetails?: boolean;
}

