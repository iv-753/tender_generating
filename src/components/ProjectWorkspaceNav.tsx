import { FileDoneOutlined, FilePptOutlined, FileTextOutlined, HistoryOutlined, ProjectOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

export type ProjectWorkspacePath = '/project/overview' | '/project/result' | '/project/presentation' | '/project/bid' | '/project/history';

const items: { path: ProjectWorkspacePath; label: string; icon: ReactNode }[] = [
  { path: '/project/overview', label: '项目概览', icon: <ProjectOutlined /> },
  { path: '/project/result', label: '测算结果', icon: <FileDoneOutlined /> },
  { path: '/project/presentation', label: '路演PPT', icon: <FilePptOutlined /> },
  { path: '/project/bid', label: '投标标书', icon: <FileTextOutlined /> },
  { path: '/project/history', label: '生成记录', icon: <HistoryOutlined /> },
];

export default function ProjectWorkspaceNav({ activePath, onNavigate }: { activePath: ProjectWorkspacePath; onNavigate: (path: ProjectWorkspacePath) => void }) {
  return (
    <nav className="project-workspace-nav" aria-label="项目工作区">
      {items.map((item) => (
        <a key={item.path} href={item.path} aria-label={item.label} className={activePath === item.path ? 'is-active' : ''} onClick={(event) => { event.preventDefault(); onNavigate(item.path); }}>
          {item.icon}<span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
