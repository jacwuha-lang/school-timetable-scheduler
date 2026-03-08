import { Room } from '../types';
import { db } from '../database';

// 场地数据访问对象
export class RoomDAO {
  // 获取所有场地
  static getAll(): Room[] {
    const stmt = db.prepare('SELECT * FROM rooms ORDER BY name');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type as 'classroom' | 'lab' | 'gym' | 'music' | 'art' | 'other',
      capacity: row.capacity,
      available: row.available,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }));
  }

  // 根据ID获取场地
  static getById(id: string): Room | null {
    const stmt = db.prepare('SELECT * FROM rooms WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) {
      return null;
    }
    
    return {
      id: row.id,
      name: row.name,
      type: row.type as 'classroom' | 'lab' | 'gym' | 'music' | 'art' | 'other',
      capacity: row.capacity,
      available: row.available,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  // 创建场地
  static create(room: Room): void {
    const stmt = db.prepare(`
      INSERT INTO rooms (id, name, type, capacity, available, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date();
    stmt.run(
      room.id,
      room.name,
      room.type,
      room.capacity,
      room.available,
      now.toISOString(),
      now.toISOString()
    );
  }

  // 更新场地
  static update(room: Room): void {
    const stmt = db.prepare(`
      UPDATE rooms
      SET name = ?, type = ?, capacity = ?, available = ?, updated_at = ?
      WHERE id = ?
    `);
    
    const now = new Date();
    stmt.run(
      room.name,
      room.type,
      room.capacity,
      room.available,
      now.toISOString(),
      room.id
    );
  }

  // 删除场地
  static delete(id: string): void {
    const stmt = db.prepare('DELETE FROM rooms WHERE id = ?');
    stmt.run(id);
  }

  // 根据类型获取场地
  static getByType(type: string): Room[] {
    const stmt = db.prepare('SELECT * FROM rooms WHERE type = ? ORDER BY name');
    const rows = stmt.all(type) as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type as 'classroom' | 'lab' | 'gym' | 'music' | 'art' | 'other',
      capacity: row.capacity,
      available: row.available,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }));
  }

  // 获取可用场地
  static getAvailable(): Room[] {
    const stmt = db.prepare('SELECT * FROM rooms WHERE available = ? ORDER BY name');
    const rows = stmt.all(true) as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type as 'classroom' | 'lab' | 'gym' | 'music' | 'art' | 'other',
      capacity: row.capacity,
      available: row.available,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }));
  }

  // 检查场地名称是否存在
  static existsByName(name: string): boolean {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM rooms WHERE name = ?');
    const result = stmt.get(name) as any;
    return result.count > 0;
  }

  // 获取场地数量
  static getCount(): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM rooms');
    const result = stmt.get() as any;
    return result.count;
  }
}