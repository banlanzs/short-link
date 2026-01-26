# 短链接重定向配置说明

## 问题描述

访问短链接（如 `https://your-domain.com/abc123`）时，显示的是前端页面而不是重定向到原始 URL。

## 原因

Cloudflare Pages 默认会将所有路径请求返回 `index.html`（SPA 模式），导致 Functions 无法处理短链接路径。

## 解决方案

### 方案 1：使用 `_routes.json`（推荐）

已创建 `public/_routes.json` 文件，配置如下：

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": [
    "/",
    "/index.html",
    "/assets/*",
    "/*.js",
    "/*.css",
    "/*.json",
    "/*.txt",
    "/*.xml",
    "/*.woff",
    "/*.woff2",
    "/*.ttf",
    "/*.eot",
    "/*.svg",
    "/*.ico",
    "/*.png",
    "/*.jpg",
    "/*.jpeg",
    "/*.gif",
    "/*.webp",
    "/*.webmanifest"
  ]
}
```

**工作原理**：
- `include: ["/*"]`：所有路径都由 Functions 处理
- `exclude: ["/", "/index.html", "/assets/*", ...]`：排除根路径和静态资源

**结果**：
- 访问 `/` → 返回前端页面
- 访问 `/abc123` → 由 `functions/[slug].ts` 处理，返回 301 重定向
- 访问 `/api/shorten` → 由 `functions/api/shorten.ts` 处理

### 方案 2：使用 `_redirects` 文件（备选）

如果 `_routes.json` 不生效，可以创建 `public/_redirects` 文件：

```
# API 路由
/api/* 200

# 静态资源
/ /index.html 200
/assets/* 200

# 短链接重定向（由 Functions 处理）
/:slug 200
```

### 方案 3：修改 Functions 文件名（不推荐）

将 `functions/[slug].ts` 重命名为 `functions/[[path]].ts`，这样可以捕获所有路径。但这会导致根路径也被 Functions 处理，需要额外逻辑判断。

## 部署后验证

### 1. 构建项目
```bash
npm run build
```

确认 `dist/` 目录包含 `_routes.json` 文件。

### 2. 部署到 Cloudflare Pages
推送代码到 GitHub，Cloudflare Pages 会自动重新部署。

### 3. 测试重定向

**创建短链接**：
```bash
curl -X POST https://your-domain.com/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.example.com"}'
```

返回：
```json
{
  "slug": "abc123",
  "shortUrl": "https://your-domain.com/abc123",
  "url": "https://www.example.com"
}
```

**测试重定向**：
```bash
curl -I https://your-domain.com/abc123
```

应该返回：
```
HTTP/2 301
location: https://www.example.com
cache-control: public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400
```

**浏览器测试**：
访问 `https://your-domain.com/abc123`，应该**立即重定向**到 `https://www.example.com`，而不是显示前端页面。

## 常见问题

### Q: 部署后仍然显示前端页面？

**检查清单**：
1. ✅ 确认 `dist/_routes.json` 文件存在
2. ✅ 确认 D1 数据库已绑定（Variable name: `DB`）
3. ✅ 清除浏览器缓存或使用无痕模式测试
4. ✅ 检查 Cloudflare Pages 部署日志

**调试步骤**：
```bash
# 1. 检查 Functions 是否部署
curl -I https://your-domain.com/api/shorten

# 2. 检查短链接是否存在于数据库
# 在 D1 Console 执行：
SELECT * FROM links WHERE slug = 'abc123';

# 3. 直接测试 Functions
curl -I https://your-domain.com/abc123
```

### Q: 404 Not Found？

可能原因：
1. 短链接不存在于数据库
2. D1 数据库未正确绑定
3. Functions 未正确部署

**解决方法**：
- 在 D1 Console 查询数据库
- 检查 Cloudflare Pages 的 Functions 日志
- 重新部署项目

### Q: 本地开发如何测试重定向？

本地开发使用 Mock API，无法测试重定向。需要部署到 Cloudflare Pages 测试完整功能。

如果必须本地测试，可以使用 wrangler：
```bash
npm run build:frontend
npx wrangler pages dev dist --d1=DB --port=8788
```

## 文件清单

确保以下文件存在：

- ✅ `public/_routes.json` - 路由配置
- ✅ `functions/[slug].ts` - 重定向处理
- ✅ `functions/api/shorten.ts` - 短链接生成
- ✅ `schema.sql` - 数据库 Schema

## 下一步

1. 提交代码：
   ```bash
   git add .
   git commit -m "Fix: Add _routes.json for proper redirect handling"
   git push
   ```

2. 等待 Cloudflare Pages 自动部署

3. 测试重定向功能

4. 如果仍有问题，检查 Cloudflare Pages 的部署日志
