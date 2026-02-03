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

### 1. 克隆项目并安装依赖

```bash
git clone https://github.com/banlanzs/short-link.git
cd short-link
npm install
```

### 2. 配置 Cloudflare

#### 2.1 登录 Cloudflare

```bash
npx wrangler login
```

#### 2.2 创建 D1 数据库

```bash
npx wrangler d1 create short_links
```

复制返回的 `database_id`，例如：
```
database_id = "dc4195a8-83f1-4949-81f0-ace760512142"
```

#### 2.3 配置 wrangler.toml

复制模板文件并填入你的 database_id：

```bash
cp wrangler.toml.example wrangler.toml
```

编辑 `wrangler.toml`，将 `<YOUR_D1_DATABASE_ID>` 替换为你的实际 database_id。

**注意**: `wrangler.toml` 包含敏感信息，已被添加到 `.gitignore`，不会提交到 Git。

### 3. 初始化数据库

#### 3.1 初始化本地数据库（用于开发）

```bash
npx wrangler d1 execute short_links --local --file=./schema.sql
```

#### 3.2 初始化远程数据库（用于生产）

```bash
npx wrangler d1 execute short_links --remote --file=./schema.sql
```

### 4. 本地开发

#### 方式一：仅前端开发（推荐用于 UI 调试）

```bash
npm run dev
```

访问 http://localhost:5173

#### 方式二：完整开发环境（包含 Functions 和 D1）

```bash
npm run dev:functions
```

访问 http://localhost:8788

### 5. 部署到 Cloudflare Pages

#### 5.1 通过 GitHub 自动部署（推荐）

1. **推送代码到 GitHub**:
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push
   ```

2. **在 Cloudflare Dashboard 中创建 Pages 项目**:
   - 访问 https://dash.cloudflare.com/
   - 进入 **Workers & Pages**
   - 点击 **Create application** → **Pages** → **Connect to Git**
   - 选择你的 GitHub 仓库
   - 配置构建设置：
     - **构建命令**: `npm run build`
     - **构建输出目录**: `dist`
   - 点击 **Save and Deploy**

3. **配置 D1 数据库绑定**:
   - 在 Pages 项目中，进入 **Settings** → **Functions**
   - 滚动到 **D1 database bindings**
   - 点击 **Add binding**
   - 填写：
     - **Variable name**: `DB`
     - **D1 database**: 选择 `short_links`
   - 点击 **Save**

4. **触发重新部署**:
   - 回到 **Deployments** 标签
   - 点击最新部署旁边的 **Retry deployment**

#### 5.2 通过命令行部署

```bash
npm run deploy
```

**注意**: 命令行部署后仍需在 Cloudflare Dashboard 中配置 D1 绑定（参考上面步骤 3）。

### 6. 验证部署

1. 访问你的 Pages URL（例如 `https://short-links.pages.dev`）
2. 尝试创建一个短链接
3. 测试重定向是否正常工作

## 项目结构

```
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
```

## API 接口

### 创建短链接

```
POST /api/shorten
Content-Type: application/json

{
  "url": "https://example.com/very/long/url",
  "slug": "custom-slug"  // 可选
}
```

**响应**:
```json
{
  "slug": "abc1234",
  "shortUrl": "https://your-domain.com/abc1234",
  "url": "https://example.com/very/long/url"
}
```

### 访问短链接

```
GET /{slug}
```

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

**本地数据库**:
```bash
npx wrangler d1 execute short_links --local --command "SELECT * FROM links LIMIT 10"
```

**远程数据库**:
```bash
npx wrangler d1 execute short_links --remote --command "SELECT * FROM links LIMIT 10"
```

### 标记热门链接为 pinned

```bash
npx wrangler d1 execute short_links --remote --command "UPDATE links SET pinned = 1 WHERE slug = 'your-slug'"
```

### 重新导出静态文件

```bash
node scripts/export-static.js
```

**注意**: 静态导出功能在本地开发时需要 wrangler CLI 可用。在 Cloudflare Pages 构建环境中会自动跳过。

## 安全特性

- URL 格式验证（仅允许 http/https）
- Slug 格式验证
- HTML 转义防止 XSS
- 数据库 UNIQUE 约束防止冲突
- 敏感配置文件（wrangler.toml）不提交到 Git

## 常见问题

### Q: 本地开发时出现 "no such table: links" 错误？

**A**: 需要初始化本地数据库：
```bash
npx wrangler d1 execute short_links --local --file=./schema.sql
```

### Q: 部署后 API 返回 500 错误？

**A**: 检查是否配置了 D1 数据库绑定：
1. 进入 Cloudflare Dashboard → Workers & Pages → 你的项目
2. Settings → Functions → D1 database bindings
3. 添加绑定：变量名 `DB`，数据库选择 `short_links`

### Q: 如何查看生产环境的数据库内容？

**A**: 使用 `--remote` 参数：
```bash
npx wrangler d1 execute short_links --remote --command "SELECT * FROM links"
```

### Q: wrangler.toml 文件丢失了怎么办？

**A**: 从模板文件复制并填入你的 database_id：
```bash
cp wrangler.toml.example wrangler.toml
# 编辑 wrangler.toml，填入你的 database_id
```

### Q: 如何自定义域名？

**A**: 在 Cloudflare Pages 项目设置中：
1. 进入 **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名并按照提示配置 DNS

## 许可证

MIT
