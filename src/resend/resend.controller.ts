import { Controller, Post, Req, Headers, HttpCode, Body } from '@nestjs/common';
import { ResendService } from './resend.service';
import { Request } from 'express';

@Controller('resend')
export class ResendController {
  constructor(private readonly resendService: ResendService) {}

  @Post('resend')
  @HttpCode(200)
  async handleResendWebhook(
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    const rawBody = (req as any).rawBody;
    return this.resendService.handleWebhook({ headers, rawBody });
  }
}
