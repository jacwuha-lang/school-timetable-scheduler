import Database from 'better-sqlite3';
import path from 'path';

// 数据库文件路径
const mainDbPath = path.join(__dirname, '../../data/schedule.db');
const testDbPath = path.join(__dirname, '../../data/schedule_test.db');

let db: Database.Database;
let currentDbPath: string = mainDbPath;

// 初始化数据库
export const initializeDatabase = () => {
  try {
    // 确保数据目录存在
    const fs = require('fs');
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ 数据目录创建成功');
    }

    // 连接数据库
    db = new Database(currentDbPath);
    console.log(`✅ 数据库连接成功: ${currentDbPath}`);

    // 创建表
    createTables();
    console.log('✅ 数据库表结构初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
};

// 切换到测试数据库
export const switchToTestDatabase = () => {
  if (db) {
    db.close();
  }
  currentDbPath = testDbPath;
  initializeDatabase();
  console.log('✅ 已切换到测试数据库');
};

// 切换到主数据库
export const switchToMainDatabase = () => {
  if (db) {
    db.close();
  }
  currentDbPath = mainDbPath;
  initializeDatabase();
  console.log('✅ 已切换到主数据库');
};

// 检查是否是测试数据库
export const isTestDatabase = () => {
  return currentDbPath === testDbPath;
};

// 创建表结构
const createTables = () => {
  try {
    // 学校配置表
    db.exec(`
      CREATE TABLE IF NOT EXISTS school_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        principal TEXT,
        academic_year TEXT,
        semester TEXT,
        class_time_config TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 班级表
    db.exec(`
      CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        grade INTEGER NOT NULL,
        student_count INTEGER NOT NULL,
        homeroom_teacher_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 教师表
    db.exec(`
      CREATE TABLE IF NOT EXISTS teachers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subjects TEXT NOT NULL,
        weekly_hours TEXT NOT NULL,
        grade_assignments TEXT NOT NULL,
        max_consecutive_periods INTEGER NOT NULL,
        preferred_time_of_day TEXT NOT NULL,
        preferred_time_slots TEXT,
        unavailable_time_slots TEXT NOT NULL,
        flexibility_score INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 科目表
    db.exec(`
      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        short_name TEXT NOT NULL,
        weekly_hours INTEGER NOT NULL,
        min_weekly_hours INTEGER NOT NULL,
        max_weekly_hours INTEGER NOT NULL,
        requires_lab BOOLEAN NOT NULL,
        requires_special_room BOOLEAN NOT NULL,
        requires_public_room BOOLEAN NOT NULL,
        max_consecutive_periods INTEGER NOT NULL,
        require_same_progress BOOLEAN NOT NULL,
        preferred_time_slots TEXT,
        avoid_time_slots TEXT,
        grade_config TEXT NOT NULL,
        grade_hours TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 场地表
    db.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        available BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 课表表
    db.exec(`
      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        semester TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 课程安排表
    db.exec(`
      CREATE TABLE IF NOT EXISTS schedule_items (
        id TEXT PRIMARY KEY,
        schedule_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        teacher_id TEXT NOT NULL,
        room_id TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        duration INTEGER NOT NULL,
        is_locked BOOLEAN NOT NULL,
        conflict_status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
      );
    `);

    // 规则表
    db.exec(`
      CREATE TABLE IF NOT EXISTS rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        description TEXT NOT NULL,
        enabled BOOLEAN NOT NULL,
        config TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 操作日志表
    db.exec(`
      CREATE TABLE IF NOT EXISTS operation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_type TEXT NOT NULL,
        user_id TEXT,
        description TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 体检报告表
    db.exec(`
      CREATE TABLE IF NOT EXISTS health_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id TEXT NOT NULL,
        report_data TEXT NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
      );
    `);

    // 创建索引
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_schedule_items_schedule_id ON schedule_items(schedule_id);
      CREATE INDEX IF NOT EXISTS idx_schedule_items_class_id ON schedule_items(class_id);
      CREATE INDEX IF NOT EXISTS idx_schedule_items_teacher_id ON schedule_items(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_schedule_items_room_id ON schedule_items(room_id);
    `);

    console.log('✅ 数据库表结构创建/更新成功');
  } catch (error) {
    console.error('❌ 创建数据库表结构失败:', error);
    throw error;
  }
};

// 导出数据库实例
export { db };
