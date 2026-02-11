
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
  { id: 'subjects', label: 'Institutional Repository', icon: <Layers size={20} />, requiredPermission: 'view_subjects' },
  { id: 'users', label: 'User Management', icon: <Users size={20} />, requiredPermission: 'view_users' },
  { id: 'whitelist', label: 'Whitelisting', icon: <UserCheck size={20} />, requiredPermission: 'view_whitelist' },
  { id: 'assessments', label: 'Assessments', icon: <ClipboardCheck size={20} />, requiredPermission: 'view_assessments' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} />, requiredPermission: 'view_analytics' },
  { id: 'security', label: 'Security & Logs', icon: <ShieldAlert size={20} />, requiredPermission: 'view_logs' },
];

export const THEMES = [
  { name: 'CVSU Standard', primary: 'bg-blue-800', text: 'text-blue-800', border: 'border-blue-800' },
  { name: 'Forest Green', primary: 'bg-green-800', text: 'text-green-800', border: 'border-green-800' },
  { name: 'Modern Dark', primary: 'bg-slate-900', text: 'text-slate-900', border: 'border-slate-900' },
  { name: 'Midnight Purple', primary: 'bg-indigo-900', text: 'text-indigo-900', border: 'border-indigo-900' },
];

export const PERMISSION_MODULES = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Main overview and statistics',
    actions: [
      { id: 'view_dashboard', label: 'View Dashboard' }
    ]
  },
  {
    id: 'subjects',
    name: 'Subjects Repository',
    description: 'Curriculum and core subjects management',
    actions: [
      { id: 'view_subjects', label: 'View' },
      { id: 'create_subjects', label: 'Create' },
      { id: 'edit_subjects', label: 'Edit' },
      { id: 'delete_subjects', label: 'Delete' }
    ]
  },
  {
    id: 'users',
    name: 'User Management',
    description: 'Faculty and student accounts',
    actions: [
      { id: 'view_users', label: 'View' },
      { id: 'create_users', label: 'Create' },
      { id: 'edit_users', label: 'Edit' },
      { id: 'delete_users', label: 'Delete' }
    ]
  },
  {
    id: 'whitelist',
    name: 'Whitelist',
    description: 'Pre-registration approval list',
    actions: [
      { id: 'view_whitelist', label: 'View' },
      { id: 'manage_whitelist', label: 'Manage (Add/Remove)' }
    ]
  },
  {
    id: 'content',
    name: 'Content Materials',
    description: 'Review modules and resources',
    actions: [
      { id: 'view_content', label: 'View' },
      { id: 'create_content', label: 'Create' },
      { id: 'edit_content', label: 'Edit' },
      { id: 'delete_content', label: 'Delete' }
    ]
  },
  {
    id: 'assessments',
    name: 'Assessments',
    description: 'Exams and quizzes',
    actions: [
      { id: 'view_assessments', label: 'View' },
      { id: 'create_assessments', label: 'Create' },
      { id: 'edit_assessments', label: 'Edit' },
      { id: 'delete_assessments', label: 'Delete' }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Performance reports',
    actions: [
      { id: 'view_analytics', label: 'View Reports' }
    ]
  },
  {
    id: 'settings',
    name: 'System Settings',
    description: 'Global configuration and logs',
    actions: [
      { id: 'view_settings', label: 'View Settings' },
      { id: 'edit_settings', label: 'Edit Config' },
      { id: 'manage_backup', label: 'Backups' },
      { id: 'view_logs', label: 'Security Logs' }
    ]
  }
];

export const DEFAULT_PERMISSIONS = PERMISSION_MODULES.flatMap(m => m.actions.map(a => ({ id: a.id, name: a.label, description: m.name })));

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
