import { DeleteOutlined, PlusOutlined, StopOutlined, UndoOutlined } from '@ant-design/icons';
import { Button, Input, InputNumber, Modal, Space, Table, Tag } from 'antd';
import { useState } from 'react';

import { displayActionName, displayQuantity } from '../calculation';
import type { ActionCategory, CalculationAdjustments, CustomActionInput, ServiceActionResult } from '../types';

const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });
const workloadCurrency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Props = {
  category: ActionCategory;
  actions: ServiceActionResult[];
  adjustments: CalculationAdjustments;
  onChange: (adjustments: CalculationAdjustments) => void;
};

type CustomDraft = {
  action: string;
  basis: string;
  annualFrequency: number;
  annualHours: number;
  headcount: number;
};

const blankDraft = (): CustomDraft => ({ action: '', basis: '', annualFrequency: 0, annualHours: 0, headcount: 1 });
const cleanDecimal = (value: number) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const cleanFrequency = (value: number) => Math.round(Number(value));

export default function ActionEditor({ category, actions, adjustments, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<CustomDraft>(blankDraft);
  const [addError, setAddError] = useState('');

  const updateOverride = (id: string, patch: Record<string, number | boolean | undefined>) => {
    const current = { ...(adjustments.overrides[id] ?? {}) };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === false) delete current[key as keyof typeof current];
      else current[key as keyof typeof current] = value as never;
    }
    const overrides = { ...adjustments.overrides };
    if (Object.keys(current).length) overrides[id] = current;
    else delete overrides[id];
    onChange({ ...adjustments, overrides });
  };

  const updateCustom = (id: string, patch: Partial<CustomActionInput>) => {
    onChange({
      ...adjustments,
      customActions: adjustments.customActions.map((item) => item.id === id ? { ...item, ...patch } : item),
    });
  };

  const removeCustom = (id: string) => onChange({
    ...adjustments,
    customActions: adjustments.customActions.filter((item) => item.id !== id),
  });

  const addCustom = () => {
    if (!draft.action.trim()) {
      setAddError('请填写动作名称');
      return;
    }
    const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const item: CustomActionInput = {
      id: `custom-${category}-${suffix}`,
      category,
      action: draft.action.trim(),
      property: '自定义',
      ...(draft.basis.trim() ? { basis: draft.basis.trim() } : {}),
      ...(category === 'assistance'
        ? { headcount: draft.headcount }
        : { annualFrequency: cleanFrequency(draft.annualFrequency), annualHours: cleanDecimal(draft.annualHours) }),
    };
    onChange({ ...adjustments, customActions: [...adjustments.customActions, item] });
    setAdding(false);
    setDraft(blankDraft());
    setAddError('');
  };

  const columns = [
    {
      title: '动作', key: 'action', fixed: 'left' as const, width: 190,
      render: (_: unknown, item: ServiceActionResult) => <Space size={6}><span>{displayActionName(item.action)}</span>{item.source === 'custom' && <Tag color="blue">自定义</Tag>}{item.enabled === false && <Tag>已停用</Tag>}</Space>,
    },
    { title: '属性', dataIndex: 'property', key: 'property', width: 100 },
    {
      title: '适用数量 / 依据', key: 'applicable', width: 180,
      render: (_: unknown, item: ServiceActionResult) => item.basis || displayQuantity(item.quantity, item.unit),
    },
    ...(category === 'assistance' ? [{
      title: '配置人数', key: 'headcount', width: 130,
      render: (_: unknown, item: ServiceActionResult) => {
        const custom = adjustments.customActions.find((entry) => entry.id === item.id);
        const value = custom?.headcount ?? adjustments.overrides[item.id]?.headcount ?? item.headcount ?? 0;
        return <InputNumber aria-label={`${displayActionName(item.action)}配置人数`} min={0} precision={0} value={value} disabled={item.enabled === false} onChange={(next) => item.source === 'custom' ? updateCustom(item.id, { headcount: Number(next ?? 0) }) : updateOverride(item.id, { headcount: Number(next ?? 0) })} />;
      },
    }] : [
      {
        title: '年频次', key: 'annualFrequency', width: 130,
        render: (_: unknown, item: ServiceActionResult) => {
          const custom = adjustments.customActions.find((entry) => entry.id === item.id);
          const value = custom?.annualFrequency ?? adjustments.overrides[item.id]?.annualFrequency ?? item.annualFrequency ?? 0;
          return <InputNumber aria-label={`${displayActionName(item.action)}年频次`} min={0} precision={0} value={cleanFrequency(value)} disabled={item.enabled === false} onChange={(next) => item.source === 'custom' ? updateCustom(item.id, { annualFrequency: cleanFrequency(Number(next ?? 0)) }) : updateOverride(item.id, { annualFrequency: cleanFrequency(Number(next ?? 0)), annualHours: undefined, annualCost: undefined })} />;
        },
      },
      {
        title: '年工时', key: 'annualHours', width: 130,
        render: (_: unknown, item: ServiceActionResult) => {
          const custom = adjustments.customActions.find((entry) => entry.id === item.id);
          const overridden = adjustments.overrides[item.id]?.annualHours !== undefined;
          const value = custom?.annualHours ?? adjustments.overrides[item.id]?.annualHours ?? item.annualHours ?? 0;
          return <Space orientation="vertical" size={1}><InputNumber aria-label={`${displayActionName(item.action)}年工时`} min={0} precision={2} value={cleanDecimal(value)} disabled={item.enabled === false} onChange={(next) => item.source === 'custom' ? updateCustom(item.id, { annualHours: cleanDecimal(Number(next ?? 0)) }) : updateOverride(item.id, { annualHours: cleanDecimal(Number(next ?? 0)), annualCost: undefined })} />{overridden && <small className="manual-override">已手动调整</small>}</Space>;
        },
      },
      {
        title: '年工作量成本', key: 'annualCost', width: 150,
        render: (_: unknown, item: ServiceActionResult) => <span className="calculated-workload-cost" aria-label={`${displayActionName(item.action)}年工作量成本`}><strong>{workloadCurrency.format(item.annualCost ?? 0)}</strong><small>系统计算</small></span>,
      },
    ]),
    ...(category === 'assistance' ? [{ title: '年岗位成本', dataIndex: 'annualCost', key: 'annualCost', width: 140, align: 'right' as const, render: (value: number) => currency.format(value) }] : []),
    {
      title: '操作', key: 'actions', fixed: 'right' as const, width: 110,
      render: (_: unknown, item: ServiceActionResult) => item.source === 'custom'
        ? <Button aria-label="删除" danger type="link" icon={<DeleteOutlined />} onClick={() => removeCustom(item.id)}>删除</Button>
        : item.enabled === false
          ? <Button aria-label="撤销停用" type="link" icon={<UndoOutlined />} onClick={() => updateOverride(item.id, { disabled: false })}>撤销停用</Button>
          : <Button aria-label="停用" danger type="link" icon={<StopOutlined />} onClick={() => updateOverride(item.id, { disabled: true })}>停用</Button>,
    },
  ];

  return <>
    {category !== 'assistance' && <p className="action-editor-note">年工作量成本由年工时和对应人工单价自动计算，不支持直接修改；分类/项目预算按取整用工口径重算</p>}
    <Table<ServiceActionResult> className="action-editor-table" rowKey="id" size="middle" columns={columns} dataSource={actions} pagination={{ pageSize: 12, showSizeChanger: false, showTotal: (total) => `共 ${total} 项` }} scroll={{ x: 1080 }} rowClassName={(item) => item.enabled === false ? 'disabled-action-row' : ''} />
    <Button className="add-action-button" type="dashed" block icon={<PlusOutlined />} onClick={() => setAdding(true)}>添加服务动作</Button>
    <Modal title="添加服务动作" open={adding} onCancel={() => { setAdding(false); setAddError(''); }} footer={<Space><Button onClick={() => setAdding(false)}>取消</Button><Button type="primary" onClick={addCustom}>确认添加</Button></Space>}>
      <div className="custom-action-form">
        <label>动作名称<Input aria-label="自定义动作名称" value={draft.action} status={addError ? 'error' : undefined} onChange={(event) => { setDraft({ ...draft, action: event.target.value }); setAddError(''); }} /></label>
        {addError && <span className="field-error">{addError}</span>}
        <label>适用依据（选填）<Input aria-label="自定义动作适用依据" value={draft.basis} onChange={(event) => setDraft({ ...draft, basis: event.target.value })} /></label>
        {category === 'assistance' ? <label>配置人数<InputNumber aria-label="自定义动作配置人数" min={0} precision={0} value={draft.headcount} onChange={(value) => setDraft({ ...draft, headcount: Number(value ?? 0) })} /></label> : <Space wrap>
          <label>年频次<InputNumber aria-label="自定义动作年频次" min={0} precision={0} value={draft.annualFrequency} onChange={(value) => setDraft({ ...draft, annualFrequency: Number(value ?? 0) })} /></label>
          <label>年工时<InputNumber aria-label="自定义动作年工时" min={0} precision={2} value={draft.annualHours} onChange={(value) => setDraft({ ...draft, annualHours: cleanDecimal(Number(value ?? 0)) })} /></label>
          <small className="custom-action-cost-note">年工作量成本将根据年工时和对应人工单价自动计算</small>
        </Space>}
      </div>
    </Modal>
  </>;
}
