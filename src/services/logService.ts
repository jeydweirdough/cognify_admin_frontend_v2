
import type { ActivityLog } from '../types';

export const logActivity = (action: string, entityName: string, entityId: string) => {
  const savedUser = localStorage.getItem('mastery_user');
  if (!savedUser) return;
  const user = JSON.parse(savedUser);

  const logs: ActivityLog[] = JSON.parse(localStorage.getItem('system_logs') || '[]');
  
  const newLog: ActivityLog = {
    id: Date.now().toString(),
    userId: user.id,
    userName: user.name,
    action: `${action}: ${entityName}`,
    timestamp: new Date().toISOString()
  };

  const updatedLogs = [newLog, ...logs].slice(0, 200); // Keep last 200 logs
  localStorage.setItem('system_logs', JSON.stringify(updatedLogs));
};

export const getLogs = (): ActivityLog[] => {
  return JSON.parse(localStorage.getItem('system_logs') || '[]');
};
