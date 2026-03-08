import { Schedule, ScheduleItem, Conflict, HealthReport, Teacher, Class, Subject, Room } from '../types';
import { TeacherDAO } from '../dao/TeacherDAO';
import { ClassDAO } from '../dao/ClassDAO';
import { SubjectDAO } from '../dao/SubjectDAO';
import { RoomDAO } from '../dao/RoomDAO';

// 验证引擎服务
export class ValidationEngine {
  // 验证课表
  validateSchedule(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    
    // 获取相关数据
    const teachers = TeacherDAO.getAll();
    const classes = ClassDAO.getAll();
    const subjects = SubjectDAO.getAll();
    const rooms = RoomDAO.getAll();
    
    // 转换为映射以提高查询效率
    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    const classMap = new Map(classes.map(c => [c.id, c]));
    const subjectMap = new Map(subjects.map(s => [s.id, s]));
    const roomMap = new Map(rooms.map(r => [r.id, r]));
    
    // 检查教师时间冲突
    const teacherTimeSlots = new Map<string, Set<string>>();
    schedule.items.forEach(item => {
      const teacherId = item.teacherId;
      const timeKey = `${item.timeSlot.dayOfWeek}-${item.timeSlot.period}`;
      
      if (!teacherTimeSlots.has(teacherId)) {
        teacherTimeSlots.set(teacherId, new Set());
      }
      
      if (teacherTimeSlots.get(teacherId)?.has(timeKey)) {
        conflicts.push({
          id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'teacher_time_conflict',
          severity: 'error',
          description: `教师 ${teacherMap.get(teacherId)?.name} 在 ${this.getTimeSlotString(item.timeSlot)} 时间段有冲突`,
          affectedItems: [item.id]
        });
      } else {
        teacherTimeSlots.get(teacherId)?.add(timeKey);
      }
    });
    
    // 检查班级时间冲突
    const classTimeSlots = new Map<string, Set<string>>();
    schedule.items.forEach(item => {
      const classId = item.classId;
      const timeKey = `${item.timeSlot.dayOfWeek}-${item.timeSlot.period}`;
      
      if (!classTimeSlots.has(classId)) {
        classTimeSlots.set(classId, new Set());
      }
      
      if (classTimeSlots.get(classId)?.has(timeKey)) {
        conflicts.push({
          id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'class_time_conflict',
          severity: 'error',
          description: `班级 ${classMap.get(classId)?.name} 在 ${this.getTimeSlotString(item.timeSlot)} 时间段有冲突`,
          affectedItems: [item.id]
        });
      } else {
        classTimeSlots.get(classId)?.add(timeKey);
      }
    });
    
    // 检查场地时间冲突
    const roomTimeSlots = new Map<string, Set<string>>();
    schedule.items.forEach(item => {
      const roomId = item.roomId;
      const timeKey = `${item.timeSlot.dayOfWeek}-${item.timeSlot.period}`;
      
      if (!roomTimeSlots.has(roomId)) {
        roomTimeSlots.set(roomId, new Set());
      }
      
      if (roomTimeSlots.get(roomId)?.has(timeKey)) {
        conflicts.push({
          id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'room_time_conflict',
          severity: 'error',
          description: `场地 ${roomMap.get(roomId)?.name} 在 ${this.getTimeSlotString(item.timeSlot)} 时间段有冲突`,
          affectedItems: [item.id]
        });
      } else {
        roomTimeSlots.get(roomId)?.add(timeKey);
      }
    });
    
    // 检查课时定额合规
    const classSubjectHours = new Map<string, Map<string, number>>();
    schedule.items.forEach(item => {
      const key = `${item.classId}-${item.subjectId}`;
      const [classId, subjectId] = key.split('-');
      
      if (!classSubjectHours.has(classId)) {
        classSubjectHours.set(classId, new Map());
      }
      
      const subjectMap = classSubjectHours.get(classId)!;
      const currentHours = subjectMap.get(subjectId) || 0;
      subjectMap.set(subjectId, currentHours + item.duration);
    });
    
    classSubjectHours.forEach((subjectHours, classId) => {
      const cls = classMap.get(classId);
      if (!cls) return;
      
      subjectHours.forEach((hours, subjectId) => {
        const subject = subjectMap.get(subjectId);
        if (!subject) return;
        
        const gradeHours = subject.gradeHours[cls.grade] || subject.weeklyHours;
        const minHours = subject.minWeeklyHours;
        const maxHours = subject.maxWeeklyHours;
        
        if (hours < minHours) {
          conflicts.push({
            id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'subject_hours_insufficient',
            severity: 'error',
            description: `班级 ${cls.name} 的 ${subject.name} 课时不足，当前 ${hours} 节，最少需要 ${minHours} 节`,
            affectedItems: schedule.items
              .filter(item => item.classId === classId && item.subjectId === subjectId)
              .map(item => item.id)
          });
        } else if (hours > maxHours) {
          conflicts.push({
            id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'subject_hours_excessive',
            severity: 'error',
            description: `班级 ${cls.name} 的 ${subject.name} 课时过多，当前 ${hours} 节，最多允许 ${maxHours} 节`,
            affectedItems: schedule.items
              .filter(item => item.classId === classId && item.subjectId === subjectId)
              .map(item => item.id)
          });
        }
      });
    });
    
    // 检查教师工作量
    const teacherWorkload = new Map<string, number>();
    schedule.items.forEach(item => {
      const teacherId = item.teacherId;
      const currentWorkload = teacherWorkload.get(teacherId) || 0;
      teacherWorkload.set(teacherId, currentWorkload + item.duration);
    });
    
    teacherWorkload.forEach((workload, teacherId) => {
      const teacher = teacherMap.get(teacherId);
      if (!teacher) return;
      
      const maxWorkload = teacher.weeklyHours.mainClasses;
      if (workload > maxWorkload) {
        conflicts.push({
          id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'teacher_workload_excessive',
          severity: 'warning',
          description: `教师 ${teacher.name} 工作量过多，当前 ${workload} 节，最多允许 ${maxWorkload} 节`,
          affectedItems: schedule.items
            .filter(item => item.teacherId === teacherId)
            .map(item => item.id)
        });
      }
    });
    
    return conflicts;
  }
  
