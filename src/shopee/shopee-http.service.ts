import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as https from 'https';
import { ShopeeConfigService } from './shopee.config';

@Injectable()
export class ShopeeHttpService {
  constructor(private configService: ShopeeConfigService) {}

  /**
   * Tạo signature HMAC-SHA256 (cho auth APIs)
   */
  createSignature(partnerId: number, path: string, timestamp: number, key: string): string {
    const baseStr = partnerId + path + timestamp;
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(baseStr);
    return hmac.digest('hex');
  }

  /**
   * Tạo signature HMAC-SHA256 (cho shop APIs - có access_token)
   */
  createSignatureWithAccessToken(
    partnerId: number,
    path: string,
    timestamp: number,
    accessToken: string,
    shopId: number,
    key: string,
  ): string {
    const baseStr = partnerId + path + timestamp + accessToken + shopId;
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(baseStr);
    return hmac.digest('hex');
  }

  /**
   * Gửi HTTP POST request
   */
  postRequest(path: string, body: any, queryParams: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(body);
      const queryString = new URLSearchParams(queryParams).toString();
      const host = this.configService.apiHost;

      const options = {
        hostname: host,
        path: `${path}?${queryString}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Gửi HTTP GET request với access_token (cho shop APIs)
   */
  getRequestWithAccessToken(path: string, queryParams: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const queryString = new URLSearchParams(queryParams).toString();
      const host = this.configService.apiHost;

      const options = {
        hostname: host,
        path: `${path}?${queryString}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              console.error(`HTTP Status: ${res.statusCode}`);
              console.error('Response:', data.substring(0, 500));
            }

            if (!data.trim().startsWith('{') && !data.trim().startsWith('[')) {
              console.error('Response không phải JSON:', data.substring(0, 500));
              reject(new Error(`Invalid JSON response: ${data.substring(0, 200)}`));
              return;
            }

            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (e) {
            console.error('Parse JSON error. Response:', data.substring(0, 500));
            reject(e);
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.end();
    });
  }
}

