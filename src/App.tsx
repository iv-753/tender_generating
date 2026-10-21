import { SHOW_DELIVERABLE_FEATURES, isRetainedRoute } from './presentationFeatures';
import { ClockCircleOutlined, HomeFilled, PlusCircleOutlined, AppstoreOutlined, BankOutlined, SettingOutlined, SnippetsOutlined, UserOutlined } from '@ant-design/icons';
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
  if (routes.includes(path) && isRetainedRoute(path)) return path;
  window.history.replaceState({}, '', '/projects');
  return '/projects';
}

function navigate(path: AppPath) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function App() {
  const [path, setPath] = useState(resolvePath);
  const [resultRevision, setResultRevision] = useState(0);
  useEffect(() => {
    const handlePopState = () => setPath(resolvePath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openProject = (id: string, destination: '/project/new' | '/project/overview' | '/project/result') => {
    if (storage.selectProject(id)) { setResultRevision(value => value + 1); navigate(destination); }
  };
  const startNewProject = () => { storage.startNewProject(); navigate('/project/new'); };
  const projectNavigate = (destination: ProjectWorkspacePath) => navigate(destination);

  let page;
  if (path === '/projects') page = <ProjectCenterPage onNew={startNewProject} onResume={() => navigate('/project/new')} onResult={(id) => openProject(id, '/project/result')} onOpen={(id) => openProject(id, '/project/overview')} onEdit={(id) => openProject(id, '/project/new')} />;
  else if (path === '/company') page = <CompanyProfilePage />;
  else if (path === '/templates') page = <TemplateManagementPage />;
  else if (path === '/settings') page = <SystemSettingsPage />;
  else if (path === '/project/new') page = <ProjectNewPage onNavigate={() => navigate('/project/result')} />;
  else if (path === '/project/overview') page = <ProjectOverviewPage onNavigate={projectNavigate} />;
  else if (path === '/project/result') page = <ProjectResultPage key={resultRevision} onNavigate={() => navigate('/project/new')} />;
  else if (path === '/project/presentation') page = <ProjectPresentationPage onGenerate={() => navigate('/project/result')} />;
  else if (path === '/project/bid') page = <ProjectBidPage />;
  else page = <ProjectHistoryPage />;

  const commonPage = ['/projects','/project/new','/project/overview','/project/result'].includes(path);
  const workspace = projectWorkspacePaths.includes(path as ProjectWorkspacePath);
  const selected = path.startsWith('/project/') ? '/projects' : path;
  const menuItems = [
    { key: '/projects', icon: <AppstoreOutlined />, label: '项目中心' },
    { key: '/company', icon: <BankOutlined />, label: '企业资料' },
    { key: '/templates', icon: <SnippetsOutlined />, label: '方案资产' },
    { key: '/settings', icon: <SettingOutlined />, label: '管理中心' },
  ].filter(item => SHOW_DELIVERABLE_FEATURES || item.key === '/projects').map((item) => ({ ...item, label: <a href={item.key} onClick={(event) => { event.preventDefault(); navigate(item.key as AppPath); }}>{item.label}</a> }));

  return <Layout className={`app-shell pearl-home-shell${commonPage ? ' workbench-shell unified-shell' : ''}`}>
    <Header className="app-header"><Typography.Title className="brand" level={3}><>珠江智营图谱<small>物业经营测算与决策平台</small></></Typography.Title><Menu className="main-menu" mode="horizontal" theme="light" selectedKeys={[selected]} items={menuItems} /><span className="account-chip"><UserOutlined /><span><strong>{storage.loadCompanyProfile()?.companyName || '珠江城市服务'}</strong><small>项目经营测算</small></span></span></Header>
    <Content className="app-content">{workspace && !commonPage && <ProjectWorkspaceNav activePath={path as ProjectWorkspacePath} onNavigate={projectNavigate} />}{commonPage ? <div className={`pearl-workbench ${path === '/project/result' ? 'result-workbench' : ''}`}><aside className="workbench-sidebar" aria-label="项目导航"><button className={path === '/projects' ? 'sidebar-active' : ''} onClick={() => navigate('/projects')}><HomeFilled />项目工作台</button><button className={path === '/project/new' ? 'sidebar-active' : ''} onClick={startNewProject}><PlusCircleOutlined />新建测算</button><div className="result-sidebar-label"><ClockCircleOutlined />最近项目</div><div className="sidebar-recents">{storage.loadProjects().slice(0,5).map(item => <button key={item.id} className={item.id === storage.getActiveProjectId() ? 'sidebar-active' : ''} title={item.result.project.projectName} onClick={() => openProject(item.id,'/project/result')}>{item.result.project.projectName}</button>)}</div></aside><div className="workbench-main result-workbench-main">{path !== '/projects' && <nav className="result-breadcrumb"><button onClick={() => navigate('/projects')}>项目工作台</button><span>/</span><span>{storage.loadResult()?.project.projectName || '当前项目'}</span><span>/</span><span>{path === '/project/result' ? '测算结果' : path === '/project/new' ? '资料录入' : '项目概览'}</span></nav>}{page}</div></div> : page}</Content>
  </Layout>;
}
