import { Schedule, ScheduleItem, Suggestion, TimeSlot } from '../types';

// 调整建议引擎服务
export class AdjustmentSuggestionEngine {
  // 生成调整建议
  generateSuggestions(schedule: Schedule, modifiedItem: ScheduleItem): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    console.log('生成调整建议:', {
      scheduleId: schedule.id,
      modifiedItemId: modifiedItem.id,
      modifiedItemTimeSlot: modifiedItem.timeSlot
    });
    
    // 1. 生成时间调整建议
    const timeSuggestions = this.generateTimeAdjustmentSuggestions(schedule, modifiedItem);
    suggestions.push(...timeSuggestions);
    
    // 2. 生成教师调整建议
    const teacherSuggestions = this.generateTeacherAdjustmentSuggestions(schedule, modifiedItem);
    suggestions.push(...teacherSuggestions);
    
    // 3. 生成场地调整建议
    const roomSuggestions = this.generateRoomAdjustmentSuggestions(schedule, modifiedItem);
    suggestions.push(...roomSuggestions);
    
    console.log('生成了', suggestions.length, '条调整建议');
    
    return suggestions;
  }
  
  // 生成时间调整建议
  private generateTimeAdjustmentSuggestions(schedule: Schedule, modifiedItem: ScheduleItem): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    // 尝试找到其他可用的时间槽
    for (let dayOfWeek = 0; dayOfWeek < 5; dayOfWeek++) { // 周一到周五
      for (let period = 1; period <= 8; period++) { // 1-8节课
        const newTimeSlot: TimeSlot = { dayOfWeek, period };
        
        // 检查是否与其他课程冲突
        const isConflict = schedule.items.some(item => {
          // 跳过当前修改的项目
          if (item.id === modifiedItem.id) return false;
          
          // 检查班级时间冲突
          if (item.classId === modifiedItem.classId && 
              item.timeSlot.dayOfWeek === dayOfWeek && 
              item.timeSlot.period === period) {
            return true;
          }
          
          // 检查教师时间冲突
          if (item.teacherId === modifiedItem.teacherId && 
              item.timeSlot.dayOfWeek === dayOfWeek && 
              item.timeSlot.period === period) {
            return true;
          }
          
          // 检查场地时间冲突
          if (item.roomId === modifiedItem.roomId && 
              item.timeSlot.dayOfWeek === dayOfWeek && 
              item.timeSlot.period === period) {
            return true;
          }
          
          return false;
        });
        
        if (!isConflict) {
          suggestions.push({
            id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'time_adjustment',
            description: `将课程调整到 ${this.getTimeSlotString(newTimeSlot)}`,
            priority: 'high',
            estimatedImpact: 8,
            implementationSteps: [
              `将课程从 ${this.getTimeSlotString(modifiedItem.timeSlot)} 移动到 ${this.getTimeSlotString(newTimeSlot)}`
            ],
            affectedItems: [modifiedItem.id],
            beforeState: { timeSlot: modifiedItem.timeSlot },
            afterState: { timeSlot: newTimeSlot }
          });
        }
      }
    }
    
    return suggestions;
  }
  
  // 生成教师调整建议
  private generateTeacherAdjustmentSuggestions(schedule: Schedule, modifiedItem: ScheduleItem): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    // 这里可以根据实际情况实现教师调整逻辑
    // 例如，查找其他可以教授该科目的教师
    
    return suggestions;
  }
  
  // 生成场地调整建议
  private generateRoomAdjustmentSuggestions(schedule: Schedule, modifiedItem: ScheduleItem): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    // 这里可以根据实际情况实现场地调整逻辑
    // 例如，查找其他适合的场地
    
    return suggestions;
  }
  
  // 获取时间段字符串
  private getTimeSlotString(timeSlot: TimeSlot): string {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return `${days[timeSlot.dayOfWeek]}第${timeSlot.period}节`;
  }
}