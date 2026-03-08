import { SchoolConfig } from '../types';
import { db } from '../database';

// 学校配置数据访问对象
export class SchoolConfigDAO {
  // 获取学校配置
  static get(): SchoolConfig | null {
    const stmt = db.prepare('SELECT * FROM school_config ORDER BY id DESC LIMIT 1');
    const row = stmt.get() as any;
    
    if (!row) {
      return null;
    }
    
    return {
      id: row.id.toString(),
      name: row.name,
      address: row.address,
      phone: row.phone,
      principal: row.principal,
      academicYear: row.academic_year,
      semester: row.semester,
      classTimeConfig: row.class_time_config ? JSON.parse(row.class_time_config) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  // 创建或更新学校配置
  static createOrUpdate(config: SchoolConfig): void {
    const existingConfig = this.get();
    
    if (existingConfig) {
      // 更新现有配置
      const stmt = db.prepare(`
        UPDATE school_config
        SET name = ?, address = ?, phone = ?, principal = ?, 
            academic_year = ?, semester = ?, class_time_config = ?, updated_at = ?
        WHERE id = ?
      `);
      
      const now = new Date();
      stmt.run(
        config.name,
        config.address,
        config.phone,
        config.principal,
        config.academicYear,
        config.semester,
        config.classTimeConfig ? JSON.stringify(config.classTimeConfig) : null,
        now.toISOString(),
        existingConfig.id
      );
    } else {
      // 创建新配置
      const stmt = db.prepare(`
        INSERT INTO school_config (
          name, address, phone, principal, academic_year, semester, class_time_config, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const now = new Date();
      stmt.run(
        config.name,
        config.address,
        config.phone,
        config.principal,
        config.academicYear,
        config.semester,
        config.classTimeConfig ? JSON.stringify(config.classTimeConfig) : null,
        now.toISOString(),
        now.toISOString()
      );
    }
  }

  // 删除学校配置
  static delete(): void {
    const stmt = db.prepare('DELETE FROM school_config');
    stmt.run();
  }

  // 检查是否存在配置
  static exists(): boolean {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM school_config');
    const result = stmt.get() as any;
    return result.count > 0;
  }
}