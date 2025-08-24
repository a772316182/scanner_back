import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  if (process.arch !== 'x64') {
    throw new Error(
      'Unsupported architecture current, please use x86_64 architecture',
    );
  }
  if (process.platform !== 'linux') {
    throw new Error('Unsupported platform current, please use Linux');
  }

  logger.log(
    `Bootstrap initialization, USER: ${process.env.USER}, OS: ${process.platform}, Arch: ${process.arch}`,
  );

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000).then(() => {
    new Logger('Bootstrap').log(
      `Nest application started on port ${process.env.PORT ?? 3000}`,
    );
  });
}
bootstrap();
