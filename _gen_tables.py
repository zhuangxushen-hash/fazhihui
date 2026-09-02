# -*- coding: utf-8 -*-
import os, re, glob, json

SRC = 'backend/src'
OUT = '表结构设计文档.md'

# ---------- 1. 实体中文名映射（来自开发文档标题提取） ----------
ZH = {}
try:
    doc = open('开发文档.md', encoding='utf-8').read()
    for h in re.findall(r'^#{2,4}\s+(.+)$', doc, re.M):
        for a, b in [(r'([A-Za-z_][A-Za-z0-9_]*)\s*[（(]\s*([\u4e00-\u9fff]+)\s*[）)]', 'en'),
                     (r'([\u4e00-\u9fff]+)\s*[（(]\s*([A-Za-z_][A-Za-z0-9_]*)\s*[）)]', 'zh')]:
            m = re.search(a, h)
            if m:
                if b == 'en':
                    ZH[m.group(1).lower()] = m.group(2)
                else:
                    ZH[m.group(2).lower()] = m.group(1)
except Exception as e:
    print('warn doc parse', e)

# 兜底中文名（核心实体）
FALLBACK = {
    'contracts':'合同','cases':'案件','receivables':'应收','fees':'费用(已弃)',
    'organizations':'组织','users':'用户','roles':'角色','menus':'菜单',
    'audit_logs':'审计日志','seals':'用印','conflict_checks':'利冲审查',
    'clients':'客户(C端)','payment_records':'收款记录','profit_shares':'分润',
    'commission_rules':'佣金规则','commission_records':'佣金记录',
    'case_costs':'案件成本','invoices':'发票','refunds':'退款',
    'overdue_warnings':'逾期预警','business_funds':'业务款',
}

def zh_of(table):
    return ZH.get(table.lower()) or FALLBACK.get(table.lower()) or ''

# 常见 _id 字段 → 目标表（逻辑外键反查）
IDMAP = {
    'case_id':'cases(案件)','organization_id':'organizations(组织)','org_id':'organizations(组织)',
    'user_id':'users(用户)','client_id':'clients(客户)','contract_id':'contracts(合同)',
    'lead_id':'leads(线索)','role_id':'roles(角色)','menu_id':'menus(菜单)',
    'approval_id':'approval_requests(审批申请)','template_id':'合同/签约模板','lawyer_id':'users(用户)',
    'task_id':'case_tasks(案件任务)','document_id':'documents(文书)','fee_id':'fees(费用)',
    'payment_id':'payment_records(收款)','project_id':'internal_projects(内部项目)',
    'customer_id':'client_profiles(客户档案)','order_id':'orders(订单)','post_id':'social_posts(帖子)',
    'account_id':'ad_accounts(广告账户)','stage_id':'contract_stage(合同阶段)','father_id':'本表(自引用)',
    'parent_id':'本表(自引用)','creator_id':'users(用户)','owner_id':'users(用户)',
    'reviewer_id':'users(用户)','approver_id':'users(用户)','handler_id':'users(用户)',
    'assignee_id':'users(用户)','target_id':'（见注释）','source_id':'（见注释）',
}

# ---------- 2. 字段类型映射 ----------
TYPE_MAP = {
    'varchar':'VARCHAR','char':'CHAR','text':'TEXT','int':'INT','integer':'INT',
    'bigint':'BIGINT','smallint':'SMALLINT','decimal':'DECIMAL','float':'FLOAT',
    'double':'DOUBLE','datetime':'DATETIME','timestamp':'TIMESTAMP','date':'DATE',
    'time':'TIME','boolean':'BOOLEAN','tinyint':'TINYINT','json':'JSON',
    'simple-json':'JSON(TEXT)','simple-array':'TEXT','uuid':'UUID',
    'blob':'BLOB','enum':'ENUM',
}
def db_type(col):
    t = col.get('dbtype','')
    if t in TYPE_MAP:
        base = TYPE_MAP[t]
        if t == 'decimal' and col.get('precision'):
            return f"DECIMAL({col.get('precision')},{col.get('scale',0)})"
        if t == 'varchar' and col.get('length'):
            return f"VARCHAR({col.get('length')})"
        return base
    return t.upper() if t else '—'

