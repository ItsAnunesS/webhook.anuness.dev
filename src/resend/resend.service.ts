import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Webhook } from 'svix';

// Interface para facilitar o manuseio dos dados do webhook
interface WebhookPayload {
  headers: Record<string, string>;
  rawBody: Buffer;
}

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly discordWebhookUrl: string;
  private readonly resendWebhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const discordUrl = this.configService.get<string>(
      'RESEND_DISCORD_WEBHOOK_URL',
    );
    const resendSecret = this.configService.get<string>(
      'RESEND_WEBHOOK_SIGNING_SECRET',
    );

    if (!discordUrl || !resendSecret) {
      throw new Error(
        'As variáveis de ambiente DISCORD_WEBHOOK_URL e RESEND_WEBHOOK_SIGNING_SECRET são obrigatórias.',
      );
    }

    this.discordWebhookUrl = discordUrl;
    this.resendWebhookSecret = resendSecret;
  }

  public async handleWebhook({ headers, rawBody }: WebhookPayload) {
    this.logger.log('Novo webhook do Resend recebido.');

    const payload = this.verifyAndParse(headers, rawBody);
    this.logger.log(`Webhook verificado com sucesso. Tipo de evento: ${payload.type}`);

    this.sendToDiscord(payload).catch(err => {
      this.logger.error('Falha ao enviar mensagem para o Discord.', err.stack);
    });

    return { message: 'Webhook recebido.' };
  }

  private verifyAndParse(
    headers: Record<string, string>,
    rawBody: Buffer,
  ): any {
    try {
      const wh = new Webhook(this.resendWebhookSecret);
      const payload = wh.verify(rawBody.toString(), headers);
      return payload;
    } catch (err) {
      this.logger.error('Falha na verificação do webhook:', err.message);
      throw new UnauthorizedException('Assinatura do webhook inválida.');
    }
  }

  private async sendToDiscord(payload: any): Promise<void> {
    const { type, data } = payload;

    const embed = this.formatDiscordEmbed(type, data);

    if (!embed) {
      this.logger.warn(`Nenhum formato de embed para o evento ${type}. Ignorando.`);
      return;
    }

    const discordPayload = {
      username: 'Resend Notificações',
      avatar_url: 'https://avatars.githubusercontent.com/u/124838633?s=200&v=4', // Logo do Resend
      embeds: [embed],
    };

    try {
      await firstValueFrom(
        this.httpService.post(this.discordWebhookUrl, discordPayload),
      );
      this.logger.log(`Notificação do evento ${type} enviada para o Discord.`);
    } catch (error) {
      this.logger.error(
        `Erro ao enviar webhook para o Discord: ${error.message}`,
        error.response?.data,
      );
      throw error;
    }
  }

  private formatDiscordEmbed(type: string, data: any) {
    let title = `Evento de Email: ${type}`;
    let description = `O email com ID \`${data.email_id}\` foi atualizado.`;
    let color = 0x808080;

    switch (type) {
      case 'email.sent':
        title = '✅ Email Enviado com Sucesso!';
        description = `O email para **${data.to}** com o assunto "**${data.subject}**" foi enviado.`;
        color = 0x00FF00;
        break;
      case 'email.delivered':
        title = '🚚 Email Entregue!';
        description = `O email para **${data.to}** foi entregue com sucesso.`;
        color = 0x0000FF;
        break;
      case 'email.bounced':
        title = '⚠️ Email com Bounce!';
        description = `O email para **${data.to}** falhou (bounce). Motivo: ${data.bounce?.description || 'N/A'}`;
        color = 0xFFA500;
        break;
      case 'email.complained':
        title = '🚫 Reclamação de Spam';
        description = `O destinatário **${data.to}** marcou o email como spam.`;
        color = 0xFF0000;
        break;
      case 'email.opened':
        title = '📬 Email Aberto';
        description = `O destinatário **${data.to}** abriu o email.`;
        color = 0xFFFF00;
        break;
    }

    return {
      title,
      description,
      color,
      footer: {
        text: `Resend Email ID: ${data.email_id}`,
      },
      timestamp: new Date().toISOString(),
    };
  }
}