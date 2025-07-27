import {
  Controller,
  Post,
  Headers,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { ResendService } from './resend.service';
import { Response, Request } from 'express';

@ApiTags('Resend Webhooks')
@Controller('resend')
export class ResendController {
  constructor(private readonly resendService: ResendService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recebe eventos do Resend e repassa para o Discord',
  })
  @ApiHeader({
    name: 'resend-signature',
    description: 'Assinatura HMAC-SHA256 enviada pelo Resend',
    required: true,
  })
  @ApiBody({
    description: 'Payload do webhook conforme enviado pelo Resend',
    examples: {
      example1: {
        summary: 'Exemplo de evento `email.sent`',
        value: {
          type: 'email.sent',
          data: {
            to: 'andre@example.com',
            from: 'noreply@zephyrus.com',
            subject: 'Bem-vindo!',
            created_at: '2024-01-01T00:00:00.000Z',
            tags: ['boas-vindas'],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Evento processado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Assinatura inválida ou erro de processamento',
  })
  async handleResendWebhook(
    @Headers('resend-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const rawBody = (req as any).rawBody as Buffer;

    try {
      await this.resendService.processWebhook(signature, rawBody);
      return res.sendStatus(200);
    } catch (error) {
      return res.status(400).send('Invalid signature or processing error.');
    }
  }
}
