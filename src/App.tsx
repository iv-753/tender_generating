import { BarChartOutlined, FormOutlined } from '@ant-design/icons';
import { Layout, Menu, Typography } from 'antd';
import { useEffect, useState } from 'react';
import ProjectNewPage from './pages/ProjectNewPage';
import ProjectResultPage from './pages/ProjectResultPage';

const { Header, Content } = Layout;

const routes = ['/project/new', '/project/result'] as const;
type AppPath = (typeof routes)[number];

function resolvePath() {
  const path = window.location.pathname;
  if (routes.includes(path as (typeof routes)[number])) {
    return path;
  }
  window.history.replaceState({}, '', '/project/new');
  return '/project/new';
}

function navigate(path: AppPath) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function App() {
  const [path, setPath] = useState(resolvePath);

  useEffect(() => {
    const handlePopState = () => setPath(resolvePath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const page =
    path === '/project/result' ? (
      <ProjectResultPage onNavigate={() => navigate('/project/new')} />
    ) : (
      <ProjectNewPage onNavigate={() => navigate('/project/result')} />
    );

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <Typography.Title className="brand" level={3}>
          物业测算工作台
        </Typography.Title>
        <Menu
          className="main-menu"
          mode="horizontal"
          theme="dark"
          selectedKeys={[path]}
          items={[
            {
              key: '/project/new',
              icon: <FormOutlined />,
              label: (
                <a
                  href="/project/new"
                  onClick={(event) => {
                    event.preventDefault();
                    navigate('/project/new');
                  }}
                >
                  新建测算
                </a>
              ),
            },
            {
              key: '/project/result',
              icon: <BarChartOutlined />,
              label: (
                <a
                  href="/project/result"
                  onClick={(event) => {
                    event.preventDefault();
                    navigate('/project/result');
                  }}
                >
                  测算结果
                </a>
              ),
            },
          ]}
        />
      </Header>
      <Content className="app-content">{page}</Content>
    </Layout>
  );
}
