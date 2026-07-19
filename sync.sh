#!/bin/bash

set -e

echo "=== 开始同步代码到 GitHub ==="

echo "1. 检查工作目录状态..."
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "发现未提交的更改"
else
    echo "工作目录干净，无需同步"
    exit 0
fi

echo "2. 添加所有更改..."
git add -A

echo "3. 生成提交信息..."
COMMIT_MSG="自动同步 - $(date '+%Y-%m-%d %H:%M:%S')"

echo "4. 提交更改..."
git commit -m "$COMMIT_MSG"

echo "5. 推送到远程仓库..."
git push origin master

echo "=== 同步完成 ==="