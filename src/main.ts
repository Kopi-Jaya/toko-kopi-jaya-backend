import { ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { appValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Static asset serving for product images. The directory is mounted to a
  // host volume in Dokploy so uploads survive redeploys (see Dokploy app
  // config — /app/uploads → host volume).
  const uploadsRoot =
    configService.get<string>('UPLOADS_DIR') ?? join(process.cwd(), 'uploads');
  if (!existsSync(uploadsRoot)) mkdirSync(uploadsRoot, { recursive: true });
  app.useStaticAssets(uploadsRoot, { prefix: '/uploads/' });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  const corsOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Helmet
  app.use(helmet());

  // Global pipes, filters, interceptors.
  //
  // Interceptor order matters. With useGlobalInterceptors([A, B]) the
  // response pipeline runs A's map() LAST (outermost) and B's map()
  // FIRST (innermost, closest to the controller).
  //
  // We need ClassSerializerInterceptor to see the raw Member/Staff
  // instance before TransformInterceptor wraps it in { data: ... }.
  // If TransformInterceptor runs first, ClassSerializerInterceptor
  // only sees a plain `{ data: <entity> }` wrapper and doesn't recurse
  // into `data`, so @Exclude()'d fields (like Member.password) leak
  // through into the JSON response (M-002 / DEFECT-002).
  //
  // Order therefore: TransformInterceptor outer, ClassSerializerInterceptor
  // inner -> entity is serialized first (password stripped), THEN wrapped.
  app.useGlobalPipes(appValidationPipe);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Toko Kopi Jaya API')
    .setDescription('API documentation for Toko Kopi Jaya CRM and Ordering System')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Start — bind explicitly to 0.0.0.0 so the Android emulator's
  // 10.0.2.2 (IPv4) can reach us. Node's default on Windows binds
  // to '::' (IPv6 only), which the emulator cannot translate to.
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`Application running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
