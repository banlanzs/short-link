# Vercel 部署指南

本指南介绍如何将短链接工具部署到 Vercel，与现有的 Cloudflare Pages 部署并存。

## 功能特性

- **双平台并存**：保留 Cloudflare Pages，新增 Vercel 作为备选部署
- **Vercel KV 存储**：使用 Redis 键值存储，优化读写性能
- **静态导出优化**：热门链接（pinned）静态导出，零边缘函数调用
- **成本优化**：最大化利用 Vercel 免费额度

## 前置条件

1. **Vercel 账户**：注册 [Vercel](https://vercel.com)
2. **GitHub 仓库**：代码已推送到 GitHub
3. **Node.js**：本地开发需要 Node.js 18+

## 部署步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 连接 GitHub 仓库

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **New Project**
3. 选择你的 GitHub 仓库
4. 点击 **Import**

### 3. 配置构建设置

在项目导入页面配置：

- **Framework Preset**: Vite
- **Build Command**: `npm run build:vercel`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. 创建 Vercel KV 数据库

1. 在 Vercel Dashboard，进入你的项目
2. 点击 **Storage** 标签
3. 点击 **Create Database**
4. 选择 **KV**
5. 输入数据库名称（如 `short-links-kv`）
6. 点击 **Create**

### 5. 连接 KV 数据库到项目

1. 在 KV 数据库页面，点击 **Connect Project**
2. 选择你的短链接项目
3. 点击 **Connect**
4. 环境变量会自动注入到项目中

### 6. 部署项目

点击 **Deploy** 开始部署。首次部署完成后，你会获得一个 Vercel URL。

## 本地开发

### 1. 安装 Vercel CLI

```bash
npm i -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 链接本地项目

```bash
vercel link
```

### 4. 拉取环境变量

```bash
vercel env pull .env.local
```

### 5. 启动开发服务器

```bash
npm run dev:vercel
```

访问 http://localhost:3000

## 数据模型

### Vercel KV 键值对结构

```typescript
// 链接数据
link:{slug} = {
  url: "https://example.com",
  visits: 0,
  pinned: false,
  created: 1234567890,
  expires: null
}

// 热门链接集合
links:pinned = Set["slug1", "slug2", "slug3"]
```

### 与 Cloudflare D1 的对比

| 字段 | Cloudflare D1 | Vercel KV |
|------|---------------|-----------|
| 主键 | `id` (自增) | `link:{slug}` (键) |
| 链接 | `target_url` | `url` |
| 访问量 | `hit_count` | `visits` |
| 置顶 | `pinned` (0/1) | `pinned` (boolean) |
| 创建时间 | `created_at` (ISO) | `created` (timestamp) |
| 过期时间 | `expires_at` (ISO) | `expires` (timestamp) |

## 管理热门链接

### 添加热门链接（静态导出）

使用 Vercel CLI 或在线工具操作 KV：

```bash
# 设置链接为热门
vercel kv sadd links:pinned your-slug

# 或者直接修改链接数据
vercel kv set link:your-slug '{"url":"https://example.com","visits":100,"pinned":true,"created":1234567890,"expires":null}'
```

### 查看热门链接

```bash
# 查看所有热门链接
vercel kv smembers links:pinned

# 查看特定链接数据
vercel kv get link:your-slug
```

## 成本估算

### Vercel 免费额度

- ✅ **Serverless Functions**: 100GB-hours/月
- ✅ **Edge Functions**: 500K requests/月
- ✅ **KV 存储**: 256MB
- ⚠️ **KV 读取**: 100K operations/月
- ⚠️ **KV 写入**: 1K operations/月

### 优化策略

1. **静态导出**：热门链接零 KV 查询
2. **CDN 缓存**：Vercel 自动缓存静态文件
3. **Edge 缓存**：动态重定向设置缓存头

## 数据迁移（可选）

如需从 Cloudflare D1 迁移数据到 Vercel KV：

### 1. 导出 D1 数据

```bash
npx wrangler d1 execute short_links --remote --command "SELECT slug, target_url, hit_count, pinned FROM links" --json > links.json
```

### 2. 转换并导入 KV

创建迁移脚本 `scripts/migrate-to-kv.js`：

```javascript
import { createClient } from '@vercel/kv'
import fs from 'fs'

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

const data = JSON.parse(fs.readFileSync('links.json', 'utf8'))
const links = data[0].results

for (const link of links) {
  await kv.set(`link:${link.slug}`, {
    url: link.target_url,
    visits: link.hit_count || 0,
    pinned: Boolean(link.pinned),
    created: Date.now(),
    expires: null
  })

  if (link.pinned) {
    await kv.sadd('links:pinned', link.slug)
  }
}

console.log(`Migrated ${links.length} links`)
```

运行迁移：

```bash
node scripts/migrate-to-kv.js
```

## 双平台对比

| 特性 | Cloudflare Pages | Vercel |
|------|------------------|--------|
| **存储** | D1 (SQLite) | KV (Redis) |
| **函数** | Pages Functions | Edge + Serverless |
| **缓存** | 24小时边缘缓存 | CDN + 静态导出 |
| **成本** | 请求计费 | 执行时间计费 |
| **全球分布** | ✅ 全球边缘 | ✅ 全球边缘 |
| **冷启动** | 极快 | 快（Edge）/中等（Serverless） |

## 常见问题

### Q: 如何查看 KV 数据库内容？

**A**: 使用 Vercel CLI：

```bash
# 查看所有键
vercel kv scan 0

# 查看特定键
vercel kv get link:your-slug

# 查看热门链接
vercel kv smembers links:pinned
```

### Q: 如何删除链接？

**A**:

```bash
# 删除链接
vercel kv del link:your-slug

# 从热门列表移除
vercel kv srem links:pinned your-slug
```

### Q: 部署后 API 返回 500 错误？

**A**: 检查环境变量：

1. 进入 Vercel Dashboard → 项目 → Settings → Environment Variables
2. 确认 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN` 存在
3. 重新部署项目

### Q: 静态导出不工作？

**A**: 确认以下条件：

1. 环境变量 `VERCEL=1` 存在（构建时自动设置）
2. KV 环境变量正确配置
3. `links:pinned` 集合包含数据

### Q: 如何监控使用量？

**A**:

1. Vercel Dashboard → 项目 → Analytics
2. Storage → KV 数据库 → Usage

## 技术支持

- **Vercel 文档**: https://vercel.com/docs
- **KV 文档**: https://vercel.com/docs/storage/vercel-kv
- **项目仓库**: 提交 Issue 获取帮助

---

## 下一步

1. ✅ 部署到 Vercel
2. ✅ 创建 KV 数据库
3. ✅ 测试短链接功能
4. 🎯 添加热门链接进行静态导出测试
5. 📊 监控使用量和性能