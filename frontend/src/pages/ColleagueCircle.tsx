import { useState, useEffect, useCallback } from 'react'
import { Card, Row, Col, Input, Button, Avatar, Tabs, Tag, List, message, Popconfirm, Empty } from 'antd'
import {
  LikeOutlined,
  CommentOutlined,
  ShareAltOutlined,
  TeamOutlined,
  FireOutlined,
  SendOutlined,
  BulbOutlined,
  FileTextOutlined,
  CalendarOutlined,
  SolutionOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDateTime } from '../utils/format'
import {
  getPosts,
  createPost,
  deletePost,
  getComments,
  addComment,
  likePost,
  unlikePost,
} from '../api/social'
import { getUsers } from '../api/user'

const { TextArea } = Input

// 动态类型选项（与后端 PostType 对齐）
const postTypeOptions = [
  { value: 'normal', label: '日常' },
  { value: 'case_share', label: '案例分享' },
  { value: 'experience', label: '经验' },
  { value: 'knowledge', label: '知识' },
]

const typeLabelMap: Record<string, { className: string }> = {
  normal: { className: 'stitch-tag stitch-tag-primary' },
  case_share: { className: 'stitch-tag stitch-tag-success' },
  experience: { className: 'stitch-tag stitch-tag-warning' },
  knowledge: { className: 'stitch-tag stitch-tag-info' },
}

const typeLabelText: Record<string, string> = {
  normal: '日常',
  case_share: '案例分享',
  experience: '经验',
  knowledge: '知识',
}

const statusColorMap: Record<string, string> = { '在线': theme.success, '忙碌': theme.warning, '离线': theme.textTertiary }

