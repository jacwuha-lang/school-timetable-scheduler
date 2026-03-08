import { Schedule, ScheduleItem, Class, Teacher, Subject, Room, TimeSlot } from '../types';
import { ClassDAO } from '../dao/ClassDAO';
import { TeacherDAO } from '../dao/TeacherDAO';
import { SubjectDAO } from '../dao/SubjectDAO';
import { RoomDAO } from '../dao/RoomDAO';

// 排课算法服务
export class SchedulingAlgorithm {
  // 生成课表
  generateSchedule(name: string, semester: string): Schedule {
    console.log('开始生成课表:', name, semester);
    
    // 获取所有数据
    const classes = ClassDAO.getAll();
    const teachers = TeacherDAO.getAll();
    const subjects = SubjectDAO.getAll();
    const rooms = RoomDAO.getAvailable();
    
    console.log('数据加载完成:', {
      classes: classes.length,
      teachers: teachers.length,
      subjects: subjects.length,
      rooms: rooms.length
    });
    
    if (classes.length === 0 || teachers.length === 0 || subjects.length === 0 || rooms.length === 0) {
      throw new Error('数据不足，无法生成课表');
    }
    
    // 生成课程安排
    const items: ScheduleItem[] = [];
    
    // 为每个班级生成课程
    for (const cls of classes) {
      console.log(`为班级 ${cls.name} 生成课程`);
      
      // 为每个科目生成课程
      for (const subject of subjects) {
        // 根据年级获取科目课时
        const weeklyHours = subject.gradeHours[cls.grade] || subject.weeklyHours;
        if (weeklyHours <= 0) continue;
        
        console.log(`  科目 ${subject.name}: ${weeklyHours} 课时/周`);
        
        // 生成指定数量的课程
        for (let i = 0; i < weeklyHours; i++) {
          const item = this.createScheduleItem(cls, subject, teachers, rooms, items);
          if (item) {
            items.push(item);
          }
        }
      }
    }
    
    console.log('课程安排生成完成，共', items.length, '节课程');
    
    // 创建课表
    const schedule: Schedule = {
      id: `schedule_${Date.now()}`,
      name,
      semester,
      items,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return schedule;
  }
  
  // 创建课程安排
  private createScheduleItem(
    cls: Class,
    subject: Subject,
    teachers: Teacher[],
    rooms: Room[],
    existingItems: ScheduleItem[]
  ): ScheduleItem | null {
    // 过滤可教授该科目的教师
    const eligibleTeachers = teachers.filter(teacher => 
      teacher.subjects.includes(subject.id) && 
      teacher.gradeAssignments[`grade${cls.grade}`]
    );
    
    if (eligibleTeachers.length === 0) {
      console.warn(`没有可教授 ${subject.name} 的教师`);
      return null;
    }
    
    // 过滤适合该科目和班级的场地
    const eligibleRooms = rooms.filter(room => {
      if (subject.requiresLab && room.type !== 'lab') return false;
      if (subject.requiresSpecialRoom && !['lab', 'music', 'art', 'gym'].includes(room.type)) return false;
      if (room.capacity < cls.studentCount) return false;
      return true;
    });
    
    if (eligibleRooms.length === 0) {
      console.warn(`没有适合 ${subject.name} 的场地`);
      return null;
    }
    
    // 尝试找到合适的时间槽
    const timeSlot = this.findAvailableTimeSlot(cls, subject, eligibleTeachers[0], eligibleRooms[0], existingItems);
    if (!timeSlot) {
      console.warn(`没有可用的时间槽`);
      return null;
    }
    
    // 创建课程安排
    const item: ScheduleItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scheduleId: '', // 稍后会设置
      classId: cls.id,
      subjectId: subject.id,
      teacherId: eligibleTeachers[0].id,
      roomId: eligibleRooms[0].id,
      timeSlot,
      duration: 1,
      isLocked: false
    };
    
    return item;
  }
  
  // 找到可用的时间槽
  private findAvailableTimeSlot(
    cls: Class,
    subject: Subject,
    teacher: Teacher,
    room: Room,
    existingItems: ScheduleItem[]
  ): TimeSlot | null {
    // 尝试所有可能的时间槽
    for (let dayOfWeek = 0; dayOfWeek < 5; dayOfWeek++) { // 周一到周五
      for (let period = 1; period <= 8; period++) { // 1-8节课
        const timeSlot: TimeSlot = { dayOfWeek, period };
        
        // 检查是否与现有课程冲突
        const isConflict = existingItems.some(item => {
          // 班级时间冲突
          if (item.classId === cls.id && 
              item.timeSlot.dayOfWeek === dayOfWeek && 
              item.timeSlot.period === period) {
            return true;
          }
          
          // 教师时间冲突
          if (item.teacherId === teacher.id && 
              item.timeSlot.dayOfWeek === dayOfWeek && 
              item.timeSlot.period === period) {
            return true;
          }
          
          // 场地时间冲突
          if (item.roomId === room.id && 
              item.timeSlot.dayOfWeek === dayOfWeek && 
              item.timeSlot.period === period) {
            return true;
          }
          
          return false;
        });
        
        // 检查教师是否在该时段不可用
        const isTeacherUnavailable = teacher.unavailableTimeSlots.some(slot => 
          slot.dayOfWeek === dayOfWeek && slot.period === period
        );
        
        if (!isConflict && !isTeacherUnavailable) {
          return timeSlot;
        }
      }
    }
    
    return null;
  }
}