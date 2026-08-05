// 常用魔法数字常量定义（避免代码中硬编码数字）

// === 时间间隔（毫秒） ===
export const INTERVAL = {
  SECOND: 1000,
  HALF_MINUTE: 30000,
  MINUTE: 60000,
  HOUR: 3600000,
  // 数据大屏刷新间隔
  DATA_SCREEN_REFRESH: 30000,
  // 时钟刷新间隔
  CLOCK_TICK: 1000,
  // 计时器精度
  TIMER_PRECISION: 100,
} as const

// === 超时时间（毫秒） ===
export const TIMEOUT = {
  DEFAULT: 10000,
  LONG: 30000,
} as const

// === 分页 ===
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  LARGE_PAGE_SIZE: 50,
  SMALL_PAGE_SIZE: 10,
} as const

// === 表格列宽 ===
export const COL_WIDTH = {
  XS: 80,
  SM: 100,
  MD: 140,
  LG: 180,
  XL: 220,
  XXL: 280,
  ACTION: 160,
} as const

// === 弹窗宽度 ===
export const MODAL_WIDTH = {
  SM: 480,
  MD: 600,
  LG: 800,
  XL: 1000,
  XXL: 1200,
} as const

// === 文件大小（字节） ===
export const FILE_SIZE = {
  KB: 1024,
  MB: 1024 * 1024,
  // 上传限制
  MAX_UPLOAD_MB: 10,
  MAX_IMAGE_MB: 5,
} as const

// === 计时器预设（分钟） ===
export const TIMER_PRESET = {
  POMODORO: 25,
  SHORT_BREAK: 5,
  LONG_BREAK: 15,
} as const
