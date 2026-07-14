import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { UngDungModule } from './ung-dung.module';

async function bootstrap() {
  const app = await NestFactory.create(UngDungModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🛡️ SafeVoice AI running on http://localhost:${port}`);
}
bootstrap();

