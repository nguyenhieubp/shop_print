import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ShopeeConfigService {
  constructor(private configService: ConfigService) {}

  get shopId(): number {
    return parseInt(this.configService.get<string>('SHOP_ID') || '1306398160');
  }

  get partnerId(): number {
    return parseInt(this.configService.get<string>('PARTNER_ID') || '2013772');
  }

  get apiKey(): string {
    return this.configService.get<string>('API_KEY') || '';
  }

  get apiHost(): string {
    return this.configService.get<string>('API_HOST') || 'partner.shopeemobile.com';
  }

  get redirectUrl(): string {
    return this.configService.get<string>('REDIRECT_URL') || 'https://chando-himalaya.vn/';
  }

  get accessToken(): string {
    return this.configService.get<string>('ACCESS_TOKEN') || '';
  }

  get refreshToken(): string {
    return this.configService.get<string>('REFRESH_TOKEN') || '';
  }

  get authCode(): string {
    return this.configService.get<string>('AUTH_CODE') || '';
  }

  async updateTokens(accessToken: string, refreshToken: string): Promise<void> {
    // Update environment variables in .env file
    const fs = require('fs');
    const path = require('path');
    
    const envPath = path.join(process.cwd(), '.env');
    
    try {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update ACCESS_TOKEN
      if (envContent.includes('ACCESS_TOKEN=')) {
        envContent = envContent.replace(/ACCESS_TOKEN=.*/g, `ACCESS_TOKEN=${accessToken}`);
      } else {
        envContent += `\nACCESS_TOKEN=${accessToken}`;
      }
      
      // Update REFRESH_TOKEN
      if (envContent.includes('REFRESH_TOKEN=')) {
        envContent = envContent.replace(/REFRESH_TOKEN=.*/g, `REFRESH_TOKEN=${refreshToken}`);
      } else {
        envContent += `\nREFRESH_TOKEN=${refreshToken}`;
      }
      
      fs.writeFileSync(envPath, envContent, 'utf8');
    } catch (error) {
      console.error('⚠️  Không thể cập nhật file .env:', error.message);
    }
  }
}

