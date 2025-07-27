// resend.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly discordWebhookUrl: string;
  private readonly signingSecret: string;

  constructor(private readonly configService: ConfigService) {
    const discordUrl = this.configService.get<string>(
      'RESEND_DISCORD_WEBHOOK_URL',
    );
    const resendSecret = this.configService.get<string>(
      'RESEND_WEBHOOK_SIGNING_SECRET',
    );

    if (!discordUrl || !resendSecret) {
      this.logger.error(
        '❌ Variáveis de ambiente RESEND_DISCORD_WEBHOOK_URL e RESEND_WEBHOOK_SIGNING_SECRET não estão definidas',
      );
      throw new Error(
        'RESEND_DISCORD_WEBHOOK_URL and RESEND_WEBHOOK_SIGNING_SECRET must be set in environment variables',
      );
    }

    this.discordWebhookUrl = discordUrl;
    this.signingSecret = resendSecret;
  }

  verifySignature(signature: string, rawBody: Buffer): boolean {
    const hmac = crypto
      .createHmac('sha256', this.signingSecret)
      .update(rawBody)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature, 'hex');
    const hmacBuffer = Buffer.from(hmac, 'hex');

    if (signatureBuffer.length !== hmacBuffer.length) {
      this.logger.warn(
        `❌ Tamanhos diferentes: assinatura=${signatureBuffer.length}, hmac=${hmacBuffer.length}`,
      );
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, hmacBuffer);
  }

  async processWebhook(signature: string, rawBody: Buffer): Promise<void> {
    if (!this.verifySignature(signature, rawBody)) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(rawBody.toString('utf8')); // Parse manual
    const { type, data } = payload;

    await axios.post(this.discordWebhookUrl, {
      content: `📬 Evento recebido do Resend: \`${type}\`\n\`\`\`json\n${JSON.stringify(
        data,
        null,
        2,
      )}\n\`\`\``,
    });
  }
}
