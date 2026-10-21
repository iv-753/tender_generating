import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
import App from './App';
import './styles.css';
import './pearl-theme.css';
import './workspace-shell.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0057B8',
          colorText: '#18324A',
          colorTextSecondary: '#64748B',
          colorBorder: '#E2E8F0',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
          fontSize: 14,
          controlHeight: 36,
          colorBgLayout: '#F3F6FA',
          borderRadius: 8,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
