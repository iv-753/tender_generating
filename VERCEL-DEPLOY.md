# Vercel 部署配置

1. 从 GitHub 导入项目，Framework 选择 `Vite`，Root Directory 保持 `./`；构建和路由配置已写入 `vercel.json`。
2. 在项目的 Storage 中创建并连接一个 **Private Blob**，不要选择 Public。
3. 把本机的 `动态成本分析模型.xlsx` 上传到该私有 Blob，并将其 Blob pathname 填入环境变量 `COST_MODEL_BLOB_PATH`。
4. 在 Vercel 环境变量中添加 `QWEN_API_KEY`；模型默认使用 `qwen3.7-max`，无需再填模型名。
5. 重新部署后，依次验证项目测算、Excel 智能导入、PPT 下载和标书下载。

成本模型、API 密钥及客户生成文件均不得放入 Git 仓库或公开存储。