export default function ColleagueCircle() {
  const [posts, setPosts] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [newPost, setNewPost] = useState({ content: '', post_type: 'normal' })
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  const [commentText, setCommentText] = useState('')
  const [commentingId, setCommentingId] = useState<string | null>(null)
  const [commentsMap, setCommentsMap] = useState<Record<string, Record<string, unknown>[]>>({})
  // 成员列表（右侧在线同事）
  const [members, setMembers] = useState<Record<string, unknown>[]>([])

  // 当前用户
  const [currentUser] = useState(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}')
    return u
  })

  // 加载动态列表
  const fetchPosts = useCallback(async (tab?: string) => {
    setLoading(true)
    try {
      const type = tab || activeTab
      const params: Record<string, unknown> = { page: 1, limit: 50 }
      if (type && type !== 'all') params.post_type = type
      const res = (await getPosts(params as never)) as Record<string, unknown>
      const data = res?.data || []
      setPosts((Array.isArray(data) ? data : []) as Record<string, unknown>[])
    } catch (error) {
      message.error('动态加载失败')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  // 加载成员列表（在线同事）
  const fetchMembers = useCallback(async () => {
    try {
      const res = (await getUsers({})) as unknown as Record<string, unknown>
      const users = (res?.data || []) as Record<string, unknown>[]
      setMembers(users.slice(0, 10))
    } catch (error) {
      // 成员列表加载失败不影响主流程，错误已由拦截器统一处理
    }
  }, [])

  useEffect(() => {
    fetchPosts()
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tab 切换
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    fetchPosts(key)
  }

  // 发布动态
  const handlePublish = async () => {
    if (!newPost.content.trim()) {
      message.warning('请输入动态内容')
      return
    }
    try {
      await createPost({ content: newPost.content, post_type: newPost.post_type })
      message.success('动态发布成功')
      setNewPost({ content: '', post_type: 'normal' })
      fetchPosts()
    } catch (error) {
      message.error('发布失败')
    }
  }

  // 点赞/取消点赞
  const handleLike = async (post: Record<string, unknown>) => {
    try {
      await likePost(String(post.id))
      message.success('已点赞')
      fetchPosts()
    } catch (error) {
      try {
        await unlikePost(String(post.id))
        message.success('已取消点赞')
        fetchPosts()
      } catch (err) {
        message.error('操作失败')
      }
    }
  }

  // 加载评论列表
  const loadComments = async (postId: string) => {
    try {
      const res = (await getComments(postId)) as Record<string, unknown>
      const data = res?.data || res || []
      setCommentsMap((prev) => ({ ...prev, [postId]: (Array.isArray(data) ? data : []) as Record<string, unknown>[] }))
    } catch (error) {
      setCommentsMap((prev) => ({ ...prev, [postId]: [] }))
    }
  }

  // 展开/收起评论
  const toggleComments = async (postId: string) => {
    const next = { ...showComments, [postId]: !showComments[postId] }
    setShowComments(next)
    setCommentingId(postId)
    setCommentText('')
    if (next[postId]) {
      loadComments(postId)
    }
  }

  // 添加评论
  const handleAddComment = async () => {
    if (!commentText.trim() || !commentingId) return
    try {
      await addComment(commentingId, { content: commentText })
      message.success('评论成功')
      setCommentText('')
      loadComments(commentingId)
      fetchPosts()
    } catch (error) {
      message.error('评论失败')
    }
  }

  // 删除动态
  const handleDelete = async (id: string) => {
    try {
      await deletePost(id)
      message.success('删除成功')
      fetchPosts()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const tabItems = [
    { key: 'all', label: '全部动态' },
    { key: 'normal', label: '日常' },
    { key: 'case_share', label: '案例分享' },
    { key: 'experience', label: '经验' },
    { key: 'knowledge', label: '知识' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={[16, 16]}>
        {/* 左侧：动态主内容区 */}
        <Col xs={24} lg={16}>
          {/* 发布区 */}
          <Card styles={{ body: { padding: 20 } }} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Avatar size={44} style={{ background: theme.gradientStat1, color: theme.white, flexShrink: 0 }}>
                {String(currentUser.real_name || '我').slice(0, 1)}
              </Avatar>
              <div style={{ flex: 1 }}>
                <TextArea rows={3} placeholder="分享你的工作心得、案例经验..." value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} maxLength={2000} showCount style={{ marginBottom: 12 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <select
                    value={newPost.post_type}
                    onChange={e => setNewPost({ ...newPost, post_type: e.target.value })}
                    style={{ height: 36, borderRadius: 8, border: `1px solid ${theme.border}`, padding: '0 12px' }}
                  >
                    {postTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <Button type="primary" icon={<SendOutlined />} onClick={handlePublish}>发布</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Tab 筛选 */}
          <Card styles={{ body: { padding: 0 } }} style={{ marginBottom: 16 }}>
            <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} style={{ padding: '0 16px' }} tabBarStyle={{ marginBottom: 0 }} />
          </Card>

          {/* 动态列表 */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: theme.textTertiary }}>加载中...</div>
          ) : posts.length === 0 ? (
            <Card style={{ borderRadius: 12 }}>
              <Empty description="暂无动态，快来发布第一条吧" />
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {posts.map((post) => {
                const postId = String(post.id)
                const showCmts = showComments[postId]
                const comments = commentsMap[postId] || []
                const postType = (post.post_type as string) || 'normal'
                return (
                  <Card key={postId} styles={{ body: { padding: 20 } }} style={{ borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar size={40} icon={<UserOutlined />} style={{ background: theme.gradientStat1, color: theme.white }}>
                          {String(post.user_name || '律').slice(0, 1)}
                        </Avatar>
                        <div>
                          <div style={{ fontWeight: 600 }}>{String(post.user_name || '同事')}</div>
                          <div style={{ fontSize: 12, color: theme.textTertiary }}>{formatDateTime(post.created_at as string)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag className={(typeLabelMap[postType] || typeLabelMap.normal).className}>
                          {typeLabelText[postType] || postType}
                        </Tag>
                        {post.user_id === currentUser.id && (
                          <Popconfirm title="确定删除这条动态吗？" onConfirm={() => handleDelete(postId)}>
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        )}
                      </div>
                    </div>

                    <div style={{ color: theme.textBase, lineHeight: 1.7, marginBottom: 12, whiteSpace: 'pre-wrap', fontSize: 14 }}>
                      {String(post.content || '')}
                    </div>

                    {/* 图片 */}
                    {Array.isArray(post.images) && (post.images as string[]).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {(post.images as string[]).map((img: string, idx: number) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`图片${idx + 1}`}
                            style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }}
                          />
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 24, paddingTop: 12, borderTop: `1px solid ${theme.borderSecondary}` }}>
                      <Button type="text" icon={<LikeOutlined />} onClick={() => handleLike(post)} style={{ color: theme.textSecondary }}>
                        {(post.like_count as number) || 0}
                      </Button>
                      <Button type="text" icon={<CommentOutlined />} onClick={() => toggleComments(postId)} style={{ color: theme.textSecondary }}>
                        {(post.comment_count as number) || 0}
                      </Button>
                      <Button type="text" icon={<ShareAltOutlined />} style={{ color: theme.textSecondary }}>分享</Button>
                      <span style={{ lineHeight: '32px', fontSize: 13, color: theme.textTertiary }}>
                        阅读 {(post.view_count as number) || 0}
                      </span>
                    </div>

                    {showCmts && (
                      <div style={{ marginTop: 12, padding: 12, background: theme.bgSurfaceLow, borderRadius: 8 }}>
                        {comments.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            {comments.map((c, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: idx < comments.length - 1 ? 10 : 0 }}>
                                <Avatar size={24} style={{ background: theme.primary, color: theme.white, flexShrink: 0, fontSize: 12 }}>
                                  {String(c.user_name || '律').slice(0, 1)}
                                </Avatar>
                                <div>
                                  <div style={{ fontSize: 12, marginBottom: 2 }}>
                                    <span style={{ fontWeight: 600, color: theme.primary }}>{String(c.user_name || '同事')}</span>
                                    <span style={{ color: theme.textTertiary, marginLeft: 8 }}>{formatDateTime(c.created_at as string)}</span>
                                  </div>
                                  <div style={{ fontSize: 13, color: theme.textSecondary }}>{String(c.content || '')}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Input
                            placeholder="写下你的评论..."
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onPressEnter={handleAddComment}
                            style={{ flex: 1 }}
                          />
                          <Button type="primary" onClick={handleAddComment}>发送</Button>
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </Col>

        {/* 右侧：侧边栏 */}
        <Col xs={24} lg={8}>
          {/* 在线同事 */}
          <Card
            title={<span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, fontWeight: 600 }}><TeamOutlined style={{ color: theme.primary, marginRight: 8 }} />本所同事</span>}
            extra={<Tag className="stitch-tag stitch-tag-success">{members.length} 人</Tag>}
            style={{ marginBottom: 16 }}
          >
            <List
              dataSource={members}
              locale={{ emptyText: '暂无成员' }}
              renderItem={(c) => (
                <List.Item style={{ padding: '10px 0', borderBottom: `1px solid ${theme.borderSecondary}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar size={36} style={{ background: theme.gradientStat1, color: theme.white }}>
                        {String(c.real_name || '律').slice(0, 1)}
                      </Avatar>
                      <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: statusColorMap['在线'], border: `2px solid ${theme.bgContainer}` }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{String(c.real_name || '-')}</div>
                      <div style={{ fontSize: 12, color: theme.textTertiary }}>{String(c.position || c.role || '同事')}</div>
                    </div>
                    <Tag style={{ borderRadius: 999, fontSize: 11, color: statusColorMap['在线'], background: `${statusColorMap['在线']}15`, border: 'none' }}>在线</Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          {/* 热门话题 */}
          <Card title={<span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, fontWeight: 600 }}><FireOutlined style={{ color: theme.error, marginRight: 8 }} />热门话题</span>} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {postTypeOptions.map((opt, i) => {
                const count = posts.filter((p) => p.post_type === opt.value).length
                return (
                  <div
                    key={opt.value}
                    className="hover-lift"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer' }}
                    onClick={() => handleTabChange(opt.value)}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: i < 3 ? theme.primary : theme.bgSurfaceHigh,
                        color: i < 3 ? theme.white : theme.textTertiary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 13 }}>#{opt.label}分享</span>
                    <span style={{ fontSize: 12, color: theme.textTertiary }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* 快捷功能 */}
          <Card title={<span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, fontWeight: 600 }}><BulbOutlined style={{ color: theme.warning, marginRight: 8 }} />快捷功能</span>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { icon: <FileTextOutlined />, label: '案件协作', color: theme.primary },
                { icon: <SolutionOutlined />, label: '知识共享', color: theme.success },
                { icon: <CalendarOutlined />, label: '日程安排', color: theme.warning },
                { icon: <TeamOutlined />, label: '团队活动', color: theme.error },
              ].map((item, idx) => (
                <div key={idx} className="hover-lift" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16, borderRadius: 10, background: `${item.color}10`, cursor: 'pointer' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.white, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, fontSize: 20, marginBottom: 8 }}>{item.icon}</div>
                  <span style={{ fontSize: 12 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
