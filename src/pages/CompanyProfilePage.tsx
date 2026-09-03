import { BankOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, message, Row, Typography } from 'antd';
import { storage } from '../storage';
import type { CompanyProfile } from '../types';

const EMPTY_PROFILE: CompanyProfile = { companyName: '', socialCreditCode: '', legalRepresentative: '', registeredAddress: '', contactName: '', contactPhone: '', companyProfile: '' };

export default function CompanyProfilePage() {
  const [form] = Form.useForm<CompanyProfile>();
  const save = (values: CompanyProfile) => {
    storage.saveCompanyProfile(values);
    message.success('企业资料已保存');
  };

  return <main className="workspace-page">
    <div className="page-heading blueprint-rule"><div><Typography.Title level={2}>企业资料</Typography.Title><Typography.Paragraph type="secondary">统一维护路演材料与投标文件复用的企业信息。</Typography.Paragraph></div></div>
    <Card className="enterprise-card" bordered={false} title={<span><BankOutlined /> 企业基本信息</span>} extra={<Typography.Text type="secondary">用于项目方案生成</Typography.Text>}>
      <Form<CompanyProfile> form={form} layout="vertical" initialValues={storage.loadCompanyProfile() ?? EMPTY_PROFILE} onFinish={save}>
        <Row gutter={18}>
          <Col xs={24} md={12}><Form.Item name="companyName" label="企业名称" rules={[{ required: true, message: '请填写企业名称' }]}><Input /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="socialCreditCode" label="统一社会信用代码" rules={[{ required: true, message: '请填写统一社会信用代码' }]}><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="legalRepresentative" label="法定代表人" rules={[{ required: true, message: '请填写法定代表人' }]}><Input /></Form.Item></Col>
          <Col xs={24} md={16}><Form.Item name="registeredAddress" label="注册地址" rules={[{ required: true, message: '请填写注册地址' }]}><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="contactName" label="联系人" rules={[{ required: true, message: '请填写联系人' }]}><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="contactPhone" label="联系电话" rules={[{ required: true, message: '请填写联系电话' }]}><Input /></Form.Item></Col>
          <Col span={24}><Form.Item name="companyProfile" label="企业简介"><Input.TextArea rows={5} showCount maxLength={800} /></Form.Item></Col>
        </Row>
        <div className="form-actions"><Button type="primary" htmlType="submit" icon={<SaveOutlined />}>保存企业资料</Button></div>
      </Form>
    </Card>
  </main>;
}
