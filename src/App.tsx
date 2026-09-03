import { AppstoreOutlined, BankOutlined, SettingOutlined, SnippetsOutlined, UserOutlined } from '@ant-design/icons';
import { Layout, Menu, Typography } from 'antd';
import { useEffect, useState } from 'react';
import ProjectWorkspaceNav, { type ProjectWorkspacePath } from './components/ProjectWorkspaceNav';
import CompanyProfilePage from './pages/CompanyProfilePage';
import ProjectBidPage from './pages/ProjectBidPage';
import ProjectCenterPage from './pages/ProjectCenterPage';
import ProjectHistoryPage from './pages/ProjectHistoryPage';
import ProjectNewPage from './pages/ProjectNewPage';
import ProjectOverviewPage from './pages/ProjectOverviewPage';
import ProjectPresentationPage from './pages/ProjectPresentationPage';
import ProjectResultPage from './pages/ProjectResultPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import TemplateManagementPage from './pages/TemplateManagementPage';
import { storage } from './storage';

const { Header, Content } = Layout;
const routes = ['/projects', '/company', '/templates', '/settings', '/project/new', '/project/overview', '/project/result', '/project/presentation', '/project/bid', '/project/history'] as const;
type AppPath = (typeof routes)[number];
const projectWorkspacePaths: ProjectWorkspacePath[] = ['/project/overview', '/project/result', '/project/presentation', '/project/bid', '/project/history'];

function resolvePath(): AppPath {
  const path = window.location.pathname as AppPath;
  if (routes.includes(path)) return path;
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

  const openProject = (id: string, destination: '/project/new' | '/project/overview') => {
    if (storage.selectProject(id)) navigate(destination);
  };
  const startNewProject = () => { storage.startNewProject(); navigate('/project/new'); };
  const projectNavigate = (destination: ProjectWorkspacePath) => navigate(destination);

  let page;
  if (path === '/projects') page = <ProjectCenterPage onNew={startNewProject} onOpen={(id) => openProject(id, '/project/overview')} onEdit={(id) => openProject(id, '/project/new')} />;
  else if (path === '/company') page = <CompanyProfilePage />;
  else if (path === '/templates') page = <TemplateManagementPage />;
  else if (path === '/settings') page = <SystemSettingsPage />;
  else if (path === '/project/new') page = <ProjectNewPage onNavigate={() => navigate('/project/result')} />;
  else if (path === '/project/overview') page = <ProjectOverviewPage onNavigate={projectNavigate} />;
  else if (path === '/project/result') page = <ProjectResultPage onNavigate={() => navigate('/project/new')} />;
  else if (path === '/project/presentation') page = <ProjectPresentationPage onGenerate={() => navigate('/project/result')} />;
  else if (path === '/project/bid') page = <ProjectBidPage />;
  else page = <ProjectHistoryPage />;

  const workspace = projectWorkspacePaths.includes(path as ProjectWorkspacePath);
  const selected = path.startsWith('/project/') ? '/projects' : path;
  const menuItems = [
    { key: '/projects', icon: <AppstoreOutlined />, label: '项目中心' },
    { key: '/company', icon: <BankOutlined />, label: '企业资料' },
    { key: '/templates', icon: <SnippetsOutlined />, label: '方案资产' },
    { key: '/settings', icon: <SettingOutlined />, label: '管理中心' },
  ].map((item) => ({ ...item, label: <a href={item.key} onClick={(event) => { event.preventDefault(); navigate(item.key as AppPath); }}>{item.label}</a> }));

  return <Layout className="app-shell">
    <Header className="app-header"><Typography.Title className="brand" level={3}>物业方案工作台</Typography.Title><Menu className="main-menu" mode="horizontal" theme="dark" selectedKeys={[selected]} items={menuItems} /><span className="account-chip"><UserOutlined /><span><strong>{storage.loadCompanyProfile()?.companyName || '企业账户'}</strong><small>管理员</small></span></span></Header>
    <Content className="app-content">{workspace && <ProjectWorkspaceNav activePath={path as ProjectWorkspacePath} onNavigate={projectNavigate} />}{page}</Content>
  </Layout>;
}