# ---------- 3. 解析单个实体文件 ----------
def parse_entity(path):
    lines = open(path, encoding='utf-8').read().split('\n')
    module = os.path.basename(os.path.dirname(path))
    table = None
    cls = None
    class_indices = []          # list of [cols]
    desc_lines = []
    fields = []                 # dict per column/relation
    relations = []              # list of str
    buf = []                    # pending decorators
    seen_entity = False
    i = 0
    # 顶部描述注释（@Entity 之前的 // 注释）
    for ln in lines:
        if '@Entity' in ln:
            m = re.search(r"@Entity\(\s*(?:\{[^}]*name\s*:\s*['\"]([^'\"]+)['\"]|['\"]([^'\"]+)['\"])", ln)
            if m:
                table = m.group(1) or m.group(2)
            break
        if ln.strip().startswith('//') and not seen_entity:
            desc_lines.append(ln.strip().lstrip('/').strip())
    if not table:
        # 尝试多行 @Entity({ name: 'x' })
        for j, ln in enumerate(lines):
            if '@Entity' in ln:
                chunk = ' '.join(lines[j:j+3])
                m = re.search(r"name\s*:\s*['\"]([^'\"]+)['\"]", chunk)
                if m:
                    table = m.group(1)
                break

    # 逐行解析
    for ln in lines:
        s = ln.strip()
        if not s:
            continue
        if s.startswith('//'):
            # 行内注释可能描述字段，但已在各 decorators 的 comment 中，忽略
            continue
        if s.startswith('@Entity'):
            seen_entity = True
            buf = []
            continue
        if s.startswith('@Index'):
            m = re.search(r"\[([^\]]*)\]", s)
            if m:
                cols = re.findall(r"['\"]([^'\"]+)['\"]", m.group(1))
                class_indices.append(cols)
            buf = []
            continue
        if s.startswith('@'):
            buf.append(s)
            continue
        if s.startswith('export class'):
            m = re.search(r"class\s+(\w+)", s)
            if m:
                cls = m.group(1)
            buf = []
            continue
        # 属性声明？
        pm = re.match(r'^([A-Za-z_$][\w$]*)\s*[!?]?\s*:\s*(.+?)\s*;?\s*$', s)
        if not pm:
            buf = []  # 方法/其它，清空装饰器缓冲
            continue
        name = pm.group(1)
        tstype = pm.group(2).split('//')[0].split(';')[0].strip()
        decos = list(buf)
        buf = []
        if '(' in tstype:
            # 含括号（方法签名误判），跳过
            continue
        field = {
            'name': name, 'tstype': tstype, 'dbtype': '', 'nullable': True,
            'default': '', 'comment': '', 'key': '', 'fk': '', 'enum': '',
        }
        is_rel = False
        rel_target = ''
        join_col = None
        rel_kind = ''
        for d in decos:
            if d.startswith('@PrimaryGeneratedColumn'):
                field['key'] = 'PK'
                if "'uuid'" in d or '"uuid"' in d:
                    field['dbtype'] = 'UUID'
                else:
                    field['dbtype'] = 'INT(自增)'
                field['nullable'] = False
            elif d.startswith('@PrimaryColumn'):
                field['key'] = 'PK'
                field['nullable'] = False
            elif d.startswith('@CreateDateColumn'):
                field['dbtype'] = 'DATETIME'; field['comment'] = field['comment'] or '创建时间(自动)'
            elif d.startswith('@UpdateDateColumn'):
                field['dbtype'] = 'DATETIME'; field['comment'] = field['comment'] or '更新时间(自动)'
            elif d.startswith('@DeleteDateColumn'):
                field['dbtype'] = 'DATETIME'; field['comment'] = field['comment'] or '删除时间(软删)'
            elif d.startswith('@Column'):
                # 解析参数
                arg = d[len('@Column'):].strip()
                if arg.startswith('('):
                    arg = arg[1:].rstrip(')')
                if arg.startswith('{'):
                    cm = re.search(r"comment\s*:\s*['\"]([^'\"]*)['\"]", arg)
                    if cm: field['comment'] = cm.group(1)
                    tm = re.search(r"type\s*:\s*['\"]([^'\"]*)['\"]", arg)
                    if tm: field['dbtype'] = tm.group(1)
                    nm = re.search(r"nullable\s*:\s*(true|false)", arg)
                    if nm: field['nullable'] = (nm.group(1) == 'true')
                    dm = re.search(r"default\s*:\s*([^,}]+)", arg)
                    if dm: field['default'] = dm.group(1).strip().strip("'\"")
                    lm = re.search(r"length\s*:\s*(\d+)", arg)
                    if lm and field['dbtype']=='varchar': field['dbtype']=f"VARCHAR({lm.group(1)})"
                    pm2 = re.search(r"precision\s*:\s*(\d+)", arg)
                    sc = re.search(r"scale\s*:\s*(\d+)", arg)
                    if pm2 and field['dbtype']=='decimal': field['dbtype']=f"DECIMAL({pm2.group(1)},{sc.group(1) if sc else 0})"
                    em = re.search(r"enum\s*:\s*\[([^\]]*)\]", arg)
                    if em: field['enum'] = em.group(1).replace("'","").replace('"','')
                else:
                    # 简写 @Column('text')
                    field['dbtype'] = arg.strip().strip("'\"")
            elif d.startswith('@ManyToOne') or d.startswith('@OneToOne') or d.startswith('@OneToMany') or d.startswith('@ManyToMany'):
                is_rel = True
                rel_kind = d[1:d.find('(')]
                tm = re.search(r"=>\s*(\w+)", d)
                if tm: rel_target = tm.group(1)
                if rel_kind in ('ManyToOne','OneToOne'):
                    # 本侧持有外键
                    if '@JoinColumn' in ' '.join(decos):
                        for d2 in decos:
                            if d2.startswith('@JoinColumn'):
                                jm = re.search(r"name\s*:\s*['\"]([^'\"]+)['\"]", d2)
                                if jm: join_col = jm.group(1)
                    if not join_col:
                        join_col = name + '_id'
                    field['name'] = join_col
                    field['dbtype'] = 'UUID'
                    field['key'] = 'FK'
                    field['fk'] = rel_target
                    field['comment'] = field['comment'] or f'关联{rel_target}'
            elif d.startswith('@JoinColumn'):
                jm = re.search(r"name\s*:\s*['\"]([^'\"]+)['\"]", d)
                if jm:
                    join_col = jm.group(1)
        # 未显式声明 type 时，从 TS 属性类型推断（TypeORM 行为一致）
        if not field['dbtype'] and not is_rel:
            ts = field['tstype']
            if ts == 'string': field['dbtype'] = 'varchar'
            elif ts == 'number': field['dbtype'] = 'numeric'
            elif ts == 'boolean': field['dbtype'] = 'boolean'
            elif ts == 'Date': field['dbtype'] = 'datetime'
            elif ts.endswith('[]'): field['dbtype'] = 'json'
        # 若关系是 OneToMany/ManyToMany（反向），不生成列，仅记录关系
        if is_rel and rel_kind in ('OneToMany','ManyToMany') and not field.get('key'):
            relations.append(f"{rel_kind} → {rel_target}（反向集合，本表无列）")
            continue
        # 普通 _id 列疑似外键标注（逻辑外键反查目标表）
        if (not field['key']) and field['name'].endswith('_id'):
            if field['name'] in IDMAP:
                field['fk'] = '→ ' + IDMAP[field['name']]
            elif field['comment']:
                field['fk'] = field['fk'] or '（见注释）'
        # 只保留含列装饰器的字段；丢弃无任何装饰器的裸属性（多为关系冗余手写列）
        eff = is_rel or field['key'] or any(d.startswith(('@Column','@Primary','@CreateDate','@UpdateDate','@DeleteDate')) for d in decos)
        if not eff:
            continue
        fields.append(field)

    # 同名字段去重（关系外键列与手写冗余 @Column 列并存时，保留带键/外键信息者）
    seen = {}
    dedup = []
    for f in fields:
        n = f['name']
        if n in seen:
            prev = seen[n]
            if f['key'] and not prev['key']:
                seen[n] = f
            # 否则保留先出现的（通常信息更全）
        else:
            seen[n] = f
            dedup.append(f)
    fields = dedup
    # 处理 class_indices 已收集
    return {
        'module': module, 'table': table, 'cls': cls,
        'desc': desc_lines, 'fields': fields,
        'class_indices': class_indices, 'relations': relations,
    }

