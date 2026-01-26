# Cloudflare Pages 手动部署指南

本指南适用于不使用 wrangler CLI，直接在 Cloudflare Dashboard 手动配置的情况。

## 第一步：准备代码仓库

### 1. 初始化 Git 仓库
```bash
git init
git add .
git commit -m "Initial commit: URL shortener"
```

### 2. 推送到 GitHub
```bash
# 在 GitHub 创建新仓库后
git remote add origin https://github.com/your-username/short-links.git
git branch -M main
git push -u origin main
```

---

## 第二步：创建 D1 数据库

### 1. 访问 Cloudflare Dashboard
https://dash.cloudflare.com/

### 2. 进入 D1 数据库页面
- 左侧菜单：**Workers & Pages** → **D1 SQL Database**
- 点击 **Create database**

### 3. 创建数据库
- Database name: `short_links`
- 点击 **Create**

### 4. 初始化数据库表结构
在数据库详情页面，点击 **Console** 标签，执行以下 SQL：

```sql
-- 链接表
CREATE TABLE links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  hit_count INTEGER NOT NULL DEFAULT 0,
  pinned INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NULL
);

-- 索引
CREATE INDEX idx_links_slug ON links(slug);
CREATE INDEX idx_links_pinned ON links(pinned);
CREATE INDEX idx_links_expires ON links(expires_at);

-- 点击事件表（可选）
CREATE TABLE link_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ip_hash TEXT NULL,
  ua_hash TEXT NULL
);
```

### 5. 记录 Database ID
在数据库详情页面顶部，复制 **Database ID**（格式类似：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）

---

## 第三步：创建 Cloudflare Pages 项目

### 1. 进入 Pages 页面
- 左侧菜单：**Workers & Pages**
- 点击 **Create application**
- 选择 **Pages** 标签
- 点击 **Connect to Git**

### 2. 连接 GitHub 仓库
- 选择你的 GitHub 账户
- 选择 `short-links` 仓库
- 点击 **Begin setup**

### 3. 配置构建设置
- **Project name**: `short-links`（或自定义）
- **Production branch**: `main`
- **Framework preset**: 选择 **None** 或 **Vite**
- **Build command**: `npm run build`
- **Build output directory**: `dist`

### 4. 环境变量（可选）
如果需要，可以添加环境变量：
- 点击 **Add variable**
- 暂时不需要添加

### 5. 点击 **Save and Deploy**

---

## 第四步：绑定 D1 数据库

### 1. 等待首次部署完成
部署完成后，进入项目设置页面

### 2. 绑定 D1 数据库
- 进入项目详情页
- 点击 **Settings** 标签
- 左侧菜单选择 **Functions**
- 滚动到 **D1 database bindings** 部分
- 点击 **Add binding**

### 3. 配置绑定
- **Variable name**: `DB`（必须是 `DB`，与代码中的绑定名称一致）
- **D1 database**: 选择刚才创建的 `short_links` 数据库
- 点击 **Save**

### 4. 重新部署
绑定 D1 后需要重新部署：
- 进入 **Deployments** 标签
- 点击最新部署右侧的 **...** 菜单
- 选择 **Retry deployment**

---

## 第五步：验证部署

### 1. 访问你的网站
部署完成后，Cloudflare 会提供一个 URL，格式类似：
```
https://short-links-xxx.pages.dev
```

### 2. 测试功能
- 打开网站
- 输入一个长 URL（如 `https://www.example.com/very/long/url`）
- 点击 **生成短链接**
- 应该会生成一个短链接（如 `https://short-links-xxx.pages.dev/abc1234`）
- 访问短链接，应该会重定向到原始 URL

### 3. 验证数据库
回到 D1 数据库 Console，执行：
```sql
SELECT * FROM links;
```
应该能看到刚才创建的链接记录

---

## 第六步：自定义域名（可选）

### 1. 添加自定义域名
- 在项目详情页，点击 **Custom domains** 标签
- 点击 **Set up a custom domain**
- 输入你的域名（如 `s.yourdomain.com`）
- 按照提示添加 DNS 记录

### 2. 等待 SSL 证书生成
Cloudflare 会自动为你的自定义域名生成 SSL 证书

---

## 常见问题

### Q: 如何更新代码？
A: 推送新代码到 GitHub，Cloudflare Pages 会自动重新部署。

### Q: 如何查看部署日志？
A: 在项目详情页的 **Deployments** 标签，点击具体的部署查看日志。

### Q: 如何查看 D1 数据库内容？
A: 在 D1 数据库详情页的 **Console** 标签执行 SQL 查询。

### Q: 如何标记热门链接为静态导出？
A: 在 D1 Console 执行：
```sql
UPDATE links SET pinned = 1 WHERE slug = 'your-slug';
```
然后重新部署项目。

### Q: 如何删除链接？
A: 在 D1 Console 执行：
```sql
DELETE FROM links WHERE slug = 'your-slug';
```

### Q: 如何查看链接点击统计？
A: 在 D1 Console 执行：
```sql
SELECT slug, target_url, hit_count, created_at
FROM links
ORDER BY hit_count DESC
LIMIT 10;
```

---

## 本地开发

由于不使用 wrangler，本地开发时 API 会使用 Mock 数据：

```bash
npm run dev
```

访问 http://localhost:5173

**注意**：本地开发时生成的短链接是模拟的，不会保存到数据库。要测试完整功能，请直接在 Cloudflare Pages 上测试。

---

## 更新 wrangler.toml

虽然不使用 wrangler 部署，但建议更新 `wrangler.toml` 中的 `database_id`，以便将来需要时可以使用：

```toml
name = "short-links"
pages_build_output_dir = "dist"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "short_links"
database_id = "你的-database-id-在这里"
```

---

## 下一步

1. ✅ 推送代码到 GitHub
2. ✅ 在 Cloudflare Dashboard 创建 D1 数据库
3. ✅ 在 Cloudflare Pages 连接 GitHub 仓库
4. ✅ 绑定 D1 数据库
5. ✅ 测试功能
6. 🎉 开始使用！
