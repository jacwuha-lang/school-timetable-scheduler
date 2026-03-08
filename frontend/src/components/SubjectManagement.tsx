import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Popconfirm, Space, Checkbox, Tabs, Card, Row, Col, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import * as types from '../types';

const { TabPane } = Tabs;
const { Option } = Select;

const GRADE_NAMES = ['预初', '初一', '初二', '初三'];
const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五'];
const PERIOD_OPTIONS = ['尽量不排', '不排', '一定排'];
const PERIOD_NAMES = ['早答疑', '第1节', '第2节', '第3节', '第4节', '午自习', '第5节', '第6节', '第7节', '第8节'];

const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<types.Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<types.Subject | null>(null);
  const [gradeConfig, setGradeConfig] = useState<types.SubjectGradeConfig>({});
  const [gradeHours, setGradeHours] = useState<{ [grade: number]: number }>({});
  const [periodPreferences, setPeriodPreferences] = useState<{ [dayPeriod: string]: 'avoid' | 'prefer' | 'must' }>({});
  const [form] = Form.useForm();

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const data = await apiService.getSubjects();
      setSubjects(data);
    } catch (error) {
      message.error('加载科目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSubject(null);
    form.resetFields();
    setGradeConfig({});
    setGradeHours({});
    setPeriodPreferences({});
    setModalVisible(true);
  };

  const handleEdit = (record: types.Subject) => {
    setEditingSubject(record);
    form.setFieldsValue(record);
    setGradeConfig(record.gradeConfig || {});
    setGradeHours(record.gradeHours || {});
    setPeriodPreferences(record.periodPreferences || {});
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteSubject(id);
      message.success('删除成功');
      loadSubjects();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleGradeConfigChange = (grade: number, field: string, value: number) => {
    setGradeConfig(prev => {
      const newConfig = { ...prev };
      if (!newConfig[grade]) {
        newConfig[grade] = {
          weeklyHours: 5,
          minWeeklyHours: 4,
          maxWeeklyHours: 6,
          dailyConfig: {},
        };
      }
      newConfig[grade] = {
        ...newConfig[grade],
        [field]: value,
      };
      return newConfig;
    });
  };

  const handleDailyConfigChange = (grade: number, day: number, field: string, value: number) => {
    setGradeConfig(prev => {
      const newConfig = { ...prev };
      if (!newConfig[grade]) {
        newConfig[grade] = {
          weeklyHours: 5,
          minWeeklyHours: 4,
          maxWeeklyHours: 6,
          dailyConfig: {},
        };
      }
      if (!newConfig[grade].dailyConfig[day]) {
        newConfig[grade].dailyConfig[day] = {
          minPeriods: 0,
          maxPeriods: 2,
        };
      }
      newConfig[grade].dailyConfig[day] = {
        ...newConfig[grade].dailyConfig[day],
        [field]: value,
      };
      return newConfig;
    });
  };

  const handleGradeHoursChange = (grade: number, value: number) => {
    setGradeHours(prev => ({
      ...prev,
      [grade]: value,
    }));
  };

  const handlePeriodPreferenceChange = (day: number, period: number, value: 'avoid' | 'prefer' | 'must') => {
    const key = `${day}_${period}`;
    setPeriodPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const subjectData: types.Subject = {
        ...values,
        id: editingSubject?.id || `subject_${Date.now()}`,
        preferredTimeSlots: [],
        avoidTimeSlots: [],
        gradeConfig,
        gradeHours,
        periodPreferences,
      };
      
      if (editingSubject) {
        await apiService.updateSubject(editingSubject.id, subjectData);
        message.success('更新成功');
      } else {
        await apiService.createSubject(subjectData);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadSubjects();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '科目全称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '简称',
      dataIndex: 'shortName',
      key: 'shortName',
      width: 80,
    },
    {
      title: '周课时',
      key: 'weeklyHours',
      width: 220,
      render: (_: any, record: types.Subject) => (
        <span style={{ fontSize: '12px' }}>
          预初: {record.gradeHours?.[0] || record.weeklyHours}; 
          初一: {record.gradeHours?.[1] || record.weeklyHours}; 
          初二: {record.gradeHours?.[2] || record.weeklyHours}; 
          初三: {record.gradeHours?.[3] || record.weeklyHours}
        </span>
      ),
    },
    {
      title: '特殊要求',
      key: 'specialRequirements',
      width: 120,
      render: (_: any, record: types.Subject) => (
        <Space direction="vertical" size={0}>
          {record.requiresLab && <span style={{ fontSize: '12px' }}>需要实验室</span>}
          {record.requiresSpecialRoom && <span style={{ fontSize: '12px' }}>需要专用教室</span>}
          {record.requiresPublicRoom && <span style={{ fontSize: '12px' }}>公共场地</span>}
          {record.requireSameProgress && <span style={{ fontSize: '12px' }}>同进度一致</span>}
        </Space>
      ),
    },
    {
      title: '连堂设置',
      dataIndex: 'maxConsecutivePeriods',
      key: 'maxConsecutivePeriods',
      width: 100,
      render: (value?: number) => value || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: types.Subject) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个科目吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
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
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加科目
          </Button>
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={subjects}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        scroll={{ x: 1500 }}
      />
      <Modal
        title={editingSubject ? '编辑科目' : '添加科目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={1000}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            确认
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="name"
                  label="科目全称"
                  rules={[{ required: true, message: '请输入科目全称' }]}
                >
                  <Input placeholder="如：语文、数学、英语" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="shortName"
                  label="简称"
                >
                  <Input placeholder="如：语、数、英" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="weeklyHours"
                  label="默认周课时"
                  rules={[{ required: true, message: '请输入默认周课时' }]}
                >
                  <InputNumber min={0} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="minWeeklyHours"
                  label="最小周课时"
                  rules={[{ required: true, message: '请输入最小周课时' }]}
                >
                  <InputNumber min={0} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="maxWeeklyHours"
                  label="最大周课时"
                  rules={[{ required: true, message: '请输入最大周课时' }]}
                >
                  <InputNumber min={0} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="maxConsecutivePeriods"
                  label="两节课连堂注意次数"
                >
                  <InputNumber min={0} max={10} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="requiresLab" valuePropName="checked">
                  <Checkbox>需要实验室</Checkbox>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="requiresSpecialRoom" valuePropName="checked">
                  <Checkbox>需要专用教室</Checkbox>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="requiresPublicRoom" valuePropName="checked">
                  <Checkbox>公共场地</Checkbox>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="requireSameProgress" valuePropName="checked">
                  <Checkbox>需要同进度一致</Checkbox>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card size="small" title="各年级课时" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              {[0, 1, 2, 3].map(grade => (
                <Col span={6} key={grade}>
                  <Form.Item label={GRADE_NAMES[grade]}>
                    <InputNumber
                      min={0}
                      max={20}
                      style={{ width: '100%' }}
                      value={gradeHours[grade]}
                      onChange={(value) => handleGradeHoursChange(grade, value || 0)}
                    />
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </Card>

          <Card size="small" title="年级配置（可选）" style={{ marginBottom: 16 }}>
            <Tabs defaultActiveKey="0">
              {[0, 1, 2, 3].map(grade => (
                <TabPane tab={GRADE_NAMES[grade]} key={grade.toString()}>
                  <Card size="small" title="周课时配置" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item label="周课时">
                          <InputNumber 
                            min={0} 
                            max={20} 
                            style={{ width: '100%' }}
                            value={gradeConfig[grade]?.weeklyHours || 5}
                            onChange={(value) => handleGradeConfigChange(grade, 'weeklyHours', value || 0)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="最小周课时">
                          <InputNumber 
                            min={0} 
                            max={20} 
                            style={{ width: '100%' }}
                            value={gradeConfig[grade]?.minWeeklyHours || 4}
                            onChange={(value) => handleGradeConfigChange(grade, 'minWeeklyHours', value || 0)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="最大周课时">
                          <InputNumber 
                            min={0} 
                            max={20} 
                            style={{ width: '100%' }}
                            value={gradeConfig[grade]?.maxWeeklyHours || 6}
                            onChange={(value) => handleGradeConfigChange(grade, 'maxWeeklyHours', value || 0)}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                  <Card size="small" title="每日配置">
                    <Row gutter={16}>
                      {[0, 1, 2, 3, 4].map(day => (
                        <Col span={24} key={day} style={{ marginBottom: 8 }}>
                          <Card size="small" title={DAY_NAMES[day]}>
                            <Row gutter={16}>
                              <Col span={12}>
                                <Form.Item label="最少节数">
                                  <InputNumber 
                                    min={0} 
                                    max={4} 
                                    style={{ width: '100%' }}
                                    value={gradeConfig[grade]?.dailyConfig?.[day]?.minPeriods ?? 0}
                                    onChange={(value) => handleDailyConfigChange(grade, day, 'minPeriods', value || 0)}
                                  />
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item label="最多节数">
                                  <InputNumber 
                                    min={0} 
                                    max={4} 
                                    style={{ width: '100%' }}
                                    value={gradeConfig[grade]?.dailyConfig?.[day]?.maxPeriods ?? 2}
                                    onChange={(value) => handleDailyConfigChange(grade, day, 'maxPeriods', value || 0)}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </TabPane>
              ))}
            </Tabs>
          </Card>

          <Card size="small" title="每周各节设置">
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              <Row gutter={8}>
                <Col span={4}>
                  <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 8 }}></div>
                </Col>
                {[0, 1, 2, 3, 4].map(day => (
                  <Col span={4} key={day}>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 8 }}>{DAY_NAMES[day]}</div>
                  </Col>
                ))}
              </Row>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(period => (
                <Row gutter={8} key={period} style={{ marginBottom: 8 }}>
                  <Col span={4}>
                    <div style={{ textAlign: 'right', paddingRight: 8 }}>{PERIOD_NAMES[period]}</div>
                  </Col>
                  {[0, 1, 2, 3, 4].map(day => {
                    const key = `${day}_${period}`;
                    return (
                      <Col span={4} key={key}>
                        <Select
                          size="small"
                          style={{ width: '100%' }}
                          value={periodPreferences[key]}
                          onChange={(value) => handlePeriodPreferenceChange(day, period, value as 'avoid' | 'prefer' | 'must')}
                        >
                          {PERIOD_OPTIONS.map(option => (
                            <Option key={option} value={option === '尽量不排' ? 'prefer' : option === '不排' ? 'avoid' : 'must'}>
                              {option}
                            </Option>
                          ))}
                        </Select>
                      </Col>
                    );
                  })}
                </Row>
              ))}
            </div>
          </Card>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectManagement;
