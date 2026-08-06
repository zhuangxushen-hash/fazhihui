/**
 * 修复证据文件缺失：为 evidences 表生成真实示例文件并更新 file_path
 * 用法: node fix-evidence-files.js <数据库路径> [文件根目录]
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = process.argv[2];
if (!dbPath) { console.error('用法: node fix-evidence-files.js <数据库路径>'); process.exit(1); }
// 文件存放根目录（服务器 cwd=/home/ubuntu/fazhihui）
const FILE_ROOT = process.argv[3] || path.join(process.cwd(), 'uploads', 'evidences', 'sample');

const db = new Database(dbPath);

// 生成最小合法 PDF 文件
function createSamplePdf(filePath, title) {
  const content = [
    '%PDF-1.4',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    '4 0 obj << /Length 60 >> stream',
    'BT /F1 18 Tf 72 720 Td (' + title + ') Tj ET',
    'endstream endobj',
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    'trailer << /Root 1 0 R >>',
    '%%EOF',
  ].join('\n');
  fs.writeFileSync(filePath, Buffer.from(content, 'latin1'));
}

fs.mkdirSync(FILE_ROOT, { recursive: true });

const evidences = db.prepare('SELECT id, name, file_path, case_id FROM evidences').all();
console.log('证据记录数:', evidences.length);
let fixed = 0;
for (const ev of evidences) {
  // 提取文件名（保留原始扩展名，默认 pdf）
  const origName = ev.name || 'evidence';
  const ext = (origName.includes('.') ? path.extname(origName) : '.pdf') || '.pdf';
  const safeName = origName.replace(/[\\/:*?"<>|\s]+/g, '_') + ext;
  const realPath = path.join(FILE_ROOT, safeName);
  if (!fs.existsSync(realPath)) {
    createSamplePdf(realPath, origName);
  }
  // 更新 file_path 为真实路径
  if (ev.file_path !== realPath) {
    db.prepare('UPDATE evidences SET file_path = ? WHERE id = ?').run(realPath, ev.id);
    fixed++;
  }
}
console.log('已修复 file_path:', fixed, '条');
console.log('示例文件目录:', FILE_ROOT);
db.close();
console.log('证据文件修复完成');
