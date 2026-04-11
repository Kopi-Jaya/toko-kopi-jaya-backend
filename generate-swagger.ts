/**
 * Generates Swagger/OpenAPI JSON without a live DB connection.
 * Monkey-patches TypeORM DataSource to skip the real MySQL connection.
 * Usage: npx ts-node -r tsconfig-paths/register generate-swagger.ts
 */

// ─── Patch TypeORM BEFORE any NestJS imports ───────────────────────────────
import 'reflect-metadata';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const typeorm = require('typeorm');

/** Fake repository with no-op methods — enough to satisfy DI */
const fakeRepo = new Proxy(
  {},
  {
    get: (_target, prop) => {
      if (prop === 'then') return undefined; // not a promise
      return (..._args: unknown[]) => Promise.resolve(null);
    },
  },
);

/** Fake EntityManager */
const fakeManager = new Proxy(
  {},
  {
    get: (_target, prop) => {
      if (prop === 'then') return undefined;
      if (prop === 'getRepository') return () => fakeRepo;
      if (prop === 'connection') return fakeDataSource;
      return (..._args: unknown[]) => Promise.resolve(null);
    },
  },
);

/** Fake DataSource */
const fakeDataSource = {
  isInitialized: true,
  manager: fakeManager,
  initialize: async () => fakeDataSource,
  destroy: async () => {},
  getRepository: () => fakeRepo,
  getMetadata: () => ({ tableName: '', columns: [], relations: [] }),
  hasMetadata: () => false,
};

// Patch DataSource.prototype.initialize to return a "connected" fake
typeorm.DataSource.prototype.initialize = async function () {
  this.isInitialized = true;
  this.manager = fakeManager;
  this.driver = {
    connect: async () => {},
    disconnect: async () => {},
    afterConnect: async () => {},
    createQueryRunner: () => fakeRepo,
  };
  return this;
};

// Patch DataSource.prototype.getRepository to return the fake repo
typeorm.DataSource.prototype.getRepository = function () {
  return fakeRepo;
};

// Patch DataSource.prototype.getMetadata to not throw
typeorm.DataSource.prototype.getMetadata = function () {
  return { tableName: 'fake', columns: [], relations: [], name: 'fake' };
};
typeorm.DataSource.prototype.hasMetadata = function () {
  return false;
};

// ─── Now safe to import NestJS ──────────────────────────────────────────────
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generate() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
    abortOnError: false,
  });

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Toko Kopi Jaya API')
    .setDescription(
      'API documentation for Toko Kopi Jaya CRM and Ordering System',
    )
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

  const document = SwaggerModule.createDocument(app, config);

  const outPath = path.join(__dirname, 'toko-kopi-jaya-api.json');
  fs.writeFileSync(outPath, JSON.stringify(document, null, 2), 'utf8');

  console.log('\n✅  OpenAPI spec saved:');
  console.log(`   ${outPath}`);
  console.log('\n   Postman: File > Import > select the file above');
  console.log(
    '   Swagger UI: http://localhost:3000/api/docs  (when backend is running)\n',
  );

  await app.close();
  process.exit(0);
}

generate().catch((err) => {
  console.error('Failed:', err?.message ?? err);
  process.exit(1);
});
