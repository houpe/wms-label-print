# WMS面单打印系统

基于 Next.js 16 + SQLite + Prisma 的面单打印管理系统。

## 功能特性

- **门店管理**：添加、编辑、删除门店信息
- **收货人管理**：为每个门店配置收货人信息（姓名、电话、地址）
- **面单打印**：选择门店和收货人，设置温层（冷冻/冷藏/常温）和件数，生成 130mm×76mm 竖版面单

## 技术栈

- **前端**：Next.js 16 + React 19 + TailwindCSS
- **后端**：Next.js API Routes
- **数据库**：SQLite
- **ORM**：Prisma 5

## 开发服务器

应用已启动，访问地址：http://localhost:3000

## 页面路由

| 路由 | 说明 |
|------|------|
| `/` | 首页导航 |
| `/stores` | 门店管理页面 |
| `/contacts` | 收货人管理页面 |
| `/print` | 面单打印页面 |

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/stores` | GET | 获取所有门店 |
| `/api/stores` | POST | 创建门店 |
| `/api/stores/[id]` | GET | 获取单个门店 |
| `/api/stores/[id]` | PUT | 更新门店 |
| `/api/stores/[id]` | DELETE | 删除门店 |
| `/api/contacts` | GET | 获取所有收货人 |
| `/api/contacts` | POST | 创建收货人 |
| `/api/contacts?storeId=xxx` | GET | 获取门店下的收货人 |
| `/api/contacts/[id]` | PUT | 更新收货人 |
| `/api/contacts/[id]` | DELETE | 删除收货人 |
| `/api/print-orders` | POST | 创建打印单 |
| `/api/print-orders` | GET | 获取所有打印单 |

## 面单规格

- **尺寸**：130mm × 76mm（竖版）
- **内容**：
  - 门店名称
  - 收货人姓名
  - 联系电话
  - 温层标签（冷冻/冷藏/常温，带颜色）
  - 日期
  - 件数序号（如 1/5）

## 使用方法

1. 访问 `/stores` 添加门店
2. 访问 `/contacts` 为门店添加收货人
3. 访问 `/print` 选择门店和收货人，设置温层和件数，生成面单
4. 点击浏览器打印（Ctrl/Cmd + P），选择打印机完成打印

## 数据库

SQLite 数据库文件位于 `prisma/dev.db`

运行数据库迁移：
```bash
npx prisma migrate deploy
```
