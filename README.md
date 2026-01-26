# 短链接生成工具

基于 Cloudflare Pages + D1 的短链接生成工具，采用混合静态 + 边缘缓存架构，最大化减少函数调用。

## 功能特性

- 快速生成短链接
- 支持自定义 slug
- 边缘缓存优化（24小时）
- 热门链接静态导出（零函数调用）
- 响应式设计，支持深色模式
- 本地历史记录

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Cloudflare Pages Functions
- **数据库**: Cloudflare D1 (SQLite)
- **部署**: Cloudflare Pages

## 快速开始

### 1. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 2. 创建 D1 数据库

\`\`\`bash
npx wrangler d1 create short_links
\`\`\`

复制返回的 `database_id`，更新 `wrangler.toml` 文件中的 `database_id` 字段。

### 3. 初始化数据库

\`\`\`bash
npx wrangler d1 execute short_links --file=./schema.sql
\`\`\`

### 4. 本地开发

\`\`\`bash
# 启动前端开发服务器
npm run dev

# 在另一个终端启动 Pages Functions 开发服务器
npx wrangler pages dev dist --d1=DB
\`\`\`

### 5. 部署到 Cloudflare Pages

\`\`\`bash
npm run deploy
\`\`\`

## 项目结构

\`\`\`
short-links/
├── functions/              # Cloudflare Pages Functions
│   ├── api/
│   │   └── shorten.ts     # 短链接生成 API
│   └── [slug].ts          # 动态重定向处理
├── scripts/
│   └── export-static.js   # 静态文件导出脚本
├── src/                   # React 前端源码
│   ├── components/
│   │   ├── UrlInput.tsx   # URL 输入组件
│   │   ├── ResultCard.tsx # 结果展示组件
│   │   └── RecentLinks.tsx # 历史记录组件
│   ├── App.tsx            # 主应用组件
│   ├── main.tsx           # 入口文件
│   └── index.css          # 样式文件
├── schema.sql             # D1 数据库 Schema
├── wrangler.toml          # Cloudflare 配置
└── package.json
\`\`\`

## API 接口

### 创建短链接

\`\`\`
POST /api/shorten
Content-Type: application/json

{
  "url": "https://example.com/very/long/url",
  "slug": "custom-slug"  // 可选
}
\`\`\`

**响应**:
\`\`\`json
{
  "slug": "abc1234",
  "shortUrl": "https://your-domain.com/abc1234",
  "url": "https://example.com/very/long/url"
}
\`\`\`

### 访问短链接

\`\`\`
GET /{slug}
\`\`\`

返回 301 重定向到目标 URL，带有缓存头。

## 性能优化

### 1. 边缘缓存
- 重定向响应缓存 24 小时
- 减少 D1 查询和函数调用

### 2. 静态导出
- 热门链接（pinned=1）导出为静态 HTML
- 完全绕过函数调用

### 3. 异步统计
- 点击统计异步更新，不阻塞重定向

## 成本估算

基于 Cloudflare 免费额度：
- **函数调用**: 100,000 次/天
- **D1 读取**: 5,000,000 次/天
- **D1 写入**: 100,000 次/天

**优化后预期**（假设 80% 缓存命中率）：
- 10,000 次创建/天 = 10,000 函数调用
- 2,000 次缓存未命中 = 2,000 函数调用
- **总计**: ~12,000 函数调用/天（远低于限制）

## 数据库管理

### 查询所有链接

\`\`\`bash
npx wrangler d1 execute short_links --command "SELECT * FROM links LIMIT 10"
\`\`\`

### 标记热门链接为 pinned

\`\`\`bash
npx wrangler d1 execute short_links --command "UPDATE links SET pinned = 1 WHERE slug = 'your-slug'"
\`\`\`

### 重新导出静态文件

\`\`\`bash
node scripts/export-static.js
\`\`\`

## 安全特性

- URL 格式验证（仅允许 http/https）
- Slug 格式验证
- HTML 转义防止 XSS
- 数据库 UNIQUE 约束防止冲突

## 许可证

MIT
