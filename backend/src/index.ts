import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeDatabase, switchToMainDatabase, switchToTestDatabase, isTestDatabase } from './database';
import { ClassDAO } from './dao/ClassDAO';
import { TeacherDAO } from './dao/TeacherDAO';
import { SubjectDAO } from './dao/SubjectDAO';
import { RoomDAO } from './dao/RoomDAO';
import { ScheduleDAO } from './dao/ScheduleDAO';
import { SchoolConfigDAO } from './dao/SchoolConfigDAO';
import { ValidationEngine } from './services/ValidationEngine';
import { SchedulingAlgorithm } from './services/SchedulingAlgorithm';
import { AdjustmentSuggestionEngine } from './services/AdjustmentSuggestionEngine';
import { Class, Teacher, Subject, Room, Schedule, ScheduleItem } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const validationEngine = new ValidationEngine();
const schedulingAlgorithm = new SchedulingAlgorithm();
const suggestionEngine = new AdjustmentSuggestionEngine();

initializeDatabase();

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: '排课系统API运行正常', isTestMode: isTestDatabase() });
});

app.get('/api/debug/teachers', (req: Request, res: Response) => {
  try {
    const { db } = require('./database');
    const teachers = db.prepare('SELECT * FROM teachers LIMIT 5').all();
    res.json({ teachers });
  } catch (error) {
    console.error('获取教师调试信息失败:', error);
    res.status(500).json({ error: '获取教师调试信息失败' });
  }
});

app.post('/api/test/switch-to-test', (req: Request, res: Response) => {
  try {
    switchToTestDatabase();
    res.json({ success: true, message: '已切换到测试数据库', isTestMode: true });
  } catch (error) {
    console.error('切换到测试数据库失败:', error);
    res.status(500).json({ error: '切换到测试数据库失败' });
  }
});

app.post('/api/test/switch-to-main', (req: Request, res: Response) => {
  try {
    switchToMainDatabase();
    res.json({ success: true, message: '已切换到主数据库', isTestMode: false });
  } catch (error) {
    console.error('切换到主数据库失败:', error);
    res.status(500).json({ error: '切换到主数据库失败' });
  }
});

app.get('/api/test/status', (req: Request, res: Response) => {
  try {
    const isTestMode = isTestDatabase();
    let hasTestData = false;
    
    if (isTestMode) {
      const classes = ClassDAO.getAll();
      hasTestData = classes.length > 0;
    }
    
    res.json({ isTestMode, hasTestData });
  } catch (error) {
    console.error('获取测试状态失败:', error);
    res.status(500).json({ error: '获取测试状态失败' });
  }
});

app.post('/api/test/clear-test-data', (req: Request, res: Response) => {
  try {
    console.log('开始清理测试数据...');

    const schedules = ScheduleDAO.getAll();
    for (const schedule of schedules) {
      ScheduleDAO.delete(schedule.id);
    }
    console.log('✅ 课表数据已清理');

    const classes = ClassDAO.getAll();
    for (const cls of classes) {
      ClassDAO.delete(cls.id);
    }
    console.log('✅ 班级数据已清理');

    const teachers = TeacherDAO.getAll();
    for (const teacher of teachers) {
      TeacherDAO.delete(teacher.id);
    }
    console.log('✅ 教师数据已清理');

    const subjects = SubjectDAO.getAll();
    for (const subject of subjects) {
      SubjectDAO.delete(subject.id);
    }
    console.log('✅ 科目数据已清理');

    const rooms = RoomDAO.getAll();
    for (const room of rooms) {
      RoomDAO.delete(room.id);
    }
    console.log('✅ 场地数据已清理');

    res.json({ success: true, message: '测试数据清理成功' });
  } catch (error) {
    console.error('清理测试数据失败:', error);
    res.status(500).json({ error: '清理测试数据失败' });
  }
});

