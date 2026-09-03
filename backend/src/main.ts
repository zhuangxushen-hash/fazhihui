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
    // 增量补列：documents.visible_to_client（B端上传可选「展示给C端客户」）
    // 已有生产库不会随 synchronize 加列，启动时检测并自动 ALTER
    try {
      const docCols = await dataSource.query(`PRAGMA table_info(documents)`);
      if (Array.isArray(docCols) && docCols.length > 0 && !docCols.some((c: any) => c.name === 'visible_to_client')) {
        await dataSource.query(
          `ALTER TABLE documents ADD COLUMN visible_to_client boolean NOT NULL DEFAULT 0`
        );
        console.log('[生产环境] documents 表已补充 visible_to_client 列');
      }
    } catch (e) {
      console.warn('[生产环境] documents.visible_to_client 补列检查失败，请手动执行 ALTER TABLE', e);
    }
    // 新流程（线索→发合同→签约完成生成案件）：contracts.case_supplement / signing_compliance.lead_id、contract_id
    try {
      const cCols = await dataSource.query(`PRAGMA table_info(contracts)`);
      if (Array.isArray(cCols) && cCols.length > 0 && !cCols.some((c: any) => c.name === 'case_supplement')) {
        await dataSource.query(`ALTER TABLE contracts ADD COLUMN case_supplement text`);
        console.log('[生产环境] contracts 表已补充 case_supplement 列');
      }
      if (Array.isArray(cCols) && cCols.length > 0 && !cCols.some((c: any) => c.name === 'case_no')) {
        await dataSource.query(`ALTER TABLE contracts ADD COLUMN case_no varchar`);
        console.log('[生产环境] contracts 表已补充 case_no 列（发合同时预生成案件编号）');
      }
    } catch (e) {
      console.warn('[生产环境] contracts 补列检查失败，请手动执行 ALTER TABLE', e);
    }
    try {
      const sCols = await dataSource.query(`PRAGMA table_info(signing_compliance)`);
      if (Array.isArray(sCols) && sCols.length > 0) {
        if (!sCols.some((c: any) => c.name === 'lead_id')) {
          await dataSource.query(`ALTER TABLE signing_compliance ADD COLUMN lead_id varchar`);
          console.log('[生产环境] signing_compliance 表已补充 lead_id 列');
        }
        if (!sCols.some((c: any) => c.name === 'contract_id')) {
          await dataSource.query(`ALTER TABLE signing_compliance ADD COLUMN contract_id varchar`);
          console.log('[生产环境] signing_compliance 表已补充 contract_id 列');
        }
      }
    } catch (e) {
      console.warn('[生产环境] signing_compliance 补列检查失败，请手动执行 ALTER TABLE', e);
    }
    // 案件状态字典（组织级自定义）建表
    try {
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS case_status_configs (
          id varchar PRIMARY KEY,
          organization_id varchar NOT NULL,
          name varchar NOT NULL,
          code varchar NOT NULL,
          kind varchar DEFAULT 'neutral',
          sort_order integer DEFAULT 0,
          enabled boolean DEFAULT 1,
          is_default boolean DEFAULT 0,
          created_at datetime DEFAULT CURRENT_TIMESTAMP,
          updated_at datetime DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await dataSource.query(`CREATE INDEX IF NOT EXISTS idx_case_status_configs_org ON case_status_configs (organization_id)`);
      console.log('[生产环境] case_status_configs 表已就绪');
    } catch (e) {
      console.warn('[生产环境] case_status_configs 建表失败，请手动建表', e);
    }
  }

  await app.listen(process.env.PORT || 3000);
}
bootstrap();

