import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { rawBodyMiddleware } from './common/middleware/raw-body.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use('/resend', rawBodyMiddleware);

  const config = new DocumentBuilder()
    .setTitle('API de Webhooks - anuness.dev')
    .setDescription(
      'API para receber e processar webhooks da Resend e notificar o Discord.',
    )
    .setVersion('1.0')
    .addTag('Webhooks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
