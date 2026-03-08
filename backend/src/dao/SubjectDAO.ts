import { Subject } from '../types';
import { db } from '../database';

// 科目数据访问对象
export class SubjectDAO {
  // 获取所有科目
  static getAll(): Subject[] {
    const stmt = db.prepare('SELECT * FROM subjects ORDER BY name');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      shortName: row.short_name,
      weeklyHours: row.weekly_hours,
      minWeeklyHours: row.min_weekly_hours,
      maxWeeklyHours: row.max_weekly_hours,
      requiresLab: row.requires_lab,
      requiresSpecialRoom: row.requires_special_room,
      requiresPublicRoom: row.requires_public_room,
      maxConsecutivePeriods: row.max_consecutive_periods,
      requireSameProgress: row.require_same_progress,
      preferredTimeSlots: row.preferred_time_slots ? JSON.parse(row.preferred_time_slots) : [],
      avoidTimeSlots: row.avoid_time_slots ? JSON.parse(row.avoid_time_slots) : [],
      gradeConfig: JSON.parse(row.grade_config),
      gradeHours: JSON.parse(row.grade_hours),
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }));
  }

  // 根据ID获取科目
  static getById(id: string): Subject | null {
    const stmt = db.prepare('SELECT * FROM subjects WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) {
      return null;
    }
    
    return {
      id: row.id,
      name: row.name,
      shortName: row.short_name,
      weeklyHours: row.weekly_hours,
      minWeeklyHours: row.min_weekly_hours,
      maxWeeklyHours: row.max_weekly_hours,
      requiresLab: row.requires_lab,
      requiresSpecialRoom: row.requires_special_room,
      requiresPublicRoom: row.requires_public_room,
      maxConsecutivePeriods: row.max_consecutive_periods,
      requireSameProgress: row.require_same_progress,
      preferredTimeSlots: row.preferred_time_slots ? JSON.parse(row.preferred_time_slots) : [],
      avoidTimeSlots: row.avoid_time_slots ? JSON.parse(row.avoid_time_slots) : [],
      gradeConfig: JSON.parse(row.grade_config),
      gradeHours: JSON.parse(row.grade_hours),
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  // 创建科目
  static create(subject: Subject): void {
    const stmt = db.prepare(`
      INSERT INTO subjects (
        id, name, short_name, weekly_hours, min_weekly_hours, max_weekly_hours, 
        requires_lab, requires_special_room, requires_public_room, 
        max_consecutive_periods, require_same_progress, 
        preferred_time_slots, avoid_time_slots, 
        grade_config, grade_hours, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date();
    stmt.run(
      subject.id,
      subject.name,
      subject.shortName,
      subject.weeklyHours,
      subject.minWeeklyHours,
      subject.maxWeeklyHours,
      subject.requiresLab,
      subject.requiresSpecialRoom,
      subject.requiresPublicRoom,
      subject.maxConsecutivePeriods,
      subject.requireSameProgress,
      subject.preferredTimeSlots ? JSON.stringify(subject.preferredTimeSlots) : null,
      subject.avoidTimeSlots ? JSON.stringify(subject.avoidTimeSlots) : null,
      JSON.stringify(subject.gradeConfig),
      JSON.stringify(subject.gradeHours),
      now.toISOString(),
      now.toISOString()
    );
  }

  // 更新科目
  static update(subject: Subject): void {
    const stmt = db.prepare(`
      UPDATE subjects
      SET name = ?, short_name = ?, weekly_hours = ?, min_weekly_hours = ?, max_weekly_hours = ?, 
          requires_lab = ?, requires_special_room = ?, requires_public_room = ?, 
          max_consecutive_periods = ?, require_same_progress = ?, 
          preferred_time_slots = ?, avoid_time_slots = ?, 
          grade_config = ?, grade_hours = ?, 
          updated_at = ?
      WHERE id = ?
    `);
    
    const now = new Date();
    stmt.run(
      subject.name,
      subject.shortName,
      subject.weeklyHours,
      subject.minWeeklyHours,
      subject.maxWeeklyHours,
      subject.requiresLab,
      subject.requiresSpecialRoom,
      subject.requiresPublicRoom,
      subject.maxConsecutivePeriods,
      subject.requireSameProgress,
      subject.preferredTimeSlots ? JSON.stringify(subject.preferredTimeSlots) : null,
      subject.avoidTimeSlots ? JSON.stringify(subject.avoidTimeSlots) : null,
      JSON.stringify(subject.gradeConfig),
      JSON.stringify(subject.gradeHours),
      now.toISOString(),
      subject.id
    );
  }

  // 删除科目
  static delete(id: string): void {
    const stmt = db.prepare('DELETE FROM subjects WHERE id = ?');
    stmt.run(id);
  }

  // 根据是否需要实验室获取科目
  static getByLabRequirement(requiresLab: boolean): Subject[] {
    const stmt = db.prepare('SELECT * FROM subjects WHERE requires_lab = ? ORDER BY name');
    const rows = stmt.all(requiresLab) as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      shortName: row.short_name,
      weeklyHours: row.weekly_hours,
      minWeeklyHours: row.min_weekly_hours,
      maxWeeklyHours: row.max_weekly_hours,
      requiresLab: row.requires_lab,
      requiresSpecialRoom: row.requires_special_room,
      requiresPublicRoom: row.requires_public_room,
      maxConsecutivePeriods: row.max_consecutive_periods,
      requireSameProgress: row.require_same_progress,
      preferredTimeSlots: row.preferred_time_slots ? JSON.parse(row.preferred_time_slots) : [],
      avoidTimeSlots: row.avoid_time_slots ? JSON.parse(row.avoid_time_slots) : [],
      gradeConfig: JSON.parse(row.grade_config),
      gradeHours: JSON.parse(row.grade_hours),
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }));
  }

  // 检查科目名称是否存在
  static existsByName(name: string): boolean {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM subjects WHERE name = ?');
    const result = stmt.get(name) as any;
    return result.count > 0;
  }

  // 获取科目数量
  static getCount(): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM subjects');
    const result = stmt.get() as any;
    return result.count;
  }
}