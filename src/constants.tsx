
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  BarChart3, 
  ShieldAlert,
  UserCheck,
  Layers
} from 'lucide-react';
import type { PsychologySubject } from './types';

export const COLORS = {
  primary: '#1e40af', // CVSU Blue
  secondary: '#15803d', // CVSU Green
  accent: '#f59e0b', // Yellow
  background: '#f8fafc',
  sidebar: '#ffffff'
};

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, requiredPermission: 'view_dashboard' },
  { id: 'subjects', label: 'Institutional Repository', icon: <Layers size={20} />, requiredPermission: 'manage_curriculum' },
  { id: 'users', label: 'User Management', icon: <Users size={20} />, requiredPermission: 'view_users' },
  { id: 'whitelist', label: 'Whitelisting', icon: <UserCheck size={20} />, requiredPermission: 'manage_whitelist' },
  { id: 'assessments', label: 'Assessments', icon: <ClipboardCheck size={20} />, requiredPermission: 'create_exams' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} />, requiredPermission: 'view_analytics' },
  { id: 'security', label: 'Security & Logs', icon: <ShieldAlert size={20} />, requiredPermission: 'system_settings' },
];

export const THEMES = [
  { name: 'CVSU Standard', primary: 'bg-blue-800', text: 'text-blue-800', border: 'border-blue-800' },
  { name: 'Forest Green', primary: 'bg-green-800', text: 'text-green-800', border: 'border-green-800' },
  { name: 'Modern Dark', primary: 'bg-slate-900', text: 'text-slate-900', border: 'border-slate-900' },
  { name: 'Midnight Purple', primary: 'bg-indigo-900', text: 'text-indigo-900', border: 'border-indigo-900' },
];

export const DEFAULT_PERMISSIONS = [
  { id: 'view_dashboard', name: 'View Dashboard', description: 'Access to the main overview and stats' },
  { id: 'manage_curriculum', name: 'Manage Curriculum', description: 'Can access the psychology core repository and edit topic trees' },
  { id: 'view_users', name: 'View Users', description: 'Can view list of all users' },
  { id: 'edit_users', name: 'Edit Users', description: 'Can modify user details and status' },
  { id: 'manage_whitelist', name: 'Manage Whitelist', description: 'Can approve and upload whitelist entries' },
  { id: 'manage_content', name: 'Manage Content', description: 'Can create and edit review materials' },
  { id: 'create_exams', name: 'Create Exams', description: 'Can create and schedule assessments' },
  { id: 'view_analytics', name: 'View Analytics', description: 'Can access student performance reports' },
  { id: 'system_settings', name: 'System Settings', description: 'Can modify institutional thresholds and theme' },
  { id: 'manage_backup', name: 'Manage System Backups', description: 'Can export and import full system institutional data JSON files' },
];

// Restore the default core subjects for the Psychology board exam curriculum to satisfy imports in core hub pages.
export const INITIAL_CORE_SUBJECTS: PsychologySubject[] = [
  {
    id: 's-1',
    name: 'Theories of Personality',
    description: 'Comprehensive study of major personality theories and their applications in clinical and social contexts.',
    color: '#1e40af',
    topics: []
  },
  {
    id: 's-2',
    name: 'Abnormal Psychology',
    description: 'Examination of psychopathology, diagnostic criteria, and various clinical perspectives on mental health.',
    color: '#b91c1c',
    topics: []
  },
  {
    id: 's-3',
    name: 'Industrial Psychology',
    description: 'Psychological principles applied to organizational behavior, workforce management, and human resources.',
    color: '#047857',
    topics: []
  },
  {
    id: 's-4',
    name: 'Psychological Assessment',
    description: 'Foundations of psychometrics, psychological testing methodologies, and professional evaluation standards.',
    color: '#7c3aed',
    topics: []
  }
];
