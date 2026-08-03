import { useState, useEffect, useRef } from 'react'
import { Card, Button, Modal, Input, Select, message, Popconfirm, Space, Tag, Empty, Spin } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  LinkOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons'
import { getDiagrams, createDiagram, updateDiagram, deleteDiagram } from '../api/diagram'
import dayjs from 'dayjs'

// 图表类型中文映射
const DIAGRAM_TYPE_MAP: Record<string, string> = {
  mindmap: '思维导图',
  flowchart: '流程图',
  relation: '法律关系图',
  organization: '组织架构',
}

// 节点尺寸常量
const NODE_W = 120
const NODE_H = 44

interface DiagramNode {
  id: string
  x: number
  y: number
  text: string
  color: string
}

interface DiagramEdge {
  from: string
  to: string
  label: string
}

interface DiagramData {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

interface Diagram {
  id: string
  title: string
  type: string
  content: string
  case_id: string | null
  creator_id: string | null
  organization_id: string | null
  created_at: string
  updated_at: string
}

const DiagramTool = () => {
  const [list, setList] = useState<Diagram[]>([])
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState<Diagram | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'mindmap', case_id: '' })

  // 编辑器状态
  const [nodes, setNodes] = useState<DiagramNode[]>([])
  const [edges, setEdges] = useState<DiagramEdge[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [linkMode, setLinkMode] = useState(false)
  const [linkFrom, setLinkFrom] = useState<string | null>(null)
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // 加载图表列表
  const loadList = async () => {
    setLoading(true)
    try {
      const res: any = await getDiagrams()
      setList(res?.data || [])
    } catch (e) {
      message.error('加载图表列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadList()
  }, [])

  // 打开图表进入编辑器
  const openDiagram = (d: Diagram) => {
    let content: DiagramData = { nodes: [], edges: [] }
    try {
      content = JSON.parse(d.content || '{"nodes":[],"edges":[]}')
    } catch {
      content = { nodes: [], edges: [] }
    }
    setNodes(content.nodes || [])
    setEdges(content.edges || [])
    setCurrent(d)
    setSelectedNodeId(null)
    setEditingNodeId(null)
    setLinkMode(false)
    setLinkFrom(null)
  }

  // 返回列表
  const backToList = () => {
    setCurrent(null)
    loadList()
  }

  // 提交新增图表
  const submitCreate = async () => {
    if (!form.title.trim()) {
      message.warning('请输入图表标题')
      return
    }
    try {
      await createDiagram({
        title: form.title.trim(),
        type: form.type,
        case_id: form.case_id.trim() || null,
        content: JSON.stringify({ nodes: [], edges: [] }),
      })
      message.success('创建成功')
      setModalOpen(false)
      setForm({ title: '', type: 'mindmap', case_id: '' })
      loadList()
    } catch {
      message.error('创建失败')
    }
  }

  // 删除图表
  const onRemove = async (id: string) => {
    try {
      await deleteDiagram(id)
      message.success('删除成功')
      loadList()
    } catch {
      message.error('删除失败')
    }
  }

  // 节点鼠标按下：开始拖拽
  const onNodeMouseDown = (e: React.MouseEvent, node: DiagramNode) => {
    if (linkMode) return
    if (editingNodeId === node.id) return
    setSelectedNodeId(node.id)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    setDragging({
      id: node.id,
      offsetX: e.clientX - rect.left - node.x,
      offsetY: e.clientY - rect.top - node.y,
    })
  }

  // 画布鼠标移动：拖拽节点
  const onCanvasMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.max(0, e.clientX - rect.left - dragging.offsetX)
    const y = Math.max(0, e.clientY - rect.top - dragging.offsetY)
    setNodes(ns => ns.map(n => (n.id === dragging.id ? { ...n, x, y } : n)))
  }

  // 画布鼠标抬起：结束拖拽
  const onCanvasMouseUp = () => {
    setDragging(null)
  }

  // 画布点击空白：取消选中
  const onCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedNodeId(null)
      setEditingNodeId(null)
    }
  }

  // 添加节点（画布中央）
  const addNode = () => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const cx = rect ? rect.width / 2 - NODE_W / 2 : 200
    const cy = rect ? rect.height / 2 - NODE_H / 2 : 200
    const newNode: DiagramNode = {
      id: `n_${Date.now()}`,
      x: cx,
      y: cy,
      text: '新节点',
      color: '#1677ff',
    }
    setNodes([...nodes, newNode])
    setSelectedNodeId(newNode.id)
  }

  // 节点点击（连线模式）
  const onNodeClickLink = (node: DiagramNode) => {
    if (!linkMode) return
    if (!linkFrom) {
      setLinkFrom(node.id)
      message.info('已选择起点，请点击目标节点')
    } else {
      if (linkFrom === node.id) {
        setLinkFrom(null)
        return
      }
      if (edges.some(ed => ed.from === linkFrom && ed.to === node.id)) {
        message.warning('该连线已存在')
      } else {
        setEdges([...edges, { from: linkFrom, to: node.id, label: '' }])
        message.success('连线已创建')
      }
      setLinkFrom(null)
    }
  }

  // 双击节点：进入文字编辑
  const onNodeDoubleClick = (node: DiagramNode) => {
    setEditingNodeId(node.id)
  }

  // 编辑节点文字
  const updateNodeText = (id: string, text: string) => {
    setNodes(ns => ns.map(n => (n.id === id ? { ...n, text } : n)))
  }

  // 编辑节点颜色
  const updateNodeColor = (id: string, color: string) => {
    setNodes(ns => ns.map(n => (n.id === id ? { ...n, color } : n)))
  }

  // 确认编辑文字
  const confirmEditText = (id: string) => {
    setEditingNodeId(null)
    setSelectedNodeId(id)
  }

  // 删除选中节点
  const deleteSelectedNode = () => {
    if (!selectedNodeId) return
    setNodes(ns => ns.filter(n => n.id !== selectedNodeId))
    setEdges(es => es.filter(e => e.from !== selectedNodeId && e.to !== selectedNodeId))
    setSelectedNodeId(null)
  }

  // 点击连线删除
  const onEdgeClick = (edge: DiagramEdge) => {
    setEdges(es => es.filter(e => !(e.from === edge.from && e.to === edge.to)))
    message.success('连线已删除')
  }

  // 保存图表
  const saveDiagram = async () => {
    if (!current) return
    try {
      const content = JSON.stringify({ nodes, edges })
      await updateDiagram(current.id, { content })
      message.success('保存成功')
      setCurrent({ ...current, content })
    } catch {
      message.error('保存失败')
    }
  }

  // 切换连线模式
  const toggleLinkMode = () => {
    setLinkMode(!linkMode)
    setLinkFrom(null)
    if (!linkMode) {
      setSelectedNodeId(null)
    }
  }

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null

  // 计算节点中心点
  const nodeCenter = (n: DiagramNode) => ({ x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 })

  // 列表视图
  if (!current) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>可视化绘图</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新增图表
          </Button>
        </div>
        <Spin spinning={loading}>
          {list.length === 0 ? (
            <Empty description="暂无图表" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {list.map(d => (
                <Card
                  key={d.id}
                  hoverable
                  size="small"
                  title={<span style={{ cursor: 'pointer' }} onClick={() => openDiagram(d)}>{d.title}</span>}
                  extra={
                    <Popconfirm title="确认删除该图表？" onConfirm={() => onRemove(d.id)} okText="删除" cancelText="取消">
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  }
                  onClick={() => openDiagram(d)}
                >
                  <p style={{ margin: '8px 0' }}>
                    <Tag color="blue">{DIAGRAM_TYPE_MAP[d.type] || d.type}</Tag>
                    {d.case_id && <Tag>关联案件</Tag>}
                  </p>
                  <p style={{ margin: 0, color: '#999', fontSize: 12 }}>
                    更新时间：{dayjs(d.updated_at).format('YYYY-MM-DD HH:mm')}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </Spin>

        <Modal
          title="新增图表"
          open={modalOpen}
          onOk={submitCreate}
          onCancel={() => setModalOpen(false)}
          okText="创建"
          cancelText="取消"
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <div style={{ marginBottom: 6 }}>标题</div>
              <Input
                placeholder="请输入图表标题"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <div style={{ marginBottom: 6 }}>类型</div>
              <Select
                style={{ width: '100%' }}
                value={form.type}
                onChange={v => setForm({ ...form, type: v })}
                options={Object.entries(DIAGRAM_TYPE_MAP).map(([value, label]) => ({ value, label }))}
              />
            </div>
            <div>
              <div style={{ marginBottom: 6 }}>关联案件ID（可选）</div>
              <Input
                placeholder="请输入关联案件ID"
                value={form.case_id}
                onChange={e => setForm({ ...form, case_id: e.target.value })}
              />
            </div>
          </Space>
        </Modal>
      </div>
    )
  }

  // 编辑器视图
  return (
    <div style={{ padding: 16, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={backToList}>返回列表</Button>
        <span style={{ fontWeight: 600, fontSize: 16 }}>{current.title}</span>
        <Tag color="blue">{DIAGRAM_TYPE_MAP[current.type] || current.type}</Tag>
        <span style={{ flex: 1 }} />
        <Button icon={<PlusCircleOutlined />} onClick={addNode}>添加节点</Button>
        <Button
          type={linkMode ? 'primary' : 'default'}
          icon={<LinkOutlined />}
          onClick={toggleLinkMode}
        >
          {linkMode ? (linkFrom ? '请点击目标节点' : '连线模式中') : '连线模式'}
        </Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={saveDiagram}>保存</Button>
      </div>

      {/* 画布区域 */}
      <div
        ref={canvasRef}
        onClick={onCanvasClick}
        onMouseMove={onCanvasMouseMove}
        onMouseUp={onCanvasMouseUp}
        onMouseLeave={onCanvasMouseUp}
        style={{
          flex: 1,
          position: 'relative',
          background: '#fafafa',
          border: '1px solid #e8e8e8',
          borderRadius: 8,
          overflow: 'hidden',
          cursor: dragging ? 'move' : linkMode ? 'crosshair' : 'default',
          backgroundImage: 'radial-gradient(#e0e0e0 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* SVG 连线层 */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          {edges.map((ed, idx) => {
            const fromNode = nodes.find(n => n.id === ed.from)
            const toNode = nodes.find(n => n.id === ed.to)
            if (!fromNode || !toNode) return null
            const from = nodeCenter(fromNode)
            const to = nodeCenter(toNode)
            const midX = (from.x + to.x) / 2
            const midY = (from.y + to.y) / 2
            return (
              <g key={`edge_${idx}`} style={{ pointerEvents: 'auto', cursor: 'pointer' }} onClick={() => onEdgeClick(ed)}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#888" strokeWidth={2} />
                {ed.label && (
                  <text x={midX} y={midY} fill="#555" fontSize={12} textAnchor="middle" style={{ pointerEvents: 'none' }}>
                    {ed.label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* 节点层 */}
        {nodes.map(node => {
          const isSelected = selectedNodeId === node.id
          const isLinkSource = linkFrom === node.id
          return (
            <div
              key={node.id}
              onMouseDown={e => { onNodeMouseDown(e, node); if (linkMode) { e.stopPropagation(); onNodeClickLink(node) } }}
              onDoubleClick={() => onNodeDoubleClick(node)}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                width: NODE_W,
                minHeight: NODE_H,
                background: node.color,
                color: '#fff',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 8px',
                cursor: linkMode ? 'pointer' : 'move',
                userSelect: 'none',
                border: isSelected || isLinkSource ? '2px solid #faad14' : '2px solid transparent',
                boxShadow: isSelected ? '0 0 8px rgba(250,173,20,0.5)' : '0 2px 6px rgba(0,0,0,0.15)',
                fontSize: 13,
                textAlign: 'center',
                wordBreak: 'break-all',
              }}
            >
              {editingNodeId === node.id ? (
                <input
                  autoFocus
                  defaultValue={node.text}
                  onBlur={e => { updateNodeText(node.id, e.target.value); confirmEditText(node.id) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { updateNodeText(node.id, (e.target as HTMLInputElement).value); confirmEditText(node.id) }
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: 4,
                    padding: '2px 4px',
                    textAlign: 'center',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              ) : (
                node.text
              )}
            </div>
          )
        })}
      </div>

      {/* 底部节点属性面板 */}
      <div style={{ marginTop: 12, padding: 12, background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
        {selectedNode ? (
          <>
            <span style={{ fontWeight: 600 }}>节点属性</span>
            <span>文字：</span>
            <Input
              style={{ width: 200 }}
              value={selectedNode.text}
              onChange={e => updateNodeText(selectedNode.id, e.target.value)}
            />
            <span>颜色：</span>
            <input
              type="color"
              value={selectedNode.color}
              onChange={e => updateNodeColor(selectedNode.id, e.target.value)}
              style={{ width: 40, height: 32, border: '1px solid #d9d9d9', borderRadius: 6, cursor: 'pointer', padding: 2, background: '#fff' }}
            />
            <Button danger icon={<DeleteOutlined />} onClick={deleteSelectedNode}>删除节点</Button>
          </>
        ) : (
          <span style={{ color: '#999' }}>
            {linkMode ? '连线模式：依次点击两个节点创建连线，点击连线可删除' : '请选择节点编辑属性，双击节点编辑文字，点击连线可删除'}
          </span>
        )}
      </div>
    </div>
  )
}

export default DiagramTool
