import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  // CORS 白名单模式：从环境变量读取允许的来源，开发环境默认允许本地
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost:5174'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });
  app.setGlobalPrefix('api');

  // 生产环境首次启动时自动建表（synchronize 已关闭，需手动执行 schema 同步）
  // 通过检测核心表是否存在判断是否首次启动，避免重复建表
  if (process.env.NODE_ENV === 'production') {
    const dataSource = app.get(DataSource);
    const result = await dataSource.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='users'`
    );
    if (!result || result.length === 0) {
      console.log('[生产环境] 首次启动，正在自动建表...');
      await dataSource.synchronize();
      console.log('[生产环境] 建表完成');
    }
  }

  await app.listen(process.env.PORT || 3000);
}
bootstrap();

