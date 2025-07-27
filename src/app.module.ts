import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResendModule } from './resend/resend.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ResendModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
