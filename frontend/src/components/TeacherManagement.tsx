import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Popconfirm, Space, Select, Checkbox, Upload, Divider, Row, Col, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ImportOutlined, ExportOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import * as types from '../types';

const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<types.Teacher[]>([]);
  const [subjects, setSubjects] = useState<types.Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<types.Teacher | null>(null);
  const [form] = Form.useForm();
  const [tempUnavailableSlots, setTempUnavailableSlots] = useState<types.TimeSlot[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [teachersData, subjectsData] = await Promise.all([
        apiService.getTeachers(),
        apiService.getSubjects(),
      ]);
      setTeachers(teachersData);
      setSubjects(subjectsData);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTeacher(null);
    form.resetFields();
    setTempUnavailableSlots([]);
    setModalVisible(true);
  };

  const handleEdit = (record: types.Teacher) => {
    setEditingTeacher(record);
    setTempUnavailableSlots([...(record.unavailableTimeSlots || [])]);
    form.setFieldsValue({
      ...record,
      subjects: record.subjects,
      weeklyHours: record.weeklyHours || {
        morningStudy: 0,
        lunchBreak: 0,
        afterSchool: 0,
        mainClasses: 0
      }
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteTeacher(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleExport = async () => {
    try {
      await apiService.exportTeachers();
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleImport = async (file: any) => {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      const teachers = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        if (values.length >= 4) {
          const subjectNames = values[1].split(';').map((s: string) => s.trim());
          const subjectIds = subjectNames.map((name: string) => {
            const subject = subjects.find(s => s.name === name);
            return subject?.id || name;
          }).filter(Boolean);

          teachers.push({
            name: values[0].trim(),
            subjects: subjectIds,
            minWeeklyHours: parseInt(values[2]) || 0,
            maxWeeklyHours: parseInt(values[3]) || 20,
            gradeAssignments: {
              grade0: values[4]?.trim() === '是',
              grade1: values[5]?.trim() === '是',
              grade2: values[6]?.trim() === '是',
              grade3: values[7]?.trim() === '是'
            }
          });
        }
      }

      const result = await apiService.batchImportTeachers(teachers);
      message.success(result.message);
      loadData();
    } catch (error) {
      message.error('导入失败，请检查文件格式');
    }
    return false;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const teacherData: types.Teacher = {
        ...values,
        id: editingTeacher?.id || `teacher_${Date.now()}`,
        unavailableTimeSlots: tempUnavailableSlots,
        preferredTimeSlots: [],
        maxConsecutivePeriods: values.maxConsecutivePeriods,
        preferredTimeOfDay: values.preferredTimeOfDay,
        flexibilityScore: values.flexibilityScore,
      };
      
      if (editingTeacher) {
        await apiService.updateTeacher(editingTeacher.id, teacherData);
        message.success('更新成功');
      } else {
        await apiService.createTeacher(teacherData);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getTimeOfDayText = (timeOfDay?: string) => {
    switch (timeOfDay) {
      case 'morning': return '上午';
      case 'afternoon': return '下午';
      case 'evening': return '晚上';
      case 'any': return '任意';
      default: return '-';
    }
  };

  const getFlexibilityText = (score?: number) => {
    if (!score) return '-';
    if (score <= 5) return '较难沟通';
    if (score <= 7) return '一般';
    return '好说话';
  };

  const columns = [
    {
      title: '教师姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '教授科目',
      dataIndex: 'subjects',
      key: 'subjects',
      width: 150,
      render: (subjectIds: string[]) => {
        const subjectNames = subjectIds.map(id => {
          const subject = subjects.find(s => s.id === id);
          return subject?.name || id;
        });
        return subjectNames.join(', ');
      },
    },
    {
      title: '周课时',
      key: 'weeklyHours',
      width: 200,
      render: (_: any, record: types.Teacher) => (
        <span style={{ fontSize: '12px' }}>
          早自习: {record.weeklyHours?.morningStudy || 0}; 
          午休: {record.weeklyHours?.lunchBreak || 0}; 
          课后: {record.weeklyHours?.afterSchool || 0}; 
          主课: {record.weeklyHours?.mainClasses || 0}
        </span>
      ),
    },
    {
      title: '偏好设置',
      key: 'preferences',
      width: 180,
      render: (_: any, record: types.Teacher) => (
        <span style={{ fontSize: '12px' }}>
          连堂: {record.maxConsecutivePeriods || '-'}; 
          时间: {getTimeOfDayText(record.preferredTimeOfDay)}; 
          灵活: {getFlexibilityText(record.flexibilityScore)}
        </span>
      ),
    },
    {
      title: '年级安排',
      dataIndex: 'gradeAssignments',
      key: 'gradeAssignments',
      width: 120,
      render: (assignments: types.Teacher['gradeAssignments']) => {
        const grades = [];
        if (assignments.grade0) grades.push('预初');
        if (assignments.grade1) grades.push('初一');
        if (assignments.grade2) grades.push('初二');
        if (assignments.grade3) grades.push('初三');
        return grades.join(', ') || '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: types.Teacher) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这位教师吗？"
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
            添加教师
          </Button>
          <Button icon={<ImportOutlined />}>
            <Upload
              accept=".csv"
              showUploadList={false}
              beforeUpload={handleImport}
            >
              批量导入
            </Upload>
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出数据
          </Button>
        </Space>
      </div>
      <Divider />
      <div style={{ marginBottom: 16, color: '#999', fontSize: '12px' }}>
        批量导入格式：姓名,教授科目(用;分隔),最小周课时,最大周课时,预初,初一,初二,初三<br/>
        年级安排列：需要上该年级课就填"是"，不上就留空
      </div>
      <Table
        columns={columns}
        dataSource={teachers}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        scroll={{ x: 1200 }}
      />
      <Modal
        title={editingTeacher ? '编辑教师' : '添加教师'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="教师姓名"
                  rules={[{ required: true, message: '请输入教师姓名' }]}
                >
                  <Input placeholder="请输入教师姓名" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="subjects"
                  label="教授科目"
                  rules={[{ required: true, message: '请选择教授科目' }]}
                >
                  <Select mode="multiple" placeholder="请选择教授科目">
                    {subjects.map(subject => (
                      <Select.Option key={subject.id} value={subject.id}>
                        {subject.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card size="small" title="每周课时设置" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name={['weeklyHours', 'morningStudy']} label="早自习">
                  <InputNumber min={0} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name={['weeklyHours', 'lunchBreak']} label="午休">
                  <InputNumber min={0} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name={['weeklyHours', 'afterSchool']} label="课后服务">
                  <InputNumber min={0} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name={['weeklyHours', 'mainClasses']} label="主要课时">
                  <InputNumber min={0} max={40} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card size="small" title="年级安排" style={{ marginBottom: 16 }}>
            <Form.Item name={['gradeAssignments', 'grade0']} valuePropName="checked" noStyle>
              <Checkbox>预初</Checkbox>
            </Form.Item>
            <Form.Item name={['gradeAssignments', 'grade1']} valuePropName="checked" noStyle style={{ marginLeft: 16 }}>
              <Checkbox>初一</Checkbox>
            </Form.Item>
            <Form.Item name={['gradeAssignments', 'grade2']} valuePropName="checked" noStyle style={{ marginLeft: 16 }}>
              <Checkbox>初二</Checkbox>
            </Form.Item>
            <Form.Item name={['gradeAssignments', 'grade3']} valuePropName="checked" noStyle style={{ marginLeft: 16 }}>
              <Checkbox>初三</Checkbox>
            </Form.Item>
          </Card>

          <Card size="small" title="偏好设置" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="maxConsecutivePeriods"
                  label="最大连堂数"
                  tooltip="连续上课的最大节数"
                >
                  <InputNumber min={1} max={8} style={{ width: '100%' }} placeholder="请输入最大连堂数" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="preferredTimeOfDay"
                  label="时间偏好"
                >
                  <Select placeholder="请选择时间偏好">
                    <Select.Option value="morning">上午</Select.Option>
                    <Select.Option value="afternoon">下午</Select.Option>
                    <Select.Option value="evening">晚上</Select.Option>
                    <Select.Option value="any">任意</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="flexibilityScore"
                  label="灵活性评分"
                  tooltip="1-10分，分数越高越灵活/好说话"
                >
                  <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="请输入灵活性评分(1-10)" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card size="small" title="不可排课时间">
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {['周一', '周二', '周三', '周四', '周五'].map((dayName, dayIndex) => (
                <div key={dayIndex} style={{ marginBottom: 12 }}>
                  <span style={{ display: 'inline-block', width: 50, fontWeight: 500 }}>{dayName}</span>
                  <Space wrap style={{ marginLeft: 8 }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(period => {
                      const isChecked = tempUnavailableSlots.some(
                        (slot) => slot.dayOfWeek === dayIndex + 1 && slot.period === period
                      );
                      return (
                        <Checkbox
                          key={period}
                          checked={isChecked}
                          onChange={(e) => {
                            setTempUnavailableSlots(prev =>
                              e.target.checked
                                ? [...prev, { dayOfWeek: dayIndex + 1, period }]
                                : prev.filter(slot => !(slot.dayOfWeek === dayIndex + 1 && slot.period === period))
                            );
                          }}
                        >
                          第{period}节
                        </Checkbox>
                      );
                    })}
                  </Space>
                </div>
              ))}
            </div>
          </Card>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherManagement;
