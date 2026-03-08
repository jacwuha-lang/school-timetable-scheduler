// 类型定义
export interface Class {
  id: string;
  name: string;
  grade: number;
  studentCount: number;
}

export interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  weeklyHours: {
    morningStudy: number;
    lunchBreak: number;
    afterSchool: number;
    mainClasses: number;
  };
  gradeAssignments: {
    grade0: boolean;
    grade1: boolean;
    grade2: boolean;
    grade3: boolean;
  };
  maxConsecutivePeriods: number;
  preferredTimeOfDay: 'morning' | 'afternoon' | 'any';
  preferredTimeSlots: TimeSlot[];
  unavailableTimeSlots: TimeSlot[];
  flexibilityScore: number;
}

export interface Subject {
  id: string;
  name: string;
  shortName: string;
  weeklyHours: number;
  minWeeklyHours: number;
  maxWeeklyHours: number;
  requiresLab: boolean;
  requiresSpecialRoom: boolean;
  requiresPublicRoom: boolean;
  maxConsecutivePeriods: number;
  requireSameProgress: boolean;
  preferredTimeSlots: TimeSlot[];
  avoidTimeSlots: TimeSlot[];
  gradeHours: Record<number, number>;
  gradeConfig: Record<number, {
    weeklyHours: number;
    minWeeklyHours: number;
    maxWeeklyHours: number;
    dailyConfig: Record<number, {
      minPeriods: number;
      maxPeriods: number;
    }>;
  }>;
}

export interface Room {
  id: string;
  name: string;
  type: 'classroom' | 'lab' | 'gym' | 'music' | 'art' | 'other';
  capacity: number;
  available: boolean;
}

export interface TimeSlot {
  dayOfWeek: number;
  period: number;
}

export interface ScheduleItem {
  id: string;
  scheduleId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  roomId: string;
  timeSlot: TimeSlot;
  duration: number;
  isLocked: boolean;
  conflictStatus?: {
    severity: 'error' | 'warning' | 'info' | null;
    messages: string[];
  };
}

export interface Schedule {
  id: string;
  name: string;
  semester: string;
  items: ScheduleItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Conflict {
  id: string;
  type: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
  affectedItems: string[];
}

export interface HealthReport {
  overallScore: number;
  totalConflicts: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  conflicts: Conflict[];
  statistics: {
    teacherWorkload: Record<string, {
      totalHours: number;
      classes: number;
      maxConsecutive: number;
    }>;
    subjectCompliance: Record<string, {
      totalClasses: number;
      compliantCount: number;
      nonCompliantCount: number;
    }>;
    roomUsage: Record<string, {
      usageCount: number;
      capacityUtilization: number;
    }>;
    classBalance: Record<string, {
      dailyDistribution: number[];
      mainSubjectBalance: number;
    }>;
  };
  suggestions: string[];
  generatedAt: Date;
}

export interface Suggestion {
  id: string;
  type: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number;
  implementationSteps: string[];
  affectedItems: string[];
  beforeState: any;
  afterState: any;
}

export interface SchoolConfig {
  id: string;
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
      start: string;
      end: string;
    }[];
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

export interface ErrorResponse {
  error: string;
  details?: any;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
  data?: any;
}