app.post('/api/test/create-test-data', (req: Request, res: Response) => {
  try {
    console.log('开始生成测试数据...');
    
    console.log('先清理旧的测试数据...');
    const schedules = ScheduleDAO.getAll();
    for (const schedule of schedules) {
      ScheduleDAO.delete(schedule.id);
    }
    console.log('✅ 旧课表数据已清理');

    const classes = ClassDAO.getAll();
    for (const cls of classes) {
      ClassDAO.delete(cls.id);
    }
    console.log('✅ 旧班级数据已清理');

    const teachers = TeacherDAO.getAll();
    for (const teacher of teachers) {
      TeacherDAO.delete(teacher.id);
    }
    console.log('✅ 旧教师数据已清理');

    const subjects = SubjectDAO.getAll();
    for (const subject of subjects) {
      SubjectDAO.delete(subject.id);
    }
    console.log('✅ 旧科目数据已清理');

    const rooms = RoomDAO.getAll();
    for (const room of rooms) {
      RoomDAO.delete(room.id);
    }
    console.log('✅ 旧场地数据已清理');
    console.log('旧数据清理完成，开始生成新数据...');

    const now = new Date().toISOString();
    SchoolConfigDAO.createOrUpdate({
      name: '测试中学',
      address: '测试路123号',
      phone: '123456789',
      principal: '测试校长',
      academicYear: '2024-2025',
      semester: '第一学期'
    });
    console.log('✅ 学校配置已创建');

    const createDefaultGradeConfig = (weeklyHours: number, minWeeklyHours: number, maxWeeklyHours: number) => {
      const config: any = {};
      for (let grade = 0; grade < 4; grade++) {
        config[grade] = {
          weeklyHours: weeklyHours,
          minWeeklyHours: minWeeklyHours,
          maxWeeklyHours: maxWeeklyHours,
          dailyConfig: {
            0: { minPeriods: 0, maxPeriods: 2 },
            1: { minPeriods: 0, maxPeriods: 2 },
            2: { minPeriods: 0, maxPeriods: 2 },
            3: { minPeriods: 0, maxPeriods: 2 },
            4: { minPeriods: 0, maxPeriods: 2 },
            5: { minPeriods: 0, maxPeriods: 1 },
            6: { minPeriods: 0, maxPeriods: 0 },
          }
        };
      }
      return config;
    };

    const subjectData = [
      { name: '语文', shortName: '语', weeklyHours: 7, minWeeklyHours: 6, maxWeeklyHours: 9, requiresLab: false, requiresSpecialRoom: false, requiresPublicRoom: false, maxConsecutivePeriods: 2, requireSameProgress: true, gradeHours: { 0: 7, 1: 7, 2: 7, 3: 8 } },
      { name: '数学', shortName: '数', weeklyHours: 7, minWeeklyHours: 6, maxWeeklyHours: 9, requiresLab: false, requiresSpecialRoom: false, requiresPublicRoom: false, maxConsecutivePeriods: 2, requireSameProgress: true, gradeHours: { 0: 7, 1: 7, 2: 7, 3: 8 } },
      { name: '英语', shortName: '英', weeklyHours: 6, minWeeklyHours: 5, maxWeeklyHours: 8, requiresLab: false, requiresSpecialRoom: false, requiresPublicRoom: false, maxConsecutivePeriods: 2, requireSameProgress: true, gradeHours: { 0: 6, 1: 6, 2: 6, 3: 7 } },
      { name: '体育', shortName: '体', weeklyHours: 5, minWeeklyHours: 5, maxWeeklyHours: 5, requiresLab: false, requiresSpecialRoom: true, requiresPublicRoom: false, maxConsecutivePeriods: 1, requireSameProgress: false, gradeHours: { 0: 5, 1: 5, 2: 5, 3: 5 } },
      { name: '物理', shortName: '物', weeklyHours: 3, minWeeklyHours: 2, maxWeeklyHours: 4, requiresLab: false, requiresSpecialRoom: false, requiresPublicRoom: false, maxConsecutivePeriods: 2, requireSameProgress: true, gradeHours: { 0: 0, 1: 3, 2: 3, 3: 3 } },
      { name: '物理实验', shortName: '物实', weeklyHours: 1, minWeeklyHours: 1, maxWeeklyHours: 2, requiresLab: true, requiresSpecialRoom: false, requiresPublicRoom: false, maxConsecutivePeriods: 1, requireSameProgress: false, gradeHours: { 0: 0, 1: 0, 2: 1, 3: 1 } },
      { name: '化学', shortName: '化', weeklyHours: 3, minWeeklyHours: 2, maxWeeklyHours: 4, requiresLab: false, requiresSpecialRoom: false, requiresPublicRoom: false, maxConsecutivePeriods: 2, requireSameProgress: true, gradeHours: { 0: 0, 1: 0, 2: 3, 3: 3 } },
      { name: '化学实验', shortName: '化实', weeklyHours: 1, minWeeklyHours: 1, maxWeeklyHours: 2, requiresLab: true, requiresSpecialRoom: false, requiresPublicRoom: false, maxConsecutivePeriods: 1, requireSameProgress: false, gradeHours: { 0: 0, 1: 0, 2: 1, 3: 1 } },
      { name: '生物', shortName: '生', weeklyHours: 2, minWeeklyHours: 1, maxWeeklyHours: 3, requiresLab: true, requiresSpecialRoom: false, requiresPublicRoom: false, maxConsecutivePeriods: 1, requireSameProgress: true, gradeHours: { 0: 2, 1: 2, 2: 2, 3: 2 } },
      { name: '历史', shortName: '历', weeklyHours: 2, minWeeklyHours: 1, maxWeeklyHours: 4, requiresLab: false, requiresSpecialRoom: false, requiresPublicRoom: false, maxConsecutivePeriods: 2, requireSameProgress: true, gradeHours: { 0: 2, 1: 2, 2: 2, 3: 2 } },
      { name: '地理', shortName: '地', weeklyHours: 2, minWeeklyHours: 1, maxWeeklyHours: 3, requiresLab: false, requiresSpecialRoom: false, requiresPublicRoom: false, maxConsecutivePeriods: 1, requireSameProgress: true, gradeHours: { 0: 2, 1: 2, 2: 2, 3: 0 } },
      { name: '政治', shortName: '政', weeklyHours: 2, minWeeklyHours: 1, maxWeeklyHours: 4, requiresLab: false, requiresSpecialRoom: false, requiresPublicRoom: false, maxConsecutivePeriods: 2, requireSameProgress: true, gradeHours: { 0: 2, 1: 2, 2: 2, 3: 2 } },
      { name: '音乐', shortName: '音', weeklyHours: 1, minWeeklyHours: 1, maxWeeklyHours: 2, requiresLab: false, requiresSpecialRoom: true, requiresPublicRoom: false, maxConsecutivePeriods: 1, requireSameProgress: false, gradeHours: { 0: 1, 1: 1, 2: 1, 3: 1 } },
      { name: '美术', shortName: '美', weeklyHours: 1, minWeeklyHours: 1, maxWeeklyHours: 2, requiresLab: false, requiresSpecialRoom: true, requiresPublicRoom: false, maxConsecutivePeriods: 1, requireSameProgress: false, gradeHours: { 0: 1, 1: 1, 2: 1, 3: 1 } },
      { name: '信息技术', shortName: '信', weeklyHours: 1, minWeeklyHours: 1, maxWeeklyHours: 2, requiresLab: true, requiresSpecialRoom: false, requiresPublicRoom: false, maxConsecutivePeriods: 1, requireSameProgress: false, gradeHours: { 0: 1, 1: 1, 2: 1, 3: 1 } },
      { name: '劳动技术', shortName: '劳', weeklyHours: 1, minWeeklyHours: 1, maxWeeklyHours: 2, requiresLab: false, requiresSpecialRoom: true, requiresPublicRoom: false, maxConsecutivePeriods: 1, requireSameProgress: false, gradeHours: { 0: 1, 1: 1, 2: 1, 3: 1 } },
    ];

    const createdSubjects: Subject[] = [];
    for (const subject of subjectData) {
      const subjectId = `test_subject_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const gradeConfig = createDefaultGradeConfig(subject.weeklyHours, subject.minWeeklyHours, subject.maxWeeklyHours);
      SubjectDAO.create({ 
        ...subject, 
        id: subjectId, 
        preferredTimeSlots: [], 
        avoidTimeSlots: [], 
        gradeConfig 
      });
      createdSubjects.push({ 
        ...subject, 
        id: subjectId, 
        preferredTimeSlots: [], 
        avoidTimeSlots: [], 
        gradeConfig 
      });
    }
    console.log('✅ 科目数据已生成（16个科目，包含年级配置和完整属性）');

    const roomData = [
      { name: '教室1', type: 'classroom' as const, capacity: 50, available: true },
      { name: '教室2', type: 'classroom' as const, capacity: 50, available: true },
      { name: '教室3', type: 'classroom' as const, capacity: 50, available: true },
      { name: '教室4', type: 'classroom' as const, capacity: 50, available: true },
      { name: '教室5', type: 'classroom' as const, capacity: 50, available: true },
      { name: '教室6', type: 'classroom' as const, capacity: 50, available: true },
      { name: '教室7', type: 'classroom' as const, capacity: 50, available: true },
      { name: '教室8', type: 'classroom' as const, capacity: 50, available: true },
      { name: '物理实验室', type: 'lab' as const, capacity: 40, available: true },
      { name: '化学实验室', type: 'lab' as const, capacity: 40, available: true },
      { name: '生物实验室', type: 'lab' as const, capacity: 40, available: true },
      { name: '计算机房', type: 'lab' as const, capacity: 45, available: true },
      { name: '操场', type: 'gym' as const, capacity: 100, available: true },
      { name: '音乐教室', type: 'music' as const, capacity: 30, available: true },
      { name: '美术教室', type: 'art' as const, capacity: 30, available: true },
      { name: '劳技教室', type: 'art' as const, capacity: 35, available: true },
    ];

    const createdRooms: Room[] = [];
    for (const room of roomData) {
      const roomId = `test_room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      RoomDAO.create({ ...room, id: roomId });
      createdRooms.push({ ...room, id: roomId });
    }
    console.log('✅ 场地数据已生成（16个场地）');

    const teacherData = [
      { name: '张老师', subjects: [createdSubjects[0]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 24 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 2, preferredTimeOfDay: 'morning' as const, unavailableTimeSlots: [], flexibilityScore: 5 },
      { name: '王老师', subjects: [createdSubjects[0]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 24 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 3, preferredTimeOfDay: 'any' as const, unavailableTimeSlots: [], flexibilityScore: 8 },
      { name: '黄老师', subjects: [createdSubjects[0]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 24 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 2, preferredTimeOfDay: 'afternoon' as const, unavailableTimeSlots: [], flexibilityScore: 6 },
      { name: '徐老师', subjects: [createdSubjects[0]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 24 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 3, preferredTimeOfDay: 'morning' as const, unavailableTimeSlots: [], flexibilityScore: 7 },
      { name: '李老师', subjects: [createdSubjects[1]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 24 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 2, preferredTimeOfDay: 'morning' as const, unavailableTimeSlots: [], flexibilityScore: 5 },
      { name: '刘老师', subjects: [createdSubjects[1]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 24 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 3, preferredTimeOfDay: 'afternoon' as const, unavailableTimeSlots: [], flexibilityScore: 9 },
      { name: '谢老师', subjects: [createdSubjects[1]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 24 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 2, preferredTimeOfDay: 'any' as const, unavailableTimeSlots: [], flexibilityScore: 6 },
      { name: '蔡老师', subjects: [createdSubjects[1]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 24 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 3, preferredTimeOfDay: 'morning' as const, unavailableTimeSlots: [], flexibilityScore: 8 },
      { name: '陈老师', subjects: [createdSubjects[2]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 22 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 2, preferredTimeOfDay: 'morning' as const, unavailableTimeSlots: [], flexibilityScore: 7 },
      { name: '杨老师', subjects: [createdSubjects[2]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 22 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 3, preferredTimeOfDay: 'afternoon' as const, unavailableTimeSlots: [], flexibilityScore: 6 },
      { name: '许老师', subjects: [createdSubjects[2]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 22 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 2, preferredTimeOfDay: 'any' as const, unavailableTimeSlots: [], flexibilityScore: 8 },
      { name: '韩老师', subjects: [createdSubjects[2]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 22 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 3, preferredTimeOfDay: 'morning' as const, unavailableTimeSlots: [], flexibilityScore: 5 },
      { name: '赵老师', subjects: [createdSubjects[3]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 40 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 2, preferredTimeOfDay: 'any' as const, unavailableTimeSlots: [], flexibilityScore: 9 },
      { name: '孙老师', subjects: [createdSubjects[3]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 40 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 2, preferredTimeOfDay: 'any' as const, unavailableTimeSlots: [], flexibilityScore: 8 },
      { name: '周老师', subjects: [createdSubjects[3]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 40 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 2, preferredTimeOfDay: 'any' as const, unavailableTimeSlots: [], flexibilityScore: 7 },
      { name: '钱老师', subjects: [createdSubjects[4]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 18 }, gradeAssignments: { grade0: false, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 2, preferredTimeOfDay: 'afternoon' as const, unavailableTimeSlots: [], flexibilityScore: 8 },
      { name: '吴老师', subjects: [createdSubjects[5]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 8 }, gradeAssignments: { grade0: false, grade1: false, grade2: true, grade3: true }, maxConsecutivePeriods: 1, preferredTimeOfDay: 'any' as const, unavailableTimeSlots: [], flexibilityScore: 7 },
      { name: '郑老师', subjects: [createdSubjects[6]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 18 }, gradeAssignments: { grade0: false, grade1: false, grade2: true, grade3: true }, maxConsecutivePeriods: 2, preferredTimeOfDay: 'afternoon' as const, unavailableTimeSlots: [], flexibilityScore: 8 },
      { name: '冯老师', subjects: [createdSubjects[7]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 8 }, gradeAssignments: { grade0: false, grade1: false, grade2: true, grade3: true }, maxConsecutivePeriods: 1, preferredTimeOfDay: 'any' as const, unavailableTimeSlots: [], flexibilityScore: 7 },
      { name: '卫老师', subjects: [createdSubjects[8]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 16 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 1, preferredTimeOfDay: 'any' as const, unavailableTimeSlots: [], flexibilityScore: 7 },
      { name: '马老师', subjects: [createdSubjects[9]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 16 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 2, preferredTimeOfDay: 'any' as const, unavailableTimeSlots: [], flexibilityScore: 6 },
      { name: '朱老师', subjects: [createdSubjects[10]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 16 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 2, preferredTimeOfDay: 'morning' as const, unavailableTimeSlots: [], flexibilityScore: 8 },
      { name: '林老师', subjects: [createdSubjects[11]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 16 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 3, preferredTimeOfDay: 'afternoon' as const, unavailableTimeSlots: [], flexibilityScore: 7 },
      { name: '胡老师', subjects: [createdSubjects[12]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 8 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 2, preferredTimeOfDay: 'any' as const, unavailableTimeSlots: [], flexibilityScore: 9 },
      { name: '何老师', subjects: [createdSubjects[13]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 8 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 1, preferredTimeOfDay: 'afternoon' as const, unavailableTimeSlots: [], flexibilityScore: 6 },
      { name: '高老师', subjects: [createdSubjects[14]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 8 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 1, preferredTimeOfDay: 'any' as const, unavailableTimeSlots: [], flexibilityScore: 8 },
      { name: '罗老师', subjects: [createdSubjects[15]?.id], weeklyHours: { morningStudy: 0, lunchBreak: 0, afterSchool: 0, mainClasses: 8 }, gradeAssignments: { grade0: true, grade1: true, grade2: true, grade3: true }, maxConsecutivePeriods: 2, preferredTimeOfDay: 'any' as const, unavailableTimeSlots: [], flexibilityScore: 7 },
    ];

    for (const teacher of teacherData) {
      const teacherId = `test_teacher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      TeacherDAO.create({ ...teacher, id: teacherId, preferredTimeSlots: [] });
    }
    console.log('✅ 教师数据已生成（26个教师）');

    const classData = [
      { name: '预初一班', grade: 0, studentCount: 45 },
      { name: '预初二班', grade: 0, studentCount: 45 },
      { name: '初一（1）班', grade: 1, studentCount: 48 },
      { name: '初一（2）班', grade: 1, studentCount: 48 },
      { name: '初二（1）班', grade: 2, studentCount: 50 },
      { name: '初二（2）班', grade: 2, studentCount: 50 },
      { name: '初三（1）班', grade: 3, studentCount: 48 },
      { name: '初三（2）班', grade: 3, studentCount: 48 },
    ];

    for (const cls of classData) {
      const classId = `test_class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      ClassDAO.create({ ...cls, id: classId });
    }
    console.log('✅ 班级数据已生成（8个班级）');

    res.json({ 
      success: true, 
      message: '测试数据创建成功', 
      data: { 
        subjects: createdSubjects.length, 
        rooms: createdRooms.length, 
        teachers: teacherData.length, 
        classes: classData.length 
      } 
    });
  } catch (error) {
    console.error('创建测试数据失败:', error);
    res.status(500).json({ error: '创建测试数据失败' });
  }
});

app.get('/api/school-config', (req: Request, res: Response) => {
  try {
    const config = SchoolConfigDAO.get();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: '获取学校配置失败' });
  }
});

app.post('/api/school-config', (req: Request, res: Response) => {
  try {
    SchoolConfigDAO.createOrUpdate(req.body);
    res.json({ success: true, message: '学校配置保存成功' });
  } catch (error) {
    res.status(500).json({ error: '保存学校配置失败' });
  }
});

app.get('/api/class-time-config', (req: Request, res: Response) => {
  try {
    const config = SchoolConfigDAO.get();
    res.json(config?.classTimeConfig || null);
  } catch (error) {
    console.error('获取课时配置失败:', error);
    res.status(500).json({ error: '获取课时配置失败' });
  }
});

app.post('/api/class-time-config', (req: Request, res: Response) => {
  try {
    const existingConfig = SchoolConfigDAO.get();
    if (!existingConfig) {
      res.status(404).json({ error: '学校配置不存在，请先创建学校配置' });
      return;
    }

    SchoolConfigDAO.createOrUpdate({
      ...existingConfig,
      classTimeConfig: req.body
    });

    res.json({ success: true, message: '课时配置保存成功' });
  } catch (error) {
    console.error('保存课时配置失败:', error);
    res.status(500).json({ error: '保存课时配置失败' });
  }
});

app.delete('/api/school-config', (req: Request, res: Response) => {
  try {
    SchoolConfigDAO.delete();
    res.json({ success: true, message: '学校配置删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除学校配置失败' });
  }
});

app.get('/api/classes', (req: Request, res: Response) => {
  try {
    console.log('正在获取班级列表...');
    const classes = ClassDAO.getAll();
    console.log('班级列表获取成功，数量:', classes.length);
    res.json(classes);
  } catch (error) {
    console.error('获取班级列表失败:', error);
    res.status(500).json({ error: '获取班级列表失败', details: error });
  }
});

app.post('/api/classes', (req: Request, res: Response) => {
  try {
    const cls: Omit<Class, 'id'> = req.body;
    const id = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    ClassDAO.create({ ...cls, id });
    res.json({ success: true, message: '班级创建成功' });
  } catch (error) {
    console.error('创建班级失败:', error);
    res.status(500).json({ error: '创建班级失败' });
  }
});

app.put('/api/classes/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const cls: Class = { ...req.body, id };
    ClassDAO.update(cls);
    res.json({ success: true, message: '班级更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新班级失败' });
  }
});

app.delete('/api/classes/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    ClassDAO.delete(id);
    res.json({ success: true, message: '班级删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除班级失败' });
  }
});

app.get('/api/teachers', (req: Request, res: Response) => {
  try {
    const teachers = TeacherDAO.getAll();
    res.json(teachers);
  } catch (error) {
    console.error('获取教师列表失败:', error);
    res.status(500).json({ error: '获取教师列表失败' });
  }
});

app.post('/api/teachers', (req: Request, res: Response) => {
  try {
    const teacher: Teacher = req.body;
    TeacherDAO.create(teacher);
    res.json({ success: true, message: '教师创建成功' });
  } catch (error) {
    res.status(500).json({ error: '创建教师失败' });
  }
});

app.put('/api/teachers/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const teacher: Teacher = { ...req.body, id };
    TeacherDAO.update(teacher);
    res.json({ success: true, message: '教师更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新教师失败' });
  }
});

app.delete('/api/teachers/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    TeacherDAO.delete(id);
    res.json({ success: true, message: '教师删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除教师失败' });
  }
});

app.post('/api/teachers/batch-import', (req: Request, res: Response) => {
  try {
    const teachers: Omit<Teacher, 'id'>[] = req.body.teachers;
    let successCount = 0;
    let failCount = 0;

    for (const teacher of teachers) {
      try {
        TeacherDAO.create({
          ...teacher,
          id: `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    res.json({ 
      success: true, 
      message: `批量导入完成，成功${successCount}条，失败${failCount}条`,
      successCount,
      failCount
    });
  } catch (error) {
    res.status(500).json({ error: '批量导入失败' });
  }
});

app.get('/api/teachers/export', (req: Request, res: Response) => {
  try {
    const teachers = TeacherDAO.getAll();
    const csv = [
      ['姓名', '教授科目', '早自习课时', '午休课时', '课后服务课时', '主要课时', '预初', '初一', '初二', '初三'].join(','),
      ...teachers.map(t => [
        t.name,
        t.subjects.join(';'),
        t.weeklyHours?.morningStudy || 0,
        t.weeklyHours?.lunchBreak || 0,
        t.weeklyHours?.afterSchool || 0,
        t.weeklyHours?.mainClasses || 0,
        t.gradeAssignments?.grade0 ? '是' : '',
        t.gradeAssignments?.grade1 ? '是' : '',
        t.gradeAssignments?.grade2 ? '是' : '',
        t.gradeAssignments?.grade3 ? '是' : ''
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=teachers.csv');
    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({ error: '导出教师数据失败' });
  }
});

app.get('/api/subjects', (req: Request, res: Response) => {
  try {
    const subjects = SubjectDAO.getAll();
    res.json(subjects);
  } catch (error) {
    console.error('获取科目列表失败:', error);
    res.status(500).json({ error: '获取科目列表失败' });
  }
});

app.post('/api/subjects', (req: Request, res: Response) => {
  try {
    const subject: Subject = req.body;
    SubjectDAO.create(subject);
    res.json({ success: true, message: '科目创建成功' });
  } catch (error) {
    res.status(500).json({ error: '创建科目失败' });
  }
});

app.put('/api/subjects/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const subject: Subject = { ...req.body, id };
    SubjectDAO.update(subject);
    res.json({ success: true, message: '科目更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新科目失败' });
  }
});

app.delete('/api/subjects/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    SubjectDAO.delete(id);
    res.json({ success: true, message: '科目删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除科目失败' });
  }
});

app.get('/api/rooms', (req: Request, res: Response) => {
  try {
    const rooms = RoomDAO.getAll();
    res.json(rooms);
  } catch (error) {
    console.error('获取场地列表失败:', error);
    res.status(500).json({ error: '获取场地列表失败' });
  }
});

app.post('/api/rooms', (req: Request, res: Response) => {
  try {
    const room: Room = req.body;
    RoomDAO.create(room);
    res.json({ success: true, message: '场地创建成功' });
  } catch (error) {
    res.status(500).json({ error: '创建场地失败' });
  }
});

app.put('/api/rooms/:id', (req: Request, res: Response) => {
  try {
    const room: Room = { ...req.body, id: req.params.id };
    RoomDAO.update(room);
    res.json({ success: true, message: '场地更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新场地失败' });
  }
});

app.delete('/api/rooms/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    RoomDAO.delete(id);
    res.json({ success: true, message: '场地删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除场地失败' });
  }
});

app.get('/api/schedules', (req: Request, res: Response) => {
  try {
    const schedules = ScheduleDAO.getAll();
    res.json(schedules);
  } catch (error) {
    console.error('获取课表列表失败:', error);
    res.status(500).json({ error: '获取课表列表失败' });
  }
});

app.get('/api/schedules/:id/debug', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const schedule = ScheduleDAO.getById(id);
    if (!schedule) {
      return res.status(404).json({ error: '课表不存在' });
    }
    
    const subjects = SubjectDAO.getAll();
    const subjectMap = new Map(subjects.map(s => [s.id, s]));
    
    const itemsBySubject = new Map<string, any[]>();
    for (const item of schedule.items) {
      const subjectId = item.subjectId;
      if (!itemsBySubject.has(subjectId)) {
        itemsBySubject.set(subjectId, []);
      }
      itemsBySubject.get(subjectId)?.push(item);
    }
    
    const result: any[] = [];
    for (const [subjectId, items] of itemsBySubject.entries()) {
      const subject = subjectMap.get(subjectId);
      result.push({
        subjectId,
        subjectName: subject?.name || subjectId,
        count: items.length,
        items: items.map(i => ({
          classId: i.classId,
          dayOfWeek: i.timeSlot.dayOfWeek,
          period: i.timeSlot.period
        }))
      });
    }
    
    result.sort((a, b) => b.count - a.count);
    
    console.log('\n========== 课表调试信息 ==========');
    console.log('课表ID:', id);
    console.log('总课程数:', schedule.items.length);
    console.log('科目数:', result.length);
    console.log('\n各科目课程数:');
    result.forEach(r => {
      console.log(`  - ${r.subjectName}: ${r.count}节`);
    });
    console.log('====================================\n');
    
    res.json(result);
  } catch (error) {
    console.error('获取课表调试信息失败:', error);
    res.status(500).json({ error: '获取课表调试信息失败' });
  }
});

app.get('/api/schedules/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const schedule = ScheduleDAO.getById(id);
    if (!schedule) {
      return res.status(404).json({ error: '课表不存在' });
    }
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: '获取课表失败' });
  }
});

app.post('/api/schedules', (req: Request, res: Response) => {
  try {
    const { name, semester, items } = req.body;
    console.log('创建课表请求:', { name, semester, hasItems: !!items });
    
    if (items) {
      const now = new Date();
      const schedule = {
        id: `schedule_${Date.now()}`,
        name,
        semester,
        items,
        createdAt: now,
        updatedAt: now
      };
      console.log('使用提供的items创建课表');
      ScheduleDAO.create(schedule);
      res.json(schedule);
    } else {
      console.log('使用算法生成课表');
      const schedule = schedulingAlgorithm.generateSchedule(name, semester);
      console.log('课表生成成功，items数量:', schedule.items.length);
      ScheduleDAO.create(schedule);
      res.json(schedule);
    }
  } catch (error) {
    console.error('创建课表失败:', error);
    res.status(500).json({ error: '创建课表失败', details: (error as Error).message });
  }
});

app.delete('/api/schedules/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    ScheduleDAO.delete(id);
    res.json({ success: true, message: '课表删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除课表失败' });
  }
});

app.get('/api/schedules/:id/class/:classId', (req: Request, res: Response) => {
  try {
    const scheduleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
    const items = ScheduleDAO.getItemsByClass(scheduleId, classId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: '获取班级课表失败' });
  }
});

app.get('/api/schedules/:id/teacher/:teacherId', (req: Request, res: Response) => {
  try {
    const scheduleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const teacherId = Array.isArray(req.params.teacherId) ? req.params.teacherId[0] : req.params.teacherId;
    const items = ScheduleDAO.getItemsByTeacher(scheduleId, teacherId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: '获取教师课表失败' });
  }
});

app.get('/api/schedules/:id/room/:roomId', (req: Request, res: Response) => {
  try {
    const scheduleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const items = ScheduleDAO.getItemsByRoom(scheduleId, roomId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: '获取场地课表失败' });
  }
});

app.put('/api/schedules/:scheduleId/items/:itemId', (req: Request, res: Response) => {
  try {
    const item: ScheduleItem = req.body;
    const scheduleId = Array.isArray(req.params.scheduleId) ? req.params.scheduleId[0] : req.params.scheduleId;
    ScheduleDAO.updateItem(scheduleId, item);
    
    const schedule = ScheduleDAO.getById(scheduleId);
    let conflicts: any[] = [];
    
    if (schedule) {
      conflicts = validationEngine.validateSchedule(schedule);
      ScheduleDAO.clearConflictStatus(scheduleId);
      
      for (const conflict of conflicts) {
        for (const itemId of conflict.affectedItems) {
          ScheduleDAO.updateConflictStatus(
            scheduleId,
            itemId,
            conflict.severity,
            [conflict.description]
          );
        }
      }
    }
    
    res.json({ success: true, message: '课程更新成功', conflicts: conflicts || [] });
  } catch (error) {
    res.status(500).json({ error: '更新课程失败' });
  }
});

app.delete('/api/schedules/:scheduleId/items/:itemId', (req: Request, res: Response) => {
  try {
    const scheduleId = Array.isArray(req.params.scheduleId) ? req.params.scheduleId[0] : req.params.scheduleId;
    const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
    ScheduleDAO.deleteItem(scheduleId, itemId);
    res.json({ success: true, message: '课程删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除课程失败' });
  }
});

app.post('/api/schedules/:id/validate', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const schedule = ScheduleDAO.getById(id);
    if (!schedule) {
      return res.status(404).json({ error: '课表不存在' });
    }
    
    const conflicts = validationEngine.validateSchedule(schedule);
    res.json(conflicts);
  } catch (error) {
    res.status(500).json({ error: '验证课表失败' });
  }
});

app.post('/api/schedules/:id/health-report', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const schedule = ScheduleDAO.getById(id);
    if (!schedule) {
      return res.status(404).json({ error: '课表不存在' });
    }
    
    const report = validationEngine.generateHealthReport(schedule);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: '生成体检报告失败' });
  }
});

app.post('/api/schedules/:scheduleId/suggestions', (req: Request, res: Response) => {
  try {
    const scheduleId = Array.isArray(req.params.scheduleId) ? req.params.scheduleId[0] : req.params.scheduleId;
    const schedule = ScheduleDAO.getById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: '课表不存在' });
    }
    
    const { modifiedItem } = req.body;
    const suggestions = suggestionEngine.generateSuggestions(schedule, modifiedItem);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: '生成调整建议失败' });
  }
});

app.post('/api/schedules/:scheduleId/suggestions/:suggestionId/execute', (req: Request, res: Response) => {
  try {
    const scheduleId = Array.isArray(req.params.scheduleId) ? req.params.scheduleId[0] : req.params.scheduleId;
    const schedule = ScheduleDAO.getById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: '课表不存在' });
    }
    
    // 这里可以实现执行调整建议的逻辑
    res.json({ success: true, message: '调整建议执行成功' });
  } catch (error) {
    res.status(500).json({ error: '执行调整建议失败' });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});