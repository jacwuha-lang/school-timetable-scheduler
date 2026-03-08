import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Popconfirm, Space, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import * as types from '../types';

const { Option } = Select;

const GRADE_OPTIONS = [
  { value: 0, label: '预初' },
  { value: 1, label: '初一' },
  { value: 2, label: '初二' },
  { value: 3, label: '初三' },
];

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<types.Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState<types.Class | null>(null);
  const [previewClassName, setPreviewClassName] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await apiService.getClasses();
      setClasses(data);
    } catch (error) {
      message.error('加载班级列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingClass(null);
    form.resetFields();
    setPreviewClassName('');
    setModalVisible(true);
  };

  const handleEdit = (record: types.Class) => {
    setEditingClass(record);
    
    const match = record.name.match(/（(\d+)）班/);
    const classNumber = match ? parseInt(match[1]) : undefined;
    
    form.setFieldsValue({
      ...record,
      classNumber: record.classNumber || classNumber
    });
    setPreviewClassName(record.name);
    setModalVisible(true);
  };

  const generateClassName = (grade: number, classNumber: number, customGrade?: string) => {
    const gradeName = customGrade || GRADE_OPTIONS.find(g => g.value === grade)?.label || `${grade}年级`;
    return `${gradeName}（${classNumber}）班`;
  };

  const handleFormChange = (changedValues: any, allValues: any) => {
    if (changedValues.grade !== undefined || changedValues.classNumber !== undefined || changedValues.customGrade !== undefined) {
      const { grade, classNumber } = allValues;
      if (grade !== undefined && classNumber !== undefined) {
        const name = generateClassName(grade, classNumber, allValues.customGrade);
        setPreviewClassName(name);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteClass(id);
      message.success('删除成功');
      loadClasses();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const classData = {
        ...values,
        name: previewClassName || generateClassName(values.grade, values.classNumber, values.customGrade)
      };
      
      if (editingClass) {
        await apiService.updateClass(editingClass.id, { ...classData, id: editingClass.id });
        message.success('更新成功');
      } else {
        await apiService.createClass(classData);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadClasses();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '班级名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '年级',
      dataIndex: 'grade',
      key: 'grade',
      render: (grade: number) => {
        if (grade === -1) return '自定义';
        const option = GRADE_OPTIONS.find(g => g.value === grade);
        return option ? option.label : `${grade}年级`;
      },
    },
    {
      title: '学生人数',
      dataIndex: 'studentCount',
      key: 'studentCount',
      render: (count: number) => count || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: types.Class) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个班级吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加班级
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={classes}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
      />
      <Modal
        title={editingClass ? '编辑班级' : '添加班级'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确认"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" onValuesChange={handleFormChange}>
          <Form.Item
            name="grade"
            label="年级"
            rules={[{ required: true, message: '请选择年级' }]}
          >
            <Select placeholder="请选择年级">
              {GRADE_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
              <Option value={-1}>自定义</Option>
            </Select>
          </Form.Item>
          
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.grade !== currentValues.grade}>
            {({ getFieldValue }) => {
              const grade = getFieldValue('grade');
              if (grade === -1) {
                return (
                  <Form.Item
                    name="customGrade"
                    label="自定义年级名称"
                    rules={[{ required: true, message: '请输入自定义年级名称' }]}
                  >
                    <Input placeholder="如：六年级" />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item
            name="classNumber"
            label="班级序号"
            rules={[{ required: true, message: '请输入班级序号' }]}
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="请输入班级序号，如：2" />
          </Form.Item>

          {previewClassName && (
            <div style={{ marginBottom: 16, padding: '8px 12px', backgroundColor: '#f0f9ff', borderRadius: 4, border: '1px solid #bae6fd' }}>
              <span style={{ color: '#0369a1', fontWeight: 500 }}>班级名称预览：{previewClassName}</span>
            </div>
          )}

          <Form.Item
            name="studentCount"
            label="学生人数（可选）"
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="请输入学生人数" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClassManagement;
