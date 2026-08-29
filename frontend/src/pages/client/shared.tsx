/**
 * C 端（小程序）页面共享模块
 * 统一案件状态文案/配色/进度、案件类型图标、通用原子组件，避免各页面各写一套。
 * 取值对齐设计稿「法智汇-C端重设计方案」。
 */
import type { CSSProperties, ReactNode } from 'react'

/* ============================ 案件状态 ============================ */

/** 案件状态 → 文案 */
export const CASE_STATUS_LABELS: Record<string, string> = {
  pending_assign: '待分配',
  processing: '处理中',
  filing: '立案阶段',
  evidence: '举证阶段',
  hearing: '审理中',
  appeal: '上诉阶段',
  pending_close: '待结案',
  closed: '已结案',
}

/** 案件状态 → 进度百分比 */
export const CASE_STATUS_PROGRESS: Record<string, number> = {
  pending_assign: 10,
  processing: 30,
  filing: 45,
  evidence: 60,
  hearing: 68,
  appeal: 85,
  pending_close: 92,
  closed: 100,
}

/** 状态色系：藏蓝=办理中，金色=待办/风险，绿色=已完成 */
export type StatusTone = 'primary' | 'gold' | 'success'

/** 案件状态 → 色系 */
export const CASE_STATUS_TONE: Record<string, StatusTone> = {
  pending_assign: 'gold',
  processing: 'primary',
  filing: 'primary',
  evidence: 'primary',
  hearing: 'primary',
  appeal: 'gold',
  pending_close: 'gold',
  closed: 'success',
}

/** 色系 → 标签底色 / 文字色 / 进度条色 / 头像色 / 进度百分比文字色 */
export const TONE_COLORS: Record<
  StatusTone,
  { bg: string; color: string; bar: string; avatar: string; percent: string }
> = {
  primary: { bg: '#EEF2FB', color: '#1E3A8A', bar: '#D97706', avatar: '#1E3A8A', percent: '#B45309' },
  gold: { bg: '#FEF3C7', color: '#B45309', bar: '#D97706', avatar: '#475569', percent: '#B45309' },
  success: { bg: '#E7F6EF', color: '#059669', bar: '#059669', avatar: '#059669', percent: '#059669' },
}

export function caseStatusLabel(status?: string): string {
  return CASE_STATUS_LABELS[status || ''] || status || '处理中'
}

export function caseStatusTone(status?: string): StatusTone {
  return CASE_STATUS_TONE[status || ''] || 'primary'
}

export function caseStatusProgress(status?: string): number {
  return CASE_STATUS_PROGRESS[status || ''] ?? 30
}

/** 案件是否处于「办理中」（未结案） */
export function isCaseActive(status?: string): boolean {
  return status !== 'closed'
}

/* ============================ 案件类型图标 ============================ */

const ICON_PATHS: Record<string, ReactNode> = {
  // 婚姻家事 —— 心
  marriage: <path d="M12 20.5S4.5 15.9 4.5 10.8A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.8c0 5.1-7.5 9.7-7.5 9.7Z" />,
  // 交通事故 —— 车
  traffic: (
    <>
      <path d="M4.5 16.5h15" />
      <path d="M6 16.5v1.2a1 1 0 0 1-1 1H4.2a1 1 0 0 1-1-1v-3.4l1.6-4.4A2 2 0 0 1 6.7 8.2h10.6a2 2 0 0 1 1.9 1.4l1.6 4.3v3.4a1 1 0 0 1-1 1h-.8a1 1 0 0 1-1-1v-1.8" />
      <path d="M6.4 12.4h11.2" />
    </>
  ),
  // 劳动争议 —— 公文包
  labor: (
    <>
      <path d="M9 7.5V5.8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.7" />
      <path d="M4.2 7.5h15.6a1 1 0 0 1 1 1v9.8a2 2 0 0 1-2 2H5.2a2 2 0 0 1-2-2V8.5a1 1 0 0 1 1-1Z" />
      <path d="M3.4 12.6h17.2" />
    </>
  ),
  // 债务纠纷 —— 钱币
  debt: (
    <>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="M8.8 8.6 12 13l3.2-4.4" />
      <path d="M12 13v4" />
      <path d="M9.4 12.6h5.2" />
      <path d="M9.4 15h5.2" />
    </>
  ),
  // 其他 —— 文件
  other: (
    <>
      <path d="M14 3.2V8h4.8" />
      <path d="M6 3.2h8l5 5v12.6H6z" />
    </>
  ),
}

/**
 * 案件类型图标（线性，20×20，描边继承 currentColor）
 */
export function CaseTypeIcon({
  caseType,
  size = 20,
  color = '#1E3A8A',
}: {
  caseType?: string | null
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      {ICON_PATHS[caseType || ''] || ICON_PATHS.other}
    </svg>
  )
}

/* ============================ 通用原子组件 ============================ */

/** 胶囊标签：底色 + 文字色 + 圆角 99 */
export function Pill({
  bg,
  color,
  children,
  style,
}: {
  bg: string
  color: string
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3px 10px',
        borderRadius: 99,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/** 案件阶段标签（按状态自动取色） */
export function CaseStatusPill({ status, style }: { status?: string; style?: CSSProperties }) {
  const tone = TONE_COLORS[caseStatusTone(status)]
  return (
    <Pill bg={tone.bg} color={tone.color} style={style}>
      {caseStatusLabel(status)}
    </Pill>
  )
}

/** 进度条：轨道 6px 圆角 3，填充按色系 */
export function ProgressBar({
  percent,
  color = '#D97706',
  trackColor = '#E2E8F0',
}: {
  percent: number
  color?: string
  trackColor?: string
}) {
  return (
    <div
      style={{
        flex: 1,
        height: 6,
        borderRadius: 3,
        background: trackColor,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          height: '100%',
          borderRadius: 3,
          background: color,
          transition: 'width .3s ease',
        }}
      />
    </div>
  )
}

/** 白底圆角卡片（设计稿统一 radius 16） */
export function Card({
  children,
  style,
  onClick,
}: {
  children: ReactNode
  style?: CSSProperties
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** 空状态 */
export function EmptyState({ icon, title, desc }: { icon?: ReactNode; title: string; desc?: string }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      {icon ? <div style={{ fontSize: 40, color: '#CBD5E1', marginBottom: 12 }}>{icon}</div> : null}
      <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{title}</div>
      {desc ? <div style={{ marginTop: 6, fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>{desc}</div> : null}
    </div>
  )
}
