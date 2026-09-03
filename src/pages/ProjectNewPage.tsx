import { Card, Typography } from 'antd';

type ProjectNewPageProps = {
  onNavigate: () => void;
};

export default function ProjectNewPage({ onNavigate }: ProjectNewPageProps) {
  return (
    <main>
      <Typography.Title level={2}>项目信息</Typography.Title>
      <Card>
        <Typography.Paragraph type="secondary">
          页面建设中
        </Typography.Paragraph>
        <a
          href="/project/result"
          onClick={(event) => {
            event.preventDefault();
            onNavigate();
          }}
        >
          查看测算结果
        </a>
      </Card>
    </main>
  );
}
