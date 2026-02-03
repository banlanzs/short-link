import { execSync } from 'node:child_process'

try {
  console.log('Initializing local D1 database...')
  execSync('npx wrangler d1 execute short_links --local --file=./schema.sql', {
    stdio: 'inherit',
    encoding: 'utf8'
  })
  console.log('Local database initialized successfully!')
} catch (error) {
  // 如果表已存在，忽略错误
  if (error.message?.includes('already exists')) {
    console.log('Database tables already exist, skipping initialization.')
  } else {
    console.error('Failed to initialize database:', error.message)
  }
}
