// 敏感数据脱敏工具函数

/**
 * 手机号脱敏：保留前3后4，中间用****替换
 * 例：13812345678 -> 138****5678
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

/**
 * 身份证号脱敏：保留前3后4，中间用*替换
 * 例：110101199001011234 -> 110***********1234
 */
export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 7) return idCard;
  return idCard.slice(0, 3) + '*'.repeat(idCard.length - 7) + idCard.slice(-4);
}

/**
 * 对用户对象进行脱敏处理
 */
export function desensitizeUser(user: any): any {
  if (!user) return user;
  const result = { ...user };
  if (result.phone) {
    result.phone = maskPhone(result.phone);
  }
  if (result.credentials_no) {
    result.credentials_no = maskIdCard(result.credentials_no);
  }
  // password 字段不返回
  delete result.password;
  return result;
}
