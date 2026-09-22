import { Alert, Button, Drawer, Empty, Input, InputNumber, Select, Space, Spin, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { WorkbookInput } from '../types';

type Props = {
  open: boolean;
  parameters: WorkbookInput[];
  overrides: Record<string, number | string>;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onSave: (overrides: Record<string, number | string>) => void;
};

export default function WorkbookParametersDrawer({ open, parameters, overrides, loading, error, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(overrides);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string>();
  const [page, setPage] = useState(1);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  useEffect(() => { if (open) { setDraft(overrides); setInvalid({}); setPage(1); } }, [open, overrides]);
  const groups = useMemo(() => [...new Set(parameters.map((item) => item.group))], [parameters]);
  const filtered = parameters.filter((item) => (!group || item.group === group) && `${item.label} ${item.key}`.includes(query.trim()));
  const modifiedCount = Object.keys(draft).length;
  const restore = (key: string) => {
    setDraft((current) => { const next = { ...current }; delete next[key]; return next; });
    setInvalid((current) => { const next = { ...current }; delete next[key]; return next; });
  };
  return <Drawer title="完整计算参数" open={open} onClose={onClose} size={960} destroyOnHidden footer={<Space style={{ width: '100%', justifyContent: 'space-between' }}><Typography.Text type="secondary">已手动设置 {modifiedCount} 项；恢复默认后重新按原表公式计算。</Typography.Text><Space><Button onClick={onClose}>取消</Button><Button type="primary" disabled={loading || !parameters.length || Object.values(invalid).some(Boolean)} onClick={() => onSave(draft)}>应用参数</Button></Space></Space>}>
    <Alert type="info" showIcon title="原表完整计算口径" description="按广东区级单价计算。保留原表工时、人员取整及附加比例；替休采用原公式5.2（原表最低档文字写7，待核实）。模板数量和历史单价可在这里调整。" style={{ marginBottom: 16 }} />
    {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
    <Space wrap style={{ marginBottom: 16 }}><Select aria-label="参数分类" placeholder="全部分类" allowClear style={{ width: 180 }} value={group} options={groups.map((value) => ({ value, label: value }))} onChange={(value) => { setGroup(value); setPage(1); }} /><Input aria-label="搜索计算参数" placeholder="搜索动作、工资、面积等" allowClear value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /><Button disabled={!modifiedCount} onClick={() => { setDraft({}); setInvalid({}); }}>全部恢复默认</Button></Space>
    {loading ? <Spin /> : !parameters.length ? <Empty description="暂无计算参数" /> : <Table<WorkbookInput> rowKey="key" size="small" dataSource={filtered} pagination={{ current: page, pageSize: 12, showSizeChanger: false, showTotal: (total) => `共 ${total} 项`, onChange: setPage }} scroll={{ x: 750 }} columns={[
      { title: '参数及来源', key: 'label', width: 380, render: (_, item) => <><div>{item.label}</div><Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.group} · {item.key}</Typography.Text></> },
      { title: '采用值', key: 'value', width: 230, render: (_, item) => <Space>{item.type === 'select' ? <Select aria-label={item.label} style={{ width: 160 }} value={draft[item.key] ?? item.defaultValue} options={item.options?.map((value) => ({ value, label: value }))} onChange={(value) => setDraft((current) => ({ ...current, [item.key]: value }))} /> : <InputNumber aria-label={item.label} min={item.min ?? 0} max={item.max} status={invalid[item.key] ? 'error' : undefined} style={{ width: 150 }} value={Number(draft[item.key] ?? item.defaultValue)} onChange={(value) => { const bad = value === null || !Number.isFinite(value) || value < (item.min ?? 0) || (item.max !== undefined && value > item.max); setInvalid((current) => ({ ...current, [item.key]: bad })); if (!bad) setDraft((current) => ({ ...current, [item.key]: Number(value) })); }} />}<span>{item.unit}</span></Space> },
      { title: '设置', key: 'source', width: 120, render: (_, item) => Object.hasOwn(draft, item.key) ? <><Tag color="gold">手动</Tag><Button size="small" type="link" onClick={() => restore(item.key)}>恢复</Button></> : <Tag>原表默认</Tag> },
    ]} />}
  </Drawer>;
}
