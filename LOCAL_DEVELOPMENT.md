# 本地开发指南

## 方案 A：完整本地开发（推荐）

如果需要在本地测试完整功能（包括 API 和重定向），需要使用 wrangler pages dev：

### 1. 安装依赖
```bash
npm install
```

### 2. 配置 wrangler.toml
```bash
# 复制模板文件
cp wrangler.toml.example wrangler.toml
# 编辑 wrangler.toml，填入你的 database_id
```

### 3. 创建和初始化 D1 数据库
```bash
# 创建远程数据库
npx wrangler d1 create short_links

# 初始化本地数据库（用于开发）
npx wrangler d1 execute short_links --local --file=./schema.sql

# 初始化远程数据库（用于生产）
npx wrangler d1 execute short_links --remote --file=./schema.sql
```

### 4. 启动本地开发服务器
```bash
npm run dev:functions
```

访问：http://localhost:8788

**注意**：`dev:functions` 命令会自动：
1. 构建前端 (`npm run build:frontend`)
2. 初始化本地数据库 (`node scripts/init-local-db.js`)
3. 启动 wrangler pages dev 服务器

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
A: Vite 开发服务器不支持 Cloudflare Pages Functions。需要使用 `npm run dev:functions` 或者使用 Mock API。

### Q: 本地开发时出现 "no such table: links" 错误？
A: 需要初始化本地数据库：
```bash
npx wrangler d1 execute short_links --local --file=./schema.sql
```
或者重启 `npm run dev:functions`，它会自动初始化。

### Q: wrangler.toml 文件不存在？
A: 从模板文件复制：
```bash
cp wrangler.toml.example wrangler.toml
```
然后编辑文件，填入你的 `database_id`。

### Q: 如何查看本地数据库内容？
A: 使用 wrangler 命令：
```bash
npx wrangler d1 execute short_links --local --command "SELECT * FROM links"
```
