import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Popconfirm, Space, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import * as types from '../types';

const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<types.Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<types.Room | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const data = await apiService.getRooms();
      setRooms(data);
    } catch (error) {
      message.error('加载场地列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRoom(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: types.Room) => {
    setEditingRoom(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteRoom(id);
      message.success('删除成功');
      loadRooms();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const roomData: types.Room = {
        ...values,
        id: editingRoom?.id || `room_${Date.now()}`,
      };
      
      if (editingRoom) {
        await apiService.updateRoom(editingRoom.id, roomData);
        message.success('更新成功');
      } else {
        await apiService.createRoom(roomData);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadRooms();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '场地名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '场地类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          classroom: '普通教室',
          lab: '实验室',
          gym: '体育馆',
          music: '音乐教室',
          art: '美术教室',
          computer: '计算机房',
          other: '其他',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      key: 'capacity',
    },
    {
      title: '可用状态',
      dataIndex: 'available',
      key: 'available',
      render: (available: boolean) => (available ? '可用' : '不可用'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: types.Room) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个场地吗？"
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
          添加场地
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={rooms}
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
        title={editingRoom ? '编辑场地' : '添加场地'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="场地名称"
            rules={[{ required: true, message: '请输入场地名称' }]}
          >
            <Input placeholder="如：101教室" />
          </Form.Item>
          <Form.Item
            name="type"
            label="场地类型"
            rules={[{ required: true, message: '请选择场地类型' }]}
          >
            <Select placeholder="请选择场地类型">
              <Select.Option value="classroom">普通教室</Select.Option>
              <Select.Option value="lab">实验室</Select.Option>
              <Select.Option value="gym">体育馆</Select.Option>
              <Select.Option value="music">音乐教室</Select.Option>
              <Select.Option value="art">美术教室</Select.Option>
              <Select.Option value="computer">计算机房</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="capacity"
            label="容量"
            rules={[{ required: true, message: '请输入容量' }]}
          >
            <InputNumber min={1} max={200} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="available" valuePropName="checked" initialValue={true}>
            <Select>
              <Select.Option value={true}>可用</Select.Option>
              <Select.Option value={false}>不可用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoomManagement;
