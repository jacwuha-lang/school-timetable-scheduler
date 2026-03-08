// 类型定义

export interface Class {
  id: string;
  name: string;
  grade: number; // 0: 预初, 1: 初一, 2: 初二, 3: 初三
  studentCount: number;
  homeroomTeacherId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Teacher {
  id: string;
  name: string;
  subjects: string[]; // 教授科目ID
  weeklyHours: {
    morningStudy: number; // 早自习课时
    lunchBreak: number; // 午休课时
    afterSchool: number; // 课后服务课时
    mainClasses: number; // 主要课时
  };
  gradeAssignments: {
    grade0: boolean; // 预初
    grade1: boolean; // 初一
    grade2: boolean; // 初二
    grade3: boolean; // 初三
  };
  maxConsecutivePeriods: number; // 最大连续课时
  preferredTimeOfDay: 'morning' | 'afternoon' | 'any'; // 偏好时间段
  preferredTimeSlots?: { dayOfWeek: number; period: number }[];
  unavailableTimeSlots: { dayOfWeek: number; period: number }[];
  flexibilityScore: number; // 灵活性评分 1-10
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Subject {
  id: string;
  name: string;
  shortName: string;
  weeklyHours: number; // 周课时
  minWeeklyHours: number; // 最小周课时
  maxWeeklyHours: number; // 最大周课时
  requiresLab: boolean; // 是否需要实验室
  requiresSpecialRoom: boolean; // 是否需要专用教室
  requiresPublicRoom: boolean; // 是否需要公共教室
  maxConsecutivePeriods: number; // 最大连续课时
  requireSameProgress: boolean; // 是否需要相同进度
  preferredTimeSlots: { dayOfWeek: number; period: number }[];
  avoidTimeSlots: { dayOfWeek: number; period: number }[];
  gradeConfig: {
    [grade: number]: {
      weeklyHours: number;
      minWeeklyHours: number;
      maxWeeklyHours: number;
      dailyConfig: {
        [day: number]: {
          minPeriods: number;
          maxPeriods: number;
        };
      };
    };
  };
  gradeHours: {
    [grade: number]: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Room {
  id: string;
  name: string;
  type: 'classroom' | 'lab' | 'gym' | 'music' | 'art' | 'other';
  capacity: number;
  available: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TimeSlot {
  dayOfWeek: number; // 0-6, 0表示周一
  period: number; // 1-8, 表示第几节课
}

export interface ScheduleItem {
  id: string;
  scheduleId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  roomId: string;
  timeSlot: TimeSlot;
  duration: number; // 课时长度
  isLocked: boolean; // 是否锁定
  conflictStatus?: {
    severity: 'error' | 'warning' | 'info';
    messages: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Schedule {
  id: string;
  name: string;
  semester: string;
  items: ScheduleItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SchoolConfig {
  id?: string;
  name: string;
  address: string;
  phone: string;
  principal: string;
  academicYear: string;
  semester: string;
  classTimeConfig?: {
    morningStudy?: {
      start: string;
      end: string;
    };
    periods: {
      [period: number]: {
        start: string;
        end: string;
      };
    };
    lunchBreak?: {
      start: string;
      end: string;
    };
    afterSchool?: {
      start: string;
      end: string;
    };
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Conflict {
  id: string;
  type: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
  affectedItems: string[];
  details?: any;
}

export interface HealthReport {
  overallScore: number;
  totalConflicts: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  conflicts: Conflict[];
  statistics: {
    teacherWorkload: {
      [teacherId: string]: {
        totalHours: number;
        classes: number;
        maxConsecutive: number;
      };
    };
    subjectCompliance: {
      [subjectId: string]: {
        totalClasses: number;
        compliantCount: number;
        nonCompliantCount: number;
      };
    };
    roomUsage: {
      [roomId: string]: {
        usageCount: number;
        capacityUtilization: number;
      };
    };
    classBalance: {
      [classId: string]: {
        dailyDistribution: number[];
        mainSubjectBalance: number;
      };
    };
  };
  suggestions: string[];
  generatedAt: Date;
}

export interface Suggestion {
  id: string;
  type: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number; // 1-10
  implementationSteps: string[];
  affectedItems: string[];
  beforeState?: any;
  afterState?: any;
}
