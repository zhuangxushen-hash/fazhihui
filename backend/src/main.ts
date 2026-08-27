import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import helmet from 'helmet';

// 全局异常过滤器：HttpException 按原样透传；其他未捕获异常统一转为 500，
// 并在响应体中保留业务错误信息，避免前端只能显示笼统的“服务器异常”提示
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    const message = exception instanceof Error && exception.message
      ? exception.message
      : '服务器内部错误';
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
    });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  // CORS 白名单模式：从环境变量读取允许的来源，开发环境默认允许本地
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:8080', 'http://127.0.0.1:8080'];
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

