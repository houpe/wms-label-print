# WMS · 面单打印系统

基于 Next.js 16 + SQLite + Prisma 的面单打印管理系统。

## 功能特性

- **单次新建**：选择货主、门店，按温层（冷冻/冷藏/常温）独立设置件数，实时生成面单
- **批量新建**：上传 Excel 批量生成面单，支持下载模板
- **门店管理**：添加、编辑、删除门店信息，支持货主和联系电话
- **联系人管理**：联系人归属门店，单次和批量创建时自动从门店获取联系人
- **标签打印**：76mm × 133mm 竖版面单，内容旋转90°，每件一张，精准分页
- **记忆功能**：自动保存上次选择的货主、门店、温层
- **打印记录**：所有打印操作自动入库

## 面单规格

- **纸张尺寸**：76mm 宽 × 133mm 高（竖版）
- **内容旋转**：顺时针90°，打印后横向粘贴
- **面单内容**：
  - 门店名称（加粗居中）
  - 收货人（黑色加粗）
  - 联系电话（后四位加大显示）
  - 日期（精确到秒，年份缩写如 26/06/15）
  - 温层标签（冷冻：黑底白字；冷藏/常温：黑字黑框）
  - 件数序号（如 1/5）
- **打印方式**：隐藏 iframe 打印，不弹窗，带进度提示

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | Next.js 16 + React 19 + TailwindCSS 4 |
| 后端 | Next.js API Routes |
| 数据库 | SQLite |
| ORM | Prisma 5 |
| Excel解析 | xlsx (SheetJS) |
| 下拉选择 | react-select |
| UI设计 | 绿色主题 |

## 快速开始

```bash
# 安装依赖
npm install

# 初始化数据库
npx prisma migrate deploy

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000/print

## 页面路由

| 路由 | 说明 |
|------|------|
| `/print` | 面单打印（单次新建 + 批量新建 Tab） |
| `/print/stores` | 门店管理 |

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/print/api/stores` | GET | 获取所有门店（含联系人） |
| `/print/api/stores` | POST | 创建门店 |
| `/print/api/stores/[id]` | PUT | 更新门店 |
| `/print/api/stores/[id]` | DELETE | 删除门店 |
| `/print/api/contacts` | GET | 获取联系人（支持 ?storeId 过滤） |
| `/print/api/contacts` | POST | 创建联系人 |
| `/print/api/contacts/[id]` | PUT | 更新联系人 |
| `/print/api/contacts/[id]` | DELETE | 删除联系人 |
| `/print/api/print-orders` | GET | 获取打印记录 |
| `/print/api/print-orders` | POST | 创建打印记录 |

## 批量上传

1. 下载模板：点击「📥 下载模板」获取 `批量模板.xls`
2. 模板格式：

| 门店 | 收货人 | 联系电话 | 日期 | 温区 | 总件数 |
|------|--------|----------|------|------|--------|
| 尹三顺洋湖天街店 | 张三 | 18888888888 | （Excel日期） | 冷冻 | 10 |
| 尹三顺万象城店 | 李四 | 13888888888 | （Excel日期） | 冷藏 | 20 |

3. 温区必须是：冷冻 / 冷藏 / 常温
4. 上传后自动解析，显示有效行数和面单总数
5. 点击「立即打印」直接打印

## 项目结构

```
src/
├── app/
│   ├── page.tsx          # 首页（单次新建 + 批量新建 Tab）
│   ├── stores/page.tsx   # 门店管理
│   ├── api/
│   │   ├── stores/       # 门店 API
│   │   ├── contacts/     # 联系人 API
│   │   └── print-orders/ # 打印记录 API
│   ├── globals.css       # 全局样式（绿色主题）
│   └── layout.tsx        # 根布局
├── lib/prisma.ts         # Prisma 客户端
prisma/
├── schema.prisma         # 数据库模型
└── migrations/           # 数据库迁移
public/
└── 批量模板.xls          # 批量上传模板
```

## 部署

服务器部署在 `root@www.houpe.top`，部署目录 `/opt/wms-label`，通过 PM2 管理进程。

```bash
# 推送部署（首次配置后）
git push server main
```

Nginx 反向代理路径：`https://houpe.top/print`

## ESLint

```bash
npm run lint
```

代码规范通过 ESLint 检查，零 error。

## 许可证

MIT
