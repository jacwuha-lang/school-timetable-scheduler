import { useState, useEffect } from 'react';
import { ConfigProvider, Layout, Button, Tooltip, message, Progress } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { 
  FileAddOutlined, 
  FileOpenOutlined, 
  SaveOutlined, 
  ImportOutlined, 
  ExportOutlined, 
  PrinterOutlined, 
  UndoOutlined, 
  RedoOutlined, 
  SettingOutlined, 
  CheckCircleOutlined, 
  AlertCircleOutlined, 
  HourglassOutlined 
} from '@ant-design/icons';
import './App.css';
import { healthCheck, switchToTestMode, createTestData, getTestStatus } from './services/api';
import SchoolConfig from './components/SchoolConfig';
import ClassManagement from './components/ClassManagement';
import TeacherManagement from './components/TeacherManagement';
import SubjectManagement from './components/SubjectManagement';
import RoomManagement from './components/RoomManagement';
import ScheduleGeneration from './components/ScheduleGeneration';
import ScheduleView from './components/ScheduleView';

const { Header, Sider, Content, Footer } = Layout;

function App() {
  const [activeTab, setActiveTab] = useState('config');
  const [isLoading, setIsLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [testMode, setTestMode] = useState(false);
  const [hasTestData, setHasTestData] = useState(false);
  const [testDataLoading, setTestDataLoading] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const status = await healthCheck();
      setHealthStatus(status);
      setTestMode(status.isTestMode);
      
      const testStatus = await getTestStatus();
      setHasTestData(testStatus.hasTestData);
    } catch (error) {
      message.error('无法连接到后端服务，请确保后端服务已启动');
      console.error('健康检查失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToTestMode = async () => {
    try {
      await switchToTestMode();
      message.success('已切换到测试模式');
      setTestMode(true);
      setHasTestData(false);
    } catch (error) {
      message.error('切换到测试模式失败');
    }
  };

  const handleCreateTestData = async () => {
    try {
      setTestDataLoading(true);
      await createTestData();
      message.success('测试数据创建成功');
      setHasTestData(true);
    } catch (error) {
      message.error('创建测试数据失败');
      console.error('创建测试数据失败:', error);
    } finally {
      setTestDataLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Progress type="circle" percent={100} size={80} status="active" />
        <p>正在检查后端服务...</p>
      </div>
    );
  }

  return (
    <ConfigProvider locale={zhCN}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header className="header">
          <div className="logo">
            <h1>排课系统</h1>
          </div>
          <div className="header-actions">
            <Tooltip title="新建">
              <Button type="primary" icon={<FileAddOutlined />} />
            </Tooltip>
            <Tooltip title="打开">
              <Button icon={<FileOpenOutlined />} />
            </Tooltip>
            <Tooltip title="保存">
              <Button icon={<SaveOutlined />} />
            </Tooltip>
            <Tooltip title="导入">
              <Button icon={<ImportOutlined />} />
            </Tooltip>
            <Tooltip title="导出">
              <Button icon={<ExportOutlined />} />
            </Tooltip>
            <Tooltip title="打印">
              <Button icon={<PrinterOutlined />} />
            </Tooltip>
            <Tooltip title="撤销">
              <Button icon={<UndoOutlined />} />
            </Tooltip>
            <Tooltip title="重做">
              <Button icon={<RedoOutlined />} />
            </Tooltip>
            <Tooltip title="设置">
              <Button icon={<SettingOutlined />} />
            </Tooltip>
          </div>
        </Header>
        <Layout>
          <Sider width={200} className="sider">
            <div className="sider-menu">
              <div 
                className={`menu-item ${activeTab === 'config' ? 'active' : ''}`}
                onClick={() => setActiveTab('config')}
              >
                <SettingOutlined /> 学校配置
              </div>
              <div 
                className={`menu-item ${activeTab === 'class' ? 'active' : ''}`}
                onClick={() => setActiveTab('class')}
              >
                <FileAddOutlined /> 班级管理
              </div>
              <div 
                className={`menu-item ${activeTab === 'teacher' ? 'active' : ''}`}
                onClick={() => setActiveTab('teacher')}
              >
                <FileAddOutlined /> 教师管理
              </div>
              <div 
                className={`menu-item ${activeTab === 'subject' ? 'active' : ''}`}
                onClick={() => setActiveTab('subject')}
              >
                <FileAddOutlined /> 科目管理
              </div>
              <div 
                className={`menu-item ${activeTab === 'room' ? 'active' : ''}`}
                onClick={() => setActiveTab('room')}
              >
                <FileAddOutlined /> 场地管理
              </div>
              <div 
                className={`menu-item ${activeTab === 'schedule' ? 'active' : ''}`}
                onClick={() => setActiveTab('schedule')}
              >
                <FileAddOutlined /> 课表生成
              </div>
              <div 
                className={`menu-item ${activeTab === 'view' ? 'active' : ''}`}
                onClick={() => setActiveTab('view')}
              >
                <FileOpenOutlined /> 课表查看
              </div>
            </div>
            <div className="test-mode-section">
              <h3>测试模式</h3>
              <Button 
                type={testMode ? 'primary' : 'default'}
                onClick={handleSwitchToTestMode}
                disabled={testMode}
                style={{ marginBottom: 8 }}
              >
                切换到测试模式
              </Button>
              {testMode && (
                <Button 
                  type="default" 
                  onClick={handleCreateTestData}
                  loading={testDataLoading}
                  disabled={hasTestData}
                >
                  {hasTestData ? '测试数据已创建' : '创建测试数据'}
                </Button>
              )}
            </div>
          </Sider>
          <Content className="content">
            <div className="content-header">
              <h2>
                {activeTab === 'config' && '学校配置'}
                {activeTab === 'class' && '班级管理'}
                {activeTab === 'teacher' && '教师管理'}
                {activeTab === 'subject' && '科目管理'}
                {activeTab === 'room' && '场地管理'}
                {activeTab === 'schedule' && '课表生成'}
                {activeTab === 'view' && '课表查看'}
              </h2>
              <div className="health-status">
                {healthStatus ? (
                  <div className="status-item">
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <span>后端服务正常</span>
                  </div>
                ) : (
                  <div className="status-item error">
                    <AlertCircleOutlined style={{ color: '#ff4d4f' }} />
                    <span>后端服务异常</span>
                  </div>
                )}
                {testMode && (
                  <div className="status-item test-mode">
                    <HourglassOutlined style={{ color: '#faad14' }} />
                    <span>测试模式</span>
                  </div>
                )}
              </div>
            </div>
            <div className="content-body">
              {activeTab === 'config' && <SchoolConfig />}
              {activeTab === 'class' && <ClassManagement />}
              {activeTab === 'teacher' && <TeacherManagement />}
              {activeTab === 'subject' && <SubjectManagement />}
              {activeTab === 'room' && <RoomManagement />}
              {activeTab === 'schedule' && <ScheduleGeneration />}
              {activeTab === 'view' && <ScheduleView />}
            </div>
          </Content>
        </Layout>
        <Footer className="footer">
          <p>排课系统 ©{new Date().getFullYear()} 版权所有</p>
          <p>版本: 1.0.0</p>
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}

export default App;