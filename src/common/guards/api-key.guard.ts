import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Kiểm tra xem endpoint có được đánh dấu là public không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu là public endpoint, bỏ qua authentication
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API Key is required');
    }

    const validApiKey = this.configService.get<string>('API_SECRET_KEY');
    
    if (!validApiKey) {
      // Nếu chưa set API_SECRET_KEY, cho phép tất cả (development mode)
      return true;
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }

  private extractApiKey(request: Request): string | null {
    // Lấy API key từ header
    const apiKeyFromHeader = request.headers['x-api-key'] as string;
    if (apiKeyFromHeader) {
      return apiKeyFromHeader;
    }

    // Hoặc từ query parameter
    const apiKeyFromQuery = request.query['api_key'] as string;
    if (apiKeyFromQuery) {
      return apiKeyFromQuery;
    }

    return null;
  }
}

