import { Module } from '@nestjs/common';
import { ResendController } from './resend.controller';
import { ResendService } from './resend.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [ResendController],
  providers: [ResendService],
})
export class ResendModule {}
