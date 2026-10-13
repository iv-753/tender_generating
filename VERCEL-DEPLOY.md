# Vercel 部署配置

1. 从 GitHub 导入项目，Framework 选择 `Vite`，Root Directory 保持 `./`；构建和路由配置已写入 `vercel.json`。
2. 在项目的 Storage 中创建并连接一个 **Private Blob**，不要选择 Public。
3. 不需要上传成本模型，也不要配置 `COST_MODEL_BLOB_PATH`；122 项测算规则已经内置到服务器代码。
4. 在 Vercel 环境变量中添加 `QWEN_API_KEY`；模型默认使用 `qwen3.7-max`，无需再填模型名。
5. 为 Production 环境添加随机生成的 `CRON_SECRET`（至少 32 个字符），不要提交到仓库。清理接口在未配置密钥时拒绝运行。
6. 重新部署后，依次验证项目测算、Excel 智能导入、PPT 下载和标书下载，并在 Settings → Cron Jobs 中确认 `/api/artifacts/cleanup` 已启用；首次上线可点 Run 清理历史过期生成文件，检查函数日志中的删除数量和字节数。

生成的 PPT 和 Word 标书下载链接保留 24 小时。每天 UTC 19:00（北京时间次日 03:00）清理已上传超过 24 小时零 5 分钟的文件；5 分钟用于保护旧版本上传后才签发的链接。Hobby 套餐每日运行一次且可能在该小时内延迟，因此过期后通常在下一个每日任务释放空间，不保证到点立即删除。仅清理 `generated/presentation/<UUID>/artifact.pptx` 和 `generated/bid/<UUID>/artifact.docx`，包括历史生成文件，不处理模型、模板或其他路径。清理失败会返回错误并记录日志，下次任务重试；浏览器中原有下载记录不会被删除，过期后需重新生成。

上线验收时可携带 `Authorization: Bearer <CRON_SECRET>` 请求 `/api/artifacts/cleanup?dryRun=1`，只返回待清理数量和容量，不删除文件。

成本模型、API 密钥及客户生成文件均不得放入 Git 仓库或公开存储。
