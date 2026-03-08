import axios from 'axios';
import { Class, Teacher, Subject, Room, Schedule, ScheduleItem, Conflict, HealthReport, Suggestion, SchoolConfig, SuccessResponse } from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 健康检查
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

// 测试模式
export const switchToTestMode = async () => {
  const response = await api.post('/test/switch-to-test');
  return response.data;
};

export const switchToMainMode = async () => {
  const response = await api.post('/test/switch-to-main');
  return response.data;
};

export const getTestStatus = async () => {
  const response = await api.get('/test/status');
  return response.data;
};

export const clearTestData = async () => {
  const response = await api.post('/test/clear-test-data');
  return response.data;
};

export const createTestData = async () => {
  const response = await api.post('/test/create-test-data');
  return response.data;
};

// 学校配置
export const getSchoolConfig = async (): Promise<SchoolConfig | null> => {
  const response = await api.get('/school-config');
  return response.data;
};

export const saveSchoolConfig = async (config: SchoolConfig): Promise<SuccessResponse> => {
  const response = await api.post('/school-config', config);
  return response.data;
};

export const deleteSchoolConfig = async (): Promise<SuccessResponse> => {
  const response = await api.delete('/school-config');
  return response.data;
};

// 课时配置
export const getClassTimeConfig = async () => {
  const response = await api.get('/class-time-config');
  return response.data;
};

export const saveClassTimeConfig = async (config: any): Promise<SuccessResponse> => {
  const response = await api.post('/class-time-config', config);
  return response.data;
};

// 班级管理
export const getClasses = async (): Promise<Class[]> => {
  const response = await api.get('/classes');
  return response.data;
};

export const createClass = async (cls: Omit<Class, 'id'>): Promise<SuccessResponse> => {
  const response = await api.post('/classes', cls);
  return response.data;
};

export const updateClass = async (cls: Class): Promise<SuccessResponse> => {
  const response = await api.put(`/classes/${cls.id}`, cls);
  return response.data;
};

export const deleteClass = async (id: string): Promise<SuccessResponse> => {
  const response = await api.delete(`/classes/${id}`);
  return response.data;
};

// 教师管理
export const getTeachers = async (): Promise<Teacher[]> => {
  const response = await api.get('/teachers');
  return response.data;
};

export const createTeacher = async (teacher: Teacher): Promise<SuccessResponse> => {
  const response = await api.post('/teachers', teacher);
  return response.data;
};

export const updateTeacher = async (teacher: Teacher): Promise<SuccessResponse> => {
  const response = await api.put(`/teachers/${teacher.id}`, teacher);
  return response.data;
};

export const deleteTeacher = async (id: string): Promise<SuccessResponse> => {
  const response = await api.delete(`/teachers/${id}`);
  return response.data;
};

export const batchImportTeachers = async (teachers: Omit<Teacher, 'id'>[]): Promise<SuccessResponse> => {
  const response = await api.post('/teachers/batch-import', { teachers });
  return response.data;
};

export const exportTeachers = async () => {
  const response = await api.get('/teachers/export', {
    responseType: 'blob'
  });
  return response.data;
};

// 科目管理
export const getSubjects = async (): Promise<Subject[]> => {
  const response = await api.get('/subjects');
  return response.data;
};

export const createSubject = async (subject: Subject): Promise<SuccessResponse> => {
  const response = await api.post('/subjects', subject);
  return response.data;
};

export const updateSubject = async (subject: Subject): Promise<SuccessResponse> => {
  const response = await api.put(`/subjects/${subject.id}`, subject);
  return response.data;
};

export const deleteSubject = async (id: string): Promise<SuccessResponse> => {
  const response = await api.delete(`/subjects/${id}`);
  return response.data;
};

// 场地管理
export const getRooms = async (): Promise<Room[]> => {
  const response = await api.get('/rooms');
  return response.data;
};

export const createRoom = async (room: Room): Promise<SuccessResponse> => {
  const response = await api.post('/rooms', room);
  return response.data;
};

export const updateRoom = async (room: Room): Promise<SuccessResponse> => {
  const response = await api.put(`/rooms/${room.id}`, room);
  return response.data;
};

export const deleteRoom = async (id: string): Promise<SuccessResponse> => {
  const response = await api.delete(`/rooms/${id}`);
  return response.data;
};

// 课表管理
export const getSchedules = async (): Promise<Schedule[]> => {
  const response = await api.get('/schedules');
  return response.data;
};

export const getSchedule = async (id: string): Promise<Schedule> => {
  const response = await api.get(`/schedules/${id}`);
  return response.data;
};

export const createSchedule = async (name: string, semester: string, items?: ScheduleItem[]): Promise<Schedule> => {
  const response = await api.post('/schedules', { name, semester, items });
  return response.data;
};

export const deleteSchedule = async (id: string): Promise<SuccessResponse> => {
  const response = await api.delete(`/schedules/${id}`);
  return response.data;
};

// 课表视图
export const getClassSchedule = async (scheduleId: string, classId: string): Promise<ScheduleItem[]> => {
  const response = await api.get(`/schedules/${scheduleId}/class/${classId}`);
  return response.data;
};

export const getTeacherSchedule = async (scheduleId: string, teacherId: string): Promise<ScheduleItem[]> => {
  const response = await api.get(`/schedules/${scheduleId}/teacher/${teacherId}`);
  return response.data;
};

export const getRoomSchedule = async (scheduleId: string, roomId: string): Promise<ScheduleItem[]> => {
  const response = await api.get(`/schedules/${scheduleId}/room/${roomId}`);
  return response.data;
};

// 课程管理
export const updateScheduleItem = async (scheduleId: string, item: ScheduleItem): Promise<{ success: boolean; message: string; conflicts: Conflict[] }> => {
  const response = await api.put(`/schedules/${scheduleId}/items/${item.id}`, item);
  return response.data;
};

export const deleteScheduleItem = async (scheduleId: string, itemId: string): Promise<SuccessResponse> => {
  const response = await api.delete(`/schedules/${scheduleId}/items/${itemId}`);
  return response.data;
};

// 课表验证
export const validateSchedule = async (scheduleId: string): Promise<Conflict[]> => {
  const response = await api.post(`/schedules/${scheduleId}/validate`);
  return response.data;
};

export const generateHealthReport = async (scheduleId: string): Promise<HealthReport> => {
  const response = await api.post(`/schedules/${scheduleId}/health-report`);
  return response.data;
};

// 调整建议
export const generateSuggestions = async (scheduleId: string, modifiedItem: ScheduleItem): Promise<Suggestion[]> => {
  const response = await api.post(`/schedules/${scheduleId}/suggestions`, { modifiedItem });
  return response.data;
};

export const executeSuggestion = async (scheduleId: string, suggestionId: string): Promise<SuccessResponse> => {
  const response = await api.post(`/schedules/${scheduleId}/suggestions/${suggestionId}/execute`);
  return response.data;
};