import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Progress, Statistic, Row, Col, Table, Tag, message, Space, Alert, Tabs, Popconfirm, Divider } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  WarningOutlined, 
  FileTextOutlined,
  ExperimentOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  DatabaseOutlined,
  HomeOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { apiService } from '../services/api';
import * as types from '../types';

const HealthReport: React.FC = () => {
  const [schedules, setSchedules] = useState<types.Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<types.Schedule | null>(null);
  const [report, setReport] = useState<types.HealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [isTestMode, setIsTestMode] = useState(false);
  const [hasTestData, setHasTestData] = useState(false);
  const [switchingDatabase, setSwitchingDatabase] = useState(false);
  const [creatingTestData, setCreatingTestData] = useState(false);
  const [clearingTestData, setClearingTestData] = useState(false);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [testProgress, setTestProgress] = useState<string>('');

  useEffect(() => {
    checkTestStatus();
    loadSchedules();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkTestStatus();
        loadSchedules();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const checkTestStatus = async () => {
    try {
      const status = await apiService.getTestStatus();
      setIsTestMode(status.isTestMode);
      setHasTestData(status.hasTestData);
    } catch (error) {
      console.error('检查测试状态失败:', error);
    }
  };

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const data = await apiService.getSchedules();
      setSchedules(data);
      if (data.length > 0) {
        setSelectedSchedule(data[0]);
      }
    } catch (error) {
      message.error('加载课表列表失败');
    } finally {
      setLoading(false);
    }
  };

  const switchToTestDatabase = async () => {
    setSwitchingDatabase(true);
    setTestProgress('正在切换到测试数据库...');
    try {
      const result = await apiService.switchToTestDatabase();
      setTestProgress('');
      message.success('✅ ' + result.message);
      await checkTestStatus();
      await loadSchedules();
    } catch (error) {
      setTestProgress('');
      message.error('切换到测试数据库失败');
    } finally {
      setSwitchingDatabase(false);
    }
  };

  const switchToMainDatabase = async () => {
    setSwitchingDatabase(true);
    setTestProgress('正在切换到主数据库...');
    try {
      const result = await apiService.switchToMainDatabase();
      setTestProgress('');
      message.success('✅ ' + result.message);
      await checkTestStatus();
      await loadSchedules();
    } catch (error) {
      setTestProgress('');
      message.error('切换到主数据库失败');
    } finally {
      setSwitchingDatabase(false);
    }
  };

  const createTestData = async () => {
    setCreatingTestData(true);
    try {
      setTestProgress('正在创建测试数据...');
      await apiService.createTestData();
      setTestProgress('');
      message.success('🎉 测试数据创建完成！您现在可以去其他模块查看测试数据，或者点击「生成测试课表」来生成课表');
      await checkTestStatus();
    } catch (error) {
      setTestProgress('');
      message.error('创建测试数据失败');
    } finally {
      setCreatingTestData(false);
    }
  };

  const clearTestData = async () => {
    setClearingTestData(true);
    try {
      setTestProgress('正在清理测试数据...');
      await apiService.clearTestData();
      setTestProgress('');
      message.success('✅ 测试数据清理成功！');
      await checkTestStatus();
      await loadSchedules();
    } catch (error) {
      setTestProgress('');
      message.error('清理测试数据失败');
    } finally {
      setClearingTestData(false);
    }
  };

  const generateTestSchedule = async () => {
    if (!hasTestData) {
      message.warning('请先生成测试数据');
      return;
    }

    setGeneratingSchedule(true);
    setTestProgress('正在生成课表，这可能需要一些时间...');
    try {
      const now = new Date();
      const testScheduleName = `测试课表_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const newSchedule = await apiService.createSchedule(testScheduleName, '2024-2025学年第一学期');
      
      setSelectedSchedule(newSchedule);
      loadSchedules();
      setTestProgress('');
      message.success('🎉 测试课表生成成功！请在上方的课表选择器中选择新生成的课表查看');
    } catch (error) {
      setTestProgress('');
      message.error('生成课表失败，请稍后重试或手动到课表管理模块生成');
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedSchedule) return;

    setLoading(true);
    try {
      const reportData = await apiService.generateHealthReport(selectedSchedule.id);
      setReport(reportData);
      message.success('体检报告生成成功');
    } catch (error) {
      message.error('生成体检报告失败');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return '优秀';
    if (score >= 70) return '良好';
    if (score >= 60) return '及格';
    return '不合格';
  };

  const renderOverallScore = () => {
    if (!report) return null;

    return (
      <Card title="课表总体评分" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="总体评分"
              value={report.overallScore}
              suffix="/ 100"
              valueStyle={{ color: getScoreColor(report.overallScore), fontSize: '48px' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="评级"
              value={getScoreStatus(report.overallScore)}
              valueStyle={{ fontSize: '32px', fontWeight: 'bold' }}
            />
          </Col>
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ marginBottom: 8 }}>硬性冲突: {report.hardConflicts.length}</div>
                <Progress
                  percent={report.hardConflicts.length === 0 ? 100 : 0}
                  status={report.hardConflicts.length === 0 ? 'success' : 'exception'}
                  showInfo={false}
                />
              </div>
              <div>
                <div style={{ marginBottom: 8 }}>软约束冲突: {report.softConflicts.length}</div>
                <Progress
                  percent={report.softConflicts.length === 0 ? 100 : Math.max(0, 100 - report.softConflicts.length * 10)}
                  status={report.softConflicts.length === 0 ? 'success' : 'normal'}
                  showInfo={false}
                />
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderConflicts = () => {
    if (!report) return null;

    const conflictColumns = [
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        render: (type: string) => {
          const typeMap: Record<string, string> = {
            teacher: '教师',
            class: '班级',
            room: '场地',
            hours: '课时',
            locked: '锁定时段',
            combined: '合班课',
            afterSchool: '课后服务',
          };
          return typeMap[type] || type;
        },
      },
      {
        title: '严重程度',
        dataIndex: 'severity',
        key: 'severity',
        render: (severity: string) => (
          <Tag color={severity === 'hard' ? 'red' : 'orange'}>
            {severity === 'hard' ? '硬性冲突' : '软约束'}
          </Tag>
        ),
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: '影响课程数',
        dataIndex: 'affectedItems',
        key: 'affectedItems',
        render: (items: string[]) => items.length,
      },
    ];

    return (
      <Card title="冲突详情" style={{ marginBottom: 16 }}>
        <Tabs
          items={[
            {
              key: 'hard',
              label: (
                <span>
                  <CloseCircleOutlined />
                  硬性冲突 ({report.hardConflicts.length})
                </span>
              ),
              children: (
                <Table
                  columns={conflictColumns}
                  dataSource={report.hardConflicts}
                  rowKey="id"
                  pagination={false}
                  locale={{ emptyText: '无硬性冲突' }}
                />
              ),
            },
            {
              key: 'soft',
              label: (
                <span>
                  <WarningOutlined />
                  软约束冲突 ({report.softConflicts.length})
                </span>
              ),
              children: (
                <Table
                  columns={conflictColumns}
                  dataSource={report.softConflicts}
                  rowKey="id"
                  pagination={false}
                  locale={{ emptyText: '无软约束冲突' }}
                />
              ),
            },
          ]}
        />
      </Card>
    );
  };

  const renderStatistics = () => {
    if (!report) return null;

    const teacherColumns = [
      { title: '教师姓名', dataIndex: 'teacherName', key: 'teacherName' },
      { title: '当前课时', dataIndex: 'currentHours', key: 'currentHours' },
      { title: '最小课时', dataIndex: 'minHours', key: 'minHours' },
      { title: '最大课时', dataIndex: 'maxHours', key: 'maxHours' },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
          const statusMap: Record<string, { color: string; text: string }> = {
            under: { color: 'orange', text: '不足' },
            normal: { color: 'green', text: '正常' },
            over: { color: 'red', text: '过载' },
          };
          const { color, text } = statusMap[status] || { color: 'default', text: status };
          return <Tag color={color}>{text}</Tag>;
        },
      },
    ];

    const subjectColumns = [
      { title: '班级', dataIndex: 'className', key: 'className' },
      { title: '科目', dataIndex: 'subjectName', key: 'subjectName' },
      { title: '要求课时', dataIndex: 'requiredHours', key: 'requiredHours' },
      { title: '实际课时', dataIndex: 'actualHours', key: 'actualHours' },
      {
        title: '合规性',
        dataIndex: 'compliant',
        key: 'compliant',
        render: (compliant: boolean) => (
          <Tag color={compliant ? 'green' : 'red'}>
            {compliant ? '合规' : '不合规'}
          </Tag>
        ),
      },
    ];

    const roomColumns = [
      { title: '场地名称', dataIndex: 'roomName', key: 'roomName' },
      { title: '总时段数', dataIndex: 'totalSlots', key: 'totalSlots' },
      { title: '已用时段', dataIndex: 'usedSlots', key: 'usedSlots' },
      {
        title: '使用率',
        dataIndex: 'utilizationRate',
        key: 'utilizationRate',
        render: (rate: number) => (
          <Progress percent={rate} size="small" status={rate > 80 ? 'exception' : 'normal'} />
        ),
      },
    ];

    const classColumns = [
      { title: '班级', dataIndex: 'className', key: 'className' },
      {
        title: '均衡评分',
        dataIndex: 'balanceScore',
        key: 'balanceScore',
        render: (score: number) => (
          <Progress percent={score} size="small" status={score > 80 ? 'success' : score > 60 ? 'normal' : 'exception'} />
        ),
      },
      {
        title: '每日主科分布',
        dataIndex: 'dailyMainSubjectCounts',
        key: 'dailyMainSubjectCounts',
        render: (counts: number[]) => counts.join(', '),
      },
    ];

    return (
      <Card title="统计分析" style={{ marginBottom: 16 }}>
        <Tabs
          items={[
            {
              key: 'teacher',
              label: '教师工作量',
              children: (
                <Table
                  columns={teacherColumns}
                  dataSource={report.statistics.teacherWorkload}
                  rowKey="teacherId"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条记录`,
                    pageSizeOptions: ['10', '20', '50', '100'],
                  }}
                />
              ),
            },
            {
              key: 'subject',
              label: '科目合规性',
              children: (
                <Table
                  columns={subjectColumns}
                  dataSource={report.statistics.subjectCompliance}
                  rowKey={(record) => `${record.classId}_${record.subjectId}`}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条记录`,
                    pageSizeOptions: ['10', '20', '50', '100'],
                  }}
                />
              ),
            },
            {
              key: 'room',
              label: '场地使用率',
              children: (
                <Table
                  columns={roomColumns}
                  dataSource={report.statistics.roomUtilization}
                  rowKey="roomId"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条记录`,
                    pageSizeOptions: ['10', '20', '50', '100'],
                  }}
                />
              ),
            },
            {
              key: 'class',
              label: '班级均衡性',
              children: (
                <Table
                  columns={classColumns}
                  dataSource={report.statistics.classBalance}
                  rowKey="classId"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条记录`,
                    pageSizeOptions: ['10', '20', '50', '100'],
                  }}
                />
              ),
            },
          ]}
        />
      </Card>
    );
  };

  return (
    <div>
      <Card 
        title="测试工具" 
        style={{ marginBottom: 16 }}
        extra={
          <Tag color={isTestMode ? 'orange' : 'green'} icon={isTestMode ? <ExperimentOutlined /> : <HomeOutlined />}>
            {isTestMode ? '测试数据库' : '主数据库'}
          </Tag>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap>
            {!isTestMode ? (
              <Button
                type="primary"
                icon={<SafetyOutlined />}
                onClick={switchToTestDatabase}
                loading={switchingDatabase}
              >
                进入测试模式
              </Button>
            ) : (
              <>
                <Popconfirm
                  title="确定要退出测试模式吗？"
                  description="这将切换回主数据库，您在测试数据库中的所有更改都不会影响主数据库"
                  onConfirm={switchToMainDatabase}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    danger 
                    icon={<HomeOutlined />}
                    loading={switchingDatabase}
                  >
                    退出测试模式
                  </Button>
                </Popconfirm>
                <Button
                  icon={<DatabaseOutlined />}
                  onClick={createTestData}
                  loading={creatingTestData}
                  disabled={hasTestData}
                >
                  生成测试数据
                </Button>
                <Button
                  icon={<DeleteOutlined />}
                  onClick={clearTestData}
                  loading={clearingTestData}
                  disabled={!hasTestData}
                  danger
                >
                  清除测试数据
                </Button>
                <Button
                  icon={<PlayCircleOutlined />}
                  onClick={generateTestSchedule}
                  loading={generatingSchedule}
                  disabled={!hasTestData}
                >
                  生成测试课表
                </Button>
              </>
            )}
          </Space>

          <Divider style={{ margin: '16px 0' }} />

          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="数据库模式"
                  value={isTestMode ? '测试模式' : '主模式'}
                  valueStyle={{ color: isTestMode ? '#faad14' : '#52c41a' }}
                  prefix={isTestMode ? <ExperimentOutlined /> : <HomeOutlined />}
                />
              </Col>
              {isTestMode && (
                <Col span={6}>
                  <Statistic
                    title="测试数据状态"
                    value={hasTestData ? '已创建' : '未创建'}
                    valueStyle={{ color: hasTestData ? '#52c41a' : '#faad14' }}
                    prefix={hasTestData ? <CheckCircleOutlined /> : <WarningOutlined />}
                  />
                </Col>
              )}
            </Row>
          </Space>
        </Space>
      </Card>

      {testProgress && (
        <Alert
          message="操作进行中"
          description={testProgress}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {isTestMode && (
        <Alert
          message="当前处于测试模式"
          description="您现在正在使用测试数据库，所有操作都不会影响主数据库的数据。完成测试后，请点击「退出测试模式」返回主数据库。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          style={{ width: 300 }}
          placeholder="选择课表"
          value={selectedSchedule?.id}
          onChange={(value) => setSelectedSchedule(schedules.find(s => s.id === value) || null)}
          options={schedules.map(s => ({ label: s.name, value: s.id }))}
        />
        <Button
          type="primary"
          icon={<FileTextOutlined />}
          onClick={handleGenerateReport}
          loading={loading}
          disabled={!selectedSchedule}
        >
          生成体检报告
        </Button>
      </Space>

      {!report && selectedSchedule && (
        <Alert
          message="请点击「生成体检报告」按钮开始课表体检"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {report && (
        <>
          {renderOverallScore()}
          {renderConflicts()}
          {renderStatistics()}
        </>
      )}
    </div>
  );
};

export default HealthReport;