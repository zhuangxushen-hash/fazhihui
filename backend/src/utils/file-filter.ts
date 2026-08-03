import { Request } from 'express';

// 允许的文件扩展名白名单
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xlsx', '.xls'];
// 单文件最大大小：20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

/**
 * Multer 文件过滤函数：仅允许白名单内的文件类型
 */
export function imageFileFilter(
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const originalName = file.originalname.toLowerCase();
  const ext = originalName.substring(originalName.lastIndexOf('.'));
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    callback(null, true);
  } else {
    callback(new Error(`不支持的文件类型: ${ext}，仅支持 ${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }
}

/**
 * Multer 文件大小限制配置
 */
export const fileLimits = {
  fileSize: MAX_FILE_SIZE,
};
