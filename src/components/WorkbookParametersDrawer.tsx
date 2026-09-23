import { Alert, Button, Checkbox, Drawer, Empty, Input, InputNumber, Select, Space, Spin, Table, Tag, Tooltip, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { WorkbookInput } from '../types';
import { customerLabel, customerParameterNote } from '../customerLanguage';

type Props = {
  open: boolean;
  zhujiang?: boolean;
  parameters: WorkbookInput[];
  overrides: Record<string, number | string>;
  loading: boolean;
  error?: string;
  focusKey?: string;
  missingKeys?: string[];
  onClose: () => void;
  onSave: (overrides: Record<string, number | string>) => void;
};

export default function WorkbookParametersDrawer({ open, zhujiang, parameters, overrides, loading, error, focusKey, missingKeys, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(overrides);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string>();
  const [page, setPage] = useState(1);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const [missingOnly,setMissingOnly]=useState(false);
  useEffect(() => { if (open) { setDraft(overrides); setInvalid({}); setPage(1); } }, [open, overrides]);
  useEffect(() => { if(open) {setQuery(focusKey ? customerLabel(parameters.find(item=>item.key===focusKey)?.label??'') : '');setGroup(!focusKey && parameters.some(item=>item.group==='珠江·项目及配置') ? '珠江·项目及配置' : undefined);setMissingOnly(false);setPage(1);} },[open,focusKey,parameters]);
  const groups = useMemo(() => [...new Set(parameters.map((item) => item.group))], [parameters]);
  const visible = parameters.filter(item => !item.visibleWhen || Number(draft[item.visibleWhen] ?? parameters.find(other => other.key === item.visibleWhen)?.defaultValue ?? 0) > 0);
  const filtered = visible.filter((item) => (!group || item.group === group) && (!missingOnly || (missingKeys ? missingKeys.includes(item.key) : item.defaultValue===null)) && customerLabel(item.label).includes(query.trim()));
  const modifiedCount = parameters.filter(item => Object.hasOwn(draft, item.key)).length;
  const restore = (key: string) => {
    setDraft((current) => { const next = { ...current }; delete next[key]; return next; });
    setInvalid((current) => { const next = { ...current }; delete next[key]; return next; });
  };
  return <Drawer title="项目服务设置" open={open} onClose={onClose} size={960} destroyOnHidden footer={<Space style={{ width: '100%', justifyContent: 'space-between' }}><Typography.Text type="secondary">已手动设置 {modifiedCount} 项；恢复默认后按所选档次重新计算。</Typography.Text><Space><Button onClick={onClose}>取消</Button><Button type="primary" disabled={loading || !parameters.length || Object.values(invalid).some(Boolean)} onClick={() => onSave(draft)}>保存设置</Button></Space></Space>}>
    <Alert type="info" showIcon title={zhujiang ? "服务标准与项目资料" : "原表完整计算口径"} description={zhujiang ? "服务次数按所选珠江档次带入。请填写项目实际设备数量、服务范围和人工费用；没有的设施填0，暂不清楚可留空。" : "按广东区级单价计算。保留原表工时、人员取整及附加比例；替休采用原公式5.2（原表最低档文字写7，待核实）。模板数量和历史单价可在这里调整。"} style={{ marginBottom: 16 }} />
    {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
    <Space wrap style={{ marginBottom: 16 }}><Select aria-label="参数分类" placeholder="全部分类" allowClear style={{ width: 180 }} value={group} options={groups.map((value) => ({ value, label: customerLabel(value.split('·').at(-1)??value) }))} onChange={(value) => { setGroup(value); setPage(1); }} /><Input aria-label="搜索计算参数" placeholder="搜索服务、工资、面积等" allowClear value={query} onChange={(event) => { setQuery(event.target.value); setGroup(undefined); setPage(1); }} />{zhujiang && <Checkbox checked={missingOnly} onChange={e=>{setMissingOnly(e.target.checked);setGroup(undefined);setPage(1);}}>只看待补数据</Checkbox>}<Button disabled={!modifiedCount} onClick={() => { setDraft(current => Object.fromEntries(Object.entries(current).filter(([key]) => !parameters.some(item => item.key === key)))); setInvalid({}); }}>恢复参考设置</Button></Space>
    {loading ? <Spin /> : !parameters.length ? <Empty description="暂无计算参数" /> : <Table<WorkbookInput> rowKey="key" size="small" dataSource={filtered} pagination={{ current: page, pageSize: 12, showSizeChanger: false, showTotal: (total) => `共 ${total} 项`, onChange: setPage }} scroll={{ x: 750 }} columns={[
      { title: '填写内容', key: 'label', width: 380, render: (_, item) => <><div>{customerLabel(item.label)}</div><Typography.Text type="secondary" style={{ fontSize: 12 }}>{customerLabel(item.group.split('·').at(-1)??item.group)}</Typography.Text>{item.sourceText && <div><Tooltip title={item.sourceText}><Typography.Text type="secondary">查看珠江服务要求</Typography.Text></Tooltip></div>}<div style={{ fontSize: 12 }}>{zhujiang?customerParameterNote(item):item.note}</div></> },
      { title: '采用值', key: 'value', width: 230, render: (_, item) => <Space>{item.key === 'zhuj.managerConcurrentRole' ? <Select aria-label={customerLabel(item.label)} placeholder="待确认兼岗" allowClear style={{width:160}} value={draft[item.key]??item.defaultValue??undefined} options={[{value:0,label:'不兼任'},{value:1,label:'兼管家主任'},{value:2,label:'兼工程主任'},{value:3,label:'兼安保主任'}]} onChange={value=>value===undefined ? restore(item.key) : setDraft(current=>({...current,[item.key]:value}))} /> : item.key === 'zhuj.garageIncluded' ? <Select aria-label={customerLabel(item.label)} style={{ width: 160 }} value={Number(draft[item.key] ?? item.defaultValue)} options={[{ value: 1, label: '纳入本项目服务' }, { value: 0, label: '不纳入本项目服务' }]} onChange={(value) => setDraft((current) => ({ ...current, [item.key]: value }))} /> : item.type === 'select' ? <Select aria-label={customerLabel(item.label)} style={{ width: 160 }} value={draft[item.key] ?? item.defaultValue} options={item.options?.map((value) => ({ value, label: customerLabel(value.split('·').at(-1)??value) }))} onChange={(value) => setDraft((current) => ({ ...current, [item.key]: value }))} /> : <InputNumber aria-label={customerLabel(item.label)} min={item.min ?? 0} max={item.max} status={invalid[item.key] ? 'error' : undefined} style={{ width: 150 }} placeholder="待填写" precision={item.integer ? 0 : undefined} value={draft[item.key] === undefined && item.defaultValue === null ? null : Number(draft[item.key] ?? item.defaultValue) * (item.displayScale ?? 1)} onChange={(value) => { if (value === null && item.defaultValue === null) { restore(item.key); return; } const bad = value === null || !Number.isFinite(value) || value < (item.min ?? 0) || (item.max !== undefined && value > item.max); setInvalid((current) => ({ ...current, [item.key]: bad })); if (!bad) setDraft((current) => ({ ...current, [item.key]: Number(value) / (item.displayScale ?? 1) })); }} />}<span>{item.unit}</span></Space> },
      { title: '设置', key: 'source', width: 120, render: (_, item) => Object.hasOwn(draft, item.key) ? <><Tag color="gold">已填写</Tag><Button size="small" type="link" onClick={() => restore(item.key)}>恢复</Button></> : <Tag>{zhujiang ? item.defaultValue===null?'待填写':item.defaultLabel?.includes('珠江')?'服务标准':'参考值' : item.defaultLabel ?? "原表默认"}</Tag> },
    ]} />}
  </Drawer>;
}
