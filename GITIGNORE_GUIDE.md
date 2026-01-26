# .gitignore 说明

本文件配置了 Git 应该忽略的文件和目录，避免提交不必要或敏感的文件到版本控制。

## 忽略的文件类型

### 1. 依赖和包管理
```
node_modules/          # npm 依赖包
package-lock.json      # 锁文件（可选忽略）
```

**说明**：
- `node_modules/` 包含所有依赖，体积大且可通过 `npm install` 重新生成
- `package-lock.json` 是否忽略取决于团队协作需求，建议保留以确保依赖版本一致

### 2. 构建产物
```
dist/                  # Vite 构建输出
build/                 # 其他构建工具输出
.output/               # Nuxt 等框架输出
```

**说明**：
- 构建产物可以通过 `npm run build` 重新生成
- Cloudflare Pages 会在部署时自动构建

### 3. Cloudflare 相关
```
.wrangler/             # Wrangler 本地缓存
.dev.vars              # 本地开发环境变量
wrangler.toml.backup   # 配置备份文件
```

**说明**：
- `.dev.vars` 可能包含敏感信息（API 密钥等）
- `.wrangler/` 是本地缓存目录

### 4. 环境变量和配置
```
.env                   # 环境变量文件
.env.local             # 本地环境变量
.env.*.local           # 各环境的本地配置
*.local                # 所有本地配置文件
```

**说明**：
- 环境变量文件通常包含敏感信息（数据库密码、API 密钥等）
- 应该创建 `.env.example` 作为模板提交到 Git

### 5. 日志文件
```
*.log                  # 所有日志文件
npm-debug.log*         # npm 调试日志
yarn-debug.log*        # yarn 调试日志
pnpm-debug.log*        # pnpm 调试日志
```

**说明**：
- 日志文件包含运行时信息，不需要版本控制
- 可能包含敏感信息（错误堆栈、路径等）

### 6. 编辑器和 IDE
```
.vscode/               # VS Code 配置
.idea/                 # JetBrains IDE 配置
*.swp, *.swo          # Vim 临时文件
.sublime-*            # Sublime Text 配置
```

**说明**：
- 编辑器配置因人而异，不应强制团队成员使用相同配置
- 如需共享配置，可以创建 `.vscode/settings.json.example`

### 7. 操作系统文件
```
.DS_Store              # macOS 文件夹元数据
Thumbs.db              # Windows 缩略图缓存
desktop.ini            # Windows 文件夹配置
```

**说明**：
- 操作系统自动生成的文件，对项目无用
- 会污染 Git 历史

### 8. 测试覆盖率
```
coverage/              # 测试覆盖率报告
*.lcov                 # LCOV 格式报告
.nyc_output/           # NYC 测试工具输出
```

**说明**：
- 测试覆盖率报告可以在 CI/CD 中重新生成
- 通常体积较大

### 9. 临时文件
```
*.tmp, *.temp          # 临时文件
.cache/                # 缓存目录
.temp/, .tmp/          # 临时目录
```

**说明**：
- 临时文件和缓存不需要版本控制
- 可能包含敏感信息

### 10. 其他
```
.ace-tool/             # ACE 工具缓存
.claude/               # Claude 配置和计划文件
```

**说明**：
- 项目特定的工具缓存和配置
- `.claude/` 包含 AI 辅助开发的计划文件，通常不需要提交

## 安全建议

### ⚠️ 绝对不要提交的文件
1. **环境变量文件**：`.env`, `.env.local`
2. **API 密钥和密码**：任何包含敏感信息的文件
3. **私钥文件**：`.pem`, `.key`, `*.p12`
4. **数据库备份**：`*.sql`, `*.db`（除非是示例数据）
5. **个人配置**：编辑器配置、操作系统文件

### ✅ 应该提交的文件
1. **源代码**：`src/`, `functions/`
2. **配置模板**：`.env.example`, `wrangler.toml.example`
3. **文档**：`README.md`, `*.md`
4. **依赖声明**：`package.json`
5. **构建配置**：`vite.config.ts`, `tsconfig.json`

## 检查已提交的敏感文件

如果不小心提交了敏感文件，需要从 Git 历史中删除：

```bash
# 从 Git 历史中删除文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/sensitive/file" \
  --prune-empty --tag-name-filter cat -- --all

# 强制推送（谨慎使用）
git push origin --force --all
```

**更安全的方法**：使用 BFG Repo-Cleaner
```bash
# 安装 BFG
brew install bfg  # macOS
# 或从 https://rtyley.github.io/bfg-repo-cleaner/ 下载

# 删除敏感文件
bfg --delete-files sensitive-file.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## 验证 .gitignore

检查哪些文件会被忽略：
```bash
# 查看所有被忽略的文件
git status --ignored

# 检查特定文件是否被忽略
git check-ignore -v path/to/file

# 查看 .gitignore 规则
git ls-files --others --ignored --exclude-standard
```

## 常见问题

### Q: package-lock.json 应该提交吗？
A: **建议提交**。它确保团队成员和 CI/CD 使用相同的依赖版本。如果是库项目，可以忽略。

### Q: dist/ 目录应该提交吗？
A: **不应该**。构建产物应该在部署时生成，不需要版本控制。

### Q: .vscode/ 应该提交吗？
A: **看情况**。如果是团队共享的配置（如推荐扩展），可以提交。个人配置不应该提交。

### Q: 如何忽略已经提交的文件？
A:
```bash
# 从 Git 中删除但保留本地文件
git rm --cached path/to/file

# 提交更改
git commit -m "Remove file from Git"
```

## 相关资源

- [GitHub .gitignore 模板](https://github.com/github/gitignore)
- [gitignore.io](https://www.toptal.com/developers/gitignore) - 在线生成 .gitignore
- [Git 文档](https://git-scm.com/docs/gitignore)
