import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Space, Divider } from 'antd';
import { SaveOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';

interface SchoolConfig {
  name: string;
  address?: string;
  phone?: string;
  principal?: string;
  academicYear?: string;
  semester?: string;
}

const SchoolConfigManagement: React.FC = () => {
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await apiService.getSchoolConfig();
      if (data) {
        setConfig(data);
        form.setFieldsValue(data);
      }
    } catch (error) {
      message.error('加载学校配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await apiService.saveSchoolConfig(values);
      message.success('保存成功');
      loadConfig();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleDelete = async () => {
    try {
      await apiService.deleteSchoolConfig();
      message.success('删除成功');
      setConfig(null);
      form.resetFields();
    } catch (error) {
      message.error('删除失败');
    }
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <HomeOutlined />
            学校基本信息
          </Space>
        }
        extra={
          <Space>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete} disabled={!config}>
              清除配置
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              保存配置
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" disabled={loading}>
          <Form.Item
            name="name"
            label="学校名称"
            rules={[{ required: true, message: '请输入学校名称' }]}
          >
            <Input placeholder="请输入学校名称" size="large" />
          </Form.Item>

          <Form.Item
            name="academicYear"
            label="学年"
          >
            <Input placeholder="如：2024-2025学年" />
          </Form.Item>

          <Form.Item
            name="semester"
            label="学期"
          >
            <Input placeholder="如：第一学期" />
          </Form.Item>

          <Divider>联系信息</Divider>

          <Form.Item
            name="principal"
            label="校长姓名"
          >
            <Input placeholder="请输入校长姓名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="联系电话"
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item
            name="address"
            label="学校地址"
          >
            <Input.TextArea placeholder="请输入学校地址" rows={3} />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SchoolConfigManagement;
