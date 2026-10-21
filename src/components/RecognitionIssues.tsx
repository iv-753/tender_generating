import { Table, Tag } from 'antd';
import type { ImportReviewIssue } from '../types';

const labels = { missing: '待补充', conflict: '有冲突', invalid: '数据错误', unmatched: '未匹配' };
export default function RecognitionIssues({ issues }: { issues: ImportReviewIssue[] }) {
  return <Table<ImportReviewIssue> size="small" rowKey="key" pagination={false} dataSource={issues} scroll={{ x: 650, y: 320 }} columns={[
    { title: '需要核对的参数', dataIndex: 'label', width: 175 },
    { title: '状态', dataIndex: 'kind', width: 85, render: (kind: ImportReviewIssue['kind'],issue) => <Tag color={kind === 'missing' ? 'gold' : 'orange'}>{issue.classification==='conflict'?'确有数值矛盾':kind==='missing'?'必要数据缺失':issue.classification==='unsupported'?'暂不支持':'需确认口径'}</Tag> },
    { title: '原因与处理方式', dataIndex: 'message', width: 270 },
    { title: '原表位置与内容', key: 'source', width: 230, render: (_, issue) => issue.sources.length ? issue.sources.map((source, index) => <div key={`${source.sheet}-${source.cell}-${index}`}><small>{source.sheet} · {source.cell}</small><div>{source.raw == null || source.raw === '' ? '（空白）' : String(source.raw)}</div></div>) : '原表未提供' },
  ]} />;
}
