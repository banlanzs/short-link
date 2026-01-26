# 本地开发指南

## 方案 A：完整本地开发（需要 wrangler）

如果需要在本地测试完整功能（包括 API 和重定向），需要使用 wrangler pages dev：

### 1. 安装 wrangler
```bash
npm install -g wrangler
```

### 2. 创建本地 D1 数据库（用于本地开发）
```bash
npx wrangler d1 create short_links
# 或使用本地文件系统
npx wrangler d1 execute short_links --local --file=./schema.sql
```

### 3. 更新 wrangler.toml
将返回的 `database_id` 更新到 `wrangler.toml`

### 4. 启动本地开发服务器
```bash
npm run dev:functions
```

访问：http://localhost:8788

---

## 方案 B：纯前端开发（推荐，不需要 wrangler）

如果你只想开发前端 UI，不测试 API 功能：

### 1. 创建 Mock API 响应
创建 `src/mock.ts` 文件：

```typescript
// Mock API 响应
export async function mockShorten(url: string) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const slug = Math.random().toString(36).substring(2, 9)
      resolve({
        slug,
        shortUrl: `http://localhost:5173/${slug}`,
        url,
      })
    }, 500)
  })
}
```

### 2. 修改 UrlInput.tsx 使用 Mock
将 `fetch('/api/shorten', ...)` 替换为 `mockShorten(url)`

### 3. 启动 Vite 开发服务器
```bash
npm run dev
```

---

## 方案 C：直接部署到 Cloudflare 测试（推荐）

跳过本地测试，直接在 Cloudflare Pages 上测试：

### 1. 推送代码到 GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. 在 Cloudflare Pages 连接 GitHub 仓库
访问：https://dash.cloudflare.com/

---

## 常见问题

### Q: 为什么 npm run dev 访问 /api/shorten 返回 404？
A: Vite 开发服务器不支持 Cloudflare Pages Functions。需要使用 `wrangler pages dev` 或者使用 Mock API。

### Q: 我不想安装 wrangler，可以本地开发吗？
A: 可以，但只能测试前端 UI。API 功能需要使用 Mock 数据或者直接部署到 Cloudflare Pages 测试。

### Q: 如何在不使用 wrangler 的情况下初始化 D1 数据库？
A: 可以在 Cloudflare Dashboard 的 D1 控制台手动执行 SQL（参考下面的手动部署指南）。