  // 生成体检报告
  generateHealthReport(schedule: Schedule): HealthReport {
    const conflicts = this.validateSchedule(schedule);
    
    // 统计冲突
    const errorCount = conflicts.filter(c => c.severity === 'error').length;
    const warningCount = conflicts.filter(c => c.severity === 'warning').length;
    const infoCount = conflicts.filter(c => c.severity === 'info').length;
    
    // 计算总体评分
    const totalConflicts = conflicts.length;
    const maxScore = 100;
    const scoreDeduction = totalConflicts * 5;
    const overallScore = Math.max(0, maxScore - scoreDeduction);
    
    // 生成统计信息
    const statistics = this.generateStatistics(schedule);
    
    // 生成建议
    const suggestions = this.generateSuggestions(conflicts, schedule);
    
    return {
      overallScore,
      totalConflicts,
      errorCount,
      warningCount,
      infoCount,
      conflicts,
      statistics,
      suggestions,
      generatedAt: new Date()
    };
  }
  
  // 生成统计信息
  private generateStatistics(schedule: Schedule) {
    // 教师工作量统计
    const teacherWorkload = new Map<string, { totalHours: number; classes: number; maxConsecutive: number }>();
    
    // 科目合规性统计
    const subjectCompliance = new Map<string, { totalClasses: number; compliantCount: number; nonCompliantCount: number }>();
    
    // 场地使用统计
    const roomUsage = new Map<string, { usageCount: number; capacityUtilization: number }>();
    
    // 班级均衡性统计
    const classBalance = new Map<string, { dailyDistribution: number[]; mainSubjectBalance: number }>();
    
    // 初始化统计数据
    schedule.items.forEach(item => {
      // 教师工作量
      if (!teacherWorkload.has(item.teacherId)) {
        teacherWorkload.set(item.teacherId, { totalHours: 0, classes: 0, maxConsecutive: 0 });
      }
      const teacherStats = teacherWorkload.get(item.teacherId)!;
      teacherStats.totalHours += item.duration;
      teacherStats.classes++;
      
      // 科目合规性
      if (!subjectCompliance.has(item.subjectId)) {
        subjectCompliance.set(item.subjectId, { totalClasses: 0, compliantCount: 0, nonCompliantCount: 0 });
      }
      const subjectStats = subjectCompliance.get(item.subjectId)!;
      subjectStats.totalClasses++;
      
      // 场地使用
      if (!roomUsage.has(item.roomId)) {
        roomUsage.set(item.roomId, { usageCount: 0, capacityUtilization: 0 });
      }
      const roomStats = roomUsage.get(item.roomId)!;
      roomStats.usageCount++;
      
      // 班级均衡性
      if (!classBalance.has(item.classId)) {
        classBalance.set(item.classId, { dailyDistribution: [0, 0, 0, 0, 0], mainSubjectBalance: 0 });
      }
      const classStats = classBalance.get(item.classId)!;
      classStats.dailyDistribution[item.timeSlot.dayOfWeek]++;
    });
    
    return {
      teacherWorkload: Object.fromEntries(teacherWorkload),
      subjectCompliance: Object.fromEntries(subjectCompliance),
      roomUsage: Object.fromEntries(roomUsage),
      classBalance: Object.fromEntries(classBalance)
    };
  }
  
  // 生成建议
  private generateSuggestions(conflicts: Conflict[], schedule: Schedule): string[] {
    const suggestions: string[] = [];
    
    if (conflicts.length === 0) {
      suggestions.push('课表验证通过，未发现冲突');
    } else {
      suggestions.push(`发现 ${conflicts.length} 个冲突，其中 ${conflicts.filter(c => c.severity === 'error').length} 个错误，${conflicts.filter(c => c.severity === 'warning').length} 个警告`);
    }
    
    // 根据冲突类型生成具体建议
    const errorConflicts = conflicts.filter(c => c.severity === 'error');
    if (errorConflicts.length > 0) {
      suggestions.push('请优先解决所有错误级别的冲突，特别是时间冲突和课时定额问题');
    }
    
    const warningConflicts = conflicts.filter(c => c.severity === 'warning');
    if (warningConflicts.length > 0) {
      suggestions.push('建议优化警告级别的问题，如教师工作量和科目时段偏好');
    }
    
    return suggestions;
  }
  
  // 获取时间段字符串
  private getTimeSlotString(timeSlot: { dayOfWeek: number; period: number }): string {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return `${days[timeSlot.dayOfWeek]}第${timeSlot.period}节`;
  }
}