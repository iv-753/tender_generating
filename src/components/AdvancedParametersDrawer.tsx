import { Alert, Button, Collapse, Drawer, Empty, InputNumber, Space, Spin, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { AdvancedParameterGroup, AdvancedParameterSnapshot } from '../types';

type Overrides = Record<string, number>;

interface AdvancedParametersDrawerProps {
  open: boolean;
  parameters: AdvancedParameterSnapshot[];
  overrides: Overrides;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onChange: (overrides: Overrides) => void;
}

const groups: Array<{ key: AdvancedParameterGroup; label: string }> = [
  { key: 'basement', label: '地下空间' },
  { key: 'building', label: '楼栋公区' },
  { key: 'grounds', label: '室外场地' },
  { key: 'staffingCost', label: '人员与成本' },
];

const sourceLabels = {
  derived: '直接推算',
  estimated: '规则估算',
  template: '模板默认',
  manual: '手动调整',
} as const;

function isIntegerParameter(parameter: AdvancedParameterSnapshot) {
  return parameter.unit === '个' || parameter.unit === '台';
}

export default function AdvancedParametersDrawer({ open, parameters, overrides, loading = false, error, onClose, onChange }: AdvancedParametersDrawerProps) {
  const [invalidKeys, setInvalidKeys] = useState<Set<string>>(new Set());
  const [draftOverrides, setDraftOverrides] = useState<Overrides>(overrides);
  useEffect(() => {
    setInvalidKeys(new Set());
    setDraftOverrides(overrides);
  }, [open, parameters, overrides]);

  const grouped = useMemo(() => Object.fromEntries(groups.map(({ key }) => [key, parameters.filter((parameter) => parameter.group === key)])) as Record<AdvancedParameterGroup, AdvancedParameterSnapshot[]>, [parameters]);

  const updateParameter = (parameter: AdvancedParameterSnapshot, rawValue: number | null) => {
    if (rawValue === null || !Number.isFinite(rawValue) || rawValue < 0) {
      setInvalidKeys((current) => new Set(current).add(parameter.key));
      return;
    }
    setInvalidKeys((current) => {
      const next = new Set(current);
      next.delete(parameter.key);
      return next;
    });
    const value = isIntegerParameter(parameter) ? Math.round(rawValue) : rawValue;
    const next = { ...draftOverrides };
    if (value === parameter.defaultValue) delete next[parameter.key];
    else next[parameter.key] = value;
    setDraftOverrides(next);
    onChange(next);
  };

  const restoreParameter = (key: string) => {
    const next = { ...draftOverrides };
    delete next[key];
    setDraftOverrides(next);
    onChange(next);
  };

  const restoreGroup = (group: AdvancedParameterGroup) => {
    const keys = new Set(grouped[group].map(({ key }) => key));
    const next = Object.fromEntries(Object.entries(draftOverrides).filter(([key]) => !keys.has(key)));
    setDraftOverrides(next);
    onChange(next);
  };

  const items = groups.filter((group) => grouped[group.key].length > 0).map((group) => {
    const groupParameters = grouped[group.key];
    const adjustedCount = groupParameters.filter(({ key }) => Object.hasOwn(draftOverrides, key)).length;
    const actionCount = new Set(groupParameters.flatMap(({ affectedActionIds }) => affectedActionIds)).size;
    return {
      key: group.key,
      label: <div className="advanced-group-heading"><strong>{group.label}</strong><span>系统已估算 {groupParameters.length - adjustedCount} 项 · 已调整 {adjustedCount} 项 · 影响 {actionCount} 个服务动作</span></div>,
      children: <div className="advanced-group-content">
        <div className="advanced-group-actions"><Typography.Text type="secondary">仅修改与项目实际情况不符的参数。</Typography.Text><Button type="link" disabled={!adjustedCount} aria-label={`恢复${group.label}全部系统值`} onClick={() => restoreGroup(group.key)}>整组恢复系统值</Button></div>
        {groupParameters.map((parameter) => {
          const adjusted = Object.hasOwn(draftOverrides, parameter.key);
          const value = adjusted ? draftOverrides[parameter.key] : parameter.defaultValue;
          return <div className="advanced-parameter-row" key={parameter.key}>
            <div className="advanced-parameter-meta"><strong>{parameter.label}</strong><Space size={6} wrap><Tag color={adjusted ? 'gold' : 'cyan'}>{adjusted ? sourceLabels.manual : sourceLabels[parameter.source]}</Tag><Typography.Text type="secondary">影响 {parameter.affectedActionIds.length} 个服务动作</Typography.Text></Space></div>
            <div className="advanced-parameter-control"><InputNumber aria-label={parameter.label} min={0} precision={isIntegerParameter(parameter) ? 0 : undefined} status={invalidKeys.has(parameter.key) ? 'error' : undefined} value={value} onChange={(next) => updateParameter(parameter, next)} /><span>{parameter.unit}</span><Button type="link" disabled={!adjusted} onClick={() => restoreParameter(parameter.key)}>恢复系统值</Button>{invalidKeys.has(parameter.key) && <small role="alert">请输入 0 或更大的数字</small>}</div>
          </div>;
        })}
      </div>,
    };
  });

  return <Drawer className="advanced-parameters-drawer" title="高级参数（可选）" size="large" open={open} onClose={onClose} destroyOnHidden footer={<div className="advanced-drawer-footer"><Typography.Text type="secondary">系统已根据项目基础信息完成估算，调整后将用于正式测算。</Typography.Text><Button type="primary" onClick={onClose}>完成</Button></div>}>
    {loading ? <div className="advanced-state"><Spin /><span>正在估算高级参数…</span></div>
      : error ? <Alert type="error" showIcon title={error} />
        : parameters.length === 0 ? <Empty description="暂无可调整参数" />
          : <><Alert className="advanced-drawer-note" type="info" showIcon title="通常无需修改" description="这些参数由系统自动估算。只有与现场实际情况不符时，才需要调整。" /><Collapse items={items} defaultActiveKey={[]} destroyOnHidden /></>}
  </Drawer>;
}
