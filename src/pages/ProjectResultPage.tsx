import { Card, Typography } from 'antd';

type ProjectResultPageProps = {
  onNavigate: () => void;
};

export default function ProjectResultPage({
  onNavigate,
}: ProjectResultPageProps) {
  return (
    <main>
      <Typography.Title level={2}>测算结果</Typography.Title>
      <Card>
        <Typography.Paragraph type="secondary">
          页面建设中
        </Typography.Paragraph>
        <a
          href="/project/new"
          onClick={(event) => {
            event.preventDefault();
            onNavigate();
          }}
        >
          返回项目信息
        </a>
      </Card>
    </main>
  );
}
