import axios from './axios'

// ==================== 动态管理 ====================

// 查询动态列表（支持 post_type 筛选和分页）
export const getPosts = (params?: { post_type?: string; page?: number; limit?: number }) =>
  axios.get('/social/posts', { params })

// 查询单条动态详情
export const getPostById = (id: string) => axios.get(`/social/posts/${id}`)

// 创建动态
export const createPost = (data: {
  content: string
  images?: string[]
  post_type?: string
  related_case_id?: string
}) => axios.post('/social/posts', data)

// 删除动态
export const deletePost = (id: string) => axios.delete(`/social/posts/${id}`)

// ==================== 评论管理 ====================

// 查询动态的评论列表
export const getComments = (postId: string) => axios.get(`/social/posts/${postId}/comments`)

// 添加评论
export const addComment = (postId: string, data: { content: string; parent_id?: string }) =>
  axios.post(`/social/posts/${postId}/comments`, data)

// 删除评论
export const deleteComment = (id: string) => axios.delete(`/social/comments/${id}`)

// ==================== 点赞管理 ====================

// 查询动态的点赞列表
export const getLikes = (postId: string) => axios.get(`/social/posts/${postId}/likes`)

// 点赞
export const likePost = (postId: string) => axios.post(`/social/posts/${postId}/likes`)

// 取消点赞
export const unlikePost = (postId: string) => axios.delete(`/social/posts/${postId}/likes`)
