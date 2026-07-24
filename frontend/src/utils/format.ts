export function formatDate(dateStr: string | Date): string {
  if (!dateStr) return '-';
  const dateStrNormalized = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
  const date = typeof dateStrNormalized === 'string' ? new Date(dateStrNormalized) : dateStrNormalized;
  if (isNaN(date.getTime())) return '-';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTime(dateStr: string | Date): string {
  if (!dateStr) return '-';
  const dateStrNormalized = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
  const date = typeof dateStrNormalized === 'string' ? new Date(dateStrNormalized) : dateStrNormalized;
  if (isNaN(date.getTime())) return '-';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}