# ---------- 4. 收集所有实体 ----------
files = sorted(glob.glob(os.path.join(SRC, '**', '*.entity.ts'), recursive=True))
entities = []
for f in files:
    try:
        e = parse_entity(f)
        if e['table']:
            entities.append(e)
    except Exception as ex:
        print('ERR', f, ex)

# 按模块分组
from collections import defaultdict, OrderedDict
mods = OrderedDict()
for e in entities:
    mods.setdefault(e['module'], []).append(e)

# 类→表 映射，用于把关系外键解析为目标表名
cls2table = {e['cls']: e['table'] for e in entities if e['cls']}
for e in entities:
    for f in e['fields']:
        if f['fk'] and f['fk'] not in ('（见注释）',) and not f['fk'].startswith('→'):
            tgt = cls2table.get(f['fk'], f['fk'])
            f['fk'] = '→ ' + tgt + (f"（{zh_of(tgt)}）" if zh_of(tgt) else '')
    # relations 中把类名替换为表名
    new_rels = []
    for r in e['relations']:
        m = re.search(r"→\s*(\w+)", r)
        if m and m.group(1) in cls2table:
            r = r.replace(m.group(1), cls2table[m.group(1)])
        new_rels.append(r)
    e['relations'] = new_rels

# ---------- 5. 生成 Markdown ----------
L = []
L.append('# 法智汇 · 业务表结构设计文档\n')
L.append('> 本文档由后端 `backend/src/**/*.entity.ts` 自动抽取生成，覆盖全部业务实体。\n')
L.append('> 数据库当前为 **SQLite**（`synchronize:true` 自动建表）；字段「类型」列展示 TypeORM 声明类型，SQLite 实际存储会归并（VARCHAR/TEXT→TEXT，DECIMAL/INT→NUMERIC）。\n')
L.append(f'> 共抽取 **{len(entities)}** 张业务表，分布于 **{len(mods)}** 个模块。\n')

