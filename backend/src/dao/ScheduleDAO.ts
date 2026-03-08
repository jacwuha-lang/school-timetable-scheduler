import { Schedule, ScheduleItem } from '../types';
import { db } from '../database';

// 课表数据访问对象
export class ScheduleDAO {
  // 获取所有课表
  static getAll(): Schedule[] {
    const stmt = db.prepare('SELECT * FROM schedules ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      semester: row.semester,
      items: this.getItemsBySchedule(row.id),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  // 根据ID获取课表
  static getById(id: string): Schedule | null {
    const stmt = db.prepare('SELECT * FROM schedules WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) {
      return null;
    }
    
    return {
      id: row.id,
      name: row.name,
      semester: row.semester,
      items: this.getItemsBySchedule(row.id),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // 创建课表
  static create(schedule: Schedule): void {
    const stmt = db.prepare(`
      INSERT INTO schedules (id, name, semester, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      schedule.id,
      schedule.name,
      schedule.semester,
      schedule.createdAt.toISOString(),
      schedule.updatedAt.toISOString()
    );

    // 插入课程安排
    for (const item of schedule.items) {
      this.createItem(item);
    }
  }

  // 更新课表
  static update(schedule: Schedule): void {
    const stmt = db.prepare(`
      UPDATE schedules
      SET name = ?, semester = ?, updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(
      schedule.name,
      schedule.semester,
      schedule.updatedAt.toISOString(),
      schedule.id
    );
  }

  // 删除课表
  static delete(id: string): void {
    const stmt = db.prepare('DELETE FROM schedules WHERE id = ?');
    stmt.run(id);
  }

  // 获取课表的课程安排
  static getItemsBySchedule(scheduleId: string): ScheduleItem[] {
    const stmt = db.prepare('SELECT * FROM schedule_items WHERE schedule_id = ?');
    const rows = stmt.all(scheduleId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      scheduleId: row.schedule_id,
      classId: row.class_id,
      subjectId: row.subject_id,
      teacherId: row.teacher_id,
      roomId: row.room_id,
      timeSlot: JSON.parse(row.time_slot),
      duration: row.duration,
      isLocked: row.is_locked,
      conflictStatus: row.conflict_status ? JSON.parse(row.conflict_status) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }));
  }

  // 根据班级获取课程安排
  static getItemsByClass(scheduleId: string, classId: string): ScheduleItem[] {
    const stmt = db.prepare('SELECT * FROM schedule_items WHERE schedule_id = ? AND class_id = ?');
    const rows = stmt.all(scheduleId, classId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      scheduleId: row.schedule_id,
      classId: row.class_id,
      subjectId: row.subject_id,
      teacherId: row.teacher_id,
      roomId: row.room_id,
      timeSlot: JSON.parse(row.time_slot),
      duration: row.duration,
      isLocked: row.is_locked,
      conflictStatus: row.conflict_status ? JSON.parse(row.conflict_status) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }));
  }

  // 根据教师获取课程安排
  static getItemsByTeacher(scheduleId: string, teacherId: string): ScheduleItem[] {
    const stmt = db.prepare('SELECT * FROM schedule_items WHERE schedule_id = ? AND teacher_id = ?');
    const rows = stmt.all(scheduleId, teacherId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      scheduleId: row.schedule_id,
      classId: row.class_id,
      subjectId: row.subject_id,
      teacherId: row.teacher_id,
      roomId: row.room_id,
      timeSlot: JSON.parse(row.time_slot),
      duration: row.duration,
      isLocked: row.is_locked,
      conflictStatus: row.conflict_status ? JSON.parse(row.conflict_status) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }));
  }

  // 根据场地获取课程安排
  static getItemsByRoom(scheduleId: string, roomId: string): ScheduleItem[] {
    const stmt = db.prepare('SELECT * FROM schedule_items WHERE schedule_id = ? AND room_id = ?');
    const rows = stmt.all(scheduleId, roomId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      scheduleId: row.schedule_id,
      classId: row.class_id,
      subjectId: row.subject_id,
      teacherId: row.teacher_id,
      roomId: row.room_id,
      timeSlot: JSON.parse(row.time_slot),
      duration: row.duration,
      isLocked: row.is_locked,
      conflictStatus: row.conflict_status ? JSON.parse(row.conflict_status) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }));
  }

  // 创建课程安排
  static createItem(item: ScheduleItem): void {
    const stmt = db.prepare(`
      INSERT INTO schedule_items (
        id, schedule_id, class_id, subject_id, teacher_id, room_id, 
        time_slot, duration, is_locked, conflict_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date();
    stmt.run(
      item.id,
      item.scheduleId,
      item.classId,
      item.subjectId,
      item.teacherId,
      item.roomId,
      JSON.stringify(item.timeSlot),
      item.duration,
      item.isLocked,
      item.conflictStatus ? JSON.stringify(item.conflictStatus) : null,
      now.toISOString(),
      now.toISOString()
    );
  }

  // 更新课程安排
  static updateItem(scheduleId: string, item: ScheduleItem): void {
    const stmt = db.prepare(`
      UPDATE schedule_items
      SET class_id = ?, subject_id = ?, teacher_id = ?, room_id = ?, 
          time_slot = ?, duration = ?, is_locked = ?, conflict_status = ?, updated_at = ?
      WHERE id = ? AND schedule_id = ?
    `);
    
    const now = new Date();
    stmt.run(
      item.classId,
      item.subjectId,
      item.teacherId,
      item.roomId,
      JSON.stringify(item.timeSlot),
      item.duration,
      item.isLocked,
      item.conflictStatus ? JSON.stringify(item.conflictStatus) : null,
      now.toISOString(),
      item.id,
      scheduleId
    );
  }

  // 删除课程安排
  static deleteItem(scheduleId: string, itemId: string): void {
    const stmt = db.prepare('DELETE FROM schedule_items WHERE id = ? AND schedule_id = ?');
    stmt.run(itemId, scheduleId);
  }

  // 更新冲突状态
  static updateConflictStatus(scheduleId: string, itemId: string, severity: 'error' | 'warning' | 'info', messages: string[]): void {
    const stmt = db.prepare(`
      UPDATE schedule_items
      SET conflict_status = ?
      WHERE id = ? AND schedule_id = ?
    `);
    
    const conflictStatus = {
      severity,
      messages
    };
    
    stmt.run(JSON.stringify(conflictStatus), itemId, scheduleId);
  }

  // 清除冲突状态
  static clearConflictStatus(scheduleId: string): void {
    const stmt = db.prepare('UPDATE schedule_items SET conflict_status = NULL WHERE schedule_id = ?');
    stmt.run(scheduleId);
  }

  // 检查课表名称是否存在
  static existsByName(name: string): boolean {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM schedules WHERE name = ?');
    const result = stmt.get(name) as any;
    return result.count > 0;
  }

  // 获取课表数量
  static getCount(): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM schedules');
    const result = stmt.get() as any;
    return result.count;
  }
}