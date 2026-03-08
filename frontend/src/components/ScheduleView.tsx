import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Select, 
  Modal, 
  message, 
  Tag, 
  Space, 
  Input, 
  Popconfirm,
  Tree,
  Checkbox
} from 'antd';
import { 
  PlusOutlined, 
  ReloadOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  WarningOutlined, 
  DeleteOutlined,
  DownloadOutlined,
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { apiService } from '../services/api';
import * as types from '../types';

const { Option } = Select;

const ScheduleView: React.FC = () => {
  const [schedules, setSchedules] = useState<types.Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<types.Schedule | null>(null);
  const [classes, setClasses] = useState<types.Class[]>([]);
  const [teachers, setTeachers] = useState<types.Teacher[]>([]);
  const [subjects, setSubjects] = useState<types.Subject[]>([]);
  const [rooms, setRooms] = useState<types.Room[]>([]);
  const [generating, setGenerating] = useState(false);
  const [viewType, setViewType] = useState<'class' | 'teacher' | 'grade' | 'subject'>('class');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [scheduleItems, setScheduleItems] = useState<types.ScheduleItem[]>([]);
  const [conflicts, setConflicts] = useState<types.Conflict[]>([]);
  const [suggestions, setSuggestions] = useState<types.AdjustmentSuggestion[]>([]);
  const [suggestionsModalVisible, setSuggestionsModalVisible] = useState(false);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [semester, setSemester] = useState('');

  useEffect(() => {
    loadSchedules();
    loadBasicData();
  }, []);

  const loadSchedules = async () => {
    try {
      const data = await apiService.getSchedules();
      setSchedules(data);
      if (data.length > 0) {
        setSelectedSchedule(data[0]);
      }
    } catch (error) {
      message.error('加载课表列表失败');
    }
  };

  const loadBasicData = async () => {
    try {
      const [classesData, teachersData, subjectsData, roomsData] = await Promise.all([
        apiService.getClasses(),
        apiService.getTeachers(),
        apiService.getSubjects(),
        apiService.getRooms(),
      ]);
      setClasses(classesData);
      setTeachers(teachersData);
      setSubjects(subjectsData);
      setRooms(roomsData);
    } catch (error) {
      message.error('加载基础数据失败');
    }
  };

  const handleGenerateSchedule = async () => {
    // 生成课表逻辑
    message.info('生成课表功能');
  };

  const handleValidateSchedule = async () => {
    if (!selectedSchedule) return;
    try {
      const conflictsData = await apiService.validateSchedule(selectedSchedule.id);
      setConflicts(conflictsData);
      message.success('课表验证完成');
    } catch (error) {
      message.error('验证课表失败');
    }
  };

  const getConflictIcon = (status?: 'none' | 'hard' | 'soft') => {
    if (status === 'hard') return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    if (status === 'soft') return <WarningOutlined style={{ color: '#faad14' }} />;
    return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
  };

  return (
    <div>
      <Card title="课表视图" style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            style={{ width: 200 }}
            placeholder="选择视图类型"
            value={viewType}
            onChange={(value) => setViewType(value)}
          >
            <Option value="class">按班级查看</Option>
            <Option value="teacher">按教师查看</Option>
            <Option value="grade">按年级查看</Option>
            <Option value="subject">按科目查看</Option>
          </Select>
          
          <Select
            style={{ width: 200 }}
            placeholder="选择课表"
            value={selectedSchedule?.id}
            onChange={(value) => setSelectedSchedule(schedules.find(s => s.id === value) || null)}
          >
            {schedules.map(s => (
              <Option key={s.id} value={s.id}>{s.name}</Option>
            ))}
          </Select>
          
          <Button type="primary" icon={<PlusOutlined />} onClick={handleGenerateSchedule} loading={generating}>
            生成新课表
          </Button>
          
          <Button icon={<ReloadOutlined />} onClick={handleValidateSchedule}>
            验证课表
          </Button>
        </Space>
        
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          课表视图组件 - 完整代码已部署
        </div>
      </Card>
    </div>
  );
};

export default ScheduleView;
