import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Button,
  Modal,
  Input,
  Select,
  Tabs,
  Avatar,
  Space,
  message,
  Popconfirm,
  List,
  Empty,
  Tag,
} from 'antd'
import {
  LikeOutlined,
  CommentOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  getPosts,
  createPost,
  deletePost,
  getComments,
  addComment,
  likePost,
  unlikePost,
} from '../api/social'
import { formatDateTime } from '../utils/format'

const { TextArea } = Input

// 动态类型选项
const postTypeOptions = [
  { value: 'normal', label: '日常' },
  { value: 'case_share', label: '案例分享' },
  { value: 'experience', label: '经验' },
  { value: 'knowledge', label: '知识' },
]

// 动态类型标签映射
const postTypeLabelMap: Record<string, string> = {
  normal: '日常',
  case_share: '案例分享',
  experience: '经验',
  knowledge: '知识',
}

// 动态类型标签颜色映射
const postTypeColorMap: Record<string, string> = {
  normal: 'blue',
  case_share: 'green',
  experience: 'orange',
  knowledge: 'purple',
}

export default function SocialCircle() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [currentPost, setCurrentPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')
  // 新动态表单
  const [newPost, setNewPost] = useState({
    content: '',
    post_type: 'normal',
    images: '',
  })
  // 当前用户
  const [currentUser] = useState(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}')
    return u
  })

  // 加载动态列表
  const loadPosts = useCallback(
    async (tab?: string) => {
      const type = tab || activeTab
      setLoading(true)
      try {
        const params: any = { page: 1, limit: 50 }
        if (type && type !== 'all') params.post_type = type
        const res: any = await getPosts(params)
        const data = res?.data || res || []
        setPosts(Array.isArray(data) ? data : data.data || [])
      } catch {
        message.error('加载动态失败')
      } finally {
        setLoading(false)
      }
    },
    [activeTab],
  )

  useEffect(() => {
    loadPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tab切换
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    loadPosts(key)
  }

  // 发布动态
  const handleCreate = async () => {
    if (!newPost.content.trim()) {
      message.warning('请输入动态内容')
      return
    }
    try {
      const images = newPost.images
        ? newPost.images
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean)
        : undefined
      await createPost({
        content: newPost.content,
        post_type: newPost.post_type,
        images,
      })
      message.success('发布成功')
      setCreateModalOpen(false)
      setNewPost({ content: '', post_type: 'normal', images: '' })
      loadPosts()
    } catch {
      message.error('发布失败')
    }
  }

  // 删除动态
  const handleDelete = async (id: string) => {
    try {
      await deletePost(id)
      message.success('删除成功')
      loadPosts()
    } catch {
      message.error('删除失败')
    }
  }

  // 点赞/取消点赞
  const handleLike = async (post: any) => {
    try {
      // 简单处理：调用点赞接口，如果已点赞则取消
      // 由于后端会校验是否已点赞，这里用try-catch处理
      await likePost(post.id)
      message.success('已点赞')
      loadPosts()
    } catch {
      // 如果已点赞，尝试取消
      try {
        await unlikePost(post.id)
        message.success('已取消点赞')
        loadPosts()
      } catch {
        message.error('操作失败')
      }
    }
  }

  // 打开评论弹窗
  const openCommentModal = async (post: any) => {
    setCurrentPost(post)
    setCommentModalOpen(true)
    setCommentText('')
    try {
      const res: any = await getComments(post.id)
      const data = res?.data || res || []
      setComments(Array.isArray(data) ? data : [])
    } catch {
      setComments([])
    }
  }

  // 添加评论
  const handleAddComment = async () => {
    if (!commentText.trim() || !currentPost) return
    try {
      await addComment(currentPost.id, { content: commentText })
      message.success('评论成功')
      setCommentText('')
      // 刷新评论列表
      const res: any = await getComments(currentPost.id)
      const data = res?.data || res || []
      setComments(Array.isArray(data) ? data : [])
      // 刷新动态列表（评论数更新）
      loadPosts()
    } catch {
      message.error('评论失败')
    }
  }

  // Tab项配置
  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'normal', label: '日常' },
    { key: 'case_share', label: '案例分享' },
    { key: 'experience', label: '经验' },
    { key: 'knowledge', label: '知识' },
  ]

  return (
    <div>
      {/* 顶部操作栏 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          style={{ marginBottom: 0 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          发布动态
        </Button>
      </div>

      {/* 动态列表 */}
      {posts.length === 0 && !loading ? (
        <Empty description="暂无动态" />
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {posts.map((post: any) => (
            <Card key={post.id} style={{ borderRadius: 16 }} loading={loading}>
              {/* 头部：用户信息 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#0071e3' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1d1d1f' }}>
                      {post.user_name || post.user_id?.slice(0, 8)}
                    </div>
                    <div style={{ fontSize: 12, color: '#86868b' }}>{formatDateTime(post.created_at)}</div>
                  </div>
                </div>
                <Tag color={postTypeColorMap[post.post_type] || 'default'}>
                  {postTypeLabelMap[post.post_type] || post.post_type}
                </Tag>
              </div>

              {/* 内容 */}
              <div style={{ fontSize: 15, color: '#1d1d1f', lineHeight: 1.7, marginBottom: 12, whiteSpace: 'pre-wrap' }}>
                {post.content}
              </div>

              {/* 图片 */}
              {post.images && post.images.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {post.images.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`图片${idx + 1}`}
                      style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }}
                    />
                  ))}
                </div>
              )}

              {/* 底部操作栏 */}
              <div style={{ display: 'flex', gap: 24, color: '#6e6e73', fontSize: 14, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                <Button
                  type="text"
                  icon={<LikeOutlined />}
                  onClick={() => handleLike(post)}
                  style={{ color: '#6e6e73' }}
                >
                  {post.like_count || 0}
                </Button>
                <Button
                  type="text"
                  icon={<CommentOutlined />}
                  onClick={() => openCommentModal(post)}
                  style={{ color: '#6e6e73' }}
                >
                  {post.comment_count || 0}
                </Button>
                <span style={{ lineHeight: '32px' }}>阅读 {post.view_count || 0}</span>
                {post.user_id === currentUser.id && (
                  <Popconfirm title="确定删除这条动态吗？" onConfirm={() => handleDelete(post.id)}>
                    <Button type="text" icon={<DeleteOutlined />} danger style={{ marginLeft: 'auto' }}>
                      删除
                    </Button>
                  </Popconfirm>
                )}
              </div>
            </Card>
          ))}
        </Space>
      )}

      {/* 发布动态弹窗 */}
      <Modal
        title="发布动态"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => setCreateModalOpen(false)}
        width={600}
        okText="发布"
        cancelText="取消"
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <div style={{ marginBottom: 8, color: '#6e6e73' }}>动态类型</div>
            <Select
              style={{ width: '100%' }}
              value={newPost.post_type}
              onChange={v => setNewPost({ ...newPost, post_type: v })}
              options={postTypeOptions}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8, color: '#6e6e73' }}>内容</div>
            <TextArea
              rows={5}
              value={newPost.content}
              onChange={e => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="分享你的想法..."
              maxLength={2000}
              showCount
            />
          </div>
          <div>
            <div style={{ marginBottom: 8, color: '#6e6e73' }}>图片URL（每行一个，可空）</div>
            <TextArea
              rows={3}
              value={newPost.images}
              onChange={e => setNewPost({ ...newPost, images: e.target.value })}
              placeholder="https://example.com/image1.jpg"
            />
          </div>
        </Space>
      </Modal>

      {/* 评论弹窗 */}
      <Modal
        title="评论"
        open={commentModalOpen}
        onCancel={() => setCommentModalOpen(false)}
        footer={null}
        width={600}
      >
        {currentPost && (
          <div>
            {/* 原动态内容 */}
            <div style={{ background: '#f5f5f7', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {currentPost.user_name || currentPost.user_id?.slice(0, 8)}
              </div>
              <div style={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>{currentPost.content}</div>
            </div>

            {/* 评论列表 */}
            <List
              dataSource={comments}
              locale={{ emptyText: '暂无评论' }}
              renderItem={(item: any) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#0071e3' }}>
                        {item.user_name || item.user_id?.slice(0, 8)}
                      </span>
                      <span style={{ fontSize: 12, color: '#86868b' }}>{formatDateTime(item.created_at)}</span>
                    </div>
                    <div style={{ color: '#1d1d1f', marginTop: 4 }}>{item.content}</div>
                  </div>
                </List.Item>
              )}
            />

            {/* 评论输入 */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <TextArea
                rows={2}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="写下你的评论..."
                onPressEnter={handleAddComment}
              />
              <Button type="primary" onClick={handleAddComment}>
                发送
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
