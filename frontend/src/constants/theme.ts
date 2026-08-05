// 主题色常量定义（与 index.css 的 CSS 变量保持一致）
// 用于在 TS/TSX 中引用主题色，避免硬编码颜色值

export const theme = {
  // === 主色蓝 (Material Design 3 Primary) ===
  primary: '#0071e3',
  primaryDark: '#0059b5',
  primaryLight: '#abc7ff',
  onPrimary: '#ffffff',

  // === 功能色 ===
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#ba1a1a',
  danger: '#ba1a1a',
  info: '#0071e3',
  link: '#0059b5',

  // === 文本色 ===
  textBase: '#1a1c1d',
  textSecondary: '#414753',
  textTertiary: '#717785',
  textQuaternary: '#c1c6d6',
  textInverse: '#f0f0f2',

  // === 背景色 ===
  bgLayout: '#f9f9fb',
  bgContainer: '#ffffff',
  bgElevated: '#ffffff',
  bgSpotlight: '#ffffff',
  bgSurface: '#f9f9fb',
  bgSurfaceDim: '#d9dadc',
  bgSurfaceLow: '#f3f3f5',
  bgSurfaceMedium: '#eeeef0',
  bgSurfaceHigh: '#e8e8ea',
  bgSurfaceHighest: '#e2e2e4',

  // === 边框色 ===
  border: '#c1c6d6',
  borderSecondary: '#e2e2e4',
  outline: '#717785',

  // === 深藏青 + 暗金（法律权威色板） ===
  brandDark: '#1A2332',
  brandGold: '#C9A961',

  // === 反色 ===
  inverseSurface: '#2f3132',
  inverseOnSurface: '#f0f0f2',
  inversePrimary: '#abc7ff',

  // === 常用灰阶 ===
  black: '#000000',
  white: '#ffffff',
  grayDark: '#6e6e73',
  gray: '#86868b',
  grayLight: '#bfbfbf',

  // === Stitch 设计规范：渐变色 ===
  gradientPrimary: 'linear-gradient(135deg, #0059b5 0%, #0071e3 100%)',
  gradientGold: 'linear-gradient(135deg, #c9a961 0%, #e4c278 100%)',
  gradientNavy: 'linear-gradient(180deg, #131c2a 0%, #1a2332 100%)',
  gradientSidebar: 'linear-gradient(180deg, #131c2a 0%, #1a2332 100%)',
  gradientStat1: 'linear-gradient(135deg, #0059b5 0%, #0071e3 100%)',
  gradientStat2: 'linear-gradient(135deg, #c9a961 0%, #e4c278 100%)',
  gradientStat3: 'linear-gradient(135deg, #1a2332 0%, #2f3132 100%)',
  gradientStat4: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',

  // === Stitch 设计规范：阴影 ===
  shadowXs: '0 1px 2px rgba(15, 23, 42, 0.02), 0 1px 1px rgba(15, 23, 42, 0.02)',
  shadowSm: '0 1px 3px rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04)',
  shadowMd: '0 4px 20px rgba(0, 0, 0, 0.08)',
  shadowLg: '0 8px 32px rgba(0, 0, 0, 0.1)',
  cardShadow: '0 1px 3px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.04)',
  modalShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  sidebarShadow: '2px 0 16px rgba(13, 27, 42, 0.15)',

  // === Stitch 组件设计规范 ===
  component: {
    // 输入框规范（对齐 Stitch crm_leads.html）
    input: {
      height: 36,
      paddingX: 12,
      paddingY: 6,
      background: '#ffffff',
      border: '#c1c6d6',
      borderRadius: 8,
      fontSize: 14,
      color: '#1a1c1d',
      focusBorder: '#0071e3',
      focusRing: '0 0 0 2px rgba(0, 113, 227, 0.15)',
      placeholderColor: '#717785',
    },
    // 查询条件筛选栏规范
    filterBar: {
      background: '#f9f9fb',
      border: '#e2e2e4',
      borderRadius: 12,
      padding: '16px 20px',
      gap: 12,
      marginBottom: 16,
    },
    // 图表卡片容器规范
    chartCard: {
      background: '#ffffff',
      border: '#c1c6d6',
      borderRadius: 12,
      padding: 24,
      height: 400,
      titleColor: '#1a1c1d',
      titleFont: "'Noto Serif SC', serif",
      titleSize: 18,
      subtitleColor: '#414753',
      actionColor: '#0071e3',
    },
    // 表格规范（对齐 Stitch crm_leads.html）
    table: {
      headerBackground: '#f3f3f5',
      headerColor: '#414753',
      headerFontSize: 12,
      headerFontWeight: 500,
      headerPadding: '12px 16px',
      rowBorderColor: '#e2e2e4',
      cellPadding: '12px 16px',
      cellColor: '#1a1c1d',
      hoverBackground: '#F0F7FF',
      fontSize: 14,
    },
    // 标签/徽标规范
    tag: {
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 12,
      background: '#e8e8ea',
      color: '#1a1c1d',
      border: '#c1c6d6',
    },
    // 按钮规范
    button: {
      primaryBg: '#0071e3',
      primaryColor: '#ffffff',
      primaryHoverBg: '#0059b5',
      borderRadius: 8,
      paddingX: 12,
      paddingY: 6,
      fontSize: 14,
      fontWeight: 500,
      secondaryBg: 'transparent',
      secondaryColor: '#414753',
      secondaryBorder: '#c1c6d6',
      secondaryHoverBg: '#f3f3f5',
    },
    // KPI卡片规范
    kpiCard: {
      borderRadius: 12,
      padding: 20,
      titleFontSize: 12,
      titleColor: 'rgba(255, 255, 255, 0.85)',
      valueFontSize: 30,
      valueFont: "'Noto Serif SC', serif",
      iconSize: 48,
      iconBg: 'rgba(255, 255, 255, 0.2)',
    },
    // 分页器规范
    pagination: {
      itemBg: '#ffffff',
      itemBorder: '#c1c6d6',
      itemColor: '#1a1c1d',
      activeBg: '#0071e3',
      activeColor: '#ffffff',
      activeBorder: '#0071e3',
      borderRadius: 6,
      itemSize: 32,
    },
  },
} as const

// 状态色映射（用于 Tag、Badge 等状态展示）
export const statusColors = {
  success: '#52c41a',
  processing: '#1677ff',
  warning: '#faad14',
  error: '#ff4d4f',
  default: '#8c8c8c',
  pending: '#faad14',
  approved: '#52c41a',
  rejected: '#ff4d4f',
  active: '#52c41a',
  inactive: '#8c8c8c',
} as const

// 平台色板（用于广告账号/社交账号标识）
export const platformColors: Record<string, string> = {
  douyin: '#000000',
  kuaishou: '#ff4906',
  baidu: '#2932e1',
  wechat: '#07c160',
  weibo: '#e6162d',
  xiaohongshu: '#ff2442',
  feishu: '#00d6b9',
  wework: '#07c160',
}
