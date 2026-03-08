import { Class } from '../types';
import { db } from '../database';

// 班级数据访问对象
export class ClassDAO {
  // 获取所有班级
  static getAll(): Class[] {
    const stmt = db.prepare('SELECT * FROM classes ORDER BY grade, name');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      grade: row.grade,
      studentCount: row.student_count,
      homeroomTeacherId: row.homeroom_teacher_id,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }));
  }

  // 根据ID获取班级
  static getById(id: string): Class | null {
    const stmt = db.prepare('SELECT * FROM classes WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) {
      return null;
    }
    
    return {
      id: row.id,
      name: row.name,
      grade: row.grade,
      studentCount: row.student_count,
      homeroomTeacherId: row.homeroom_teacher_id,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  // 创建班级
  static create(cls: Class): void {
    const stmt = db.prepare(`
      INSERT INTO classes (id, name, grade, student_count, homeroom_teacher_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date();
    stmt.run(
      cls.id,
      cls.name,
      cls.grade,
      cls.studentCount,
      cls.homeroomTeacherId || null,
      now.toISOString(),
      now.toISOString()
    );
  }

  // 更新班级
  static update(cls: Class): void {
    const stmt = db.prepare(`
      UPDATE classes
      SET name = ?, grade = ?, student_count = ?, homeroom_teacher_id = ?, updated_at = ?
      WHERE id = ?
    `);
    
    const now = new Date();
    stmt.run(
      cls.name,
      cls.grade,
      cls.studentCount,
      cls.homeroomTeacherId || null,
      now.toISOString(),
      cls.id
    );
  }

  // 删除班级
  static delete(id: string): void {
    const stmt = db.prepare('DELETE FROM classes WHERE id = ?');
    stmt.run(id);
  }

  // 根据年级获取班级
  static getByGrade(grade: number): Class[] {
    const stmt = db.prepare('SELECT * FROM classes WHERE grade = ? ORDER BY name');
    const rows = stmt.all(grade) as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      grade: row.grade,
      studentCount: row.student_count,
      homeroomTeacherId: row.homeroom_teacher_id,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }));
  }

  // 检查班级名称是否存在
  static existsByName(name: string): boolean {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM classes WHERE name = ?');
    const result = stmt.get(name) as any;
    return result.count > 0;
  }

  // 获取班级数量
  static getCount(): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM classes');
    const result = stmt.get() as any;
    return result.count;
  }
}