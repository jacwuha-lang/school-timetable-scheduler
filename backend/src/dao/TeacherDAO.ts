import { Teacher } from '../types';
import { db } from '../database';

// 教师数据访问对象
export class TeacherDAO {
  // 获取所有教师
  static getAll(): Teacher[] {
    const stmt = db.prepare('SELECT * FROM teachers ORDER BY name');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      subjects: JSON.parse(row.subjects),
      weeklyHours: JSON.parse(row.weekly_hours),
      gradeAssignments: JSON.parse(row.grade_assignments),
      maxConsecutivePeriods: row.max_consecutive_periods,
      preferredTimeOfDay: row.preferred_time_of_day as 'morning' | 'afternoon' | 'any',
      preferredTimeSlots: row.preferred_time_slots ? JSON.parse(row.preferred_time_slots) : [],
      unavailableTimeSlots: JSON.parse(row.unavailable_time_slots),
      flexibilityScore: row.flexibility_score,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }));
  }

  // 根据ID获取教师
  static getById(id: string): Teacher | null {
    const stmt = db.prepare('SELECT * FROM teachers WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) {
      return null;
    }
    
    return {
      id: row.id,
      name: row.name,
      subjects: JSON.parse(row.subjects),
      weeklyHours: JSON.parse(row.weekly_hours),
      gradeAssignments: JSON.parse(row.grade_assignments),
      maxConsecutivePeriods: row.max_consecutive_periods,
      preferredTimeOfDay: row.preferred_time_of_day as 'morning' | 'afternoon' | 'any',
      preferredTimeSlots: row.preferred_time_slots ? JSON.parse(row.preferred_time_slots) : [],
      unavailableTimeSlots: JSON.parse(row.unavailable_time_slots),
      flexibilityScore: row.flexibility_score,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  // 创建教师
  static create(teacher: Teacher): void {
    const stmt = db.prepare(`
      INSERT INTO teachers (
        id, name, subjects, weekly_hours, grade_assignments, 
        max_consecutive_periods, preferred_time_of_day, preferred_time_slots, 
        unavailable_time_slots, flexibility_score, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date();
    stmt.run(
      teacher.id,
      teacher.name,
      JSON.stringify(teacher.subjects),
      JSON.stringify(teacher.weeklyHours),
      JSON.stringify(teacher.gradeAssignments),
      teacher.maxConsecutivePeriods,
      teacher.preferredTimeOfDay,
      teacher.preferredTimeSlots ? JSON.stringify(teacher.preferredTimeSlots) : null,
      JSON.stringify(teacher.unavailableTimeSlots),
      teacher.flexibilityScore,
      now.toISOString(),
      now.toISOString()
    );
  }

  // 更新教师
  static update(teacher: Teacher): void {
    const stmt = db.prepare(`
      UPDATE teachers
      SET name = ?, subjects = ?, weekly_hours = ?, grade_assignments = ?, 
          max_consecutive_periods = ?, preferred_time_of_day = ?, preferred_time_slots = ?, 
          unavailable_time_slots = ?, flexibility_score = ?, updated_at = ?
      WHERE id = ?
    `);
    
    const now = new Date();
    stmt.run(
      teacher.name,
      JSON.stringify(teacher.subjects),
      JSON.stringify(teacher.weeklyHours),
      JSON.stringify(teacher.gradeAssignments),
      teacher.maxConsecutivePeriods,
      teacher.preferredTimeOfDay,
      teacher.preferredTimeSlots ? JSON.stringify(teacher.preferredTimeSlots) : null,
      JSON.stringify(teacher.unavailableTimeSlots),
      teacher.flexibilityScore,
      now.toISOString(),
      teacher.id
    );
  }

  // 删除教师
  static delete(id: string): void {
    const stmt = db.prepare('DELETE FROM teachers WHERE id = ?');
    stmt.run(id);
  }

  // 根据科目获取教师
  static getBySubject(subjectId: string): Teacher[] {
    const stmt = db.prepare('SELECT * FROM teachers WHERE subjects LIKE ?');
    const rows = stmt.all(`%${subjectId}%`) as any[];
    
    return rows
      .map(row => ({
        id: row.id,
        name: row.name,
        subjects: JSON.parse(row.subjects),
        weeklyHours: JSON.parse(row.weekly_hours),
        gradeAssignments: JSON.parse(row.grade_assignments),
        maxConsecutivePeriods: row.max_consecutive_periods,
        preferredTimeOfDay: row.preferred_time_of_day as 'morning' | 'afternoon' | 'any',
        preferredTimeSlots: row.preferred_time_slots ? JSON.parse(row.preferred_time_slots) : [],
        unavailableTimeSlots: JSON.parse(row.unavailable_time_slots),
        flexibilityScore: row.flexibility_score,
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
      }))
      .filter(teacher => teacher.subjects.includes(subjectId));
  }

  // 根据年级获取教师
  static getByGrade(grade: number): Teacher[] {
    const stmt = db.prepare('SELECT * FROM teachers');
    const rows = stmt.all() as any[];
    
    return rows
      .map(row => ({
        id: row.id,
        name: row.name,
        subjects: JSON.parse(row.subjects),
        weeklyHours: JSON.parse(row.weekly_hours),
        gradeAssignments: JSON.parse(row.grade_assignments),
        maxConsecutivePeriods: row.max_consecutive_periods,
        preferredTimeOfDay: row.preferred_time_of_day as 'morning' | 'afternoon' | 'any',
        preferredTimeSlots: row.preferred_time_slots ? JSON.parse(row.preferred_time_slots) : [],
        unavailableTimeSlots: JSON.parse(row.unavailable_time_slots),
        flexibilityScore: row.flexibility_score,
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
      }))
      .filter(teacher => teacher.gradeAssignments[`grade${grade}`]);
  }

  // 检查教师名称是否存在
  static existsByName(name: string): boolean {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM teachers WHERE name = ?');
    const result = stmt.get(name) as any;
    return result.count > 0;
  }

  // 获取教师数量
  static getCount(): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM teachers');
    const result = stmt.get() as any;
    return result.count;
  }
}