# 总览索引
L.append('## 一、表总览索引\n')
L.append('| 模块 | 表名 | 中文名 | 字段数 | 主键 | 外键数 | 索引数 |')
L.append('|------|------|--------|-------:|------|------:|------:|')
total_fields = 0
for mod, es in mods.items():
    for e in es:
        nf = len(e['fields'])
        total_fields += nf
        nidx = len(e['class_indices'])
        nfk = sum(1 for f in e['fields'] if f['key'] == 'FK')
        npk = sum(1 for f in e['fields'] if f['key'] == 'PK')
        zh = zh_of(e['table'])
        L.append(f"| {mod} | `{e['table']}` | {zh} | {nf} | {npk} | {nfk} | {nidx} |")
L.append(f'\n> 合计 **{total_fields}** 个字段。\n')

# 详情
L.append('\n---\n')
L.append('## 二、逐表结构设计\n')
sec = 0
for mod, es in mods.items():
    L.append(f'\n### 模块：{mod}\n')
    for e in es:
        sec += 1
        zh = zh_of(e['table'])
        title = f"`{e['table']}`" + (f" （{zh}）" if zh else "")
        L.append(f'\n#### {title}\n')
        # 业务说明
        if e['desc']:
            L.append('**业务说明：** ' + '；'.join(e['desc'][:6]) + '\n')
        else:
            L.append('**业务说明：** （详见《开发文档.md》第5章功能实体详解）\n')
        # 字段表
        L.append('\n| 字段名 | 类型 | 可空 | 默认值 | 键 | 关联/枚举 | 说明 |')
        L.append('|--------|------|------|--------|----|-----------|------|')
        for f in e['fields']:
            key = f['key'] or ''
            rel = f['fk']
            if f['enum']:
                rel = ('ENUM: ' + f['enum']) if not rel else rel
            extra = rel if rel else ''
            L.append(f"| `{f['name']}` | {db_type(f)} | {'Y' if f['nullable'] else 'N'} | {f['default'] or '—'} | {key or '—'} | {extra or '—'} | {f['comment'] or '—'} |")
        # 索引
        if e['class_indices']:
            L.append('\n**索引：** ' + '；'.join('(' + ', '.join(c) + ')' for c in e['class_indices']) + '\n')
        # 关联关系
        rels = list(e['relations'])
        # 也把 FK 列汇总
        fks = [f"`{f['name']}` {f['fk']}" for f in e['fields'] if f['key']=='FK']
        if fks:
            rels.insert(0, '外键：' + '，'.join(fks))
        if rels:
            L.append('\n**关联关系：** ' + '；'.join(rels) + '\n')

doc = '\n'.join(L)
open(OUT, 'w', encoding='utf-8').write(doc)
print(f'已生成 {OUT}：{len(entities)} 表 / {len(mods)} 模块 / 约 {total_fields} 字段 / 文档 {len(doc)} 字符')
