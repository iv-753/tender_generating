import { AppstoreOutlined, BarChartOutlined, FormOutlined } from '@ant-design/icons';
import { Layout, Menu, Typography } from 'antd';
import { useEffect, useState } from 'react';
import ProjectNewPage from './pages/ProjectNewPage';
import ProjectCenterPage from './pages/ProjectCenterPage';
import ProjectResultPage from './pages/ProjectResultPage';
import { storage } from './storage';

const { Header, Content } = Layout;

const routes = ['/projects', '/project/new', '/project/result'] as const;
type AppPath = (typeof routes)[number];

function resolvePath() {
  const path = window.location.pathname;
  if (routes.includes(path as (typeof routes)[number])) {
    return path;
  }
  window.history.replaceState({}, '', '/projects');
  return '/projects';
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

  const openProject = (id: string, destination: Extract<AppPath, '/project/new' | '/project/result'>) => {
    if (storage.selectProject(id)) navigate(destination);
  };
  const startNewProject = () => {
    storage.startNewProject();
    navigate('/project/new');
  };

  const page = path === '/projects' ? (
    <ProjectCenterPage
      onNew={startNewProject}
      onOpen={(id) => openProject(id, '/project/result')}
      onEdit={(id) => openProject(id, '/project/new')}
    />
  ) : path === '/project/result' ? (
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
              key: '/projects',
              icon: <AppstoreOutlined />,
              label: (
                <a
                  href="/projects"
                  onClick={(event) => {
                    event.preventDefault();
                    navigate('/projects');
                  }}
                >
                  项目中心
                </a>
              ),
            },
            {
              key: '/project/new',
              icon: <FormOutlined />,
              label: (
                <a
                  href="/project/new"
                  onClick={(event) => {
                    event.preventDefault();
                    startNewProject();
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
